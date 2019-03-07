import unittest
import urllib.request
import urllib.parse
import json


def run_query(base_url, command, args):
    url = base_url + '/' + command
    data = urllib.parse.urlencode(args)
    data = data.encode('ascii')

    req = urllib.request.Request(url, data)

    with urllib.request.urlopen(req) as res:
        ret_val = res.read()
        return json.loads(ret_val)

class ChemiRegTester(unittest.TestCase):
    base_url = None
    token = None

    @classmethod
    def setUpClass(cls):
        cls.base_url = 'http://127.0.0.1:8080'

        command = 'login'
        args = {
            'username': 'administrator',
            'password': 'chemireg_password'
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        ChemiRegTester.token = res['token']

    def test_connect(self):
        command = 'login'
        args = {
            'username': 'administrator',
            'password': 'chemireg_password'
        }

        res = run_query(ChemiRegTester.base_url,command, args)

        self.assertIsNotNone(res)
        self.assertIsNotNone(res['token'])

    def test_as_svg(self):
        command = 'api/compounds'
        args = {
            'token': ChemiRegTester.token,
            'wait': 'yes',
            'format': 'svg',
            'molblock': '''CH4
  MOLSOFT 03061911032D

  1  0  0  0  0  0  0  0  0  0999 V2000
    7.6900   -8.3333    0.0000 C   0  0  0
M  END
> <B>


$$$$
            '''
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        self.assertIsNotNone(res)
        self.assertIn('uuid', res)
        self.assertIn('error', res)
        self.assertIn('result-set', res)
        self.assertIsNone(res['error'])
        self.assertIsNotNone(res['uuid'])
        self.assertIsNotNone(res['result-set'])
        self.assertEqual(len(res['result-set']), 1)
        self.assertIsNotNone(res['result-set'][0])

        obj = res['result-set'][0]

        self.assertIsNotNone(obj)

        self.assertIn('svg_content', obj)
        self.assertIsNotNone(obj['svg_content'])

if __name__ == '__main__':
    unittest.main()
