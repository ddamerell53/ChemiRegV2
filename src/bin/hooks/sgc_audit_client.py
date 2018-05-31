
# Import ChemiReg AuditClient
from audit_client import AuditClient


from rdkit import Chem
from rdkit.Chem.SaltRemover import SaltRemover
from collections import defaultdict
from rdkit.Chem.Draw import MolDrawing
from rdkit.Chem import Draw
from rdkit.Chem.rdmolfiles import SDWriter

import tempfile
import subprocess
import os
import cx_Oracle

class SGCAuditClient(AuditClient):
    def __init__(self, hostname, port, username, password, projects, no_records, oracle_info, mysql_info, has_molcart, include_extra_columns=True):
        self.bh = cx_Oracle.connect(oracle_info['username']+'/'+oracle_info['password']+'@'+oracle_info['tns_name'])
        
        self.has_molcart = has_molcart
        
        if self.has_molcart:
            import MySQLdb as mdb
            self.mbh = mdb.connect(mysql_info['hostname'], mysql_info['username'], mysql_info['password'])

        cur = self.bh.cursor()
        cur.execute('SELECT TRANSACTIONID FROM SGC.CHEMIREG_TRANSACTION',{})    

        row = cur.fetchone()
        transaction_id = row[0]

        self.last_transaction_id = transaction_id

        self.insert_count = 0
        self.delete_count = 0
        self.update_count = 0
        
        self.structure_updates = 0
        self.include_extra_columns  = include_extra_columns

        complete_projects = [project for project in projects]
        
        extra_sql_cols = ''
        extra_sql_placeholders = ''

        if self.include_extra_columns:
            complete_projects.append('SGC/Compound Classifications')
            complete_projects.append('SGC/Compound Series')
            extra_sql_cols=',CLASSIFICATION,SERIES, FOLLOW_UP_LIST'
            extra_sql_placeholders=',:CLASSIFICATION,:SERIES, :FOLLOW_UP_LIST'

        super(SGCAuditClient, self).__init__(hostname,  port, username, password, transaction_id, complete_projects, no_records)

        compound_insert_statement = self.bh.cursor()
        compound_insert_statement.prepare('''
            INSERT INTO SGC.SGCCOMPOUND (
                SGCGLOBALID, OLD_SGCGLOBAL_ID, COMPOUND_ID, DESCRIPTION, CONCENTRATION, SUPPLIER, SUPPLIER_ID, MW,
                AMOUNTORDERED, DATESTAMP, PERSON, SMILES, INCHI, SDF, CHEMIREG_PKEY, COMMENTS,SUPPLIERPLATEID,INITVOL,BARCODEID, SOLUTE''' + extra_sql_cols + '''
            )
            VALUES(
                :SGCGLOBALID, :OLD_SGCGLOBAL_ID, :OLD_COMPOUND_ID, :DESCRIPTION, :CONCENTRATION, :SUPPLIER, :SUPPLIER_ID,
                :MW, :AMOUNTORDERED, TO_TIMESTAMP('1970-01-01 00:00:00.0'
                   ,'YYYY-MM-DD HH24:MI:SS.FF') + NUMTODSINTERVAL(:DATESTAMP, 'SECOND'), :PERSON, :SMILES, :INCHI, :SDF, :CHEMIREG_PKEY, :COMMENTS,
                :SUPPLIERPLATEID,:INITVOL,:BARCODEID,:SOLUTE''' + extra_sql_placeholders + '''
            )
        ''')

        self.insert_statements = {}
        self.delete_statements = {}
 
        if self.include_extra_columns:
            classification_insert_statement = self.bh.cursor()
            classification_insert_statement.prepare('''
                INSERT INTO SGC.SGCCOMPOUND_CLASSIFICATION (
                    CLASSIFICATION,DESCRIPTION,CHEMIREG_PKEY
                 )
                VALUES(
                    :CLASSIFICATION, :DESCRIPTION, :CHEMIREG_PKEY
             )
            ''')
        
            series_insert_statement = self.bh.cursor()
            series_insert_statement.prepare('''
                INSERT INTO SGC.SGCCOMPOUND_SERIES_NEW (
                    SERIES,DESCRIPTION,CHEMIREG_PKEY
                )
                VALUES(
                    :SERIES, :DESCRIPTION, :CHEMIREG_PKEY
                )
            ''')

            self.insert_statements = {
                'SGC/Compound Series': series_insert_statement,
                'SGC/Compound Classifications': classification_insert_statement
            }

            compound_series_statement = self.bh.cursor()
            compound_series_statement.prepare('''
                delete from SGC.SGCCOMPOUND_SERIES_NEW where CHEMIREG_PKEY = :CHEMIREG_PKEY
            ''')
        
            compound_classification_statement = self.bh.cursor()
            compound_classification_statement.prepare('''
                delete from SGC.SGCCOMPOUND_CLASSIFICATION where CHEMIREG_PKEY = :CHEMIREG_PKEY
            ''')

            self.delete_statements = {
                'SGC/Compound Series': compound_series_statement,
                'SGC/Compound Classifications': compound_classification_statement
            }

        compound_delete_statement = self.bh.cursor()
        compound_delete_statement.prepare('''
            delete from SGC.SGCCOMPOUND where CHEMIREG_PKEY = :CHEMIREG_PKEY
        ''')
        
       
        
        compound_mapping = {
            'compound_id':'SGCGLOBALID',
            'old_sgc_global_id':'OLD_SGCGLOBAL_ID',
            'old_sgc_local_id':'OLD_COMPOUND_ID',
            'description':'DESCRIPTION',
            'comments':'COMMENTS',
            'concentration':'CONCENTRATION',
            'supplier':'SUPPLIER',
            'supplier_id':'SUPPLIER_ID',
            'mw':'MW',
            'amount':'AMOUNTORDERED',
            'date_record_created':'DATESTAMP',
            'username':'PERSON',
            'salted_smiles':'SMILES',
            'salted_inchi':'INCHI',
            'salted_sdf':'SDF',
            'id': 'CHEMIREG_PKEY',
            'supplier_plate_id':'SUPPLIERPLATEID',
            'volume':'INITVOL',
            'barcode':'BARCODEID',
            'solvent':'SOLUTE',
        }

        if self.include_extra_columns:
            compound_mapping['series'] = 'SERIES'
            compound_mapping['classification'] = 'CLASSIFICATION'
            compound_mapping['follow_up_list'] = 'FOLLOW_UP_LIST'
        
        self.chemireg_to_scarab_fields = {
            'SGC/Compound Series': {'compound_id':'SERIES', 'description':'DESCRIPTION','id': 'CHEMIREG_PKEY'},
            'SGC/Compound Classifications': {'compound_id':'CLASSIFICATION', 'description':'DESCRIPTION','id': 'CHEMIREG_PKEY'}
        }
        
        self.is_project_compound = {
            'SGC/Compound Series': False,
            'SGC/Compound Classifications': False
        }
        
        self.project_to_table = {
            'SGC/Compound Series': 'SGCCOMPOUND_SERIES_NEW',
            'SGC/Compound Classifications': 'SGCCOMPOUND_CLASSIFICATION'
        }
        
        for project in projects:
            self.insert_statements[project] = compound_insert_statement
            self.delete_statements[project] = compound_delete_statement
            self.chemireg_to_scarab_fields[project] = compound_mapping
            self.is_project_compound[project] = True
            self.project_to_table[project] = 'SGCCOMPOUND'

        self.sdf_handle = tempfile.NamedTemporaryFile(delete=False, suffix='.sdf')
        self.sdf_writer = SDWriter(self.sdf_handle.name)

    def after_insert_and_update(self):
        self.sdf_writer.close()
        self.sdf_handle.close()


        print('PATH: ' + self.sdf_handle.name)
    
        # We have to be sure to close the MySQL connection before calling our ICM script
        # because this Python script might lock the Molcart table
        if self.has_molcart:
            self.mbh.commit()
        
        if self.structure_updates > 0 and self.has_molcart:
            args = [
                '/opt/local/icm/icm64',
                os.path.dirname(os.path.abspath(__file__)) + '/molcart_insert.icm',
                'sdf','=',self.sdf_handle.name
            ]

            subprocess.check_call(args)
    
    def on_done(self):
        self.bh.cursor().execute('UPDATE SGC.CHEMIREG_TRANSACTION SET TRANSACTIONID = :ID', {':ID': self.last_transaction_id})

        self.bh.commit()
        self.bh.close()
    
        if self.has_molcart:
            self.mbh.commit()

        if self.include_extra_columns:
            self.process_follow_up_list()

    # process_follow_up_list connects follow-up compounds to their parent compounds and xtals in Scarab.
    # 
    # The synchronisation between ChemiReg and Scarab is an all-or-nothing process because of the way transactions are handled in ChemiReg
    # Which means that when the script receieves a list of compound changes to make in Scarab either the whole set of changes are made or none are.
    #
    # Follow-up compounds reference xtals and parent compounds and there's a slim chance these won't exist by the time this script runs.  So
    # to not hold up the ChemiReg to Scarab synchronisation, follow-up compounds are connected to their parent compounds and xtals outside of the
    # all-or-nothing process.
    def process_follow_up_list(self):
        print('Updating follow-ups')
        # Import here for those installations which don't have our common Python library
        from org.sgc.CommonCore import CommonCore

        # Query to find follow-up compounds for which we need to process the parent compounds and xtals
        query = CommonCore.bh.cursor()
        query.execute("SELECT PKEY, FOLLOW_UP_LIST, PERSON, SGCGLOBALID,DATESTAMP FROM SGC.SGCCOMPOUND WHERE FOLLOW_UP_LIST_PROCESSED= 'no' and FOLLOW_UP_LIST IS NOT NULL",{})

        # Query to delete existing relationships for follow-up compounds
        query_delete_existing = CommonCore.bh.cursor()
        query_delete_existing.prepare('DELETE FROM SGC.SGCCOMPOUNDS_FOLLOW_UP WHERE PKEY = :PKEY')

        # Query to test if a crystal ID is correct
        query_is_xtal = CommonCore.bh.cursor()
        query_is_xtal.prepare('SELECT PKEY FROM SGC.XTAL_MOUNT WHERE UPPER(XTAL_MOUNT_ID) = UPPER(:XTAL_ID)')

        # Query to test if a parent compound ID is correct
        query_is_compound = CommonCore.bh.cursor()
        query_is_compound.prepare('SELECT PKEY FROM SGC.SGCCOMPOUND WHERE UPPER(SGCGLOBALID) = UPPER(:SGCGLOBALID)')

        # Query to insert follow-up compound relationships
        query_insert_follow_up_info = CommonCore.bh.cursor()
        query_insert_follow_up_info.prepare('INSERT INTO SGC.SGCCOMPOUNDS_FOLLOW_UP (SGCCOMPOUND_PKEY, SGCCOMPOUND_PARENT_PKEY, SGCXTALMOUNT_PKEY, PERSON, DATESTAMP) values(:COMPOUND_PKEY, :PARENT_COMPOUND_PKEY, :XTAL_MOUNT_PKEY,:PERSON,:DATESTAMP)')

        # Query to update the processed flagged for follow-up compounds
        query_update_followup_status = CommonCore.bh.cursor()
        query_update_followup_status.prepare('UPDATE SGC.SGCCOMPOUND SET FOLLOW_UP_LIST_PROCESSED = \'yes\' WHERE PKEY = :PKEY')

        # List of email addresses to send errors to
        cc_adds = ['david.damerell@sgc.ox.ac.uk', 'sgcit@sgc.ox.ac.uk']

        # Iterate list of follow-up compounds to process
        for row in query.fetchall():
            # compound Scarab primary key
            compound_pkey = row[0]
            # follow-up list crystal ID:Compound ID,
            follow_up_list = row[1]
            # User that created the follow-up compound
            user = row[2]
            # SGC Global ID of the follow-up compound
            sgcglobalid = row[3]

            datestamp = row[4]

            # Get the email address of the user that created the follow-up compound
            user_email_address = CommonCore.get_user_email_address(user)

            # Delete existing follow-up records for this follow-up compound
            query_delete_existing.execute(None, {':PKEY':compound_pkey})

            # Split the follow-up string into crystal ID:Compound ID pairs
            pairs = follow_up_list.split(',')

            # If one pair fails we don't want to update the FOLLOW_UP_PROCESSED flag
            update_follow_up_flag = True

            # Iteerate Crystal ID:Compound ID pairs
            for pair in pairs:
                # Split the pair into Crystal ID and Compound ID
                parts = pair.split(':')
                
                xtal_id = parts[0].rstrip().lstrip()
                compound_id = parts[1].rstrip().lstrip()
                
                # Test if the crystal ID exists
                query_is_xtal.execute(None, {':XTAL_ID': xtal_id})

                xtal_pkey = None

                xtal_row = query_is_xtal.fetchone()
                if xtal_row is None:
                    # We get here when the Crystal ID doesn't exist and so we email the user asking them to correct
                    msg = 'Compound ' + sgcglobalid + ' references  mounted crystal ' + xtal_id + ' which doesn\'t exist<br/>Please update in ChemiReg'                    

                    print(user_email_address)

                    CommonCore.send_email(user_email_address, cc_adds, 'Action Required: Follow-up compound error ' + sgcglobalid, msg, msg)

                    update_follow_up_flag = False
                    continue
                else:
                    xtal_pkey = xtal_row[0]

                # Test if the parent Compound ID exists
                parent_compound_pkey = None
    
                query_is_compound.execute(None, {':SGCGLOBALID': compound_id})

                compound_row = query_is_compound.fetchone()

                if compound_row is None:
                    # We get here if the parent Compound ID doesn't exist and so email the user asking them to correct
                    msg = 'Compound ' + sgcglobalid + ' references parent compound ' + compound_id + ' which doesn\'t exist<br/>Please update in ChemiReg'

                    CommonCore.send_email(user_email_address, cc_adds, 'Action Required: Follow-up compound error ' + sgcglobalid, msg, msg)

                    update_follow_up_flag = False
                    continue
                else:
                    parent_compound_pkey = compound_row[0]
                
            
                # Insert the follow-up relationship for the current follow-up compound
                query_insert_follow_up_info.execute(None, {':COMPOUND_PKEY':compound_pkey, ':PARENT_COMPOUND_PKEY':parent_compound_pkey, ':XTAL_MOUNT_PKEY':xtal_pkey, ':PERSON':user, ':DATESTAMP':datestamp})

            if update_follow_up_flag:
                # Update the follow-up status for the current follow-up compound
                query_update_followup_status.execute(None, {':PKEY':compound_pkey})

        # Compound all changes to Scarab
        CommonCore.bh.commit()

    def insert_items(self, items):
        for item in items:
            project = item['project']
            
            fields = self.chemireg_to_scarab_fields[project]
            
            insert_statement = self.insert_statements[project]
            
            self.insert_count += 1

            params = {}
            for key in fields.keys():
                if key == 'salted_sdf':
                    clob_var = insert_statement.var(cx_Oracle.CLOB)
                    clob_var.setvalue(0, item[key])
                    params[':' + fields[key]] = clob_var
                    self.structure_updates += 1
                else:
                    if key in item:
                        params[':' + fields[key]] = item[key]
                    else:
                        params[':' + fields[key]] = None

#                    if key == 'compound_id':
#                        params[':' + 'OLD_COMPOUND_ID'] = params[':SGCGLOBALID'] = None

            if item['transaction_id'] > self.last_transaction_id:
                self.last_transaction_id = item['transaction_id']


            print('Inserting ' + item['compound_id'])
            insert_statement.execute(None, params)

            if self.is_project_compound[project] and 'salted_sdf' in item:
                if item['salted_sdf'] is None or item['salted_sdf'] == '':
                    mol = Chem.MolFromSmiles('')
                else:
                    mol = Chem.MolFromMolBlock(item['salted_sdf'])
           
                mol.SetProp('SGCGLOBALID', item['compound_id'])
#                mol.SetProp('SGCOXFORDID', item['compound_id'])
                mol.SetProp('ChemiRegPKEY', str(item['id']))

                self.sdf_writer.write(mol)
 
    def update_items(self, items):
        locked_fields = {'id': True, 'username': True, 'date_record_created' : True}
        for item in items:
            project = item['project']
            
            fields = self.chemireg_to_scarab_fields[project]
            
            self.update_count += 1
            update_blocks = []
            update_values = {}

            cur = self.bh.cursor()


            for field in fields.keys():
                if self.is_project_compound[project] and field == 'salted_sdf' and field in item:
                    self.structure_updates += 1
                    clob_var = cur.var(cx_Oracle.CLOB)
                    clob_var.setvalue(0, item[field])
                    update_blocks.append(fields[field] + ' = :' + fields[field])
                    update_values[':' + fields[field]] = clob_var
                else:
                    if field in locked_fields or field not in item:
                        continue
                    else:
                        update_blocks.append(fields[field] + ' = :' + fields[field])
                        update_values[':' + fields[field]] = item[field]

                        if self.is_project_compound[project] and field == 'compound_id' and self.has_molcart:
                            self.mbh.cursor().execute('UPDATE GlobalCompounds.allOxford set SgcGlobalId=%s where ChemiRegPKEY=%s and ChemiRegPKEY is not null', (item[field],item['id']))

            if item['transaction_id'] > self.last_transaction_id:
                self.last_transaction_id = item['transaction_id']

            print('Updating ' + item['compound_id'])
            
            project_table = self.project_to_table[project]

            sql = 'UPDATE SGC.' + project_table + ' SET ' + (','.join(update_blocks)) + ' where CHEMIREG_PKEY=:CHEMIREG_PKEY'

            update_values[':CHEMIREG_PKEY'] = item['id']

            print(sql)
            print(update_values)

            if self.is_project_compound[project] and 'salted_sdf' in item:
                if item['salted_sdf'] is None or item['salted_sdf'] == '':
                    mol = Chem.MolFromSmiles('')
                else:
                    mol = Chem.MolFromMolBlock(item['salted_sdf'])

                if mol is None:
                    continue

                mol.SetProp('SGCGLOBALID', item['compound_id'])
                mol.SetProp('ChemiRegPKEY', str(item['id']))

                self.sdf_writer.write(mol)

                self.delete_from_molcart(item['id'])

            cur.execute(sql, update_values)

    def archive_items(self, items):
        for item in items:
            project = item['project']
            
            fields = self.chemireg_to_scarab_fields[project]
            delete_statement = self.delete_statements[project]
            
            self.delete_count += 1
            params = {':' + fields['id']: item['id']}

            if item['transaction_id'] > self.last_transaction_id:
                self.last_transaction_id = item['transaction_id']

            print('Deleting ' + item['compound_id'])

            delete_statement.execute(None, params)
            
            if self.is_project_compound[project]:
                self.delete_from_molcart(item['id'])  
 
    def delete_from_molcart(self, id):
        if self.has_molcart:
            delete_from_molcart = self.mbh.cursor()
            delete_from_molcart.execute('''
                delete from GlobalCompounds.allOxford where ChemiRegPKEY = %s
            ''',(id,))
