from sdf_register import CompoundManager

class Patcher(object):
	def __init__(self):
		self.manager = CompoundManager()

	#def import_projects(self):
	#	conn = self.manager.conn
#
#		cur = conn.cursor()
#		cur.execute('''
#			select
#				project_name,
#				entity_name,
#				enable_structure_field,
#				enable_attachment_field,
#				id_group_name,
#				enable_addition
#				archived_date
#			from
#				projects
#		''', None)
#
#		for row in cur:
#			project_name = row[0]
#			entity_name = row[1]
#			enable_structure_field = row[2]
#			enable_attachment_field = row[3]
#			id_group_name = row[4]
#			enable_addition = row[5]
#			archived_date = row[6]
#
#			self.manager.create_custom_fields_project(project_name, None, False)


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

	def import_user_sites(self):
		conn = self.manager.conn

		cur = conn.cursor()
		cur.execute('''
			SELECT
				id
			FROM
				custom_fields
			WHERE
				project_id = (select id from projects where project_name = 'SGC') AND
				name = 'site'
		''')

		custom_field_id = cur.fetchone()[0]

		print(custom_field_id)

		cur = conn.cursor()
		cur.execute('''
			SELECT
				a.id,
				b.site
			FROM
				v_sgc a,
				users b
			WHERE
				a.site IS NULL AND
				a.user_id = b.id AND
				b.username <> 'ddamerell' and b.username<> 'administrator'
		''')

		'''
			UPDATE
				custom_varchar_fields
			SET

			WHERE
				custom_field_id = (
					SELECT
						id
					FROM
						custom_fields
					WHERE
						project_id = (select id from projects where project_name = 'SGC') AND
						name = 'site'
				)

		'''

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
			where
				archived_date is null
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

			changes[id] = {
				'id': id, 'project_name': project_name, 'entity_name':entity_name, 'enable_structure_field': enable_structure_field,
				'enable_attachment_field' : enable_attachment_field, 'id_group_name': id_group_name, 'enable_addition': enable_addition,
				'bypass': True
			}

			id -= 1

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
				project_name = 'Public'
		''')

		custom_fields_cur = self.manager.conn.cursor()
		custom_fields_cur.execute('''
			prepare fetch_custom_fields as
			select
				before_update_function,
				calculated,
				searchable,
				human_name,
				visible,
				auto_convert_mol,
				required,
				foreign_key_project,
				type,
				name
			from
				custom_fields
			where
				project_id = $1

		''')

		for project_row in project_cur:
			project_id = project_row[0]
			project_name = project_row[1]

			custom_fields_cur.execute('execute fetch_custom_fields (%s)', (project_id,))

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
				foreign_key_project = custom_field_row[7]
				field_type = custom_field_row[8]
				name = custom_field_row[9]

				id -= 1

				changes[id] = {
					'id': id,
					'entity_name': name,
					'before_update_function':before_update_function,
					'calculated': calculated,
					'searchable': searchable,
					'human_name': human_name,
					'visible': visible,
					'auto_convert_mol': auto_convert_mol,
					'required': required,
					'foreign_key_project':foreign_key_project,
					'field_type': field_type
				}

			custom_field_project_name = project_name + '/Custom Fields'

			self.manager.save_changes('administrator', changes, custom_field_project_name, {})

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

			id -= 1

			changes[id] = {
				'id': id,
				'compound_id': project_name + '/' + user_name,
				'is_administrator': False,
				'default_project': default_project,
				'is_administrator': is_administrator,
				'bypass': True
			}

		self.manager.save_changes('administrator', changes, 'User to Project', {})


if __name__ == '__main__':
	patcher = Patcher()
	#patcher.import_users_from_user_table()
	#patcher.import_projects()
	#patcher.import_user_sites()
	patcher.import_projects()