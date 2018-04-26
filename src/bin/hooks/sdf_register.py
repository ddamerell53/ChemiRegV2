# ChemiReg - web-based compound registration platform
# Written in 2017 by David Damerell <david.damerell@sgc.ox.ac.uk>, Brian Marsden <brian.marsden@sgc.ox.ac.uk>
# 
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# Core Python Modules
import json
import os
import sys
import uuid
import re
import uuid
import pickle
import codecs
import tempfile
import csv
import datetime
import shutil

# lGPL
import psycopg2

# BSD
from xlrd import open_workbook

# BSD 3-clause
from rdkit import Chem
from rdkit.Chem.SaltRemover import SaltRemover
from rdkit.Chem import Descriptors
from rdkit.Chem.rdmolfiles import SDWriter
from salt_remove import StripMol
from rdkit.Chem import AllChem

# ChemiReg modules - CC0
import authenticate
from fetch import CompoundFetchManager
from connection_manager import ConnectionManager

class CompoundManager(object):
	def __init__(self, conn=None, auth_manager = None):
		if auth_manager is None:
			self.conn = conn
		else:
			self.conn = auth_manager.conn
			
		self.cur = None
		self.find_matching = None
		self.find_last_id = None
		
		self.custom_field_batch_cursors = None
		
		self.auto_id_retry_limit = 10

		self.supplier_list = None
		self.duplicate_error_regex = re.compile('\(compound_id\)=\(([^)]+)\) already exists')
		
		self.missing_key_error_regex = re.compile('Key \(parent_project_id, custom_field_value\)=\((\d+), ([^)]+)\) is not present in table')

		self.connect()
		self.fetch_supplier_list()
		
		if auth_manager is None:
			self.fetch_manager = CompoundFetchManager(self.conn, auth_manager, self)
			self.auth_manager = self.fetch_manager.auth_manager
		else:
			self.fetch_manager = auth_manager.fetch_manager	
		
			self.auth_manager = auth_manager
		
		self.build_custom_field_statements()

		self.valid_field_list = {'batchable': 'batchable', 'compound_id': 'compound_id'}
		
		self.cleaner = SaltRemover()
		
		self.salts = self.fetch_manager.get_salts()

	def connect(self):
		if self.conn is None:
			self.conn = ConnectionManager.get_new_connection()

		self.conn.cursor().execute('BEGIN')

		self.cur = self.conn.cursor()
		
		self.cur.execute(
    			'''	prepare compound_insert as 
    				insert into compounds (
					compound_id,
					upload_id,
					user_id,
					manual_id,
					batchable,
					project_id,
					insert_transaction_id
				)
				values($1,$2,$3,$4,$5,$6,$7)
			''')

		self.insert_structure = self.conn.cursor()

		self.find_last_id = self.conn.cursor()
		self.find_last_id.execute('''
			prepare compound_find_last_id as
			select
				max(compound_id)
			from
				compounds a,
				projects b,
				projects c
			where
				compound_id like $1 and
				a.project_id = b.id and
				c.project_name = $2 and
				b.id_group_name = c.id_group_name and
				a.archived_transaction_id is null
		''')

		self.register_supplier_cur = self.conn.cursor()
		self.register_supplier_cur.execute('''
			prepare compound_register_supplier as
			insert into suppliers (name) values($1)
		''')

		self.insert_file_attach_cur = self.conn.cursor()
		self.insert_file_attach_cur.execute(''' 
			prepare insert_file_attach as
			insert into file_uploads
			(
				compound_id,
				uuid,
				file_path,
				file_name,
				transaction_id
			)
			values($1,$2,$3,$4,$5)

		''')

		self.insert_prefix_code_cur = self.conn.cursor()
		self.insert_prefix_code_cur.execute(''' 
			prepare insert_prefix_code as 
			insert into compound_prefixes
			(
				prefix_code,
				description
			)
			values(
				$1,
				$2
			)
		''')

		self.remove_prefix_cur = self.conn.cursor()
		self.remove_prefix_cur.execute(''' 
			prepare remove_prefix as
			delete from compound_prefixes
			where prefix_code = $1
		''')

		self.insert_salt_cur = self.conn.cursor()
		self.insert_salt_cur.execute(''' 
			prepare insert_salt as
			insert into compound_salts
			(
				salt_code,
				salt_mol,
				salt_description
			)
			values(
				$1,
				$2,
				$3
			)
		''')

		self.delete_compound_cur = self.conn.cursor()
		self.delete_compound_cur.execute(''' 
			prepare delete_compound as
			delete from 
				compounds 
			where 
				id = $1
		''')
		
		self.archive_compound_cur = self.conn.cursor()
		self.archive_compound_cur.execute(''' 
			prepare archive_compound as
			update
				compounds 
			set
				compound_id = compound_id || '_archived_' || $3,
				archived_transaction_id = CAST($2 as BIGINT)
			where 
				id = $1
		''')

		self.delete_file_upload_cur = self.conn.cursor()
		self.delete_file_upload_cur.execute(''' 
			prepare delete_file_upload as
			delete from
				file_uploads
			where
				uuid = $1
		''')

		self.fetch_compound_for_upload_cur = self.conn.cursor()
		self.fetch_compound_for_upload_cur.execute(''' 
			prepare fetch_compound_for_upload as
			select
				a.compound_id,
				a.id
			from
				compounds a,
				file_uploads b
			where
				b.uuid = $1 and
				b.compound_id = a.id
		''')
		
		self.fetch_compound_id_cur = self.conn.cursor()
		self.fetch_compound_id_cur.execute(''' 
			prepare fetch_compound_id as
			select
				a.id
			from
				compounds a,
				projects b
			where
				compound_id = $1 and
				b.project_name = $2 and
				a.project_id = b.id
		''')
		
		self.fetch_project_name_cur = self.conn.cursor()
		self.fetch_project_name_cur.execute(''' 
			prepare fetch_project_name as
			select
				b.project_name
			from
				compounds a,
				projects b
			where
				a.id = $1 and
				a.project_id = b.id
		''')
		
		self.find_matching = self.conn.cursor()
		self.find_matching.execute('''
			prepare compound_find_matching as
			select
				max(a.compound_id)
			from
				compounds a,
				custom_fields b,
				custom_varchar_fields c,
				projects d,
				projects e
			where
				d.id = $1 and
				e.id_group_name = d.id_group_name and
				b.project_id = e.id and
				c.custom_field_id = b.id and
				b.name = 'desalted_inchi_key_no_tautomer' and
				c.custom_field_value = $2 and
				c.entity_id = a.id and
				a.batchable = 'true' and
				a.archived_transaction_id is null
		''')
		
		fetch_transaction = self.conn.cursor()
		
		fetch_transaction.execute('''
			select nextval('transaction_counter');
		''')
		
		self.transaction_id = fetch_transaction.fetchone()[0]
		
		self.transaction_id = 0
		
		self.delete_upload_set_cur = self.conn.cursor()
		self.delete_upload_set_cur.execute(''' 
			prepare delete_upload_set as
			update compounds
			set
				compound_id = compound_id || '_archived_' || $3,
				archived_transaction_id = CAST($3 as BIGINT)
			where upload_id = $1 and
			compounds.project_id = (select id from projects where project_name=$2)
				
		''')
		
	def build_custom_field_statements(self):	
		self.custom_field_cursors = {}
		self.custom_field_batch_cursors = {}
		
		field_types = self.auth_manager.get_custom_field_types()
		for field in field_types:
			field_type = field['type_name']
			table_name = field['table_name']
			
			self.custom_field_cursors[field_type] = self.conn.cursor()
			
			if field_type == 'foreign_key':
				self.custom_field_cursors[field_type].execute("prepare custom_field_" + field_type + " as  update " + table_name + " set custom_field_value=$1, parent_project_id=$2, update_transaction_id=$5 where entity_id = $3 and custom_field_id = $4")
			else:
				self.custom_field_cursors[field_type].execute("prepare custom_field_" + field_type + " as  update " + table_name + " set custom_field_value=$1, update_transaction_id=$4 where entity_id = $2 and custom_field_id = $3")
		
			if field_type == 'varchar':			
				self.custom_field_batch_cursors[field_type] = self.conn.cursor()
			
				self.custom_field_batch_cursors[field_type].execute(''' 
					prepare custom_field_batch_''' + field_type + '''
					as 
						select 
							max(compounds.compound_id)
						from
							compounds,
							''' + table_name + ''',
							projects,
							projects projects_2
						where
							left(''' + table_name + '''.custom_field_value,length(''' + table_name + '''.custom_field_value)-1) = $1 and
							''' + table_name + '''.entity_id = compounds.id and
							''' + table_name + '''.custom_field_id = $2 and
							''' + table_name + '''.archived_transaction_id is null and
							compounds.archived_transaction_id is null and
							compounds.project_id = projects.id and 
							projects_2.project_name = $3 and
							projects.id_group_name = projects_2.id_group_name
				''')
		
	def save_changes(self, username, changes, new_project_name, default_mapping = None):
		updated_rows = {}
		
		new_project_def = self.auth_manager.get_project_configuration(new_project_name)
		new_project_fields_by_type = self.auth_manager.get_custom_fields_by_type(new_project_name)
		new_project_fields = self.auth_manager.get_custom_fields(new_project_name)
		new_project_id = self.auth_manager.get_project_id(new_project_name)
		user = self.auth_manager.get_user(username, None)
		user_id = user['user_id']
		
		for entity_pkey in changes:
			if int(entity_pkey) < 0:
				
				if not self.auth_manager.has_project(username, new_project_name):
					raise authenticate.UnauthorisedException('User not authorised for project')
				else:
					if new_project_def['enable_structure_field'] :
						if 'compound_sdf' in changes[entity_pkey] and changes[entity_pkey]['compound_sdf'] is not None and changes[entity_pkey]['compound_sdf'] != '':
							mol = Chem.MolFromMolBlock(changes[entity_pkey]['compound_sdf'])
						elif 'smiles' in changes[entity_pkey]:
							mol = Chem.MolFromSmiles(changes[entity_pkey]['smiles'])
						else:
							mol = Chem.MolFromSmiles('')
	
						for field in changes[entity_pkey].keys():
							
							if changes[entity_pkey][field] != None and field in new_project_fields and new_project_fields[field]['type_name'] == 'foreign_key':
								mol.SetProp(field, str(changes[entity_pkey][field]));
							else:
								mol.SetProp(field, str(changes[entity_pkey][field]));
								
						if default_mapping is None:
							default_mapping = {
								'batchable':{'map_column': None, 'default_value': None},
								'compound_id':{'map_column': None, 'default_value': None},
								'classification':{'map_column': None, 'default_value': None}
							}
								
						ids = self.register_from_ctab(None, username, 
								default_mapping
							, new_project_name, None, [mol])['ids']
						
						updated_rows[entity_pkey] = self.fetch_manager.get_entity_by_id(ids[0], False)
						
						continue
					else:
						changes[entity_pkey]['user_id'] = user_id
						changes[entity_pkey]['manual_id'] = False
						changes[entity_pkey]['batchable_id'] = False
						changes[entity_pkey]['project_id'] = new_project_id
						changes[entity_pkey]['upload_id'] = str(uuid.uuid4())
						
						
						self.insert_entity(changes[entity_pkey], new_project_name, new_project_fields_by_type)
						
						updated_rows[entity_pkey] = self.fetch_manager.get_entity_by_id(changes[entity_pkey]['compound_id'], False)
			
						if new_project_def['enable_structure_field']:
							self.batch_insert_ss_table(new_project_name, changes[entity_pkey]['upload_id'] )
			
						continue
					
			entity = self.fetch_manager.get_entity(entity_pkey)
			compound_id = entity['compound_id']
			project_name = entity['project_name']
			if not self.auth_manager.has_compound_permission(username, entity_pkey):
				raise authenticate.UnauthorisedException('User not authorised for compound ' + compound_id)
			
			#TODO: Bottle-neck if updating a lot compounds
			self.fetch_project_name_cur.execute('execute fetch_project_name (%s)', (entity_pkey,))
			project_name = self.fetch_project_name_cur.fetchone()[0]
			
			project_fields = self.auth_manager.get_custom_fields(project_name)
			
			# Strip any calculated fields the user shouldn't be able to access
			for field_name in changes[entity_pkey]:
				# Initial check is for the compound_sdf field which is not a real field
				if field_name in project_fields:
					field = project_fields[field_name]
				
					if field['calculated']:
						del changes[entity_pkey][field_name]
			
			project_def = self.auth_manager.get_project_configuration(project_name)
			
			if project_def['enable_structure_field'] and 'compound_sdf' in changes[entity_pkey]:
				if 'compound_sdf' in changes[entity_pkey] and changes[entity_pkey]['compound_sdf'] is not None and changes[entity_pkey]['compound_sdf'] != '':
					mol = Chem.MolFromMolBlock(changes[entity_pkey]['compound_sdf'])
				else:
					mol = Chem.MolFromSmiles('')
				
				salts = self.fetch_manager.get_project_salts(project_name,username)
				
				changes[entity_pkey] = {**changes[entity_pkey], **self.process_mol(mol, {}, salts)}

			sql = 'update compounds set '
			field_names = []
			values = []
			for field_name in changes[entity_pkey]:
				if(field_name in self.valid_field_list):
					field_value = changes[entity_pkey][field_name]
					field_names.append(self.valid_field_list[field_name])
					values.append(field_value)

			field_names.append('update_transaction_id')
			values.append(self.transaction_id)
			
			field_blocks = []
			for i in range(0, len(field_names)):
				field_blocks.append(field_names[i] + '=%s')

			sql += ','.join(field_blocks)

			sql += ' where id = %s' 
			
			values.append(entity_pkey)

			cur = self.conn.cursor()
			cur.execute(sql, values)
			
			for field_name in changes[entity_pkey]:
				if(field_name not in self.valid_field_list and field_name in project_fields and field_name != 'compound_sdf'):
					field = project_fields[field_name]
					field_type = field['type_name']
					field_id = field['field_id']
					
					cur = self.custom_field_cursors[field_type]
					
					if field['required'] == True and changes[entity_pkey][field_name] is None:
						raise NotNullException({'compound_id': compound_id, 'field_name': field['field_name'], 'human_name': field['human_name']})
					
					if field_type == 'foreign_key':
						if changes[entity_pkey][field_name] is None:
							change = None
							parent_project_id = None
						else:
							change = changes[entity_pkey][field_name]
							parent_project_id = field['project_foreign_key_id']
							
						cur.execute("execute custom_field_" + field_type + " (%s,%s,%s,%s,%s)", (change, parent_project_id, entity_pkey, field_id, self.transaction_id))
					else:
						field_value = changes[entity_pkey][field_name]
						
						if field_value is not None:
							# Note: Whitespace at the front of Mol columns is important
							if type(field_value) is str and '_sdf' not in field_name:
								field_value =  re.sub('^\s+', '', field_value)
								field_value =  re.sub('\s+$', '', field_value)
								
								changes[entity_pkey][field_name] = field_value	
							
							if field['type_name'] == 'float':
								if type(field_value) is str and 'mM' in field_value:
									field_value = field_value.replace('mM', '').replace(' ', '')
									
									changes[entity_pkey][field_name] = field_value	
								
								try:
									if field_value == '' or field_value == ' ':
										field_value = None
									else:
										f=float(field_value)
								except ValueError:
									raise InvalidValueException({'compound_id': compound_id, 'field_name': field['field_name'], 'human_name': field['human_name'], 'value': field_value})
							elif field['type_name'] == 'int':							
								try:
									if field_value == '' or field_value == ' ':
										field_value = None
									else:
										f=int(field_value)
								except ValueError:
									raise InvalidValueException({'compound_id': compound_id, 'field_name': field['field_name'], 'human_name': field['human_name'], 'value': field_value})
							elif field['type_name'] == 'varchar':
								if len(str(field_value)) > 4000:
									raise ValueToLongException({'compound_id': compound_id, 'field_name': field['field_name'], 'human_name': field['human_name'], 'value': field_value})
							
						
							
						cur.execute("execute custom_field_" + field_type + " (%s,%s,%s,%s)", (changes[entity_pkey][field_name], entity_pkey, field_id, self.transaction_id))
					
			if project_def['enable_structure_field'] and 'compound_sdf' in changes[entity_pkey]:
				self.update_ss_table(project_name, entity_pkey)
			
			updated_rows[entity_pkey] = self.fetch_manager.get_entity(entity_pkey, False)

		self.monotone_transaction_ids()

		self.conn.commit()

		return updated_rows

	def delete_file_upload(self, username, file_uuid):
		self.fetch_compound_for_upload_cur.execute("execute fetch_compound_for_upload (%s)",(file_uuid,))
		row = self.fetch_compound_for_upload_cur.fetchone()
		if row is None:
			raise InvalidFileUUIDException('Invalid file ID: ' + file_uuid)

		compound_id = row[0]
		id = row[1]

		if self.auth_manager.has_compound_permission(username, id):
			self.delete_file_upload_cur.execute("execute delete_file_upload (%s)",(file_uuid,))	
			
			self.monotone_transaction_ids()
			
			self.conn.commit()
		else:
			raise authenticate.UnauthorisedException('User not authorised for compound ' + compound_id)	
	

	def delete_compound(self, username, id):
		if self.auth_manager.has_compound_permission(username, id):
			file_objs = self.fetch_manager.get_file_uploads(id)
			for file_obj in file_objs:
				file_path = file_obj['file_path']
				os.unlink(file_path)

			self.archive_compound_cur.execute("execute archive_compound (%s,%s,%s)",(id,self.transaction_id,str(uuid.uuid4())))
			
			self.monotone_transaction_ids()
			
			self.conn.commit()
		else:
			raise authenticate.UnauthorisedException('User not authorised for compound ' + id)	

	def add_salt(self, salt_code, salt_mol, salt_description):
		salt_str = codecs.encode(salt_mol, 'base64').decode('ascii').rstrip()
		self.insert_salt_cur.execute("execute insert_salt (%s,%s,%s)", (salt_code, salt_str, salt_description))
		
	
	def add_salts(self, salts):
		for salt in salts:
			self.add_salt(salt['salt_code'], salt['salt_mol'], salt['salt_description'])

		self.conn.commit()

	

	def create_prefix(self, prefix_code, description):
		self.insert_prefix_code_cur.execute("execute insert_prefix_code (%s, %s)",(prefix_code, description))

		self.conn.commit()

	def remove_prefix(self, prefix_code):
		if self.fetch_manager.is_prefix(prefix_code):
			self.remove_prefix_cur.execute("execute remove_prefix (%s)", (prefix_code,))
			self.conn.commit()
		else:
			raise InvalidPrefixException('Invalid prefix ' + prefix_code)

	def attach_file(self, username, id, src_file_path, file_name):
		if self.auth_manager.has_compound_permission(username, id):
			upload_uuid = str(uuid.uuid4())
			file_name_minus_ext, extension = os.path.splitext(file_name)
			file_store = os.getcwd() + '/public/static/out/permanent'
			dst_file_path = file_store + '/' + upload_uuid + extension

			upload_uuid += extension

			os.rename(src_file_path, dst_file_path)

			self.insert_file_attach_cur.execute("execute insert_file_attach (%s,%s,%s,%s,%s)", (id, upload_uuid, dst_file_path, file_name, self.transaction_id))
			
			self.monotone_transaction_ids()
			
			self.conn.commit()
			return str(upload_uuid)
		else:
			raise authenticate.UnauthorisedException('User not authorised for compound ' + id)

	def register_supplier(self, supplier):
		self.register_supplier_cur.execute("execute compound_register_supplier (%s)", (supplier,))
		
		self.conn.commit()

		self.supplier_list[supplier] = 1

	def fetch_supplier_list(self):
		self.supplier_list = {}

		self.supplier_list_cur = self.conn.cursor()
		self.supplier_list_cur.execute('''
			select
				name	
			from
				suppliers
		''')

		for row in self.supplier_list_cur.fetchall():
			self.supplier_list[row[0]] = 1
			
	def get_next_id(self, id_prefix, project_name):
		next_int = 1

		self.find_last_id.execute("execute compound_find_last_id (%s,%s)", (id_prefix + '%',project_name))
		row = self.find_last_id.fetchone()
		if not row is None and row[0] is not None:
			next_int = int(row[0][2:8].lstrip('0'))+1
			
		return next_int

	def register_from_ctab(self, ctab_path, username, upload_defaults, project_name, fw, mols=[], file_name=None, converted_file = None):	
		start_time = datetime.datetime.now()
			
		project_id = self.auth_manager.get_project_id(project_name)
		
		next_ints = {}
			
		project_fields_by_type = self.auth_manager.get_custom_fields_by_type(project_name)
		for field_type in project_fields_by_type.keys():
			for field_name in project_fields_by_type[field_type].keys():
				if project_fields_by_type[field_type][field_name]['calculated'] and field_name in upload_defaults:
					del upload_defaults[field_name]
		
		if ctab_path is not None:
			reader = Chem.SDMolSupplier(ctab_path.encode('ascii','ignore'))
		else:
			reader = mols
			
		upload_id = str(uuid.uuid1())

		user = self.auth_manager.get_user(username, None)
		
		ids = []
		
		if 'compound_id' in upload_defaults:
			id_defaults = upload_defaults['compound_id']
		else:
			id_defaults = {'map_column': None, 'default_value': None}
		
		user_id = user['user_id']
		
		row_i = 0
		
		salts = self.fetch_manager.get_project_salts(project_name, username)
		
		prefixes = {}
		
		batch_on_field = None
		batch_on_field_def = None
		
		if 'batchable' not in upload_defaults:
			raise RegistrationException('Batchable missing from upload_defaults')
		
		batchable_defaults = upload_defaults['batchable']
		
		# Batch on a separate column
		if batchable_defaults['map_column'] is not None:
			col_name = batchable_defaults['map_column']
				
			for field_name in upload_defaults.keys():
				if 'map_column' in upload_defaults[field_name]:
					if col_name == upload_defaults[field_name]['map_column']:
						batch_on_field = field_name
						break
						
			if batch_on_field is None:
				raise Exception('You wish to batch on column ' + col_name + ' but you haven\'t mapped ' + col_name + ' to a database field')
				
			for field_type in project_fields_by_type.keys():
				for field_name in project_fields_by_type[field_type].keys():
					if field_name == batch_on_field:
						batch_on_field_def = project_fields_by_type[field_type][field_name]
						break
		
		for salted_mol in reader:
			if salted_mol is None:
				continue
			
			row_i += 1
			
			auto_id_retries = 0
			
			while True:
				auto_id_retries += 1
				
				try:
	
					obj = {}
					
					obj = self.process_mol(salted_mol, obj, salts)
						
					compound_id = None
					manual_id = 'no'
					
					batchable_id = None
					
					properties = salted_mol.GetPropsAsDict()
					
					if batchable_defaults['default_value'] is not None:
						batchable_id = str(batchable_defaults['default_value'])
					elif 'batchable' in properties:
						batchable_id = properties['batchable']
					
					if type(batchable_id) is str:
						if batchable_id.lower() == 'true':
							batchable_id = True
						elif batchable_id.lower() == 'false':
							batchable_id = False
					
					if id_defaults['map_column'] is not None:
						col_name = id_defaults['map_column']
						
						if col_name not in properties:
							raise Exception('Property ' + str(col_name) + 'missing for ' + str(row_i))
						else:
							compound_id = properties[col_name]
							manual_id = 'yes'
					elif id_defaults['default_value'] is not None:
						compound_id = properties[id_defaults['default_value']]
						manual_id = 'yes'
					else:	
						batchable_id = True
						
						generate_new_batch = True
						
						obj['_auto_id'] = auto_id_retries
						
						if batchable_defaults['map_column'] is not None:							
							col_name = batchable_defaults['map_column']
							if not col_name in properties:
								raise Exception('Property ' + str(col_name) + 'missing for ' + str(row_i))
							else:
								batchable_value = properties[col_name]
								
							batchable_value = batchable_value[0:len(batchable_value) -1]
							
																
							self.custom_field_batch_cursors[batch_on_field_def['type_name']].execute("execute custom_field_batch_" + batch_on_field_def['type_name'] +" (%s,%s,%s)", (batchable_value,batch_on_field_def['field_id'],project_name))
							
							row = self.custom_field_batch_cursors[batch_on_field_def['type_name']].fetchone()
			
							if not row is None and not row[0] is None:
								compound_id = row[0][0:8] + chr(ord(row[0][8])+1)
								generate_new_batch = False
						else:
							if salted_mol.GetNumAtoms() > 0:	
								self.find_matching.execute("execute compound_find_matching (%s, %s)",(project_id, obj['desalted_inchi_key_no_tautomer']))
								row = self.find_matching.fetchone()
				
								if not row is None and not row[0] is None:
									compound_id = row[0][0:8] + chr(ord(row[0][8])+1)
									generate_new_batch = False
								
						if generate_new_batch:
							classification_defaults = upload_defaults['classification']
							if classification_defaults['map_column'] is not None:
								id_prefix = properties[classification_defaults['map_column']]
							elif classification_defaults['default_value'] is not None:
								id_prefix = classification_defaults['default_value']
							elif 'classification' in properties:
								id_prefix = properties['classification']
							else:
								raise NotNullException({'compound_id': 'molecule ' + str(row_i), 'field_name': 'classification', 'human_name': 'Classification'})
								
							if not id_prefix in next_ints:
								next_ints[id_prefix] = self.get_next_id(id_prefix, project_name)
							
							compound_id = id_prefix + str(next_ints[id_prefix]).zfill(6) + 'a'
							next_ints[id_prefix] += 1
			
					if salted_mol.GetNumAtoms() > 0:
						compound_id = compound_id + obj['salt_code']
					
					if fw is not None:
						fw.write('Inserting ' + compound_id + '\n')
						
					# Make all SD properties available	
					sdf_props = {}	
					for prop_name in properties.keys():
						sdf_props[prop_name] = properties[prop_name]
						
					# Obtain properties for mapped columns and those with default values
					user_values = {}
					for field_name in upload_defaults.keys():
						if field_name != 'compound_id' and field_name != 'batchable':
							if upload_defaults[field_name]['map_column'] is not None:
								col_name = upload_defaults[field_name]['map_column']
								
								if not col_name in properties:
									pass
								else:
									user_values[field_name] = properties[col_name]
							elif upload_defaults[field_name]['default_value'] is not None:
								user_values[field_name] = upload_defaults[field_name]['default_value']	
						
					# The order below is important for functionaility and security
					# SD properties are overwritten by user mapped or defaulted properties
					# Which are inturn overwritten by properties set by process_mol
					# Which are inturn overwritten by the properties created below
					obj = {**sdf_props, **user_values, **obj, **{
						'compound_id':compound_id,
						'upload_id':upload_id,
						'user_id':user_id,
						'manual_id':manual_id,
						'batchable_id':batchable_id,
						'project_id':project_id,
					}}
					
					ids.append(compound_id)
					
					prefixes[compound_id[0:2]] = True
					
					self.insert_entity(obj, project_name, project_fields_by_type)
					
					break
				except ConcurrentIDGenerationCollision:
					print('A concurrent ID generation collision has occurred - going again.....')
			
		print('Running batch SS update', flush=True)
		self.batch_insert_ss_table(project_name, upload_id)
		print('Batch SS update done', flush=True)
		
		if ctab_path is not None and self.auth_manager.is_project(project_name + '/Uploads'):		
			time_delta = datetime.datetime.now() - start_time
			
			changes = {-1:{
				'compound_id': upload_id,
				'upload_count': len(ids), 
				'description': 'Target Families: ' + (','.join(prefixes.keys())), 
				'upload_project': project_name, 
				'upload_upload_uuid': upload_id,
				'upload_time': re.sub('\..+$','',str(time_delta))
				
			}}
			
			objs = self.save_changes(username, changes, project_name + '/Uploads')
			
			upload_obj_id = objs[-1]['id']
			
			if converted_file is not None:				
				self.attach_file(username, upload_obj_id, converted_file, file_name)
				
				filename, file_extension = os.path.splitext(file_name)
				
				self.attach_file(username, upload_obj_id, ctab_path, filename + '.sdf')
			else:
				self.attach_file(username, upload_obj_id, ctab_path, file_name)
			
			if len(ids) <= 30000:
				self.fetch_manager.configure_for_user(username, project_name)
				
				objs = self.fetch_manager.fetch_upload_set(upload_id, 0,99999999, username)
				
				
				sdf_file = self.fetch_manager.get_sdf(objs,  None, project_name, None)
				
				self.attach_file(username, upload_obj_id, sdf_file, 'Registered.sdf')
				
				excel_file = self.fetch_manager.get_excel(objs,  None, project_name, None)
				
				self.attach_file(username, upload_obj_id, excel_file, 'Registered.xlsx')	
		
		print('Committing', flush=True)	
		self.monotone_transaction_ids()
		
		self.conn.commit()
		print('Committed', flush=True)

		return {'upload_id': upload_id, 'ids': ids}
	
	def process_mol(self, salted_mol, obj, salts):	
		if salted_mol.GetNumAtoms() == 0:
			return {
				'desalted_sdf':None,
				'desalted_smiles':None,
				'salted_sdf':None,
				'salted_smiles':None,
				'desalted_inchi':None,
				'desalted_inchi_no_tautomer':None,
				'desalted_inchi_key':None,
				'desalted_inchi_key_no_tautomer':None,
				'salted_inchi':None,
				'salted_inchi_no_tautomer':None,
				'salted_inchi_key':None,
				'salted_inchi_key_no_tautomer':None,
				'salt_code': None 
			}
			
		desalted_mol = salted_mol

		found_salts = []
		
		for salt in salts:
 			salt_mol = salt['salt_mol']
 			no_atoms = desalted_mol.GetNumAtoms()
 			
 			desalted_mol = StripMol(desalted_mol, salt_mol, False)
 			if no_atoms != desalted_mol.GetNumAtoms(): 				
 				found_salts.append(salt)

		last_salt = None 
		
		salt_code = ''
		for salt in found_salts:
			salt_code += salt['salt_code']
			
			last_salt = salt['salt_code']

		desalted_smiles = Chem.MolToSmiles(desalted_mol)
		desalted_ctab = Chem.MolToMolBlock(desalted_mol)

		desalted_inchi_no_tautomer = Chem.MolToInchi(desalted_mol)
		desalted_inchi_no_tautomer_key = Chem.InchiToInchiKey(desalted_inchi_no_tautomer)

		desalted_inchi = Chem.MolToInchi(desalted_mol, '-FixedH')
		desalted_inchi_key = Chem.InchiToInchiKey(desalted_inchi)

		salted_smiles = Chem.MolToSmiles(salted_mol)
		salted_ctab = Chem.MolToMolBlock(salted_mol)
		
		salted_inchi_no_tautomer = Chem.MolToInchi(salted_mol)
		salted_inchi_no_tautomer_key = Chem.InchiToInchiKey(salted_inchi_no_tautomer)

		salted_inchi = Chem.MolToInchi(salted_mol, '-FixedH')
		salted_inchi_key = Chem.InchiToInchiKey(salted_inchi)
		
		if salted_inchi == '':
			raise RegistrationException('ChemiReg doesn\'t support molecules with unknown or generic atoms (A, Q, *, R)')

		properties = salted_mol.GetPropsAsDict()
			
		extra_obj = {
			'mw': Descriptors.MolWt(salted_mol),
			'desalted_sdf':desalted_ctab,
			'desalted_smiles':desalted_smiles,
			'salted_sdf':salted_ctab,
			'salted_smiles':salted_smiles,
			'desalted_inchi':desalted_inchi,
			'desalted_inchi_no_tautomer':desalted_inchi_no_tautomer,
			'desalted_inchi_key':desalted_inchi_key,
			'desalted_inchi_key_no_tautomer':desalted_inchi_no_tautomer_key,
			'salted_inchi':salted_inchi,
			'salted_inchi_no_tautomer':salted_inchi_no_tautomer,
			'salted_inchi_key':salted_inchi_key,
			'salted_inchi_key_no_tautomer':salted_inchi_no_tautomer_key,
			'salt_code': salt_code,
			'salt': last_salt
		}
			
		#Note: that attributes in extra_obj will override those in obj
		ret_val = {**obj, **extra_obj}
		
		return ret_val
	
	def batch_insert_ss_table(self, project_name, upload_id):
		ss_field = self.auth_manager.get_ss_search_field(project_name)
		if ss_field is not None:
			table_name = ss_field['table_name']
			
			self.insert_structure.execute('''
				insert into compounds_idx
				(id, molecule, custom_field_id)
				(
					select 
						a.id,
						mol_from_ctab(b.custom_field_value::cstring) molecule,
						b.id
					from 
						compounds a,
						''' + table_name + ''' b
					where
						a.upload_id=%s and
						b.custom_field_id = %s and
						b.entity_id = a.id 	
				)  
			''',(upload_id,ss_field['field_id']))
		else:
			print('No SS field', flush=True)
			
	def update_ss_table(self, project_name, entity_id):
		ss_field = self.auth_manager.get_ss_search_field(project_name)
		
		if ss_field is not None:
			table_name = ss_field['table_name']
			
			self.insert_structure.execute('''
				update compounds_idx
				set 
				    molecule=c.molecule
				from
				(
					select 
						a.id,
						mol_from_ctab(b.custom_field_value::cstring) molecule,
						b.id as custom_field_id
					from 
						compounds a,
						''' + table_name + ''' b
					where
						a.id=%s and
						b.custom_field_id = %s and
						b.entity_id = a.id		
				)  c
				where
					compounds_idx.id = c.id and
					compounds_idx.custom_field_id = c.custom_field_id
			''',(entity_id,ss_field['field_id']))
		else:
			print('No SS field')
	
	def insert_entity(self, obj, project_name, project_fields_by_type):
		ss_field = self.auth_manager.get_ss_search_field(project_name)
				
		try:
			if '_auto_id' in obj:
				self.cur.execute('savepoint entity_insert', None)
				
			self.cur.execute("execute compound_insert (%s, %s, %s, %s, %s, %s, %s)", (
		 		obj['compound_id'],
				obj['upload_id'],
				obj['user_id'],
				obj['manual_id'],
				obj['batchable_id'],
				obj['project_id'],
				self.transaction_id
			))
			 
			if '_auto_id' in obj:
				self.cur.execute('release entity_insert')
		except psycopg2.IntegrityError as e:
			error_message = str(e)
			
			match = self.duplicate_error_regex.search(error_message)
	
			if not match is None:
				duplicate_id = match.group(1)
				
				if '_auto_id' in obj and obj['_auto_id'] < self.auto_id_retry_limit:
					self.cur.execute('rollback to savepoint entity_insert', None)
					self.cur.execute('release entity_insert',None)
					
					raise ConcurrentIDGenerationCollision('Concurrent ID generation collision ' + duplicate_id)
				else:
					if '_auto_id' in obj:
						self.cur.execute('release entity_insert',None)
						
					raise RegistrationException('Duplicate compound ID ' + duplicate_id)
			else:
				raise RegistrationException('Unknown error ' + error_message)

		self.fetch_compound_id_cur.execute("execute fetch_compound_id (%s,%s)", (obj['compound_id'],project_name))
		row = self.fetch_compound_id_cur.fetchone()
		
		entity_id = row[0]
		
		for field_type in project_fields_by_type.keys():
			table_name = None
			
			value_map = []
			
			for field_name in project_fields_by_type[field_type].keys():
				field = project_fields_by_type[field_type][field_name]
				table_name = field['table_name']
				field_id = field['field_id']
				
				field_value = None
				
				if field_name in obj:
					field_value = obj[field_name]
				
				if field['required'] == True and field_value is None:
					raise NotNullException({'compound_id': obj['compound_id'], 'field_name': field['field_name'], 'human_name': field['human_name']})
				
				if field['type_name'] == 'foreign_key':
					value_map += [entity_id, field['project_foreign_key_id'],field_id, field_value, self.transaction_id]
				else:	
					if field_value is not None and type(field_value) is str and '_sdf' not in field_name:
						field_value =  re.sub('^\s+', '', field_value)
						field_value =  re.sub('\s+$', '', field_value)
						
						if field['type_name'] == 'float':
							if 'mM' in field_value:
								field_value= field_value.replace('mM', '').replace(' ', '')
							
							try:
								if field_value == '':
									field_value = None
								else:
									f=float(field_value)
							except ValueError:
								raise InvalidValueException({'compound_id': obj['compound_id'], 'field_name': field['field_name'], 'human_name': field['human_name'], 'value': field_value})
						elif field['type_name'] == 'int':							
							try:
								if field_value == '':
									field_value = None
								else:
									f=int(field_value)
							except ValueError:
								raise InvalidValueException({'compound_id': obj['compound_id'], 'field_name': field['field_name'], 'human_name': field['human_name'], 'value': field_value})
						elif field['type_name'] == 'varchar':
							if len(field_value) > 4000:
								raise ValueToLongException({'compound_id': obj['compound_id'], 'field_name': field['field_name'], 'human_name': field['human_name'], 'value': field_value})
							
					value_map += [entity_id, field_id, field_value, self.transaction_id]
				
			if table_name == 'custom_foreign_key_field':
				sql = 'INSERT INTO ' + table_name + '(entity_id, parent_project_id, custom_field_id, custom_field_value, insert_transaction_id) VALUES ' + (','.join(["(%s,%s,%s,%s,%s)" for x in range(0,int(len(value_map)/5))]))
			else:
				sql = 'INSERT INTO ' + table_name + '(entity_id, custom_field_id, custom_field_value, insert_transaction_id) VALUES ' + (','.join(["(%s,%s,%s,%s)" for x in range(0,int(len(value_map)/4))]))

			try:
				self.cur.execute(sql, value_map)
			except psycopg2.IntegrityError as e:
				self.conn.rollback()
				
				error_message = str(e)
			
				match = self.missing_key_error_regex.search(error_message)
				
				if match is not None:
					project_id = match.group(1)
					entity_id= match.group(2)
					
					project_name = self.auth_manager.get_project_by_id(project_id)
					
					raise MissingEntityException({'project_name': project_name, 'entity_id': entity_id})
				else:
					raise RegistrationException('Unknown error ' + error_message)
				
	def convert_excel_to_sdf(self, input_file, field_mappings):
		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.sdf')

		writer = SDWriter(tmp_file.name)		
		
		workbook = open_workbook(input_file,on_demand=True)
		
		sheet_names = workbook.sheet_names()
		
		sheet = workbook.sheet_by_name(sheet_names[0])
		
		rows = sheet.nrows
		columns = sheet.ncols
		
		headers = [sheet.cell_value(0, i) for i in range(0, columns)]
		
		mol_column = None
		
		mol_mapping = field_mappings['_mol']
		
		mol_header = None
		mol_default = None
		
		if mol_mapping['map_column'] is not None:
			mol_header = mol_mapping['map_column']
			
			for i in range(0,len(headers)):
				header = headers[i]
				
				if header == mol_header:
					mol_column = i
		elif mol_mapping['default_value'] is not None:
			mol_default = mol_mapping['default_value']
		else:
			mol_default = ''
		
		for i in range(1, rows):
			if mol_column is not None:
				mol_str = sheet.cell_value(i, mol_column)
			else:
				mol_str = mol_default
				
			if mol_str.startswith('InChI'):
				mol = Chem.MolFromInchi(mol_str)
			else:
				mol = Chem.MolFromSmiles(mol_str)
			
			if mol is None:
				raise RegistrationException('Compound on row ' + str(j) + ' is invalid')
				
			for j in range(0, columns):
				value = sheet.cell_value(i,j)
				
				if value is None:
					value = ''
				else:
					value = str(value)
					
					if value.endswith('.0'):
						value = value[0:len(value)-2]
				
				mol.SetProp(headers[j], value)
				
			writer.write(mol)
			
		writer.close()
		tmp_file.close()
		
		return tmp_file.name
	
	def convert_ctab_to_changes(self, input_file, field_mappings, project_name):
		sd_field_to_real = {}
		
		for field_name in field_mappings:
			map_column = field_mappings[field_name]['map_column']
			
			if map_column is not None and map_column != '':			
				sd_field_to_real[map_column] = field_name
		
		changes = {}
		
		reader = Chem.SDMolSupplier(input_file.encode('ascii','ignore'))
		
		for mol in reader:
			obj = {}
			properties = mol.GetPropsAsDict()

			for sd_field in sd_field_to_real.keys():
				#If you edit an SD file in ICM-Pro and re-save the file empty properties are removed entirely
				#Thus we have to check here!
				if not sd_field in properties:
					value = None
				else:
					value = properties[sd_field]
					
				if value == '':
					value = None
					
				real_field = sd_field_to_real[sd_field]

				obj[sd_field_to_real[sd_field]] = value

			for real_field in field_mappings.keys():
				if field_mappings[real_field]['default_value'] is not None:
					obj[real_field] = field_mappings[real_field]['default_value']
				
			self.fetch_compound_id_cur.execute("execute fetch_compound_id (%s,%s)", (obj['compound_id'],project_name))
			
			row = self.fetch_compound_id_cur.fetchone()
			
			if row is None:
				raise RegistrationException('Unable to find compound on row ' + str(i) + ' ' + obj['compound_id'])
			else:
				id = row[0];
				obj['id'] = id
				
				if not self.auth_manager.has_compound_permission(username, id):
					raise authenticate.UnauthorisedException('User not authorised for compound ' + obj['compound_id'])
				
			obj['compound_sdf'] = Chem.MolToMolBlock(mol)
				
			changes[obj['id']] = obj

		return changes
	
	def convert_excel_to_changes(self, input_file, field_mappings, project_name, as_new = False):		
		workbook = open_workbook(input_file,on_demand=True)
		
		sheet_names = workbook.sheet_names()
		
		sheet = workbook.sheet_by_name(sheet_names[0])
		
		rows = sheet.nrows
		columns = sheet.ncols
		
		headers = [sheet.cell_value(0, i) for i in range(0, columns)]
		
		excel_field_to_real = {}
		
		for field_name in field_mappings:
			map_column = field_mappings[field_name]['map_column']
			
			if map_column is not None and map_column != '':			
				excel_field_to_real[map_column] = field_name
		
		changes = {}
		
		project_def = self.auth_manager.get_project_configuration(project_name)
		
		if project_def['enable_structure_field']:
			
			mol_column = None
		
			mol_mapping = field_mappings['_mol']
			
			mol_header = None
			mol_default = None
			
			skip_mol_update = False
			
			if mol_mapping['map_column'] is not None:
				mol_header = mol_mapping['map_column']
				
				for i in range(0,len(headers)):
					header = headers[i]
					
					if header == mol_header:
						
						mol_column = i
			elif mol_mapping['default_value'] is not None:
				mol_default = mol_mapping['default_value']
			else:
				mol_default = ''
				
				skip_mol_update = True
				
		obj_id = -1
		
		for i in range(1, rows):
			obj = {}
			
			if project_def['enable_structure_field']:			
				if mol_column is not None:
					mol_str = sheet.cell_value(i, mol_column)
				else:
					mol_str = mol_default
					
				if mol_str.startswith('InChI'):
					mol = Chem.MolFromInchi(mol_str)
				else:
					mol = Chem.MolFromSmiles(mol_str)
				
				if mol is None:
					raise RegistrationException('Compound on row ' + str(j) + ' is invalid')
				
			for j in range(0, columns):
				header = headers[j]
				
				if not header in excel_field_to_real:
					continue
				
				map_column = excel_field_to_real[header]
				
				value = sheet.cell_value(i,j)
				
				if value is None:
					value = ''
				else:
					value = str(value)
					
				obj[map_column] = value
					
			for map_column in field_mappings.keys():
				if field_mappings[map_column]['default_value'] is not None:	
					value = field_mappings[map_column]['default_value']
						
					obj[map_column] = value
				
			if as_new:
				id = obj_id
				obj['id'] = id
				
				obj_id -= 1
			else:				
				self.fetch_compound_id_cur.execute("execute fetch_compound_id (%s,%s)", (obj['compound_id'],project_name))
				
				row = self.fetch_compound_id_cur.fetchone()
				
				if row is None:
					raise RegistrationException('Unable to find compound on row ' + str(i) + ' ' + obj['compound_id'])
				else:
					id = row[0];
					obj['id'] = id
					
					if not self.auth_manager.has_compound_permission(username, id):
						raise authenticate.UnauthorisedException('User not authorised for compound ' + obj['compound_id'])
				
			if project_def['enable_structure_field']:	
				if not skip_mol_update:
					obj['compound_sdf'] = Chem.MolToMolBlock(mol)
			
			changes[id] = obj
		
		return changes
	
	def convert_csv_to_changes(self, input_file, field_mappings, sep, project_name, as_new = False):		
		with open(input_file, 'r') as f:
			dialect = csv.Sniffer().sniff(f.read(1024))
			
			f.seek(0)
			
			reader = csv.reader(f, dialect)
			
			headers = next(reader)
			
			excel_field_to_real = {}
		
			for field_name in field_mappings:
				map_column = field_mappings[field_name]['map_column']
				
				if map_column is not None and map_column != '':			
					excel_field_to_real[map_column] = field_name
			
			changes = {}
			
			project_def = self.auth_manager.get_project_configuration(project_name)
		
			if project_def['enable_structure_field']:
			
				mol_column = None
				
				skip_mol_update = False
			
				mol_mapping = field_mappings['_mol']
				
				mol_header = None
				mol_default = None
				
				if mol_mapping['map_column'] is not None:
					mol_header = mol_mapping['map_column']
					
					for i in range(0,len(headers)):
						header = headers[i]
						
						if header == mol_header:
							mol_column = i				
				elif mol_mapping['default_value'] is not None:
					mol_default = mol_mapping['default_value']
				else:
					mol_default = ''
					
					skip_mol_update = True
					
			obj_id = -1
			
			for cols in reader:
				obj = {}
				#cols = [col.lstrip().rstrip() for col in line.split(sep)]
				if project_def['enable_structure_field']:
					if mol_column is not None:
						mol_str = cols[mol_column]
					else:
						mol_str = mol_default
						
					if mol_str.startswith('InChI'):
						mol = Chem.MolFromInchi(mol_str)
					else:
						mol = Chem.MolFromSmiles(mol_str)
						
					if mol is None:
						raise RegistrationException('Compound on row ' + str(j) + ' is invalid')
					
				for i in range(0,len(headers)):
					header = headers[i]
				
					if not header in excel_field_to_real:
						continue
					
					map_column = excel_field_to_real[header]
					
					if project_def['enable_structure_field']:
						if i == mol_column:
							continue
					
					value = cols[i]
					
					if value is None:
						value = ''
					else:
						value = str(value)
						
					obj[map_column] = value
					
				for map_column in field_mappings.keys():
					if field_mappings[map_column]['default_value'] is not None:	
						value = field_mappings[map_column]['default_value']
							
						obj[map_column] = value
					
				if as_new:
					id = obj_id
					obj['id'] = id
					
					obj_id -= 1
				else:			
					self.fetch_compound_id_cur.execute("execute fetch_compound_id (%s,%s)", (obj['compound_id'],project_name))
				
					row = self.fetch_compound_id_cur.fetchone()
					
					if row is None:
						raise RegistrationException('Unable to find compound on row ' + str(i) + ' ' + obj['compound_id'])
					else:
						id = row[0];
						obj['id'] = id
						
						if not self.auth_manager.has_compound_permission(username, id):
							raise authenticate.UnauthorisedException('User not authorised for compound ' + obj['compound_id'])
					
				if project_def['enable_structure_field']:
					if not skip_mol_update:
						obj['compound_sdf'] = Chem.MolToMolBlock(mol)
				
				changes[id] = obj
				
		return changes
	
	def convert_csv_to_sdf(self, input_file, field_mappings, sep):
		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.sdf')

		writer = SDWriter(tmp_file.name)		
		
		with open(input_file, 'r') as f:
			dialect = csv.Sniffer().sniff(f.read(1024))
			
			f.seek(0)
			
			reader = csv.reader(f, dialect)
			
			headers = next(reader)
			
			mol_column = None
		
			mol_mapping = field_mappings['_mol']
			
			mol_header = None
			mol_default = None
			
			if mol_mapping['map_column'] is not None:
				mol_header = mol_mapping['map_column']
				
				for i in range(0,len(headers)):
					header = headers[i]
					
					if header == mol_header:
						mol_column = i				
			elif mol_mapping['default_value'] is not None:
				mol_default = mol_mapping['default_value']
			else:
				mol_default = ''
			
			for cols in reader:
				#cols = [col.lstrip().rstrip() for col in line.split(sep)]
				
				if mol_column is not None:
					mol_str = cols[mol_column]
				else:
					mol_str = mol_default
					
				if mol_str.startswith('InChI'):
					mol = Chem.MolFromInchi(mol_str)
				else:
					mol = Chem.MolFromSmiles(mol_str)
					
				if mol is None:
					raise RegistrationException('Compound on row ' + str(j) + ' is invalid')
					
				for i in range(0,len(headers)):
					header = headers[i]
						
					if i == mol_column:
						continue
					
					value = cols[i]
					
					if value is None:
						value = ''
					else:
						value = str(value)
						
					mol.SetProp(headers[i], value)
					
				writer.write(mol)
				
		writer.close()
		tmp_file.close()
		
		return tmp_file.name
	
	def delete_upload_set(self, username, upload_id, project_name):
		if not self.auth_manager.has_project(username, project_name):
			raise authenticate.UnauthorisedException('User ' + username + ' not authorised for ' + project_name)
		
		self.delete_upload_set_cur.execute("execute delete_upload_set (%s,%s,%s)", (upload_id, project_name, self.transaction_id))
		
	def convert_value(self, project_name, field_name, original_value, new_value):
		cur = self.conn.cursor()
		
		cur.execute('''
			select 
				id
			from
				projects
			where
				project_name = %s
		''',(project_name,))
		
		row = cur.fetchone()
		
		if row is None:
			raise Exception('Project name ' + project_name + ' not found')
		
		project_id = row[0]
		
		cur.execute('''
			select
				a.id,
				b.table_name
			from
				custom_fields a,
				custom_field_types b
			where
				a.project_id = %s and
				a.name = %s and
				a.type_id = b.id		
		''',(project_id, field_name))
		
		row = cur.fetchone()
		
		if row is None:
			raise Exception('Custom field ' + field_name + ' doesn\'t exist for project ' + project_name)

		custom_field_id = row[0]
		custom_field_table = row[1]

	# monotone_transaction_ids ensures that each sequential commit is marked by a unique and increasing ID	
		
	def monotone_transaction_ids(self):
		self.conn.cursor().execute('''
			lock table compounds in exclusive mode
		''')
		cur = self.conn.cursor()
		cur.execute('''
			select nextval('monotone_transaction_counter');
		''')
		
		new_transaction_id = cur.fetchone()[0]
		
		field_types = self.auth_manager.get_custom_field_types()
		for field in field_types:
			field_type = field['type_name']
			table_name = field['table_name']
			
			cur = self.conn.cursor()
			
			cur.execute('update ' + table_name + ' set insert_transaction_id=%s where insert_transaction_id=%s', (new_transaction_id, self.transaction_id))
			cur.execute('update ' + table_name + ' set update_transaction_id=%s where update_transaction_id=%s', (new_transaction_id, self.transaction_id))
			cur.execute('update ' + table_name + ' set archived_transaction_id=%s where archived_transaction_id=%s', (new_transaction_id, self.transaction_id))
		
		cur = self.conn.cursor()
			
		cur.execute('update compounds set insert_transaction_id=%s where insert_transaction_id=%s', (new_transaction_id, self.transaction_id))
		cur.execute('update compounds set update_transaction_id=%s where update_transaction_id=%s', (new_transaction_id, self.transaction_id))
		cur.execute('update compounds set archived_transaction_id=%s where archived_transaction_id=%s', (new_transaction_id, self.transaction_id))

class ValueToLongException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)	
	
class InvalidValueException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class NotNullException(Exception):		
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)
		
class MissingEntityException(Exception):		
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class RegistrationException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class InvalidPrefixException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class InvalidFileUUIDException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class InvalidFieldNameException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class ConcurrentIDGenerationCollision(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

if __name__ == '__main__':
	if len(sys.argv) < 2:
		sys.exit('Invalid number of arguments provided')
	
	input_json_path = sys.argv[len(sys.argv)-2]
	output_json_path = sys.argv[len(sys.argv)-1]
	
	input_json = None
	
	with open(input_json_path, 'r') as f:
		input_json = json.load(f)
	
	manager = CompoundManager()

	if 'save_changes' in input_json:
		#PROTECTION: _username is provided by NodeJS as the real username and can't be faked  by the client
		changes = input_json['save_changes']
		username = input_json['_username']
		project_name = input_json['project_name']
		output_json = {'error': None}
		
		error = None
		
		try:
			output_json['refreshed_objects'] = manager.save_changes(username, changes, project_name)
		except authenticate.UnauthorisedException as e:
			error = e.value
		except InvalidFieldNameException as e:
			error = e.value
		except RegistrationException as e:
			error = e.value 
		except MissingEntityException as e:
			error = 'Missing ' + e.value['project_name'] + ' ' + e.value['entity_id']
			output_json['missing_entity'] = e.value
		except NotNullException as e:
			error = 'Field ' + e.value['human_name'] + ' can\'t be null ' + ' for ' + e.value['compound_id']
			output_json['not_null_exception'] = e.value	
		except InvalidValueException as e:
			error = 'Field ' + e.value['human_name'] + ' has incorrect value '  + ' ' + str(e.value['value']) + ' for ' + e.value['compound_id']
			output_json['invalid_exception'] = e.value
			
		output_json['error'] = error
			
	elif 'delete_file' in input_json:
		#PROTECTION: _username is provided by NodeJS as the real username and can't be faked  by the client
		file_uuid = input_json['delete_file']
		username = input_json['_username']

		output_json = {'error': None}

		try:
			manager.delete_file_upload(username, file_uuid)
		except authenticate.UnauthorisedException as e:
			ouput_json['error'] = str(e)
		except InvalidFileUUIDException as e:
			output_json['error'] = str(e)

	elif 'delete_compound' in input_json:
		#PROTECTION: _username is provided by NodeJS as the real username and can't be faked  by the client
		id = input_json['delete_compound']
		username = input_json['_username']

		output_json = {'error' : None}	

		try:
			manager.delete_compound(username, id)
		except authenticate.UnauthorisedException as e:
			output_json['error'] = str(e) 	
	elif 'delete_upload_set' in input_json:
		#PROTECTION: _username is provided by NodeJS as the real username and can't be faked  by the client
		upload_id = input_json['upload_id']
		username = input_json['_username']
		project_name = input_json['project_name']

		output_json = {'error' : None}	

		try:
			manager.delete_upload_set(username, upload_id, project_name)
			
			manager.monotone_transaction_ids()
			
			manager.conn.commit()
			
		except authenticate.UnauthorisedException as e:
			output_json['error'] = str(e) 	
	elif 'register_supplier' in input_json:
		#PROTECTION: _username is provided here as at the moment all users can create suppliers
		#           NodeJS protects this function from unauthenticated users

		supplier = input_json['register_supplier']
		manager.register_supplier(supplier)

		output_json = {'error': None}
	elif 'upload_key_attach' in input_json:
		#PROTECTION: _username is provided by NodeJS as the real username and can't be faked  by the client
		file_path = input_json['upload_key_attach']
		compound_id = input_json['id']
		file_name = input_json['file_name']
		username = input_json['_username']

		error = None
		upload_uuid = None
		try:
			upload_uuid = manager.attach_file(username, compound_id, file_path, file_name)
		except authenticate.UnauthorisedException as e:
			error = str(e)

		output_json = {'error': error, 'uuid': upload_uuid}
	elif 'upload_key_sdf' in input_json:
		#PROTECTION: _username is provided by NodeJS as the real username and can't be faked  by the client

		upload_id = None
		error = None

		username = input_json['_username']
		project_name = input_json['project_name']

		#TODO: Move this check into register_from_ctab as all the other methods check the username there self
		if manager.auth_manager.has_project(username, project_name):
			project_id = manager.auth_manager.get_project_id(project_name)
			
			output_json = {}
			
			try:
				with open('/tmp/cmp_reg.log', 'w') as fw:
					input_file = input_json['upload_key_sdf']
					
					username = input_json['_username']
					project_name = input_json['project_name']
					output_json = {'error': None}
					
					if '_update' in input_json['upload_defaults'] and input_json['upload_defaults']['_update']['default_value']:
						if input_json['name'].endswith('.xlsx'):
							changes = manager.convert_excel_to_changes(input_file,input_json['upload_defaults'],project_name)	
						elif input_json['name'].endswith('.csv'):
							changes = manager.convert_csv_to_changes(input_file,input_json['upload_defaults'],',',project_name)	
						elif input_json['name'].endswith('.txt'):
							changes = manager.convert_csv_to_changes(input_file,input_json['upload_defaults'],'\t',project_name)	
						elif input_json['name'].endswith('sdf'):
							changes = manager.convert_ctab_to_changes(input_file,input_json['upload_defaults'],project_name)	
						
						error = None
						
						try:
							output_json['refreshed_objects'] = manager.save_changes(username, changes, project_name)
						except authenticate.UnauthorisedException as e:
							error = e.value
						except InvalidFieldNameException as e:
							error = e.value
						except RegistrationException as e:
							error = e.value 
						except MissingEntityException as e:
							error = 'Missing ' + e.value['project_name'] + ' ' + e.value['entity_id']
							output_json['missing_entity'] = e.value
						except NotNullException as e:
							error = 'Field ' + e.value['human_name'] + ' can\'t be null ' + ' for ' + e.value['compound_id']
							output_json['not_null_exception'] = e.value	
						except InvalidValueException as e:
							error = 'Field ' + e.value['human_name'] + ' has incorrect value '  + ' ' + str(e.value['value']) + ' for ' + e.value['compound_id']
							output_json['invalid_exception'] = e.value
							
						output_json['error'] = error
					else:					
						project_def = manager.auth_manager.get_project_configuration(project_name)
						
						if project_def['enable_structure_field']:	
							original_file = None
							if input_json['name'].endswith('.xlsx'):
								original_file = input_file	
								input_file = manager.convert_excel_to_sdf(input_file,input_json['upload_defaults'])	
							elif input_json['name'].endswith('.csv'):
								original_file = input_file	
								input_file = manager.convert_csv_to_sdf(input_file,input_json['upload_defaults'],',')
							elif input_json['name'].endswith('.txt'):
								original_file = input_file	
								input_file = manager.convert_csv_to_sdf(input_file,input_json['upload_defaults'],'\t')
								
							upload_id = manager.register_from_ctab(input_file, input_json['_username'], input_json['upload_defaults'],input_json['project_name'], fw, None, input_json['name'], original_file)['upload_id']
						else:
							if input_json['name'].endswith('.xlsx'):
								changes = manager.convert_excel_to_changes(input_file,input_json['upload_defaults'],project_name, True)	
							elif input_json['name'].endswith('.csv'):
								changes = manager.convert_csv_to_changes(input_file,input_json['upload_defaults'],',',project_name,True)	
							elif input_json['name'].endswith('.txt'):
								changes = manager.convert_csv_to_changes(input_file,input_json['upload_defaults'],'\t',project_name,True)	
								
							error = None
						
							try:
								output_json['refreshed_objects'] = manager.save_changes(username, changes, project_name)
							except authenticate.UnauthorisedException as e:
								error = e.value
							except InvalidFieldNameException as e:
								error = e.value
							except RegistrationException as e:
								error = e.value 
							except MissingEntityException as e:
								error = 'Missing ' + e.value['project_name'] + ' ' + e.value['entity_id']
								output_json['missing_entity'] = e.value
							except NotNullException as e:
								error = 'Field ' + e.value['human_name'] + ' can\'t be null ' + ' for ' + e.value['compound_id']
								output_json['not_null_exception'] = e.value	
							except InvalidValueException as e:
								error = 'Field ' + e.value['human_name'] + ' has incorrect value '  + ' ' + str(e.value['value']) + ' for ' + e.value['compound_id']
								output_json['invalid_exception'] = e.value
								
							output_json['error'] = error
						
						
			except RegistrationException as e:
				error = e.value
			except InvalidPrefixException as e:
				error = e.value
			except MissingEntityException as e:
				error = 'Missing ' + e.value['project_name'] + ' ' + e.value['entity_id']
				output_json['missing_entity'] = e.value
			except NotNullException as e:
				error = 'Field ' + e.value['human_name'] + ' can\'t be null ' + ' for ' + e.value['compound_id']
				output_json['not_null_exception'] = e.value
			except InvalidValueException as e:
				error = 'Field ' + e.value['human_name'] + ' has incorrect value '  + ' ' + str(e.value['value']) + ' for ' + e.value['compound_id']
				output_json['invalid_exception'] = e.value
			except ValueToLongException as e:
				error = 'Field ' + e.value['human_name'] + ' has value '  + ' ' + str(e.value['value']) + ' for ' + e.value['compound_id'] + ' larger than 4,000 characters'
				output_json['invalid_exception'] = e.value
				
			output_json['upload_id'] = upload_id
			output_json['error'] = error
		else:
			output_json = {'error': 'Not authorised for requested project'}	

	with open(output_json_path, 'w') as fw:
		fw.write(json.dumps(output_json))
		
