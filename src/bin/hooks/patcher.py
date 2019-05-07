from sdf_register import CompoundManager

class Patcher(object):
	def __init__(self):
		self.manager = CompoundManager()

	def import_projects(self):
		conn = self.manager.conn

		cur = conn.cursor()
		cur.execute('''
			select
				project_name,
				entity_name,
				enable_structure_field,
				enable_attachment_field,
				id_group_name,
				enable_addition,
				archived_date
			from
				projects
		''', None)

		for row in cur:
			project_name = row[0]
			entity_name = row[1]
			enable_structure_field = row[2]
			enable_attachment_field = row[3]
			id_group_name = row[4]
			enable_addition = row[5]
			archived_date = row[6]

			self.manager.auth_manager.create_custom_fields_project(project_name)


	def import_users_from_user_table(self,exclude_users=[], include_users=None):
		conn = self.manager.conn

		cur = conn.cursor()
		cur.execute('''
			select
				first_name,
				last_name,
				email,
				username,
				account_type
			from
				users
		''',None)

		exclude_list = {username:1 for username in exclude_users}

		include_list = None

		if include_users is not None:
			include_list = {username:1 for username in include_users}

		changes = {}

		id = 0

		for row in cur:
			first_name = row[0]
			last_name = row[1]
			email = row[2]
			username = row[3]
			account_type = row[4]

			if username in exclude_list:
				continue

			if include_list is not None and username not in include_list:
				continue

			id -= 1

			changes[id] = {'id':id,'first_name':first_name,'last_name':last_name,'email':email, 'compound_id':username,'account_type':account_type, 'bypass':True,'password':'<HIDDEN>'}

			print(username)

		self.manager.save_changes('administrator',changes,'Users',{})

	def import_projects2(self):
		conn = self.manager.conn

		cur = conn.cursor()
		cur.execute('''
			select
				project_name,
				entity_name,
				enable_structure_field,
				enable_attachment_field,
				id_group_name,
				enable_addition,
				archived_date
			from
				projects
			where
				archived_date is null and project_name<>'Public'
		''')

		changes = {}

		id = -1

		for row in cur:
			project_name = row[0]
			entity_name = row[1]
			enable_structure_field = row[2]
			enable_attachment_field = row[3]
			id_group_name = row[4]
			enable_addition = row[5]

			if entity_name is None:
				entity_name = project_name

			changes[id] = {
				'id': id, 'compound_id': project_name, 'entity_name':entity_name, 'enable_structure_field': enable_structure_field,
				'enable_attachment_field' : enable_attachment_field, 'id_group_name': id_group_name, 'enable_addition': enable_addition,
				'bypass': True
			}

			id -= 1

		print(changes)

		self.manager.save_changes('administrator', changes, 'Projects', {})

	def import_custom_fields(self):
		project_cur = self.manager.conn.cursor()
		project_cur.execute('''
			select
				id,
				project_name
			from
				projects
			where
				project_name <> 'OxXChem' and project_name <> 'Public' and project_name <> 'SGC'
		''')

		custom_fields_cur = self.manager.conn.cursor()
		custom_fields_cur.execute('''
			prepare fetch_custom_fields2 as
			select
				a.before_update_function,
				a.calculated,
				a.searchable,
				a.human_name,
				a.visible,
				a.auto_convert_mol,
				a.required,
				a.project_foreign_key_id,
				b.name as type_name,
				a.name
			from
				custom_fields a,
				custom_field_types b
			where
				a.project_id = $1 and
				a.type_id = b.id

		''')

		lookup_project = self.manager.conn.cursor()
		lookup_project.execute('''
			prepare fetch_project as
			select
				project_name
			from
				projects
			where
				id = $1
		''')

		custom_fields_exist = self.manager.conn.cursor()
		custom_fields_exist.execute('''
			prepare custom_fields_exist as
			select
				count(*) 
			from
				compounds
			where
				project_id = (select id from projects where project_name = $1)
		''')


		for project_row in project_cur:
			project_id = project_row[0]
			project_name = project_row[1]

			custom_fields_cur.execute('execute fetch_custom_fields2 (%s)', (project_id,))

			changes = {}

			id = -1

			for custom_field_row in custom_fields_cur:
				before_update_function = custom_field_row[0]
				calculated = custom_field_row[1]
				searchable = custom_field_row[2]
				human_name = custom_field_row[3]
				visible = custom_field_row[4]
				auto_convert_mol = custom_field_row[5]
				required = custom_field_row[6]
				foreign_key_project_id = custom_field_row[7]
				field_type = custom_field_row[8]
				name = custom_field_row[9]

				#print(human_name)

				foreign_key_project = None

				if foreign_key_project_id is not None:
					lookup_project.execute('execute fetch_project (%s)', (foreign_key_project_id,))
					row = lookup_project.fetchone()
					foreign_key_project = row[0]


				id -= 1

				changes[id] = {
					'id': id,
					'compound_id': name,
					'before_update_function':before_update_function,
					'calculated': calculated,
					'searchable': searchable,
					'human_name': human_name,
					'visible': visible,
					'auto_convert_mol': auto_convert_mol,
					'required': required,
					'foreign_key_project':foreign_key_project,
					'type': field_type,
					'bypass':True
				}

			custom_field_project_name = project_name + '/Custom Fields'

			custom_fields_exist.execute('execute custom_fields_exist (%s)',(custom_field_project_name,))

			row = custom_fields_exist.fetchone()

			if row is not None and row[0] > 0:
				print('Skippingi ' + custom_field_project_name)
			else:
				print(changes)
				try:
					self.manager.save_changes('administrator', changes, custom_field_project_name, {})
				except:
					pass

	def import_user_to_project(self):
		user_to_project_cur = self.manager.conn.cursor()
		user_to_project_cur.execute('''
			select
				b.project_name,
				a.username,
				c.is_administrator,
				c.default_project
			from
				users a,
				projects b,
				user_to_project c
			where
				c.user_id = a.id and
				c.project_id = b.id
		''')

		id = -1

		changes = {}

		for row in user_to_project_cur:
			project_name = row[0]
			user_name = row[1]
			is_administrator = row[2]
			default_project = row[3]

			if default_project is None:
				default_project = False

			if is_administrator is None:
				is_administrator = False

			id -= 1

			changes[id] = {
				'id': id,
				'compound_id': project_name + '/' + user_name,
				'is_administrator': False,
				'default_project': default_project,
				'is_administrator': is_administrator,
				'bypass': True,
				'user_user_id': user_name,
				'user_project_id': project_name
			}

		self.manager.save_changes('administrator', changes, 'User to Project', {})


	
if __name__ == '__main__':
	patcher = Patcher()
	#patcher.import_users_from_user_table()
	#patcher.import_custom_fields()
	patcher.import_user_to_project()
