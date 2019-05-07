import os

if not os.path.exists('db_created'):
    from authenticate import AuthenticationManager

    manager = AuthenticationManager()
    manager.add_user_projects('administrator')
    s_p = 'chemireg_password'

    manager.create_test_environment(s_p)
    manager.create_wordpress_environment(s_p)

    with open('db_created', 'w') as fw:
        fw.write('Base DB Created\n')
