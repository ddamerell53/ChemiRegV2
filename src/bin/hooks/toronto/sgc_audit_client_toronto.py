
# Import ChemiReg AuditClient
from audit_client import AuditClient

from rdkit.Chem.rdmolfiles import SDWriter

import tempfile
import subprocess
import os
import cx_Oracle

from toronto.update_manager import UpdateManager
from toronto.insert_manager import InsertManager
from toronto.archive_manager import ArchiveManager
from toronto.fetch_manager import FetchManager

#
#
#
# Note that the Django ORM would have been really helpful here but as we are using Oracle 11 we aren't able to use it !

class SGCTorontoAuditClient(AuditClient):
    def __init__(self, hostname, port, username, password, projects, no_records, oracle_info, mysql_info, has_molcart,schema_name, icm_path):
        # Connect to Oracle database
        self.connect_to_oracle(oracle_info)

        # Schema name to prefix table names with
        self.schema_name = schema_name

        # MySQL schema name to prefix MySQL table names with
        self.mysql_schema_name = mysql_info['molcart_database']

        # Include molcart support
        self.has_molcart = has_molcart

        # MySQL connection information
        self.mysql_info = mysql_info

        # Connect to Molcart
        if self.has_molcart:
            self.connect_to_molcart(mysql_info)

        # Fetch the last transaction ID processed
        self.populate_internal_transaction_id()

        # Number of compounds inserted
        self.insert_count = 0

        # Number of compounds deleted
        self.archive_count = 0

        # Number of compounds updated
        self.update_count = 0

        # Number of structures updated
        self.structure_updates = 0

        # Temporary file to store mol blocks in
        self.sdf_handle = tempfile.NamedTemporaryFile(delete=False, suffix='.sdf')
        # SDWriter to write to self.sdf_handle
        self.sdf_writer = SDWriter(self.sdf_handle.name)

        self.fetch_manager = FetchManager(self)

        self.set_field_mappings()

        self.debug_sql = True
        self.debug_actions = True

        self.icm_path = icm_path

        # Call super-constructor here as we need to know the last processed transaction ID
        super(SGCTorontoAuditClient, self).__init__(hostname, port, username, password, self.last_transaction_id, projects, no_records)

    # connect_to_oracle connects to the Oracle database using the details provided in oracle_info
    def connect_to_oracle(self, oracle_info):
        # Connect to Oracle database
        self.bh = cx_Oracle.connect(oracle_info['username'] + '/' + oracle_info['password'] + '@' + oracle_info['tns_name'])

    # connect_to_molcart connects to the MySQL database using the details provided in mysql_info
    def connect_to_molcart(self, mysql_info):
        # Import library here so that if you don't need it you don't have to install it
        import MySQLdb as mdb
        self.mbh = mdb.connect(mysql_info['hostname'], mysql_info['username'], mysql_info['password'])

    # populate_internal_transaction_id sets self.last_transaction_id with the last ChemiReg transaction processed
    def populate_internal_transaction_id(self):
        # Set the table of the table which stores the last transcaction ID
        self.transaction_table = self.schema_name + '.CHEMIREG_TRANSACTION'

        # Create a new cursor
        query_transaction = self.bh.cursor()

        # Execute statement to get the transaction ID
        query_transaction.execute('SELECT TRANSACTIONID FROM ' + self.transaction_table, {})

        # Fetch the first row in the resultset
        row = query_transaction.fetchone()

        if row is None:
            # We get here when self.transaction_table is empty
            raise Exception('No transaction ID found on ' + self.transaction_table +
                            ' please insert the transction ID that you would like to start processing from')

        # Set the transaction ID
        self.last_transaction_id = row[0]

    # set_field_mappings sets an internal dictionary to map table column names to ChemiReg attributes
    def set_field_mappings(self):
        # Dictionary to store field mappings for each table
        self.field_mappings = {}

        # Field mappings for CH_COMPOUND table
        self.field_mappings['CH_COMPOUND'] = {
            'compound_id': 'TO_NAME',
            'id':'CHEMIREG_PKEY',
            'salted_smiles': 'SMILES',
            'salted_sdf':'MOL',
            'series':'CHEMICAL_SERIES',
            'username':'CREATED_BY',
            'date_record_created':'CREATED_AT'
        }

        # Field mappings for CH_COMPOUND_CHEMLIB table
        self.field_mappings['CH_COMPOUND_CHEMLIB'] = {
            'compound_id': 'LIB_COMP_NUMBER',
            'username': 'CREATED_BY',
            'date_record_created': 'CREATED_AT',
            'mw': 'MOLWEIGHT',
            'comments':'COMMENTS',
            'target':'TARGET',
            'id': 'CHEMIREG_PKEY',
        }

        # Field mappings for CH_STOCK table
        self.field_mappings['CH_STOCK'] = {
            'concentration': 'CONCENTRATION',
            'solvent':'SOLVENT',
            'well':'WELL',
            'barcode':'BARCODE',
            'catalog':'CATALOG',
            'cas_number': 'CAS_NUMBER',
            'username': 'CREATED_BY',
            'date_record_created': 'CREATED_AT',
            'id': 'CHEMIREG_PKEY',
        }

        # Field mappings for CH_CHEMLIB table
        self.field_mappings['CH_CHEMLIB'] = {
            'username': 'CREATED_BY',
            'date_record_created': 'CREATED_AT'
        }

    # after_insert_and_update is called after inserts & updates have been completed.  We update Molcart at this point.
    def after_insert_and_update(self):
        # Close SDWriter and temporary file it's writing to
        self.sdf_writer.close()
        self.sdf_handle.close()
    
        # Commit pending MySQL transactions to prevent a deadlock between the ICM process and this script
        if self.has_molcart:
            self.mbh.commit()

        # Update Molcart if structures have been updated and Molcart is available
        if self.structure_updates > 0 and self.has_molcart:
            args = [
                self.icm_path,
                os.path.dirname(os.path.abspath(__file__)) + '/molcart_insert.icm',
                'sdf','=',self.sdf_handle.name,
                'hostname', '=',self.mysql_info['hostname'],
                'username', '=', self.mysql_info['username'],
                'password', '=', self.mysql_info['password'],
                'database', '=', self.mysql_info['molcart_database'],
                'table_name', '=', self.mysql_info['molcart_table_name']
            ]

            # An exception will be thrown if the ICM process doesn't return a 0 exit status
            subprocess.check_call(args)

    # on_done is called after inserts, updates, and deletes have been performed
    def on_done(self):
        # Update the last ChemiReg transaction which we have processed
        self.bh.cursor().execute('UPDATE ' + self.transaction_table + ' SET TRANSACTIONID = :ID', {':ID': self.last_transaction_id})

        # Commit changes to the Oracle database
        self.bh.commit()
        # Close the Oracle database
        self.bh.close()

        # Commit changes to MySQL which have been performed after delete
        if self.has_molcart:
            self.mbh.commit()

    # update_last_transaction_id keeps track of the maximum transaction ID which has been processed
    def update_last_transaction_id(self, compound):
        if compound['transaction_id'] > self.last_transaction_id:
            self.last_transaction_id = compound['transaction_id']

    # insert_items inserts @compounds into the Toronto schema
    def insert_items(self, compounds):
        insert_manager = InsertManager(self)
        insert_manager.insert_compounds(compounds)

    # update_items updates @compounds in the Toronto schema
    def update_items(self, compounds):
        update_manager = UpdateManager(self)
        update_manager.update_compounds(compounds)

    # archive_items deletes @compounds from the Toronto schema
    def archive_items(self, compounds):
        archive_manager = ArchiveManager(self)
        archive_manager.archive_compounds(compounds)

if __name__ == '__main__':
    oracle_info = {
        'username': 'TORONTO_TEST',
        'password': '',
        'tns_name': 'SGC'
    }

    mysql_info = {
        'hostname': '',
        'username': 'toronto_test',
        'password': '',
        'molcart_database': 'TORONTO_TEST',
        'molcart_table_name': 'molcart_test'
    }

    client = SGCTorontoAuditClient('https://globalchemireg.sgc.ox.ac.uk', 443, 'sgc_toronto_sync','', ['SGC - Toronto','SGC'], None, oracle_info, mysql_info, True, 'TORONTO_TEST','/opt/local/icm/icm64')
    client.process_updates()
