import os

if not os.path.exists('db_created'):
    from authenticate import AuthenticationManager
    from patcher import Patcher

    manager = AuthenticationManager()

    cur = manager.conn.cursor()
    cur.execute("select count(*) from users", None)

    if cur.fetchone()[0] < 2:
        manager.add_user_projects('administrator')
        s_p = 'chemireg_password'
        manager.create_test_environment(s_p)
        manager.create_wordpress_environment(s_p)

        patcher = Patcher()

        patcher.import_projects2()
        patcher.import_users_from_user_table()
        patcher.import_custom_fields()
        patcher.import_user_to_project()

        patcher.manager.commit()

        with open('db_created', 'w') as fw:
            fw.write('Base DB Created\n')
