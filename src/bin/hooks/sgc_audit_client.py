
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
import MySQLdb as mdb

class SGCAuditClient(AuditClient):
    def __init__(self, hostname, port, username, password, projects, no_records, oracle_info, mysql_info):
        self.bh = cx_Oracle.connect(oracle_info['username']+'/'+oracle_info['password']+'@'+oracle_info['tns_name'])
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

        super(SGCAuditClient, self).__init__(hostname,  port, username, password, transaction_id, projects, no_records)

        compound_insert_statement = self.bh.cursor()
        compound_insert_statement.prepare('''
            INSERT INTO SGC.SGCCOMPOUND (
                SGCGLOBALID, OLD_SGCGLOBAL_ID, COMPOUND_ID, DESCRIPTION, CONCENTRATION, SUPPLIER, SUPPLIER_ID, MW,
                AMOUNTORDERED, DATESTAMP, PERSON, SMILES, INCHI, SDF, CHEMIREG_PKEY, COMMENTS,SUPPLIERPLATEID,INITVOL,BARCODEID, SOLUTE,CLASSIFICATION,SERIES
            )
            VALUES(
                :SGCGLOBALID, :OLD_SGCGLOBAL_ID, :OLD_COMPOUND_ID, :DESCRIPTION, :CONCENTRATION, :SUPPLIER, :SUPPLIER_ID,
                :MW, :AMOUNTORDERED, TO_TIMESTAMP('1970-01-01 00:00:00.0'
                   ,'YYYY-MM-DD HH24:MI:SS.FF') + NUMTODSINTERVAL(:DATESTAMP, 'SECOND'), :PERSON, :SMILES, :INCHI, :SDF, :CHEMIREG_PKEY, :COMMENTS,
                :SUPPLIERPLATEID,:INITVOL,:BARCODEID,:SOLUTE,:CLASSIFICATION,:SERIES
            )
        ''')
        
        classification_insert_statement = self.bh.cursor()
        classification_insert_statement.prepare('''
            INSERT INTO SGC.SGCCOMPOUND_CLASSIFICATION (
                SERIES,DESCRIPTION,CHEMIREG_PKEY
            )
            VALUES(
                :SERIES, :DESCRIPTION, :CHEMIREG_PKEY
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
            'SGC/Compound Classification': classification_insert_statement
        }

        compound_delete_statement = self.bh.cursor()
        compound_delete_statement.prepare('''
            delete from SGC.SGCCOMPOUND where CHEMIREG_PKEY = :CHEMIREG_PKEY
        ''')
        
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
            'SGC/Compound Classification': compound_classification_statement
        }
        
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
            'series':'SERIES',
            'classification':'CLASSIFICATION'
        }
        
        self.chemireg_to_scarab_fields = {
            'SGC/Compound Series': {'compound_id':'SERIES', 'description':'DESCRIPTION','id': 'CHEMIREG_PKEY'},
            'SGC/Compound Classification': {'compound_id':'CLASSIFICATION', 'description':'DESCRIPTION','id': 'CHEMIREG_PKEY'}
        }
        
        self.is_project_compound = {
            'SGC/Compound Series': False,
            'SGC/Compound Classification': False
        }
        
        self.project_to_table = {
            'SGC/Compound Series': 'SGCCOMPOUND_SERIES_NEW',
            'SGC/Compound Classification': 'SGCCOMPOUND_CLASSIFICATION'
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
        self.mbh.commit()
        
        if self.structure_updates > 0:
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
        self.mbh.commit()

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
                    params[':' + self.fields[key]] = clob_var
                    self.structure_updates += 1
                else:
                    if key in item:
                        params[':' + self.fields[key]] = item[key]
                    else:
                        params[':' + self.fields[key]] = None

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
            for field in self.fields.keys():
                if self.is_project_compound[project] and field == 'salted_sdf' and field in item:
                    self.structure_updates += 1
                    clob_var = self.insert_statement.var(cx_Oracle.CLOB)
                    clob_var.setvalue(0, item[field])
                    update_blocks.append(self.fields[field] + ' = :' + self.fields[field])
                    update_values[':' + self.fields[field]] = clob_var
                else:
                    if field in locked_fields or field not in item:
                        continue
                    else:
                        update_blocks.append(self.fields[field] + ' = :' + self.fields[field])
                        update_values[':' + self.fields[field]] = item[field]

                        if self.is_project_compound[project] and field == 'compound_id':
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

            cur = self.bh.cursor()
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
        delete_from_molcart = self.mbh.cursor()
        delete_from_molcart.execute('''
            delete from GlobalCompounds.allOxford where ChemiRegPKEY = %s
        ''',(id,))
