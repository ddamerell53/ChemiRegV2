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
import argparse
import pickle 
import getpass

# lGPL
import psycopg2

# BSD 3-clause
from rdkit import Chem
from rdkit.Chem.SaltRemover import SaltRemover

# BSD
from passlib.context import CryptContext

# ChemiReg - CC0
from authenticate import AuthenticationManager
from authenticate import UserRegistrationException
from authenticate import ProjectRegistrationException
from authenticate import ProjectAssociationException
from authenticate import InvalidUserException
from connection_manager import ConnectionManager
from sdf_register import CompoundManager
from sdf_register import InvalidPrefixException
from fetch import CompoundFetchManager

class SetupManager(object):
	def __init__(self):
		self.conn = None
		self.scarab_conn = None

		self.pwd_context = CryptContext(schemes=["pbkdf2_sha256"])

		self.include_scarab = True

		self.register_manager = CompoundManager()

		self.auth_manager = self.register_manager.auth_manager
		self.auth_manager.user_registration_enabled = True
		
		self.fetch_manager = self.register_manager.fetch_manager

		self.conn = self.register_manager.conn

		#self.connect()

	def connect(self):
		if self.conn is None:
			self.conn = ConnectionManager.get_new_connection()

		self.conn.cursor().execute('BEGIN')

	def reset_administrator(self):	
		self.auth_manager.delete_user('administrator')
	
		while True:
			try:
				first_name = input('First Name: ')
				last_name = input('Last Name: ')
				email = input('Email: ')
				password = None
				while True:
					password_1 = getpass.getpass('Password: ')
					password_2 = getpass.getpass('Confirm Password: ')

					if password_1 == password_2:
						password = password_1
						break
					else:
						print('Passwords don\'t match.  Please try again')

				self.auth_manager.register_user(first_name, last_name, email, 'administrator', password)
				print('Administrator credentials reset')
				break
			except UserRegistrationException as e:
				print('Registration exception: ' + str(e))
				print('Try again? Ctrl+C to exit')
				
	def create_administrator(self, password):		
		self.auth_manager.register_user('administrator', 'administrator', '', 'administrator', password)

	def add_user(self):	
		while True:
			try:
				username = input('Username: ')
				first_name = input('First Name: ')
				last_name = input('Last Name: ')
				email = input('Email: ')
				password = None
				while True:
					password_1 = getpass.getpass('Password: ')
					password_2 = getpass.getpass('Confirm Password: ')

					if password_1 == password_2:
						password = password_1
						break
					else:
						print('Passwords don\'t match.  Please try again')

				self.auth_manager.register_user(first_name, last_name, email, username, password)
				print('User ' + username + ' created')
				break
			except UserRegistrationException as e:
				print('Registration exception: ' + str(e))
				print('Try again? Ctrl+C to exit')

	def delete_user(self):
		while True:
			try:
				username = input('Username: ')
				if username == '':
					print('Empty username, please try again!')
					continue

				self.auth_manager.delete_user(username)

				print('Deleted ' + username)

				break
			except InvalidUserException as e:
				print('Invalid user ' + username)
				print('Try again? Ctrl+C to exit')


	def create_project(self):
		while True:
			project_name = input('Project name: ')
			if project_name == '':
				print('Empty project name please try again!')
			else:
				try:
					self.auth_manager.create_project(project_name)
					print('Project ' + project_name + ' created')
					break
				except ProjectRegistrationException as e:
					print('Project registration error ' + str(e))
					print('Try again? Ctrl+C to exit')

	def add_user_to_project(self):
		while True:
			username = input('Username: ')
			if username == '':
				print('Empty username, please try again!')
			else:
				project_name = input('Project name: ')
				if project_name == '':
					print('Empty project name, please try again!')
				else:
					try:
						self.auth_manager.add_user_to_project(username, project_name)
						break
					except ProjectAssociationException as e: 
						print('Error adding user to project ' + str(e))
						print('Try again? Ctrl+C to exit')
	def remove_user_from_project(self):
		while True:
			username = input('Username: ')
			if username == '':
				print('Empty username, please try again!')
			else:
				project_name = input('Project name: ')
				if project_name == '':
					print('Empty project name, please try again!')
				else:
					try:
						self.auth_manager.remove_user_from_project(username, project_name)
						break
					except ProjectAssociationException as e: 
						print('Error removing user from project ' + str(e))
						print('Try again? Ctrl+C to exit')

	def list_projects(self):
		print('Projects')
		for project in self.auth_manager.get_projects():
			print(project)

	def list_users(self):
		print('Users')
		for user in self.auth_manager.get_users():
			print(user)

	def print_user_details(self):
		while True:
			try:
				username = input('Username: ')
				user = self.auth_manager.get_user(username, None)
				print('First name: ' + user['first_name'])
				print('Last name: ' + user['last_name'])
				print('Email:  ' + user['email'])
				print('User ID: ' + str(user['user_id']))
				print('Projects:')
				for project in user['projects'].keys():
					default = 'default' if user['projects'][project] else ''
					print('\t' + project + ' [' + default + ']')
				break
			except InvalidUserException as e:
				print('Invalid user ' + username)
				print('Try again? Ctrl+C to exit')

	def reset_user_password(self):
		while True:
			try:
				username = input('Username: ')

				password = None
				while True:
					password_1 = getpass.getpass('Password: ')
					password_2 = getpass.getpass('Confirm Password: ')

					if password_1 == password_2:
						password = password_1
						break
					else:
						print('Passwords don\'t match.  Please try again')

				self.auth_manager.reset_user_password(username, password)
				print('Password reset for ' + username)
				break
			except InvalidUserException as e:
				print('Invalid user ' + username)
				print('Try again? Ctrl+C to exit')

	def add_prefix(self):
		while True:
			prefix_code = input('Compound prefix: ')
			description = input('Description: ')

			self.register_manager.create_prefix(prefix_code, description)

			print('New prefix ' + prefix_code + ' created')
			break

	def list_prefixes(self):
		prefixes = self.fetch_manager.get_prefixes()
		for prefix in prefixes:
			print('Code: ' + prefix['prefix_code'] + '\n' + 'Description: ' + prefix['description'])

	def remove_prefix(self):
		while True:
			try:
				prefix_code = input('Compound prefix: ')
				self.register_manager.remove_prefix(prefix_code)
				print('Prefix ' + prefix_code + ' removed')
				break
			except InvalidPrefixException as e:
				print(e)
				print('Try again! Ctrl+C to exit')

	def register_rdkit_salts(self, project):
		salt_code = ''
		last_salt_char = '`'

		cleaner = SaltRemover()

		salt_len = len(cleaner.salts)
		
		salts_to_register = []

		salt_pkey = -1

		salts = {}
		#salts = cleaner.salts
		with open('salts.txt','r') as f:
			for line in f:
				if not line.startswith('//'):
					smarts = line.rstrip()
					
					if ord(last_salt_char) > 121:
						salt_code += last_salt_char
						last_salt_char = '`'
		
					last_salt_char = chr(ord(last_salt_char) + 1)
		
					current_salt_code = salt_code + last_salt_char
					
					mol_p = pickle.dumps(Chem.MolFromSmarts(smarts))
					
					salts[str(salt_pkey)] = {'mol':mol_p, 'smarts': smarts, 'compound_id': current_salt_code}
					
					salt_pkey -= 1

		self.register_manager.save_changes('administrator', salts, project)

		print('Registered: ' + str(salt_len) + ' salts')

	def delete_compound(self):
		while True:
			compound_id = input('Compound ID: ')
			if compound_id == '':
				print('Invalid compound ID.  Try again!Ctrl+C to exit')
				continue

			self.register_manager.delete_compound('administrator', compound_id)
			print('Removing compound ' + compound_id)
			break

	def add_custom_fields(self):
		custom_field_types = self.auth_manager.get_custom_field_types()
		
		while True:
			project_name = input('Project name: ')
			field_type = None
			field_name = None
			
			if project_name == '':
				print('Empty project name, please try again!')
				continue
			
			print('Custom field types: ')
			
			while True:
				for i in range(0,len(custom_field_types)):
					print(str(i) + ' ' + custom_field_types[i]['name'])
					
				try:
					field_type = custom_field_types[int(input('Type number and press enter to choose data-type: '))]['name']
					break
				except ValueError:
					print('Invalid number, please try again')
					
			while True:
				field_name = input('Custom field name: ')
			
				if field_name == '':
					print('Empty field name, please try again')
				else:
					break
				
			while True:
				required = input('Required? (Yes, No): ').upper()
				
				if required != 'YES' and required != 'NO':
					print('Please enter Yes or No!')
					continue
				
				required = True if required == 'YES' else False
				break
			
			self.auth_manager.add_custom_field(project_name, field_type, field_name, required)
			
			print('Custom field added')
			print('Add another? Ctrl+C to exit')

	def list_custom_fields(self):
		while True:
			project_name = input('Project name: ')
			
			if project_name == '':
				print('Empty project name, please try again!')
				continue
			
			fields = self.auth_manager.get_custom_fields(project_name)
			
			for field_name in fields.keys():
				print(field_name + '/' + fields[field_name]['type_name'] + ' not null = ' + str(fields[field_name]['required']))
				
			break
		
	def add_chem_custom_fields(self):
		while True:
			project_name = input('Project name: ')
			
			if project_name == '':
				print('Empty project name, please try again!')
				continue
			
			self.auth_manager.install_default_chem_custom_fields(project_name)
			print('Fields added')
			break
		
	def set_user_default_project(self):
		while True:
			username = input('Username: ')
			project_name = input('Project name: ')

			try:
				self.auth_manager.set_default_user_project(username, project_name)
				print('Default set!')
				break
			except ProjectAssociationException as e:
				print(str(e))
				print('Try again or press Ctrl+C to exit')
				
	def update_project_configuration(self):
		while True:
			project_name = input('Project name: ')
			
			entity_name = input('Entity name: ')
			enable_structure_field= input('Enable structure field: ')
			
			if enable_structure_field != 'yes' and enable_structure_field != 'no':
				print('Invalid value for enable structure field (yes/no)')
			
			enable_attachment_field = input('Enable attachment field: ')
			
			if enable_attachment_field != 'yes' and enable_attachment_field != 'no':
				print('Invalid value for enable attachment field (yes/no)')
				
			enable_attachment_field = True if enable_attachment_field == 'yes' else False
			enable_structure_field = True if enable_structure_field == 'yes' else False
			
			try:
				self.auth_manager.update_project_configuration(project_name, enable_structure_field, enable_attachment_field, entity_name)
				print('Project configuration updated')
				break
			except ProjectAssociationException as e:
				print(str(e))
				print('Try again or press Ctrl+C to exit')
				
	def create_sgc(self):
		self.auth_manager.create_sgc_global_projects()
		
	def create_oxchem(self):
		self.auth_manager.create_oxchem()
		
	def create_playground(self):
		while True:
			p1 = getpass.getpass('Password: ')
			p2 = getpass.getpass('Confirm Password: ')
			
			if p1 == p2 and p1 is not None and p1 != '':
				self.auth_manager.create_test_environment(p1)
				break
			else:
				print('Passwords don\'t match')
				
if __name__ == '__main__':
	parser = argparse.ArgumentParser(description='Script to handle setup and installation tasks')
	parser.add_argument('--admin_reset', help='Reset the administrator credentials', action='store_true')
	parser.add_argument('--create_project', help='Create new project', action='store_true')
	parser.add_argument('--add_user_to_project', help='Add user to a project', action='store_true')
	parser.add_argument('--set_user_default_project', help='Set user project default', action='store_true')
	parser.add_argument('--remove_user_from_project', help='Remove user from a project', action='store_true')
	parser.add_argument('--list_projects', help='Show a list of projects', action='store_true')
	parser.add_argument('--list_users', help='Show a list of users', action='store_true')
	parser.add_argument('--add_user', help='Add a new user', action='store_true')
	parser.add_argument('--delete_user', help='Delete a user', action='store_true')
	parser.add_argument('--user_details', help='Prints user details', action='store_true')
	parser.add_argument('--reset_user_password', help='Reset user password', action='store_true')
	parser.add_argument('--add_prefix', help='Create a new compound ID prefix', action='store_true')
	parser.add_argument('--list_prefixes', help='List compound ID prefixes', action='store_true')
	parser.add_argument('--remove_prefix', help='Remove compound ID prefix', action='store_true')
	parser.add_argument('--register_rdkit_salts', help='Register RDkit salts', action='store_true')
	parser.add_argument('--delete_compound', help='Delete compound', action='store_true')
	parser.add_argument('--add_custom_fields', help='Add custom fields to a project', action='store_true')
	parser.add_argument('--list_custom_fields', help='Show custom fields for a project', action='store_true')
	parser.add_argument('--add_chem_custom_fields', help='Add default chemistry custom fields to project', action='store_true')
	parser.add_argument('--update_project_configuration', help='Update project configuration', action='store_true')
	parser.add_argument('--create_sgc', help='Generate SGC structure', action='store_true')
	parser.add_argument('--create_oxchem', help='Generate OxChem structure', action='store_true')
	parser.add_argument('--create_playground', help='Generate Test Environment', action='store_true')

	args = parser.parse_args()	

	manager = SetupManager()

	if args.admin_reset:
		manager.reset_administrator()
	elif args.create_project:
		manager.create_project()	
	elif args.add_user_to_project:
		manager.add_user_to_project()
	elif args.remove_user_from_project:
		manager.remove_user_from_project()
	elif args.list_projects:
		manager.list_projects()
	elif args.list_users:
		manager.list_users()
	elif args.add_user:
		manager.add_user()
	elif args.delete_user:
		manager.delete_user()
	elif args.user_details:
		manager.print_user_details()
	elif args.reset_user_password:
		manager.reset_user_password()
	elif args.add_prefix:
		manager.add_prefix()
	elif args.list_prefixes:
		manager.list_prefixes()
	elif args.remove_prefix:
		manager.remove_prefix()
	elif args.register_rdkit_salts:
		manager.register_rdkit_salts()
	elif args.delete_compound:
		manager.delete_compound()
	elif args.add_custom_fields:
		manager.add_custom_fields()
	elif args.list_custom_fields:
		manager.list_custom_fields()
	elif args.add_chem_custom_fields:
		manager.add_chem_custom_fields()
	elif args.set_user_default_project:
		manager.set_user_default_project()
	elif args.update_project_configuration:
		manager.update_project_configuration()
	elif args.create_sgc:
		manager.create_sgc()
	elif args.create_oxchem:
		manager.create_oxchem()
	elif args.create_playground:
		manager.create_playground()
	