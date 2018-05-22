from sgc_audit_client import SGCAuditClient

if __name__ == '__main__':
    oracle_info={
       'username':'',
       'password':'',
       'tns_name': ''
    }

    mysql_info={
       'hostname':'',
       'username':'',
       'password':''
    }

    client = SGCAuditClient('https://globalchemireg.sgc.ox.ac.uk', 443, 'username','password', ['SGC - Oxford','SGC'], None, oracle_info, mysql_info, True) 
    client.process_updates()
