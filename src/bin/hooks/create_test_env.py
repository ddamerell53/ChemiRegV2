# Configure administrator account
from authenticate import AuthenticationManager

from chemireg import ChemiRegTests

if __name__ == '__main__':
    manager = AuthenticationManager()
    manager.register_user('CI','CI','CI@example.com','administrator','InSecurePassword@PassesFilter', 'internal', False)

    # Install default users and projects
    s_p = 'asdasdq3245r24rf'
    manager.create_test_environment(s_p)
    print('Login with username testuser1 or testuser2 and the password' + s_p)

    #tests = ChemiRegTests('http://localhost', 80, 'testuser1', s_p)
    #tests.run_tests()