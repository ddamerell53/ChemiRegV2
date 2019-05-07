import unittest
import urllib.request
import urllib.parse
import json
import base64


def run_query(base_url, command, args, method='POST'):
    url = base_url + '/' + command
    data = urllib.parse.urlencode(args)


    if method == 'GET':
        url = url + '?' + data
        data = None
    else:
        data = data.encode('ascii')

    req = urllib.request.Request(url, data, method=method)

    with urllib.request.urlopen(req) as res:
        ret_val = res.read()
        return json.loads(ret_val)

class ChemiRegTester(unittest.TestCase):
    base_url = None
    token = None

    @classmethod
    def setUpClass(cls):
        cls.base_url = 'http://127.0.0.1:80'

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
        command = 'api/compound_utils/image'
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

        self._test_basic_res(res)

        self.assertIsNotNone(res['result-set'])
        self.assertEqual(len(res['result-set']), 1)
        self.assertIsNotNone(res['result-set'][0])

        obj = res['result-set'][0]

        self.assertIsNotNone(obj)

        self.assertIn('svg_content', obj)
        self.assertIsNotNone(obj['svg_content'])

    def test_as_png(self):
        command = 'api/compound_utils/image'
        args = {
            'token': ChemiRegTester.token,
            'wait': 'yes',
            'format': 'png',
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

        self._test_basic_res(res)

        self.assertIsNotNone(res['result-set'])
        self.assertEqual(len(res['result-set']), 1)
        self.assertIsNotNone(res['result-set'][0])

        obj = res['result-set'][0]

        self.assertIsNotNone(obj)

        self.assertIn('png_content', obj)
        self.assertIsNotNone(obj['png_content'])
        self.assertIsNotNone(obj['smiles'])
        self.assertEqual(obj['smiles'], 'C')

    def test_supplier_upload(self):
        command = 'api/compounds'
        args = {
          'wait':'yes',
          'project_name':'Test/Supplier List',
          'token': ChemiRegTester.token,
          'compounds': json.dumps({
            '-1': { 
              'id': '-1',
              'compound_id': 'Test',
            }
          })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        obj2 = self._test_upload_response(res)

        matched = False

        self.assertIsNotNone(obj2)
        self.assertIn('compound_id', obj2)
        self.assertEqual('Test', obj2['compound_id'])

    def test_compound_upload(self):
        command = 'api/compounds'
        args = {
          'wait':'yes',
          'project_name':'Test/Supplier List',
          'token': ChemiRegTester.token,
          'compounds': json.dumps({
            '-1': { 
              'id': '-1',
              'compound_id': 'Test2',
            }
          })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        command = 'api/compounds'
        args = {
          'wait':'yes',
          'project_name':'TestA',
          'token': ChemiRegTester.token,
          'compounds': json.dumps({
            '-1': { 
              'id': '-1',
              'smiles': 'C',
              'classification':'ZZ',
              'supplier': 'Test2',
              'supplier_id':'AA'
            }
          })
        }

        res = run_query(ChemiRegTester.base_url, command, args)
        print(res)

    def test_compound_field_delete(self):
        command = 'api/compounds'
        args = {
            'wait': 'yes',
            'project_name': 'Test/Supplier List',
            'token': ChemiRegTester.token,
            'compounds': json.dumps({
                '-1': {
                    'id': '-1',
                    'compound_id': 'Test3',
                }
            })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        command = 'api/compounds'
        args = {
            'wait': 'yes',
            'project_name': 'TestA',
            'token': ChemiRegTester.token,
            'compounds': json.dumps({
                '-1': {
                    'id': '-1',
                    'smiles': 'C',
                    'classification': 'ZZ',
                    'supplier': 'Test3',
                    'supplier_id': 'AA',
                    'elnid': 'PAGE15-00001'
                }
            })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        self._test_basic_res(res)

        refreshed_objects = self._test_upload_response(res)

        command = 'api/compounds'

        args = {
            'wait': 'yes',
            'project_name': 'TestA',
            'token': ChemiRegTester.token,
            'field_name':'elnid',
            'field_value': 'PAGE15-00001'
        }

        res = run_query(ChemiRegTester.base_url, command, args,'DELETE')

        self._test_basic_res(res)

    def test_file_upload(self):
        chunk_size = 1024 * 60000

        upload_id = None

        command = 'api/uploads'

        with open('upload1.sdf', 'rb') as f:
            while True:
                byte_buf = f.read(chunk_size)

                contents_b64 = base64.b64encode(byte_buf).decode('ascii')

                args = {
                    'wait': 'yes',
                    'token': ChemiRegTester.token,
                    'upload_id': upload_id,
                    'contents': contents_b64
                }

                eof = len(byte_buf) != chunk_size

                print(args)

                res = run_query(ChemiRegTester.base_url, command, args)

                print(res)

                self.assertIsNotNone(res)
                self.assertIn('upload_id', res)

                upload_id = res['upload_id']

                if eof:
                    break



    def test_file_upload_and_register(self):
        chunk_size = 1024 * 60000

        command = 'api/uploads'

        upload_id = None

        with open('upload1.sdf', 'rb') as f:
            while True:
                byte_buf = f.read(chunk_size)

                contents_b64 = base64.b64encode(byte_buf).decode('ascii')

                args = {
                    'wait': 'yes',
                    'token': ChemiRegTester.token,
                    'upload_id': upload_id,
                    'contents': contents_b64
                }

                eof = len(byte_buf) != chunk_size

                res = run_query(ChemiRegTester.base_url, command, args)

                print(res)

                self.assertIsNotNone(res)
                self.assertIn('upload_id', res)

                upload_id = res['upload_id']

                if eof:
                    break

        command = 'api/compounds'
        args = {
            'wait': 'yes',
            'project_name': 'Test/Supplier List',
            'token': ChemiRegTester.token,
            'compounds': json.dumps({
                '-1': {
                    'id': '-1',
                    'compound_id': 'Test4',
                }
            })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        command = 'api/compounds'

        # Upload configuration
        config = {
            'batchable': {
                'default_value': True, 'map_column': None,
            }, 'classification': {
                'default_value': None, 'map_column': 'classification'
            }, 'supplier_id': {
                'default_value': None,
                'map_column': 'supplier_id'
            }, 'supplier': {
                'default_value': None,
                'map_column': 'supplier'
            }, 'old_sgc_global_id': {
                'default_value': None,
                'map_column': 'supplier_id'
            }
        }

        args = {
            'wait': 'yes',
            'project_name': 'TestA',
            'token': ChemiRegTester.token,
            'upload_key': upload_id,
            'upload_defaults': json.dumps(config),
            'upload_name': 'upload1.sdf'
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        print(res)

        self._test_basic_res(res)

    def test_compound_search1(self):
        command = 'api/compounds'
        args = {
          'wait':'yes',
          'project_name':'Test/Supplier List',
          'token': ChemiRegTester.token,
          'compounds': json.dumps({
            '-1': {
              'id': '-1',
              'compound_id': 'Test5',
            }
          })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        command = 'api/compounds'
        args = {
          'wait':'yes',
          'project_name':'TestA',
          'token': ChemiRegTester.token,
          'compounds': json.dumps({
            '-1': {
              'id': '-1',
              'smiles': 'C',
              'classification':'ZZ',
              'supplier': 'Test5',
              'supplier_id':'FETCH_TEST_1'
            }
          })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        print(res)

        self._test_upload_response(res)

        compound_id = res['refreshed-objects']['-1']['compound_id']


        print(compound_id)

        command = 'api/compounds'
        args = {
            'wait': 'yes',
            'project_name': 'TestA',
            'token': ChemiRegTester.token,
            'field_name': 'supplier_id',
            'field_value': 'FETCH_TEST_1'
        }

        res = run_query(ChemiRegTester.base_url, command, args, method='GET')

        print(res)

        self._test_basic_res(res)

        self.assertEquals(res['result-set'][0]['compound_id'], compound_id)

        command = 'api/compounds'
        args = {
            'wait': 'yes',
            'project_name': 'TestA',
            'token': ChemiRegTester.token,
            'field_name': 'upload_id',
            'field_value': res['result-set'][0]['upload_id']
        }

        res = run_query(ChemiRegTester.base_url, command, args, method='GET')

        print(res)

        self._test_basic_res(res)

        self.assertEquals(res['result-set'][0]['compound_id'], compound_id)


    def test_file_upload_preview(self):
        chunk_size = 1024 * 60000

        upload_id = None

        command = 'api/uploads'

        with open('upload1.sdf', 'rb') as f:
            while True:
                byte_buf = f.read(chunk_size)

                contents_b64 = base64.b64encode(byte_buf).decode('ascii')

                args = {
                    'wait': 'yes',
                    'token': ChemiRegTester.token,
                    'upload_id': upload_id,
                    'contents': contents_b64
                }

                eof = len(byte_buf) != chunk_size

                res = run_query(ChemiRegTester.base_url, command, args)

                self.assertIsNotNone(res)
                self.assertIn('upload_id', res)

                upload_id = res['upload_id']

                if eof:
                    break

        command = 'api/uploads'
        args = {
            'wait': 'yes',
            'project_name': 'TestA',
            'token': ChemiRegTester.token,
            'action': 'preview_sdf_upload',
            'upload_id': upload_id,
            'limit': 1
        }

        res = run_query(ChemiRegTester.base_url, command, args, method='GET')

        self._test_basic_res(res)

        self.assertIsNotNone(res['result-set'])
        self.assertEqual(len(res['result-set']),1)
        self.assertEqual(res['result-set'][0]['smiles'], 'c1ccccc1')
        self.assertIsNotNone(res['result-set'][0]['mol_image'])
        self.assertIsNotNone(res['result-set'][0]['mw'])

    def test_file_upload_preview2(self):
        chunk_size = 1024 * 60000

        upload_id = None

        command = 'api/uploads'

        with open('test_leo.sdf', 'rb') as f:
            while True:
                byte_buf = f.read(chunk_size)

                contents_b64 = base64.b64encode(byte_buf).decode('ascii')

                args = {
                    'wait': 'yes',
                    'token': ChemiRegTester.token,
                    'upload_id': upload_id,
                    'contents': contents_b64
                }

                eof = len(byte_buf) != chunk_size

                res = run_query(ChemiRegTester.base_url, command, args)

                self.assertIsNotNone(res)
                self.assertIn('upload_id', res)

                upload_id = res['upload_id']

                if eof:
                    break

        command = 'api/uploads'
        args = {
            'wait': 'yes',
            'project_name': 'TestA',
            'token': ChemiRegTester.token,
            'action': 'preview_sdf_upload',
            'upload_id': upload_id,
            'limit': 1
        }

        res = run_query(ChemiRegTester.base_url, command, args, method='GET')

        self._test_basic_res(res)

        self.assertIsNotNone(res['result-set'])
        self.assertEqual(len(res['result-set']),1)
        self.assertEqual(res['result-set'][0]['smiles'], 'c1ccccc1')
        self.assertIsNotNone(res['result-set'][0]['mol_image'])
        self.assertIsNotNone(res['result-set'][0]['mw'])

    def test_compound_search2(self):
        command = 'api/compounds'
        args = {
          'wait':'yes',
          'project_name':'Test/Supplier List',
          'token': ChemiRegTester.token,
          'compounds': json.dumps({
            '-1': {
              'id': '-1',
              'compound_id': 'Test6',
            }
          })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        command = 'api/compounds'
        args = {
          'wait':'yes',
          'project_name':'TestA',
          'token': ChemiRegTester.token,
          'compounds': json.dumps({
            '-1': {
              'id': '-1',
              'smiles': 'c1ccccc1',
              'classification':'ZZ',
              'supplier': 'Test6',
              'supplier_id':'FETCH_TEST_1'
            }
          })
        }

        res = run_query(ChemiRegTester.base_url, command, args)

        print(res)

        self._test_upload_response(res)

        compound_id = res['refreshed-objects']['-1']['compound_id']


        print(compound_id)

        command = 'api/compounds'
        args = {
            'wait': 'yes',
            'project_name': 'TestA',
            'token': ChemiRegTester.token,
            'search_terms': [],
            'from_row':0,
            'to_row': 10,
            'mol_block': '''C6H6
  MOLSOFT 04261914482D

  6  6  0  0  0  0  0  0  0  0999 V2000
   26.2079   -5.8304    0.0000 C   0  0  0
   24.9955   -5.1304    0.0000 C   0  0  0
   24.9955   -3.7304    0.0000 C   0  0  0
   26.2079   -3.0304    0.0000 C   0  0  0
   27.4203   -3.7304    0.0000 C   0  0  0
   27.4203   -5.1304    0.0000 C   0  0  0
  1  2  2
  2  3  1
  3  4  2
  4  5  1
  6  1  1
  5  6  2
M  END
            '''
        }

        res = run_query(ChemiRegTester.base_url, command, args, method='GET')

        print(res)

        self._test_basic_res(res)

        self.assertEquals(res['result-set'][0]['compound_id'], compound_id)

    def _test_basic_res(self, res):
        self.assertIsNotNone(res)
        self.assertIn('uuid', res)
        self.assertIn('error', res)
        self.assertIsNone(res['error'])
        self.assertIsNotNone(res['uuid'])

    def _test_upload_response(self, res):
        self.assertIsNotNone(res['refreshed-objects'])


        return res['refreshed-objects']['-1']

if __name__ == '__main__':
    unittest.main()
