from rdkit import Chem
import cx_Oracle

# InsertManager handles all inserts into the Toronto schema
class InsertManager(object):
    def __init__(self, parent):
        # Parent (i.e. outer class instance)
        self.parent = parent  # type: SGCTorontoAuditClient
        self.ch_compound_pkey = None
        self.ch_compound_chemlib_pkey = None

    # insert_entity is a generic function to insert into @table_name using @query and @params
    def insert_entity(self, query, table_name, params):
        # Generate list of Oracle table column names
        cols = [col for col in self.parent.field_mappings[table_name].values()]

        if table_name == 'CH_COMPOUND':
            pass
        elif table_name == 'CH_COMPOUND_CHEMLIB':
            cols.append('CH_CHEMLIB_PKEY')
            cols.append('CH_COMPOUND_PKEY')
        elif table_name == 'CH_STOCK':
            cols.append('CH_PLATE_PKEY')
            cols.append('CH_PROVIDER_PKEY')
            cols.append('CH_COMPOUND_CHEMLIB_PKEY')

        # Generate value placeholders along with any conversions required
        converted_cols = []
        for col in cols:
            if col == 'CREATED_AT':
                converted_cols.append("TO_TIMESTAMP('1970-01-01 00:00:00.0','YYYY-MM-DD HH24:MI:SS.FF') + NUMTODSINTERVAL(:"+col+", 'SECOND')")
            else:
                converted_cols.append(':'+col)

        # Generate SQL statement
        sql = "INSERT INTO " + self.parent.schema_name + "." + table_name + "(" + ','.join(cols) + ") VALUES(" + ','.join(converted_cols) + ')'

        if self.parent.debug_sql:
            print(sql)
            print(params)

        # Insert entity
        query.execute(sql, params)

    # insert_compounds inserts @compounds into the Toronto schema
    def insert_compounds(self, compounds):
        # Iterate compounds
        for compound in compounds:
            if self.parent.debug_actions:
                print('Inserting compound ' + compound['compound_id'])
            # Insert compound
            self.insert_compound(compound)

    # insert_compound inserts @compound into the Toronto schema
    def insert_compound(self, compound):
        # Increment insert count
        self.parent.insert_count += 1

        self.insert_ch_compound(compound)
        self.insert_ch_compound_chemlib(compound)
        self.insert_ch_compound_stock(compound)

        if self.parent.has_molcart:
            # We get here when Molcart is present
            self.insert_into_sdf(compound)

        # Allow parent to track maximum transaction ID processed
        self.parent.update_last_transaction_id(compound)

    # insert_ch_compound inserts @compound into the CH_COMPOUND table
    def insert_ch_compound(self, compound):
        if self.parent.debug_actions:
            print('Inserting CH_COMPOUND ' + compound['compound_id'])

        query = self.parent.bh.cursor()

        # Insert CH_COMPOUND record
        params = self.generate_param_dictionary(compound, 'CH_COMPOUND', query)
        self.insert_entity(query, 'CH_COMPOUND', params)

        # Get PKEY for compound we just inserted
        self.ch_compound_pkey = self.parent.fetch_manager.get_compound_pkey(compound['id'])

    # insert_ch_compound_chemlib inserts @compound into CH_COMPOUND_CHEMLIB table
    def insert_ch_compound_chemlib(self, compound):
        if self.parent.debug_actions:
            print('Inserting CH_COMPOUND_CHEMLIB ' + compound['compound_id'])

        query = self.parent.bh.cursor()

        # Insert CH_COMPOUND_CHEMLIB record for compound
        params = self.generate_param_dictionary(compound, 'CH_COMPOUND_CHEMLIB', query)

        # Add FKs
        params['CH_CHEMLIB_PKEY'] = self.parent.fetch_manager.get_library_pkey(compound['library_name'],compound)
        params['CH_COMPOUND_PKEY'] = self.ch_compound_pkey
        params['CHEMIREG_PKEY'] = compound['id']

        # Insert CH_COMPOUND_CHEMLIB record
        self.insert_entity(query, 'CH_COMPOUND_CHEMLIB', params)
        self.ch_compound_chemlib_pkey = self.parent.fetch_manager.get_compound_chemlib_pkey(self.ch_compound_pkey)

    # insert_ch_compound_stock inserts @compound into CH_STOCK
    def insert_ch_compound_stock(self, compound):
        if self.parent.debug_actions:
            print('Inserting CH_STOCK ' + compound['compound_id'])

        query = self.parent.bh.cursor()

        # Insert CH_STOCK record
        params = self.generate_param_dictionary(compound, 'CH_STOCK', query)

        # Add FKs
        params['CH_PLATE_PKEY'] = self.parent.fetch_manager.get_plate_pkey(compound['barcode'], compound)
        params['CH_PROVIDER_PKEY'] = self.parent.fetch_manager.get_provider_pkey(compound['supplier'], compound)
        params['CH_COMPOUND_CHEMLIB_PKEY'] = self.ch_compound_chemlib_pkey
        params['CHEMIREG_PKEY'] = compound['id']

        # Insert CH_STOCK record
        self.insert_entity(query, 'CH_STOCK', params)

    # insert_into_sdf inserts @compound into the open SD file
    def insert_into_sdf(self, compound):
        if 'salted_sdf' in compound:
            if compound['salted_sdf'] is None or compound['salted_sdf'] == '':
                mol = Chem.MolFromSmiles('')
            else:
                mol = Chem.MolFromMolBlock(compound['salted_sdf'])

            mol.SetProp('to_name', compound['compound_id'])
            mol.SetProp('chemireg_pkey', str(compound['id']))

            self.parent.structure_updates += 1

            self.parent.sdf_writer.write(mol)

            # generate_param_dictionary creates a dictionary of parameters for table_name using the values in item

    # @item: Dictionary of attribute value pairs
    # @table_name Name of table to generate params for
    # @query Oracle cursor to generate special variables from
    def generate_param_dictionary(self, item, table_name, query):
        # get field mapping for table_name
        fields = self.parent.field_mappings[table_name]

        # Create a dictionary to store attribute/value pairs
        params = {}
        # Iterate ChemiReg attribute names
        for key in fields.keys():
            # Special handling of Mol blocks as these can be very large
            if key == 'salted_sdf':
                clob_var = query.var(cx_Oracle.CLOB)
                clob_var.setvalue(0, item[key])
                params[':' + fields[key]] = clob_var
            else:
                # Set the key/value pair
                if key in item:
                    params[':' + fields[key]] = item[key]
                else:
                    # Set value to None if the key is missing
                    params[':' + fields[key]] = None

        return params