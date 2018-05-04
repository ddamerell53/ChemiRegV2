# ChemiReg - web-based compound registration platform
# Written in 2017 by David Damerell <david.damerell@sgc.ox.ac.uk>, Brian Marsden <brian.marsden@sgc.ox.ac.uk>
# 
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.


import psycopg2

# ChemiReg CC0
from chemiregconfig import ChemiRegConfig

class ConnectionManager(object):
    def __init__(self):
        pass
    
    @staticmethod
    def get_new_connection():
        if ChemiRegConfig.get_db_password() is not None:
            return psycopg2.connect(
                database=ChemiRegConfig.get_db_name(), 
                port=ChemiRegConfig.get_db_port(), 
                host=ChemiRegConfig.get_db_hostname(), 
                password=ChemiRegConfig.get_db_password()
            )
        else:
             return psycopg2.connect(
                database=ChemiRegConfig.get_db_name(), 
                port=ChemiRegConfig.get_db_port(), 
            )
