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
				enable_addition
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

			self.manager.create_custom_fields_project(project_name, None, False)


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

if __name__ == '__main__':
	patcher = Patcher()
	#patcher.import_users_from_user_table()
	patcher.import_projects()
