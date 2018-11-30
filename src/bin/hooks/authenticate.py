# ChemiReg - web-based compound registration platform
# Written in 2017 by David Damerell <david.damerell@sgc.ox.ac.uk>, Brian Marsden <brian.marsden@sgc.ox.ac.uk>
# 
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# Core Python
import json
import os
import sys
import uuid
import time
import datetime

# lGPL
import psycopg2

# MIT 2010, 2013
import pymysql as MySQLdb

MySQLdb.install_as_MySQLdb()

# BSD 3-clause
from rdkit import Chem
from rdkit.Chem.SaltRemover import SaltRemover

# BSD
from passlib.context import CryptContext

# MIT 2016 Daniel Wolf
from zxcvbn import zxcvbn

# ChemiReg - CC0
from email_manager import EmailManager
from connection_manager import ConnectionManager
import sdf_register
import re

class AuthenticationManager(object):
	def __init__(self, conn=None, fetch_manager = None, crud_manager=None):
		self.conn = conn
		self.scarab_conn = None

		self.pwd_context = CryptContext(schemes=["pbkdf2_sha256"])

		self.include_scarab = True
		self.user_registration_enabled = True
		self.user_registration_disabled_msg = 'Access by invitation only'
		self.email_manager = EmailManager()

		self.logging_file = '/home/chemireg/authentication.log'

		self.authentication_fw = open(self.logging_file, 'a')

		self.token_lifetime = 60 * 60 * 10 
		
		self.connect()
		
		if fetch_manager is None:
			import fetch
		
			self.fetch_manager = fetch.CompoundFetchManager(None, self)
		else:
			self.fetch_manager = fetch_manager
			
		self.crud_manager = crud_manager

	def connect(self):
		if self.conn is None:
			self.conn = ConnectionManager.get_new_connection()

		self.conn.cursor().execute('BEGIN')
		
		fetch_transaction = self.conn.cursor()
		
		fetch_transaction.execute('''
			select nextval('transaction_counter');
		''')
		
		self.transaction_id = fetch_transaction.fetchone()[0]

		if self.include_scarab:
			self.scarab_conn =  MySQLdb.connect('fides.sgc.ox.ac.uk', 'icmdb', 'molsoft')
		
		self.check_user_exists_cur = self.conn.cursor()
		self.check_user_exists_cur.execute('''
			prepare check_user_auth as
			select
				username
			from
				users
			where
				username = $1 and
				account_type = $2 and
				archive_date is null
		''')

		self.check_user_exists_all_cur = self.conn.cursor()
		self.check_user_exists_all_cur.execute('''
			prepare check_user_all as
			select
				username
			from
				users
			where
				username = $1 and
				archive_date is null
		''')

		self.insert_user_cur = self.conn.cursor()
		self.insert_user_cur.execute('''
			prepare insert_user as
			insert into users
			(
				first_name,
				last_name,
				email,
				username,
				password_hash,
				account_type
			)
			values($1,$2,$3,$4,$5, $6)
		''')

		self.update_user_cur = self.conn.cursor()
		self.update_user_cur.execute('''
			prepare update_user as
			update
				users
			set
				first_name = $2,
				last_name = $3,
				email = $4,
				username = $5,
				account_type = $6
			where
				username = $1
		''')

		self.delete_user_cur = self.conn.cursor()
		self.delete_user_cur.execute('''
			prepare delete_user as
			delete from users where username = $1		
		''')

		self.fetch_user_cur = self.conn.cursor()
		self.fetch_user_cur.execute('''
			prepare fetch_user as
			select
				first_name,
				last_name,
				email,
				username,
				password_hash,
				id,
				reset_password_token,
				extract(epoch from (current_timestamp - reset_token_timestamp)) as reset_token_age,
				account_type
			from
				users
			where
				username = $1
		''')

		self.is_project_cur = self.conn.cursor()
		self.is_project_cur.execute('''
			prepare is_project as
			select
				project_name	
			from
				projects
			where 
				project_name = $1 and
				archived_date is null
		''')

		self.create_project_cur = self.conn.cursor()
		self.create_project_cur.execute('''
			prepare create_project as
			insert into projects
			(
				project_name,id_group_name
			)
			values($1,$2)
		''')

		self.fetch_user_id_cur = self.conn.cursor()
		self.fetch_user_id_cur.execute(''' 
			prepare fetch_user_id as 
			select
				id
			from
				users
			where
				username = $1
		''')

		self.fetch_project_id_cur = self.conn.cursor()
		self.fetch_project_id_cur.execute(''' 
			prepare fetch_project_id as
			select
				id
			from 
				projects
			where 
				project_name = $1 and
				archived_date is null

		''')
		
		self.fetch_project_by_id_cur = self.conn.cursor()
		self.fetch_project_by_id_cur.execute(''' 
			prepare fetch_project_by_id as
			select
				project_name
			from 
				projects
			where 
				id = $1 and
				archived_date is null
		''')

		self.insert_project_association_cur = self.conn.cursor()
		self.insert_project_association_cur.execute(''' 
			prepare insert_project_association as
			insert into user_to_project
			(
				project_id,
				user_id
			)
			values($1, $2)
		''')

		self.fetch_users_with_project_cur = self.conn.cursor()
		self.fetch_users_with_project_cur.execute('''
			prepare fetch_users_with_project as
			select
				c.username,
				a.user_id
			from
				user_to_project a,
				projects b,
				users c
			where
				a.project_id = b.id and
				b.project_name = $1 and
				a.user_id = c.id and
				b.archived_date is null
		''')

		self.remove_project_association_cur = self.conn.cursor()
		self.remove_project_association_cur.execute(''' 
			prepare remove_project_association as
			delete from user_to_project where user_id = $1 and project_id = $2
		''')

		self.fetch_user_project_associations_cur = self.conn.cursor()
		self.fetch_user_project_associations_cur.execute(''' 
			prepare fetch_user_project_associations as 
			select
				project_name,
				c.default_project
			from
				projects a,
				users b,
				user_to_project c
			where
				b.username = $1 and
				c.user_id = b.id and
				c.project_id = a.id and
				a.archived_date is null
			order by
				c.default_project, project_name
		''')


		self.reset_user_password_cur = self.conn.cursor()
		self.reset_user_password_cur.execute(''' 
			prepare reset_user_password as 
			update
				users
			set
				password_hash = $1
			where
				username = $2
		''')

		self.has_project_cur = self.conn.cursor()
		self.has_project_cur.execute(''' 
			prepare has_project as
			select
				a.id
			from
				users a,
				projects b,
				user_to_project c
			where
				a.username = $1 and
				b.project_name = $2 and
				c.user_id = a.id and
				c.project_id = b.id and
				b.archived_date is null and
				c.archive_date is null
		''')

		self.user_compound_check_cur = self.conn.cursor()
		self.user_compound_check_cur.execute(''' 
			prepare user_compound_check as
			select
				a.id
			from
				compounds a,
				users b,
				user_to_project c
			where
				a.id = $1 and
				b.username = $2 and
				c.user_id = b.id and 
				a.project_id = c.project_id and
				c.archive_date is null
		''')

		self.update_user_reset_code_cur = self.conn.cursor()
		self.update_user_reset_code_cur.execute(''' 
			prepare update_user_reset_code as
			update
				users
			set
				reset_password_token = $1,
				reset_token_timestamp = current_timestamp
			where
				username = $2
		''')
		
		self.insert_custom_field_cur = self.conn.cursor()
		self.insert_custom_field_cur.execute('''
			prepare insert_custom_field as
			insert into custom_fields
			(project_id, name, type_id, required, visible, human_name, calculated)
			values ($1, $2, $3, $4, $5, $6, $7)
		''')

		self.update_custom_field_cur = self.conn.cursor()
		self.update_custom_field_cur.execute('''
			prepare update_custom_field as
			update custom_fields
				set name=$3,
				required=$4,
				visible=$5,
				human_name=$6,
				calculated=$7
			where
				project_id = (select id from projects where project_name = $2) and
				name = $1
		''')
		
		self.fetch_custom_field_type_id_cur = self.conn.cursor()
		self.fetch_custom_field_type_id_cur.execute(''' 
			prepare fetch_custom_field_type_id as
			select
				id
			from 
				custom_field_types
			where 
				name = $1
		''')
		
		self.fetch_custom_field_types_cur = self.conn.cursor()
		self.fetch_custom_field_types_cur.execute(''' 
			prepare fetch_custom_field_types as
			select
				id,
				name,
				table_name
			from custom_field_types
		''')
		
		self.fetch_custom_fields_cur = self.conn.cursor()
		self.fetch_custom_fields_cur.execute(''' 
			prepare fetch_custom_fields as
			select
				a.id,
				a.name,
				a.type_id,
				b.name as type_name,
				b.table_name,
				a.required,
				a.ss_field,
				NULL,
				a.auto_convert_mol,
				a.visible,
				a.human_name,
				a.project_foreign_key_id,
				c.project_name,
				a.calculated,
				a.before_update_function
			from
				custom_fields a left outer join projects c on (a.project_foreign_key_id = c.id),
				custom_field_types b
			where
				a.project_id = $1 and
				a.type_id = b.id and
				a.archived_date is null
		''')
		
		self.fetch_custom_field_cur = self.conn.cursor()
		self.fetch_custom_field_cur.execute(''' 
			prepare fetch_custom_field as
			select
				a.id,
				a.name,
				a.type_id,
				b.name as type_name,
				b.table_name,
				a.required,
				a.ss_field,
				Null,
				a.auto_convert_mol,
				a.visible,
				a.human_name,
				a.project_foreign_key_id,
				d.project_name,
				a.calculated
			from
				custom_fields a left outer join projects d on (a.project_foreign_key_id = d.id),
				custom_field_types b,
				projects c
			where
				a.project_id = c.id and
				c.project_name = $1 and
				a.name = $2 and
				a.type_id = b.id and
				c.archived_date is null
		''')
		
		self.update_foreign_key_cur = self.conn.cursor()
		self.update_foreign_key_cur.execute(''' 
			prepare update_foreign_key as
			update custom_fields 
			set 
				project_foreign_key_id = $1
			where
				id = $2
		''')
		
		self.reset_user_default_project_cur = self.conn.cursor()
		self.reset_user_default_project_cur.execute(''' 
			prepare reset_user_default_project as
			update
				user_to_project
			set
				default_project = false
			where
				user_id = $1
		''')
		
		self.set_user_default_project_cur = self.conn.cursor()
		self.set_user_default_project_cur.execute(''' 
			prepare set_user_default_project as
			update
				user_to_project
			set
				default_project = true
			where
				user_id = $1 and
				project_id = $2
		''')
		
		self.reset_ss_search_field_cur = self.conn.cursor()
		self.reset_ss_search_field_cur.execute(''' 
			prepare reset_ss_search_field as
			update
				custom_fields
			set
				ss_field = false
			where 
				project_id = $1
		''')
		
		self.set_ss_search_field_cur = self.conn.cursor()
		self.set_ss_search_field_cur.execute(''' 
			prepare set_ss_search_field as
			update
				custom_fields
			set
				ss_field = true
			where
				project_id = $1 and
				name = $2
		''')

		self.get_project_configuration_cur = self.conn.cursor()
		self.get_project_configuration_cur.execute(''' 
			prepare fetch_project_configuration as
			select
				enable_structure_field,
				enable_attachment_field,
				entity_name,
				enable_addition
			from
				projects
			where
				project_name = $1 and
				archived_date is null
		''')

		self.delete_custom_field_cur = self.conn.cursor()
		self.delete_custom_field_cur.execute('''
			prepare delete_custom_field as
			delete from custom_fields where project_id=(select id from projects where project_name = $1) and name = $2
		''')

		self.is_user_administrator_cur = self.conn.cursor()
		self.is_user_administrator_cur.execute(''' 
			prepare is_user_administrator as
			select
				is_administrator
			from
				users,
				projects,
				user_to_project
			where
				projects.project_name = $1 and
				users.username = $2 and
				user_to_project.user_id = users.id and
				user_to_project.project_id = projects.id and
				user_to_project.archive_date is null
		''')
		
		self.update_project_configuration_cur = self.conn.cursor()
		self.update_project_configuration_cur.execute(''' 
			prepare update_project_configuration as
			update
				projects
			set
				enable_structure_field = $1,
				enable_attachment_field = $2,
				entity_name = $3,
				enable_addition = $5
			where
				project_name= $4 and
				archived_date is null
		''')

		self.rename_project_cur = self.conn.cursor()
		self.rename_project_cur.execute('''
			prepare rename_project as
			update
				projects
			set
				project_name = $1
			where
				project_name = $2 and
				archived_date is null
		''')

		self.rename_child_projects_cur = self.conn.cursor()
		self.rename_child_projects_cur.execute('''
			prepare rename_child_projects as
			update
				projects
			set
				project_name = REGEXP_REPLACE(project_name, '^' || $1 || '/', $2 || '/')
			where
				project_name like $1 || '/%' and
				archived_date is null
		''')

		self.rename_project_entity_cur = self.conn.cursor()
		self.rename_project_entity_cur.execute('''
			prepare rename_project_entity as
			update
				projects
			set
				entity_name = $2
			where
				project_name = $1 and
				archived_date is null
		''')
		
		self.custom_field_cursors = {}
		
		field_types = self.get_custom_field_types()
		for field in field_types:
			field_type = field['type_name']
			table_name = field['table_name']
			
			self.custom_field_cursors[field_type] = self.conn.cursor()
			
			if field_type == 'foreign_key':
				self.custom_field_cursors[field_type].execute("prepare custom_create_field_" + field_type + ''' as
					insert into 
						''' + table_name + ''' 
						(entity_id, custom_field_id, custom_field_value, parent_project_id, insert_transaction_id) 
						select
							compounds.id,
							(
								select 
									custom_fields.id 
								from 
									custom_fields join
									projects on (custom_fields.project_id = projects.id)
								where
									projects.project_name = $1  and
									custom_fields.name = $2
									
							),
							null,
							(
								select 
									projects.id
								from
									projects
								where
									projects.project_name = $3
							),$4
						from
							compounds join
							projects on (compounds.project_id = projects.id)
						where
							projects.project_name = $1 and
							archived_date is null
				
				
				''')
			else:
				self.custom_field_cursors[field_type].execute("prepare custom_create_field_" + field_type + ''' as
					insert into 
						''' + table_name + ''' 
						(entity_id, custom_field_id, custom_field_value,insert_transaction_id) 
						select
							compounds.id,
							(
								select 
									custom_fields.id 
								from 
									custom_fields join
									projects on (custom_fields.project_id = projects.id)
								where
									projects.project_name = $1  and
									custom_fields.name = $2
									
							),
							null,
							$3
						from
							compounds join
							projects on (compounds.project_id = projects.id)
						where
							projects.project_name = $1 and
							archived_date is null
				
				
				''')

	def validate_project_term(self, term):
		if term.endswith('/Settings') or term.endswith('/Uploads') or term.endswith('/Search History') or term.endswith('/Custom Row Buttons'):
			return False
		else:
			return True

	def rename_project(self, new_project_name, old_project_name):
		self.rename_project_cur.execute('execute rename_project (%s,%s)',(new_project_name, old_project_name))

		self.rename_child_projects_cur.execute('execute rename_child_projects (%s,%s)', (old_project_name, new_project_name))

	def rename_project_entity(self, project_name, new_entity_name):
		self.rename_project_entity_cur.execute('execute rename_child_projects (%s, %s)', (project_name, new_entity_name))
				
	def delete_project_entities(self, project_name):
		self.conn.cursor().execute(
			'''delete from
				compounds
			where
				compounds.project_id = (select id from projects where project_name=%s and archived_date is null)''',
			(project_name,)
		)
		
	def delete_project_user_associations(self, project_name):
		self.conn.cursor().execute('''
			delete from
				user_to_project
			where
				user_to_project.project_id = (select id from projects where project_name=%s and archived_date is null)
		''', (project_name, ))
		
	def delete_project(self, project_name,  uuid_str = str(uuid.uuid4())):
		# When a project gets deleted all pointers to that project need to be archived
		self.conn.cursor().execute('''set constraints custom_foreign_key_field_parent_project_id_fkey1 deferred''')

		#self.delete_project_entities(project_name)
		self.delete_project_user_associations(project_name)

		# First archive any records which are pointing directly at the row for entity['compound_id'] (which is itself a project name) in the Projects project
		self.conn.cursor().execute('''
			update
				custom_foreign_key_field
			set
				custom_field_value = custom_field_value || '_archived_' || %s
			where
				parent_project_id = (select id from projects where project_name = 'Projects') and
				custom_field_value = %s
		''', (uuid_str, project_name))

		# Next archive all custom fields pointing at this project
		self.conn.cursor().execute('''
			update
				custom_fields
			set
				name = name || '_archived_' || %s,
				archived_date = localtimestamp
			where
				project_foreign_key_id = (select id from projects where project_name = %s)
		''', (uuid_str, project_name))

		self.crud_manager.archive_all(project_name, True, uuid_str)

		self.conn.cursor().execute(''' 
			update
				projects
			set
				project_name = project_name || '_archived_' || %s,
				archived_date = localtimestamp
			where
				project_name = %s
		''',(uuid_str,project_name))

		if not project_name.endswith('/Custom Row Buttons') and not project_name.endswith('/Custom Row Buttons/Uploads') \
				and not project_name.endswith('/Custom Row Buttons/Templates') and not project_name.endswith(
			'/Custom Row Buttons/Custom Fields'):
			self.delete_project(project_name + '/Custom Row Buttons')

			if not project_name.endswith('/Uploads') and not project_name.endswith(
					'/Search History') and not project_name.endswith('/Templates') and not project_name.endswith(
					'/Custom Fields'):
				self.delete_project(project_name + '/Uploads')
				self.delete_project(project_name + '/Search History')
				self.delete_project(project_name + '/Templates')
				self.delete_project(project_name + '/Custom Fields')
		else:
			if not project_name.endswith('/Custom Row Buttons/Uploads') and not project_name.endswith(
					'/Custom Row Buttons/Templates') and not project_name.endswith('/Custom Row Buttons/Custom Fields'):
				self.delete_project(project_name + '/Uploads')

				self.delete_project(project_name + '/Templates')
				self.delete_project(project_name + '/Custom Fields')



	def set_user_as_administrator(self, username, project_name, is_administrator):
		self.conn.cursor().execute('''
			update
				user_to_project
			set 
				is_administrator = %s
			where
				user_id = (select id from users where username = %s) and
				project_id = (select id from projects where project_name = %s and archived_date is null)
		''',(is_administrator, username, project_name))
		
		
	def is_user_administrator(self, project_name, usename):
		self.is_user_administrator_cur.execute("execute is_user_administrator (%s)", (project_name, username))
		row = self.is_user_administrator_cur.fetchone()
		
		if row is None:
			return False
		else:
			return row[0]
		
	def get_salt_field(self, project_name):
		custom_fields = self.get_custom_fields(project_name)
		
		for custom_field in custom_fields:
			if custom_fields[custom_field]['field_name'] == 'salt':
				return custom_fields[custom_field]['foreign_key_project_name']

	def has_compound_permission(self, username, id):
		if username == 'administrator':
			return True

		self.user_compound_check_cur.execute("execute user_compound_check (%s,%s)",(id, username))

		return False if self.user_compound_check_cur.fetchone() is None else True

	def has_project(self, username, project_name):
		self.has_project_cur.execute("execute has_project (%s, %s)", (username, project_name))

		return False if self.has_project_cur.fetchone() is None else True

	def reset_user_password(self, username, password):
		if self.is_user(username):
			user_obj = self.get_user(username)

			if not self.password_passes(password, [user_obj['username'], user_obj['first_name'], user_obj['last_name'], user_obj['email']]):
				raise InsecurePasswordException('Insecure password, please try another')

			password_hash = self.pwd_context.hash(password)
			self.reset_user_password_cur.execute("execute reset_user_password (%s, %s)", (password_hash, username))
			self.conn.commit()
		else:
			raise InvalidUserException('User ' + username + ' doesn\'t exist')


	def get_projects(self):
		cur = self.conn.cursor()
		cur.execute(''' 
			select 
				project_name
			from
				projects
		''')

		return [row[0] for row in cur.fetchall()]

	def get_users(self):
		cur = self.conn.cursor()
		cur.execute(''' 
			select
				username,
				first_name,
				last_name,
				email
			from
				users
		''')

		return {row[0]:{'username': row[0], 'first_name':row[1], 'last_name': row[2], 'email':row[3]} for row in cur.fetchall()}

	def add_user_to_project(self, username, project_name):
		project_id = self.get_project_id(project_name)

		if project_id is None:
			raise ProjectAssociationException('Project ' + project_name + ' doesn\'t exist')

		user_id = self.get_user_id(username)

		if user_id is None:
			raise ProjectAssociationException('User ' + username + ' doesn\'t exist')
		
		if self.has_project(username, project_name):
			return

		self.insert_project_association_cur.execute('execute insert_project_association (%s, %s)', (project_id, user_id))
		
		if self.is_project(project_name + '/Uploads'):
			self.add_user_to_project(username, project_name + '/Uploads')
			
		if self.is_project(project_name + '/Search History'):
			self.add_user_to_project(username, project_name + '/Search History')

		if self.is_project(project_name + '/Templates'):
			self.add_user_to_project(username, project_name + '/Templates')
		
		self.conn.commit()

	def copy_user_permissions(self, source_project, destination_project):
		user_names = self.get_users_with_project(source_project)

		for user_name in user_names:
			print('Adding user ' + user_name + ' to ' + destination_project)
			self.add_user_to_project(user_name, destination_project)

		self.conn.commit()
		
	def get_users_with_project(self, project_name):
		self.fetch_users_with_project_cur.execute('execute fetch_users_with_project (%s)', (project_name,))

		user_names = []

		for row in self.fetch_users_with_project_cur:
			user_names.append(row[0])

		return user_names

	def set_default_user_project(self, username, project_name):
		project_id = self.get_project_id(project_name)

		if project_id is None:
			raise ProjectAssociationException('Project ' + project_name + ' doesn\'t exist')
		
		user_id = self.get_user_id(username)
		
		if user_id is None:
			raise ProjectAssociationException('User ' + username + ' doesn\'t exist')
		
		if not self.has_project(username, project_name):
			raise ProjectAssociationException('First associate user ' + username + ' with '+ project_name)

		self.reset_user_default_project_cur.execute('execute reset_user_default_project (%s)', (user_id,))
		
		self.set_user_default_project_cur.execute('execute set_user_default_project (%s, %s)', (user_id, project_id))

		self.conn.commit()

	def remove_user_from_project(self, username, project_name):
		#project_id = self.get_project_id(project_name)

		#if project_id is None:
		#	raise ProjectAssociationException('Project ' + project_name + ' doesn\'t exist')

		user_id = self.get_user_id(username)

		if user_id is None:
			raise ProjectAssociationException('User ' + username + ' doesn\'t exist')

		self.conn.cursor().execute('''
			update
				user_to_project
			set
				archive_date = localtimestamp
			where
				user_id = %s and
				project_id = (select id from projects where project_name = %s) and
				archive_date is null
		''',(user_id, project_name))

		#self.remove_project_association_cur.execute('execute remove_project_association (%s, %s)', (user_id, project_id))
		#self.conn.commit()

	def get_project_id(self, project_name):
		self.fetch_project_id_cur.execute('execute fetch_project_id (%s)', (project_name,))
		row = self.fetch_project_id_cur.fetchone()

		if row is None:
			return None
		else:
			return row[0]
		
	def get_project_by_id(self, project_id):
		self.fetch_project_by_id_cur.execute('execute fetch_project_by_id (%s)', (project_id,))
		row = self.fetch_project_by_id_cur.fetchone()

		if row is None:
			return None
		else:
			return row[0]
	
	def get_custom_field_type_id(self, type_name):
		self.fetch_custom_field_type_id_cur.execute('execute fetch_custom_field_type_id (%s)', (type_name,))
		row = self.fetch_custom_field_type_id_cur.fetchone()

		if row is None:
			return None
		else:
			return row[0]

	def get_user_id(self, username):
		self.fetch_user_id_cur.execute('execute fetch_user_id (%s)',(username,))
		row = self.fetch_user_id_cur.fetchone()
		
		if row is None:
			return None
		else:
			return row[0]

	def is_project(self, project_name):
		self.is_project_cur.execute('execute is_project (%s)', (project_name,))

		if self.is_project_cur.fetchone() is not None: 
			return True
		else:
			return False

	def create_project(self, project_name, id_group_name= None, cascade = True):
		if id_group_name is None:
			id_group_name = project_name
			
		if self.is_project(project_name):
			raise ProjectRegistrationException('Project ' + project_name + ' already exists')
		else:
			self.create_project_cur.execute('execute create_project (%s,%s)', (project_name,id_group_name))
			
		self.add_user_to_project('administrator', project_name)
		
		custom_row_buttons = project_name + '/Custom Row Buttons'
		
		self.create_project_cur.execute('execute create_project (%s,%s)', (custom_row_buttons,None))
			
		self.add_user_to_project('administrator', custom_row_buttons)
		
		self.add_custom_field(custom_row_buttons, 'varchar', 'label', 'Button Label', True, True, False)
		self.add_custom_field(custom_row_buttons, 'varchar', 'function', 'Function Name', True, True, False)

		self.update_project_configuration(
			project_name=custom_row_buttons, 
			enable_structure_field=False, 
			enable_attachment_field=False, 
			entity_name='Custom Row Buttons', 
			enable_addition=True
		)

		if cascade:
			self.create_project_projects(project_name)

		self.conn.commit()

	def create_custom_fields_project(self, parent_project_name):
		project_name = parent_project_name + '/Custom Fields'

		self.create_project(project_name, None, False)

		self.update_project_configuration(
			project_name=project_name,
			enable_structure_field=False,
			enable_attachment_field=False,
			entity_name='Custom Field',
			enable_addition=True
		)

		self.add_custom_field(project_name, 'foreign_key', 'type', 'Type', True, True, False)

		self.create_foreign_key(project_name, 'type', 'Custom Field Types')

		self.add_custom_field(project_name, 'foreign_key', 'foreign_key_project', 'Points to', False, True, False)

		self.create_foreign_key(project_name, 'foreign_key_project', 'Projects')

		self.add_custom_field(project_name, 'bool', 'required', 'Required', True, True, False)
		self.add_custom_field(project_name, 'bool', 'auto_convert_mol', 'Auto convert mol', True, True, False)
		self.add_custom_field(project_name, 'bool', 'visible', 'visible', True, True, False)
		self.add_custom_field(project_name, 'varchar', 'human_name', 'Human Name', True, True, False)
		self.add_custom_field(project_name, 'bool', 'searchable', 'searchable', True, True, False)
		self.add_custom_field(project_name, 'bool', 'calculated', 'Calculated', True, True, False)
		self.add_custom_field(project_name, 'varchar', 'before_update_function', 'Before update function', False, True, False)

	def create_template_project(self, parent_project_name):
		project_name = parent_project_name + '/Templates'

		self.create_project(project_name, None, False)

		self.update_project_configuration(
			project_name=project_name,
			enable_structure_field=False,
			enable_attachment_field=True,
			entity_name='Template',
			enable_addition=True
		)

		self.add_custom_field(project_name, 'varchar', 'description', 'Description', True, True, False)
		
	def create_project_projects(self, parent_project_name):
		self.create_custom_fields_project(parent_project_name)

		self.create_template_project(parent_project_name)

		project_name = parent_project_name + '/Uploads'
		
		self.create_project(project_name, None, False)
		
		self.update_project_configuration(
			project_name=project_name, 
			enable_structure_field=False, 
			enable_attachment_field=True, 
			entity_name='Upload',
			enable_addition=False
		)
		
		self.add_custom_field(project_name, 'int', 'upload_count', 'Upload Count', True, True, True)
		self.add_custom_field(project_name, 'varchar', 'upload_project', 'Upload Project', True, True, True)
		self.add_custom_field(project_name, 'varchar', 'description', 'Description', True, True, False)
		self.add_custom_field(project_name, 'varchar', 'upload_upload_uuid', 'Upload UUID', True, False, True)
		self.add_custom_field(project_name, 'varchar', 'upload_time', 'Upload Time', True, True, True)
		
		changes = {'-1': {'compound_id':'delete_all', 'label': 'Delete Uploaded', 'function': 'delete_upload_set_ui'}}
		changes['-2'] = {'compound_id':'fetch', 'label': 'Fetch Uploaded', 'function': 'fetch_upload_set'}
		
		if self.crud_manager is None:
			self.crud_manager = sdf_register.CompoundManager(None, self)
		
		self.crud_manager.save_changes('administrator', changes, project_name + '/Custom Row Buttons')
		
		
		project_name = parent_project_name + '/Search History'
		
		self.create_project(project_name, None, False)
		
		enable_structure_field = self.get_project_configuration(parent_project_name)['enable_structure_field']
		
		self.update_project_configuration(
			project_name=project_name, 
			enable_structure_field=enable_structure_field, 
			enable_attachment_field=True, 
			entity_name='Search Item',
			enable_addition=False
		)
		
		self.add_custom_field(project_name, 'int', 'result_count', 'Result Count', False, True, True)
		
		if enable_structure_field:			
			self.add_custom_field(project_name, 'text', 'salted_sdf', 'Salted SDF', False, False, True)
			self.add_custom_field(project_name, 'text', 'salted_inchi', 'Salted InCHi', False, False, True)
			
			self.set_ss_search_field(project_name, 'salted_sdf')
			
		
		self.add_custom_field(project_name, 'text', 'json', 'JSON', True, False, True)
		self.add_custom_field(project_name, 'varchar', 'terms', 'Terms', False, True, True)
		self.add_custom_field(project_name, 'varchar', 'upload_upload_id', 'Upload ID', False, True, True)
		self.add_custom_field(project_name, 'varchar', 'project_name', 'Project Name', True, True, True)		
		self.add_custom_field(project_name, 'varchar', 'description', 'Description', False, True, False)
		self.add_custom_field(project_name, 'varchar', 'search_time', 'Search Time', True, True, True)
		
		changes = {'-1': {'compound_id':'re-run', 'label': 'Re-run', 'function': 'repeat_search'}}
		changes['-2'] ={'compound_id':'attach_excel', 'label': 'Store Excel', 'function': 'store_excel'}
		
		if enable_structure_field:
			changes['-3'] = {'compound_id':'attach_sdf', 'label': 'Store SDF', 'function': 'store_sdf'}
		
		if self.crud_manager is None:
			self.crud_manager = sdf_register.CompoundManager(None, self)
		
		self.crud_manager.save_changes('administrator', changes, project_name + '/Custom Row Buttons')
		
		self.conn.commit()

	def add_crud_manager(self):
		if self.crud_manager is None:
			self.crud_manager = sdf_register.CompoundManager(None, self)
	
	def authenticate_scarab(self, username, password):
		conn =  MySQLdb.connect('fides.sgc.ox.ac.uk', username, password)

		cur = conn.cursor()
		cur.execute('''
		    SELECT
                    	First_Name,
			Last_Name,
			EMail
                    FROM
                        icmdb_page_secure.V_USERS
                    WHERE
                        Name=%s
		''', (username,))

		row = cur.fetchone()

		if row is None:
			return False
		else:
			if not self.is_user(username, 'scarab'):
				print('Registering user')

				changes = {
					'-1': {
						'first_name': row[0],
						'last_name': row[1],
						'email': row[2],
						'compound_id': username,
						'password': password,
						'account_type': 'scarab'
					}
				}

				self.add_crud_manager()

				self.crud_manager.save_changes('administrator', changes, 'Users')

				#self.register_user(row[0], row[1], row[2], username, None, 'scarab', True)

			return True

	def disable_user(self, username):
		self.conn.cursor().execute('''
			update
				users
			set
				archive_date = localtimestamp
			where
				username = %s
		''', (username,))

	def enable_user(self, username):
		self.conn.cursor.execute('''
			update
				users
			set
				archive_date = null
			where
				username = %s
		''', (username,))

	def delete_custom_field(self, id):
		entity = self.fetch_manager.get_entity(id, False)

		parent_project_name = re.sub('/Custom Fields$', '', entity['project_name'])

		print('Removing ' + entity['compound_id'] + ' from '+ parent_project_name + ' ')

		uuid_str = str(uuid.uuid4())

		self.conn.cursor().execute('''
			update
				custom_fields
			set
				name = name || '_archived_' || %s,
				archived_date = localtimestamp
			where
				project_id = (select id from projects where project_name = %s)
		''', (uuid_str, parent_project_name))

	def update_user(self, original_username, first_name, last_name, email, username, password, account_type):
		if original_username != username and self.is_user(username):
			raise UserRegistrationException('User already exists')

		if account_type != 'scarab'   and not password is None and not self.password_passes(password, [first_name, last_name, email, username]):
			raise InsecurePasswordException('Insecure password, please try another')

		password_hash = None

		if account_type == 'internal' and password is not None:
			password_hash = self.pwd_context.hash(password)
		else:
			password_hash = None

		self.update_user_cur.execute("execute update_user (%s,%s,%s,%s,%s,%s,%s)", (
			original_username,
			first_name,
			last_name,
			email,
			username,
			account_type
		))

		if password_hash is not None:
			self.conn.cursor().execute('''
				update
					users
				set
					password_hash = %s
				where
					username = %s
			''', password_hash, username)

		self.rename_project(username + '/Settings', original_username + '/Settings')

	def register_user(self, first_name, last_name, email, username, password, account_type = 'internal', skip_external_check = False):
		if not self.user_registration_enabled and account_type != 'scarab':
			raise UserRegistrationDisabledException(self.user_registration_disabled_msg)

		if (not skip_external_check) and self.include_scarab and account_type != 'scarab':
			cur = self.scarab_conn.cursor()
			cur.execute('''
				SELECT
					Name
				FROM
					icmdb_page_secure.V_USERS
				WHERE
					Name = %s
			''', (username,))	
			
			row = cur.fetchone()

			if row is not None:
				raise UserRegistrationException('User already exists')

		if self.is_user(username):
			raise UserRegistrationException('User already exists')

		if account_type != 'scarab' and not self.password_passes(password, [first_name, last_name, email, username]):
			raise InsecurePasswordException('Insecure password, please try another')

		password_hash = None

		if account_type == 'internal':
			password_hash = self.pwd_context.hash(password)
		else:
			password_hash = None

		self.insert_user_cur.execute("execute insert_user (%s,%s,%s,%s,%s,%s)",(
			first_name,
			last_name,
			email,
			username,
			password_hash,
			account_type
		))

		self.add_user_projects(username)
		
		if account_type == 'scarab':
			changes = {
				'-1':{'compound_id': 'Hide_Salt_Suffixes_SGC', 'project': 'SGC', 'option': 'Yes'},
				'-2':{'compound_id': 'Hide_Salt_Suffixes_SGC - Oxford', 'project': 'SGC - Oxford', 'option': 'Yes'}
			}
			
			if self.crud_manager is None:
				from sdf_register import CompoundManager
				
				self.crud_manager = CompoundManager(self.conn, self)
				
			self.crud_manager.save_changes('administrator', changes, username + '/Settings')
			
			#self.add_user_to_project(username, 'SGC')
			#self.add_user_to_project(username, 'SGC - Oxford')
			#self.add_user_to_project(username, 'SGC/Supplier List')
			#self.add_user_to_project(username, 'SGC/Search History')
			#self.add_user_to_project(username, 'SGC - Oxford/Search History')
			#self.add_user_to_project(username, 'SGC/Salts')
			#self.add_user_to_project(username, 'SGC/Compound Classifications')



			

		self.conn.commit()
		
	def add_user_projects(self, username):
 		project_name = username + '/Settings'
 		self.create_project(project_name, 'Settings', False)
 		
 		self.update_project_configuration(
 			project_name=project_name, 
 			enable_structure_field=False, 
 			enable_attachment_field=True, 
 			entity_name='Setting',
 			enable_addition=True
 		)
 		

 		self.add_custom_field(project_name, 'varchar', 'project', 'Project', True, True, False)
 		self.add_custom_field(project_name, 'varchar', 'option', 'Option', True, True, False)
 		
 		self.add_user_to_project(username, project_name)
 		
 		self.conn.commit()		

	def password_passes(self, password, user_inputs):
		user_inputs += ['sgc','globalchemireg','chemireg','protein','dna','compound']
		return False if zxcvbn(password, user_inputs)['score'] < 3 else True

	def is_user(self, username, account_type = 'internal'):
		row = None

		if account_type is None:
			self.check_user_exists_all_cur.execute("execute check_user_all (%s )", (username, ))

			row = self.check_user_exists_all_cur.fetchone()

		else:	
			self.check_user_exists_cur.execute("execute check_user_auth (%s, %s)", (username, account_type))

			row = self.check_user_exists_cur.fetchone()

		if row is None:
			return False
		else:
			return True

	def authenticate(self, username, password, src):
		if (self.include_scarab and (not self.is_user(username)) and self.authenticate_scarab(username, password)):
			self.authentication_fw.write(datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S') + '\t' + username + '\t' + src + '\t' + 'Success\n')
	
			user = self.get_user(username, None)

			if not self.password_passes(password, [user['first_name'], user['last_name'], user['email'], username]) and user['account_type'] != 'scarab':
				raise InsecurePasswordException('Insecure password.  Please use the password reset facility to reset your password')

			return {'outcome': 'success', 'firstName': user['first_name'], 'lastName': user['last_name'], 'email': user['email'], 'projects':user['projects']}
		elif self.is_user(username):
			user = self.get_user(username, None)

			if self.pwd_context.verify(password, user['password_hash']):
				if not self.password_passes(password, [user['first_name'], user['last_name'], user['email'], username]):
					self.authentication_fw.write(datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S') + '\t' + username + '\t' + src + '\t' + 'Failed\n')

					raise InsecurePasswordException('Insecure password. Please use the password reset facility to reset your password')

				self.authentication_fw.write(datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S') + '\t' + username + '\t' + src + '\t' + 'Success\n')

				return {'outcome': 'success', 'firstName': user['first_name'], 'lastName': user['last_name'], 'email': user['email'], 'projects':user['projects']}
			else:
				self.authentication_fw.write(datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S') + '\t' + username + '\t' + src + '\t' + 'Failed\n')
				return {'outcome': 'failure'}

		self.authentication_fw.write(datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S') + '\t' + username + '\t' + src + '\t' + 'Failed\n')

		return {'outcome': 'failure'}

	def get_user(self, username, account_type=None):
		if self.is_user(username, None):
			self.fetch_user_cur.execute("execute fetch_user (%s)", (username,))
			row = self.fetch_user_cur.fetchone()

			if row is not None:
				user_obj = {'username' : row[3], 'first_name': row[0], 'last_name': row[1], 'email': row[2], 'user_id': row[5], 'password_hash': row[4], 'reset_token':row[6], 'reset_token_age':row[7], 'account_type': row[8]}
				
				self.fetch_user_project_associations_cur.execute("execute fetch_user_project_associations (%s)", (username,))
				user_obj['projects'] = {row[0]: row[1] for row in self.fetch_user_project_associations_cur.fetchall()}
				
				return user_obj
			else:
				raise InvalidUserException('Invalid user ' + username)
		else:
			raise InvalidUserException('Invalid user ' + username)

	def is_scarab_user(self, username):
		cur = self.scarab_conn.cursor()
		cur.execute('''
			SELECT
				Name
			FROM
				icmdb_page_secure.V_USERS
			WHERE
				Name = %s
		''', (username,))	
			
		row = cur.fetchone()

		return True if row is not None else False
		

	def send_password_reset_email(self, username):
		if self.include_scarab:
			if self.is_scarab_user(username):
				raise InvalidUserException('Invalid user ' + username)
		user_email_address = self.get_user(username)['email']

		reset_uuid = str(uuid.uuid4())
		self.update_user_reset_code_cur.execute("execute update_user_reset_code (%s,%s)", (reset_uuid, username))
		email_html = '<html><body>Click the link below to reset your password<br/>'
		email_html += '<a href="https://globalchemireg.sgc.ox.ac.uk/static/chemireg/theme/index.html?username=' + username + '&reset_code=' + reset_uuid + '">Reset Password</a></body><html>'
		self.email_manager.send_email(user_email_address, None, 'GlobalChemiReg Password Reset', email_html, email_html)
		self.conn.commit()

	def reset_password_with_token(self, username, password, reset_token):
		if self.include_scarab:
			if self.is_scarab_user(username):
				raise InvalidUserException('Invalid user ' + username)

		user = self.get_user(username)
		if reset_token != user['reset_token']:
			raise InvalidResetTokenException('Invalid reset token')


		if user['reset_token_age'] > self.token_lifetime:
			raise InvalidResetTokenException('Invalid reset token')

		self.reset_user_password(username, password)

		self.update_user_reset_code_cur.execute("execute update_user_reset_code (%s,%s)",(None, username))

		self.conn.commit()
		
	def get_custom_field_types(self):
		self.fetch_custom_field_types_cur.execute("execute fetch_custom_field_types")
		
		types = []
		
		for row in self.fetch_custom_field_types_cur.fetchall():
			types.append({'id':row[0], 'type_name':row[1], 'table_name': row[2]})
			
		return types
	
	def get_custom_fields(self, project_name):
		project_id = self.get_project_id(project_name)
		
		if project_id is None:
			raise InvalidProjectException('Project name not valid ' + project_name)
		
		self.fetch_custom_fields_cur.execute("execute fetch_custom_fields (%s)", (project_id,))
		
		fields = {}
		
		i = 0
		for row in self.fetch_custom_fields_cur.fetchall():
			fields[row[1]]= {
				'field_id':row[0],
				'field_name': row[1],
				'type_id': row[2],
				'type_name': row[3],
				'table_name':  row[4],
				'required': row[5],
				'human_name' : row[10],
				'order': i,
				'ss_field': row[6],
				'vocabulary_tably': row[7],
				'auto_convert_mol': row[8],
				'visible': row[9],
				'project_foreign_key_id': row[11],
				'foreign_key_project_name': row[12],
				'calculated': row[13],
				'before_update_function': row[14]
			}
			
			i += 1
		
		return fields	
	
	def get_custom_fields_by_type(self, project_name):
		project_fields = self.get_custom_fields(project_name)
		
		project_fields_by_type = {}
		
		for field_name in project_fields.keys():
			project_field = project_fields[field_name]
			field_type = project_field['type_name']
			
			if field_type not in project_fields_by_type:
				project_fields_by_type[field_type] = {}
				
			project_fields_by_type[field_type][field_name] = project_field
			
		return project_fields_by_type
		
	def add_custom_field(self, project_name, type_name, field_name, human_name, required, visible, calculated):
		project_id = self.get_project_id(project_name)
		
		if project_id is None:
			raise InvalidProjectException('Invalid project name ' + project_name)

		type_id = self.get_custom_field_type_id(type_name)
		
		if type_id is None:
			raise InvalidCustomFieldTypeException('Invalid custom field type ' + type_name)
		
		self.insert_custom_field_cur.execute("execute insert_custom_field (%s,%s,%s, %s, %s,%s, %s)", (project_id, field_name, type_id, required, visible,human_name, calculated))
		
		if type_name != 'foreign_key':
			self.custom_field_cursors[type_name].execute("execute custom_create_field_" + type_name + " (%s, %s, %s)",(project_name, field_name, self.transaction_id))
		
		#self.conn.commit()

	def update_custom_field_definition(self, old_name, project_name, name, required, visible, human_name, calculated):
		self.update_custom_field_cur.execute('execute update_custom_field (%s,%s,%s,%s,%s,%s,%s)',(old_name, project_name, name,required,visible, human_name,calculated))

		
	def set_ss_search_field(self, project_name, field_name):
		project_id = self.get_project_id(project_name)
		
		if project_id is None:
			raise InvalidProjectException('Invalid project name ' + project_name)
		
		self.reset_ss_search_field_cur.execute('execute reset_ss_search_field (%s)', (project_id,))
		
		self.set_ss_search_field_cur.execute('execute set_ss_search_field (%s,%s)', (project_id,field_name))
		
	def get_ss_search_field(self, project_name):
		fields = self.get_custom_fields(project_name)
		
		for field in fields.values():
			if field['ss_field']:
				return field 
			
		return None
	
	def update_project_configuration(self, project_name, enable_structure_field, enable_attachment_field, entity_name, enable_addition = True):
		project_id = self.get_project_id(project_name)
		
		if project_id is None:
			raise InvalidProjectException('Invalid project name ' + project_name)
		
		self.update_project_configuration_cur.execute('execute update_project_configuration (%s,%s,%s,%s,%s)', (enable_structure_field, enable_attachment_field, entity_name, project_name, enable_addition))
		
		self.conn.commit()
		
	def get_project_configuration(self, project_name):
		self.get_project_configuration_cur.execute('execute fetch_project_configuration (%s)', (project_name,) )
		
		row = self.get_project_configuration_cur.fetchone()
		
		obj = {'custom_row_buttons':None, 'enable_structure_field': row[0], 'enable_attachment_field': row[1], 'entity_name': row[2], 'enable_addition': row[3]}
		
		project_name = project_name + '/Custom Row Buttons'
		
		if self.is_project(project_name):		
			obj['custom_row_buttons'] = self.fetch_manager.fetch_project_set(0, 99999999, 'administrator', project_name)
			
		return obj
	
	def get_custom_field(self, project_name, custom_field_name):
		self.fetch_custom_field_cur.execute('execute fetch_custom_field (%s,%s)', (project_name, custom_field_name))
		
		row = self.fetch_custom_field_cur.fetchone()
		
		if row is  None:
			return None
		else:
			return 	{
				'field_id':row[0],
				'field_name': row[1],
				'type_id': row[2],
				'type_name': row[3],
				'table_name':  row[4],
				'required': row[5],
				'human_name' : row[10],
				'order': 0,
				'ss_field': row[6],
				'vocabulary_tably': row[7],
				'auto_convert_mol': row[8],
				'visible': row[9],
				'project_foreign_key_id': row[11],
				'foreign_key_project_name': row[12],
				'calculated': row[13]
			}
	
	def create_foreign_key(self, destination_project_name, destination_custom_field_name, source_project_name):
		destination_custom_field = self.get_custom_field(destination_project_name, destination_custom_field_name)
		
		if destination_custom_field is None:
			raise InvalidCustomField('Unable to find custom field ' + destination_project_name + ' ' + destination_custom_field_name)
		else:
			destination_custom_field_id = destination_custom_field['field_id']
		
		self._create_foreign_key(destination_custom_field_id, self.get_project_id(source_project_name))
		
		self.custom_field_cursors['foreign_key'].execute("execute custom_create_field_foreign_key (%s, %s, %s,%s)",(destination_project_name, destination_custom_field_name, source_project_name, self.transaction_id))
		
		self.conn.commit()
		
	def _create_foreign_key(self, destination_custom_field_id, source_project_id):
		self.update_foreign_key_cur.execute('execute update_foreign_key (%s,%s)', (source_project_id, destination_custom_field_id))
		
	
	def install_default_chem_custom_fields(self, project_name):
		self.update_project_configuration(project_name, True, True, 'Compound')
				
		self.add_custom_field(project_name, 'float', 'mw', 'MW', False, True, True)
		self.add_custom_field(project_name, 'text', 'desalted_sdf', 'desalted_sdf',False, False, True)
		self.add_custom_field(project_name, 'text', 'desalted_smiles', 'desalted_smiles',False, False, True)
		self.add_custom_field(project_name, 'text', 'salted_sdf', 'salted_sdf',False, False, True)
		self.set_ss_search_field(project_name, 'salted_sdf')
		self.add_custom_field(project_name, 'text', 'salted_smiles', 'salted_smiles',False, False, True)
		self.add_custom_field(project_name, 'text', 'desalted_inchi','desalted_inchi', False, False, True)
		self.add_custom_field(project_name, 'text', 'desalted_inchi_no_tautomer','desalted_inchi_no_tautomer', False, False, True)
		self.add_custom_field(project_name, 'varchar', 'desalted_inchi_key', 'desalted_inchi_key', False, False, True)
		self.add_custom_field(project_name, 'varchar', 'desalted_inchi_key_no_tautomer','desalted_inchi_key_no_tautomer', False, False, True)
		self.add_custom_field(project_name, 'text', 'salted_inchi','salted_inchi', False, False, True)
		self.add_custom_field(project_name, 'text', 'salted_inchi_no_tautomer','InChi', True, False, True)
		self.add_custom_field(project_name, 'varchar', 'salted_inchi_key','salted_inchi_key', False, False, True)
		self.add_custom_field(project_name, 'varchar', 'salted_inchi_key_no_tautomer','salted_inchi_key_no_tautomer', False, False, True)
		self.add_custom_field(project_name, 'text', 'salt', 'Salt', False, False, True)
		self.add_custom_field(project_name, 'float', 'cost','Cost', False, False, False)
		self.add_custom_field(project_name, 'varchar', 'purchased','Purchased', False, False, False)
		self.add_custom_field(project_name, 'float', 'amount','Amount', False, True, False)
		self.add_custom_field(project_name, 'varchar', 'parent_series','Parent_series', False, False, False)
		self.add_custom_field(project_name, 'varchar', 'description','Description', False, True, False)
		self.add_custom_field(project_name, 'float', 'concentration','Concentration', False, True, False)
		self.add_custom_field(project_name, 'varchar', 'supplier_id','Supplier ID', True, True, False)
		self.add_custom_field(project_name, 'varchar', 'comments','Comments', False, True, False)
		self.add_custom_field(project_name, 'varchar', 'library_name','library_name', False, True, False)
		self.add_custom_field(project_name, 'varchar', 'target','target', False, True, False)
		
		# Define Supplier List
		self.create_project(project_name + '/Supplier List')
		self.update_project_configuration(project_name + '/Supplier List', False, False, 'Supplier')
		
		# Create custom field to store supplier name
		self.add_custom_field(project_name, 'foreign_key', 'supplier','Supplier', True, True, False)
		self.create_foreign_key(project_name, 'supplier', project_name + '/Supplier List')
		
		self.create_project(project_name + '/Compound Classifications')
		self.update_project_configuration(project_name + '/Compound Classifications', False, False, 'Compound Classification')
		self.add_custom_field(project_name + '/Compound Classifications', 'varchar', 'description','Description', False, True)
		
		self.add_custom_field(project_name, 'foreign_key', 'classification','Classification', True, True, False)
		self.create_foreign_key(project_name, 'classification', project_name + '/Compound Classifications')
		
	def create_sgc_global_projects(self):
		projects = ['SGC',  'SGC - Toronto', 'SGC - Oxford', 'SGC - Campinas', 'SGC - Frankfurt', 'SGC - UNC']
		
		# Define Supplier List
		self.create_project('SGC/Supplier List')
		self.update_project_configuration('SGC/Supplier List', False, False, 'Supplier')
		
		self.create_project('SGC/Compound Classifications')
		self.update_project_configuration('SGC/Compound Classifications', False, False, 'Compound Classification')
		self.add_custom_field('SGC/Compound Classifications', 'varchar', 'description','Description', False, True, False)
		
		self.create_project('SGC/Salts')
		self.update_project_configuration('SGC/Salts', False, False, 'Salt')
		self.add_custom_field('SGC/Salts', 'varchar', 'smarts','SMARTS', False, True, False)
		self.add_custom_field('SGC/Salts', 'text', 'mol','mol', False, False, True)
		
		for project_name in projects:
			self.create_project(project_name, 'SGC')
			self.update_project_configuration(project_name, True, True, 'Compound')
					
			self.add_custom_field(project_name, 'text', 'desalted_sdf', 'desalted_sdf',False, False, True)
			self.add_custom_field(project_name, 'text', 'desalted_smiles', 'desalted_smiles',False, False, True)
			self.add_custom_field(project_name, 'text', 'salted_sdf', 'salted_sdf',False, False, True)
			self.set_ss_search_field(project_name, 'salted_sdf')
			self.add_custom_field(project_name, 'text', 'salted_smiles', 'salted_smiles',False, False, True)
			self.add_custom_field(project_name, 'text', 'desalted_inchi','desalted_inchi', False, False, True)
			self.add_custom_field(project_name, 'text', 'desalted_inchi_no_tautomer','desalted_inchi_no_tautomer', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'desalted_inchi_key', 'desalted_inchi_key', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'desalted_inchi_key_no_tautomer','desalted_inchi_key_no_tautomer', False, False, True)
			self.add_custom_field(project_name, 'text', 'salted_inchi','InChi', False, True, True)
			self.add_custom_field(project_name, 'text', 'salted_inchi_no_tautomer','InChi', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'salted_inchi_key','salted_inchi_key', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'salted_inchi_key_no_tautomer','salted_inchi_key_no_tautomer', False, False, True)
			
			self.add_custom_field(project_name, 'float', 'cost','Cost', False, False, False)
			self.add_custom_field(project_name, 'varchar', 'purchased','Purchased', False, False, False)
			
			self.add_custom_field(project_name, 'varchar', 'parent_series','Parent series', False, False, False)
			
			self.add_custom_field(project_name, 'varchar', 'comments','Comments', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'description','Description', False, True, False)
			
			self.add_custom_field(project_name, 'float', 'amount','Amount', False, True, False)
			self.add_custom_field(project_name, 'float', 'concentration','Concentration', False, True, False)
			
			self.add_custom_field(project_name, 'varchar', 'library_name','Library Name', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'target','Target', False, True, False)
		
			self.add_custom_field(project_name, 'foreign_key', 'classification','Classification', True, True, False)
			self.create_foreign_key(project_name, 'classification', 'SGC/Compound Classifications')
			
			self.add_custom_field(project_name, 'varchar', 'supplier_id','Supplier ID', True, True, False)
			
			# Create custom field to store supplier name
			self.add_custom_field(project_name, 'foreign_key', 'supplier','Supplier', True, True, False)
			self.create_foreign_key(project_name, 'supplier', 'SGC/Supplier List')
			
			self.add_custom_field(project_name, 'foreign_key', 'salt', 'Salt', False, True, False)
			self.create_foreign_key(project_name, 'salt', 'SGC/Salts')
			
			self.add_custom_field(project_name, 'varchar', 'old_sgc_global_id','Old SGC Global ID', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'old_sgc_local_id','Old Local SGC ID', False, True, False)
			
			self.add_custom_field(project_name, 'float', 'mw', 'MW', False, True, False)
			
	def create_test_environment(self, default_password):
		projects = ['TestA',  'TestB']
		
		complete_project_list =  projects + ['Test/Supplier List','Test/Compound Classifications','Test/Salts']
		
		for project in complete_project_list:
			self.delete_project_entities(project)
			
			self.delete_project_entities(project + '/Uploads')
			
			self.delete_project_entities(project + '/Search History')
			
		users = {
			'testuser1':{
				'TestA':True, 'Test/Supplier List':False, 'Test/Compound Classifications': False, 'Test/Salts': False
			}, 
			'testuser2':{
				'TestB': True, 'Test/Supplier List': False, 'Test/Compound Classifications': False, 'Test/Salts': False
			}
		}
		
		for user in users.keys():
			if self.is_user(user, 'internal'):
				self.delete_user(user)

		for project in complete_project_list:
			self.delete_project(project)
		
		self.create_project('Test/Supplier List')
		self.update_project_configuration('Test/Supplier List', False, False, 'Supplier')
		
		self.create_project('Test/Compound Classifications')
		self.update_project_configuration('Test/Compound Classifications', False, False, 'Compound Classification')
		self.add_custom_field('Test/Compound Classifications', 'varchar', 'description','Description', False, True, False)
		
		self.create_project('Test/Salts')
		self.update_project_configuration('Test/Salts', False, False, 'Salt')
		self.add_custom_field('Test/Salts', 'varchar', 'smarts','SMARTS', False, True, False)
		self.add_custom_field('Test/Salts', 'text', 'mol','mol', False, False, True)
		
		for project_name in projects:
			self.create_project(project_name, 'Test')
			self.update_project_configuration(project_name, True, True, 'Compound')
					
			self.add_custom_field(project_name, 'text', 'desalted_sdf', 'desalted_sdf',False, False, True)
			self.add_custom_field(project_name, 'text', 'desalted_smiles', 'desalted_smiles',False, False, True)
			self.add_custom_field(project_name, 'text', 'salted_sdf', 'salted_sdf',False, False, True)
			self.set_ss_search_field(project_name, 'salted_sdf')
			self.add_custom_field(project_name, 'text', 'salted_smiles', 'salted_smiles',False, False, True)
			self.add_custom_field(project_name, 'text', 'desalted_inchi','desalted_inchi', False, False, True)
			self.add_custom_field(project_name, 'text', 'desalted_inchi_no_tautomer','desalted_inchi_no_tautomer', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'desalted_inchi_key', 'desalted_inchi_key', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'desalted_inchi_key_no_tautomer','desalted_inchi_key_no_tautomer', False, False, True)
			self.add_custom_field(project_name, 'text', 'salted_inchi','InChi', False, True, True)
			self.add_custom_field(project_name, 'text', 'salted_inchi_no_tautomer','InChi No Tautomer', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'salted_inchi_key','salted_inchi_key', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'salted_inchi_key_no_tautomer','salted_inchi_key_no_tautomer', False, False, True)
			
			self.add_custom_field(project_name, 'float', 'cost','Cost', False, False, False)
			self.add_custom_field(project_name, 'varchar', 'purchased','Purchased', False, False, False)
			
			self.add_custom_field(project_name, 'varchar', 'parent_series','Parent series', False, False, False)
			
			self.add_custom_field(project_name, 'varchar', 'comments','Comments', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'description','Description', False, True, False)
			
			self.add_custom_field(project_name, 'float', 'amount','Amount', False, True, False)
			self.add_custom_field(project_name, 'float', 'concentration','Concentration', False, True, False)
			
			self.add_custom_field(project_name, 'varchar', 'library_name','Library Name', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'target','Target', False, True, False)
		
			self.add_custom_field(project_name, 'foreign_key', 'classification','Classification', True, True, False)
			self.create_foreign_key(project_name, 'classification', 'Test/Compound Classifications')
			
			self.add_custom_field(project_name, 'varchar', 'supplier_id','Supplier ID', True, True, False)
			
			# Create custom field to store supplier name
			self.add_custom_field(project_name, 'foreign_key', 'supplier','Supplier', True, True, False)
			self.create_foreign_key(project_name, 'supplier', 'Test/Supplier List')
			
			self.add_custom_field(project_name, 'foreign_key', 'salt', 'Salt', False, True, False)
			self.create_foreign_key(project_name, 'salt', 'Test/Salts')
			
			self.add_custom_field(project_name, 'varchar', 'old_sgc_global_id','Old SGC Global ID', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'old_sgc_local_id','Old Local SGC ID', False, True, False)
			
			self.add_custom_field(project_name, 'float', 'mw', 'MW', False, True, False)
			
		self.user_registration_enabled= True
		
		for user in users.keys():		
			self.register_user(user, user, 'sgcit@sgc.ox.ac.uk', user, default_password, 'internal', False)
			
			for project in users[user].keys():				
				self.add_user_to_project(user, project)
				
				self.set_user_as_administrator(user, project, users[user][project])
			
		changes = {
			'-1':{
				'compound_id': 'ZZ',
				'description': 'ZZ - Miscellaneous'
			}
		}
				
		self.crud_manager.save_changes('administrator', changes, 'Test/Compound Classifications')
			
	def create_oxchem(self):
		projects = ['OxChem']
		
		# Define Supplier List
		self.create_project('OxChem/Supplier List')
		self.update_project_configuration('OxChem/Supplier List', False, False, 'Supplier')
		
		# Define Supplier List
		self.create_project('OxChem/Compound Classifications')
		self.update_project_configuration('OxChem/Compound Classifications', False, False, 'Compound Classification')
		self.add_custom_field('OxChem/Compound Classifications', 'varchar', 'description','Description', False, True, False)
		
		for project_name in projects:
			self.create_project(project_name, 'SGC')
			self.update_project_configuration(project_name, True, True, 'Compound')
					
			self.add_custom_field(project_name, 'text', 'desalted_sdf', 'desalted_sdf',False, False, True)
			self.add_custom_field(project_name, 'text', 'desalted_smiles', 'desalted_smiles',False, False, True)
			self.add_custom_field(project_name, 'text', 'salted_sdf', 'salted_sdf',False, False, True)
			self.set_ss_search_field(project_name, 'salted_sdf')
			self.add_custom_field(project_name, 'text', 'salted_smiles', 'salted_smiles',False, True, True)
			self.add_custom_field(project_name, 'text', 'desalted_inchi','desalted_inchi', False, False, True)
			self.add_custom_field(project_name, 'text', 'desalted_inchi_no_tautomer','desalted_inchi_no_tautomer', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'desalted_inchi_key', 'desalted_inchi_key', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'desalted_inchi_key_no_tautomer','desalted_inchi_key_no_tautomer', False, False, True)
			self.add_custom_field(project_name, 'text', 'salted_inchi','InChi', False, True, True)
			self.add_custom_field(project_name, 'text', 'salted_inchi_no_tautomer','InChi', True, False, True)
			self.add_custom_field(project_name, 'varchar', 'salted_inchi_key','salted_inchi_key', False, False, True)
			self.add_custom_field(project_name, 'varchar', 'salted_inchi_key_no_tautomer','salted_inchi_key_no_tautomer', False, False, True)
			self.add_custom_field(project_name, 'text', 'salt', 'Salt', False, False, True)
			
			self.add_custom_field(project_name, 'varchar', 'lab_location','Lab Location', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'fludix_rack_barcode','Fluidx Rack Barcode', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'fludix_well_barcode','Fluidx Well Barcode', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'fludix_location_96','Fluidx Location (96)', False, True, False)
			self.add_custom_field(project_name, 'varchar', 'fludix_location_1536','Fluidx Location (1536)', False, True, False)
			self.add_custom_field(project_name, 'float', 'amount','Amount', False, True, False)
			self.add_custom_field(project_name, 'float', 'dilution','Dilution (500nM)', False, True, False)
			self.add_custom_field(project_name, 'float', 'dilution_real','Dilution (Real', False, True, False)
			self.add_custom_field(project_name, 'float', 'concentration','Concentration', False, True, False)
			self.add_custom_field(project_name, 'float', 'hplc_purity','HPLC Purity', False, True, False)
		
			self.add_custom_field(project_name, 'foreign_key', 'classification','Classification', True, True, False)
			self.create_foreign_key(project_name, 'classification', 'OxChem/Compound Classifications')
			
			self.add_custom_field(project_name, 'varchar', 'supplier_id','Supplier ID', True, True, False)
			
			# Create custom field to store supplier name
			self.add_custom_field(project_name, 'foreign_key', 'supplier','Supplier', True, True, False)
			self.create_foreign_key(project_name, 'supplier', 'OxChem/Supplier List')
			
			self.add_custom_field(project_name, 'float', 'mw', 'MW', False, True, False)

	def update_project_view(self, project_name):
		custom_fields = self.get_custom_fields(project_name)

		custom_field_types = self.get_custom_field_types()

		field_id_to_table = {}

		for field_type in custom_field_types:
			field_id_to_table[field_type['id']] = field_type['table_name']

		corrected_project_name = 'v_' + project_name.lower().replace('/', '_')

		view_sql = 'create or replace view ' + corrected_project_name + ' '

		select_sql = ' as select compounds.compound_id'
		tables_sql = ' from compounds '
		join_sql = ['compounds.archived_transaction_id is null']

		table_id = 1

		previous_field = 'compounds.id'

		for field in custom_fields.values():
			field_name = field['field_name']
			type_id = field['type_id']
			field_id = field['field_id']

			table_alias = 'tbx_' + str(table_id)

			select_sql += ',' + table_alias + '.custom_field_value' + ' as ' + field_name
			tables_sql += ',' + field_id_to_table[type_id] + ' as ' + table_alias
			join_sql.append(table_alias + '.custom_field_id = ' + str(
				field_id) + ' and ' + table_alias + '.entity_id = ' + previous_field + ' and ' + table_alias + '.archived_transaction_id is null')

			previous_field = table_alias + '.entity_id'

			table_id += 1

		view_sql += select_sql + tables_sql + ' where ' + (' and '.join(join_sql))

		self.conn.cursor().execute(view_sql)

		print('Created view ' + corrected_project_name)

	def add_users_to_template_project(self, project_name):
		cur = self.conn.cursor()
		cur.execute('select username from users a, user_to_project b, projects c where a.id = b.user_id and b.project_id=c.id and c.project_name=%s',(project_name,))

		for row in cur:
			username = row[0]
			self.add_user_to_project(username, project_name + '/Templates')


class InsecurePasswordException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class InvalidCustomField(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)
	
class InvalidCustomFieldTypeException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class UserRegistrationException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class UserRegistrationDisabledException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class ProjectRegistrationException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class ProjectAssociationException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class InvalidUserException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)
	
class InvalidProjectException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class UnauthorisedException(Exception):
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return repr(self.value)

class InvalidResetTokenException(Exception):
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
	
	manager = AuthenticationManager()
	
	if 'action' in input_json:
		output_json = {}
		error = None
		
		if 'action' == 'create_test_environment':
			if '_username' in input_json:
				if input_json['_username'] == 'administrator':
					if 'test_password' not in input_json:
						error = 'test_password must be provided to set the test account passwords'
					else:
						manager.create_test_environment(input_json['test_password'])
				else:
					error = 'API request only allowed by the administrator'
			else:
				error = 'Unauthenticated API request not allowed'
				
		output_json['error']  = error
	# old API below
	elif input_json['mode'] == 'authenticate':
		# PROTECTION: none, users need to be able to login 
		output_json = {'error': None}
		try:
			output_json = manager.authenticate(input_json['username'], input_json['password'], input_json['src'])
		except InsecurePasswordException as e:
			output_json['error'] = str(e.value)
			output_json['outcome'] = 'failure'
	elif input_json['mode'] == 'register':
		# PROTECTION: none, users need to be able to login - though you can disable via switch
		output_json = {'outcome':'success'}

		try:

			changes = {
				'-1': {
					'first_name':input_json['first_name'],
					'last_name':input_json['last_name'],
					'email':input_json['email'],
					'compound_id':input_json['username'],
					'password':input_json['password'],
					'account_type': 'internal'
				}
			}

			if manager.crud_manager is None:
				manager.crud_manager = sdf_register.CompoundManager(None, manager)

			manager.crud_manager.save_changes('administrator', changes, 'Users')

			#manager.register_user(input_json['first_name'], input_json['last_name'], input_json['email'], input_json['username'], input_json['password'])
		except UserRegistrationException as e:
			output_json['outcome'] = 'failure'
			output_json['error'] = str(e.value)
		except UserRegistrationDisabledException as e:
			output_json['outcome'] = 'failure'
			output_json['error'] = str(e.value)
		except InsecurePasswordException as e:
			output_json['outcome'] = 'failure'
			output_json['error'] = str(e.value)
	elif input_json['mode'] == 'project_list':
		# PROTECTION: _username is a special attribute populated by our NodeJS app and can't be set by the client
		output_json = {'error': None}
		try:
			user = manager.get_user(input_json['_username'], None)
			
			project_fields = {}
			for project_name in user['projects']:
				project_fields[project_name]= manager.get_custom_fields(project_name)
				
			project_defs = {}
			for project_name in user['projects']:
				project_defs[project_name] = manager.get_project_configuration(project_name)
			
			output_json = {'outcome': 'success','projects':user['projects'], 'custom_fields': project_fields,'error':None, 'project_defs': project_defs}
		except InvalidUserException as e:
			output_json['outcome'] = 'failure'
			output_json['error'] = 'Invalid user'
	elif input_json['mode'] == 'request_password_reset':
		# PROTECTION: none, users need to be able to request password reset links.  We don't report none-existant users to the requester to prevent linkage
		username = input_json['username']
		
		output_json = {'error' : None}
		try:
			manager.send_password_reset_email(username)
		except InvalidUserException as e:
			print('Invalid user ' + str(e.value))
			#swallow to prevent username guesses
			pass
			#output_json['error'] = e.value
	elif input_json['mode'] == 'reset_password_token':
		# PROTECTION: The token provided must match the token we have for the user in the database
		username = input_json['username']
		password = input_json['password']
		reset_token = input_json['reset_token']

		output_json = {'error': None}
		try:
			manager.reset_password_with_token(username, password, reset_token)
		except InvalidUserException as e:
			output_json['error'] = 'Password reset exception'
		except InvalidResetTokenException as e:
			output_json['error']= 'Password reset exception'
		except InsecurePasswordException as e:
			output_json['error']= str(e.value)

	with open(output_json_path, 'w') as fw:
    		fw.write(json.dumps(output_json))
