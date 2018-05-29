from rdkit import Chem
import cx_Oracle

class UpdateManager(object):
    def __init__(self, parent):
        self.parent = parent
        self.ch_compound_pkey = None
        self.locked_fields = {'id': True, 'username': True, 'date_record_created': True}

    # update_items updates @compounds present in the Toronto schema
    def update_compounds(self, compounds):
        # Iterate compounds
        for compound in compounds:
            if self.parent.debug_actions:
                print('Updating ' + compound['compound_id'])
            # Insert compound
            self.update_compound(compound)

    # update_compound updates @compound in the Toronto schema
    def update_compound(self, compound):
        self.parent.update_count += 1

        self.ch_compound_pkey = self.parent.fetch_manager.get_compound_pkey(compound['id'])

        if self.ch_compound_pkey is None:
            print('Skipping compound ' + str(compound['id']) + '/' + compound['compound_id'] + ' not found')
            return

        self.update_ch_compound(compound)
        self.update_ch_compound_chemlib(compound)
        self.update_ch_stock(compound)

        if self.parent.has_molcart:
            self.update_molcart(compound)

    # update_ch_compound updates @compound into the CH_COMPOUND table
    def update_ch_compound(self, compound):
        if self.parent.debug_actions:
            print('Updating CH_COMPOUND ' + compound['compound_id'])

        fields = self.parent.field_mappings['CH_COMPOUND']

        query = self.parent.bh.cursor()

        update_blocks = []
        update_values = {}

        for field in fields:
            # Skip fields which have not been updated
            if field not in compound:
                continue

            # Skip fields which are not updatable
            if field in self.locked_fields:
                continue

            if field == 'salted_sdf':
                clob_var = query.var(cx_Oracle.CLOB)
                clob_var.setvalue(0, compound[field])

                update_blocks.append(fields[field] + ' = :' + fields[field])
                update_values[':' + fields[field]] = clob_var
            else:
                update_blocks.append(fields[field] + ' = :' + fields[field])
                update_values[':' + fields[field]] = compound[field]

        sql = 'UPDATE ' + self.parent.schema_name + '.CH_COMPOUND' + ' SET ' + (','.join(update_blocks)) + ' where CHEMIREG_PKEY=:CHEMIREG_PKEY'

        update_values[':CHEMIREG_PKEY'] = compound['id']

        if self.parent.debug_sql:
            print(sql)
            print(update_values)

        query.execute(sql, update_values)

    # update_ch_compound_chemlib updates @compound in the CH_COMPOUND_CHEMLIB table
    def update_ch_compound_chemlib(self, compound):
        if self.parent.debug_actions:
            print('Updating CH_COMPOUND_CHEMLIB ' + compound['compound_id'])

        fields = self.parent.field_mappings['CH_COMPOUND_CHEMLIB']

        query = self.parent.bh.cursor()

        update_blocks = []
        update_values = {}

        for field in fields:
            # Skip fields which have not been updated
            if field not in compound:
                continue

            # Skip fields which are not updatable
            if field in self.locked_fields:
                continue

            update_blocks.append(fields[field] + ' = :' + fields[field])
            update_values[':' + fields[field]] = compound[field]

        if 'library_name' in compound:
            update_blocks.append('CH_CHEMLIB_PKEY = :CH_CHEMLIB_PKEY')
            update_values[':CH_CHEMLIB_PKEY'] = self.parent.fetch_manager.get_library_pkey(compound['library_name'],compound)

        sql = 'UPDATE ' + self.parent.schema_name + '.CH_COMPOUND_CHEMLIB' + ' SET ' + (','.join(update_blocks)) + ' where CHEMIREG_PKEY=:CHEMIREG_PKEY'

        update_values[':CHEMIREG_PKEY'] = compound['id']

        if self.parent.debug_sql:
            print(sql)
            print(update_values)

        query.execute(sql, update_values)

    # update_ch_stock updates @compound in the CH_STOCK table
    def update_ch_stock(self, compound):
        if self.parent.debug_actions:
            print('Updating CH_STOCK ' + compound['compound_id'])

        fields = self.parent.field_mappings['CH_STOCK']

        query = self.parent.bh.cursor()

        update_blocks = []
        update_values = {}

        for field in fields:
            # Skip fields which have not been updated
            if field not in compound:
                continue

            # Skip fields which are not updatable
            if field in self.locked_fields:
                continue

            update_blocks.append(fields[field] + ' = :' + fields[field])
            update_values[':' + fields[field]] = compound[field]

        if 'supplier' in compound:
            update_blocks.append('CH_PROVIDER_PKEY = :CH_PROVIDER_PKEY')
            update_values[':CH_PROVIDER_PKEY'] = self.parent.fetch_manager.get_provider_pkey(compound['supplier'], compound)

        if 'barcode' in compound:
            update_blocks.append('CH_PLATE_PKEY = :CH_PLATE_PKEY')
            update_values[':CH_PLATE_PKEY'] = self.parent.fetch_manager.get_plate_pkey(compound['barcode'], compound)

        sql = 'UPDATE ' + self.parent.schema_name + '.CH_STOCK' + ' SET ' + (','.join(update_blocks)) + ' where CHEMIREG_PKEY=:CHEMIREG_PKEY'

        update_values[':CHEMIREG_PKEY'] = compound['id']

        if self.parent.debug_sql:
            print(sql)
            print(update_values)

        query.execute(sql, update_values)

    # update_molcart updates @compound in the Molcart table
    def update_molcart(self, compound):
        if self.parent.debug_actions:
            print('Updating Molcart ' + compound['compound_id'])

        if 'salted_sdf' in compound:
            if compound['salted_sdf'] is None or compound['salted_sdf'] == '':
                mol = Chem.MolFromSmiles('')
            else:
                mol = Chem.MolFromMolBlock(compound['salted_sdf'])

            if mol is not None:
                mol.SetProp('to_name', compound['compound_id'])
                mol.SetProp('chemireg_pkey', str(compound['id']))

                self.parent.sdf_writer.write(mol)

                self.parent.delete_from_molcart(compound['id'])