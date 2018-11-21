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
        return None
    
    @staticmethod
    def get_db_port():
        return 5432
    
    @staticmethod
    def get_db_name():
        return 'sat_reg'
    
    @staticmethod
    def get_db_password():
        return None 
    
    @staticmethod
    def get_email_address():
        return 'info_bot@sgc.ox.ac.uk'
    
    @staticmethod
    def get_email_hostname():
        return 'smtp.ox.ac.uk'
    
    @staticmethod
    def get_email_port():
        return 587

    @staticmethod
    def get_email_username():
        return 'infobot'
    
    @staticmethod
    def get_email_password():
        return '9gVPSOR90'
