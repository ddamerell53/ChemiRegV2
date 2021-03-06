# ChemiReg - web-based compound registration platform
# Written in 2017 by David Damerell <david.damerell@sgc.ox.ac.uk>, Brian Marsden <brian.marsden@sgc.ox.ac.uk>
# 
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.


# Core Python
from builtins import staticmethod

class ChemiRegConfig(object):
    @staticmethod
    def get_db_hostname():
        return 'chemireg_postgres'
    
    @staticmethod
    def get_db_port():
        return 5432
    
    @staticmethod
    def get_db_name():
        return 'chemireg'
    
    @staticmethod
    def get_db_password():
        return 'password'
    
    @staticmethod
    def get_email_address():
        return None
    
    @staticmethod
    def get_email_hostname():
        return None
    
    @staticmethod
    def get_email_port():
        return None

    @staticmethod
    def get_email_username():
        return None
    
    @staticmethod
    def get_email_password():
        return None

    @staticmethod
    def raise_scarab_config_exception():
        raise Exception('Set the Scarab username in chemiregconfig.py')

    @staticmethod
    def is_scarab_enabled():
        return False

    @staticmethod
    def get_scarab_hostname():
        ChemiRegConfig.raise_scarab_config_exception()

    @staticmethod
    def get_scarab_username():
        ChemiRegConfig.raise_scarab_config_exception()

    @staticmethod
    def get_scarab_password():
        ChemiRegConfig.raise_scarab_config_exception()
