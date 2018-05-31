# ChemiReg - web-based compound registration platform
# Written in 2017 by David Damerell <david.damerell@sgc.ox.ac.uk>, Brian Marsden <brian.marsden@sgc.ox.ac.uk>
# 
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# MIT 2015 Tencent
import rapidjson

# Core Python
import json
import os
import sys
import uuid
import tempfile
import pickle
import codecs
import pytz
from datetime import datetime
import datetime
from dateutil import tz
import dateutil
from collections import defaultdict
import time
import re
import hashlib

# BSD 2013 John McNamara
import xlsxwriter

# lGPL
import psycopg2

# BSD - 3 clause
from rdkit import Chem
from rdkit.Chem.SaltRemover import SaltRemover
from rdkit.Chem.Draw import MolDrawing
from rdkit.Chem import Draw
from rdkit.Chem.rdmolfiles import SDWriter
from rdkit.Chem import AllChem

# ChemiReg - CC0
from connection_manager import ConnectionManager
import authenticate 

class CompoundFetchManager(object):
	def __init__(self, conn=None,auth_manager = None,crud_manager=None):
		self.fetch_upload_set_cur = None

		if auth_manager is None:
			self.conn = conn
		else:
			self.conn = auth_manager.conn
			
		self.start_time = datetime.datetime.now()
		
		self.record_fetch = True

		self.connect()
		
		if auth_manager is None:
			self.auth_manager = authenticate.AuthenticationManager(self.conn, self, crud_manager)
		else:
			self.auth_manager = auth_manager
		
		self.generate_custom_field_selects()
		self.generate_custom_field_update_selects()
		
		self.user = None
		self.project = None
		self.strip_salts = False
		
	def set_record_fetch(self, record):
		self.record_fetch = record

	def connect(self):
		if self.conn is None:
			self.conn = ConnectionManager.get_new_connection()
			
		#https://www.postgresql.org/docs/9.4/static/explicit-joins.html
		self.conn.cursor().execute("set join_collapse_limit =1")
		
		self.fetch_upload_set_cur = self.conn.cursor()
		self.fetch_upload_set_cur.execute('''
			prepare fetch_upload_set as 
			select
				compound_id,
				b.username,
				a.id,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable
			from
				compounds a,
				users b
			where
				upload_id = $1 AND
				b.id = a.user_id and
				a.archived_transaction_id is null
			order by a.date_record_created desc, a.compound_id
			limit $2 offset $3
		''')
 
		self.fetch_upload_set_count_cur = self.conn.cursor()
		self.fetch_upload_set_count_cur.execute('''
			prepare fetch_upload_set_count as 
			select
				count(*)
			from
				compounds a
			where
				upload_id = $1 and
				a.archived_transaction_id is null
		''')
		
		self.fetch_exact_set_cur = self.conn.cursor()
		self.fetch_exact_set_cur.execute('''
			prepare fetch_exact_set as 
			select
				compound_id,
				b.username,
				a.id,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable
			from
				compounds a,
				users b,
				projects d
			where
				a.compound_id = ANY($1) AND
				d.project_name = $4 and
				a.user_id = b.id and
				a.project_id = d.id and
				a.archived_transaction_id is null
			order by a.date_record_created desc, a.compound_id
			limit $2 offset $3
		''')
 
		self.fetch_exact_set_count_cur = self.conn.cursor()
		self.fetch_exact_set_count_cur.execute('''
			prepare fetch_exact_set_count as 
			select
				count(*)
			from
				compounds a,
				users b,
				projects d
			where
				a.compound_id = ANY($1) and
				d.project_name = $2 and
				a.user_id = b.id and
				a.project_id = d.id and
				a.archived_transaction_id is null
		''')
		
		self.fetch_exact_set_left_cur = self.conn.cursor()
		self.fetch_exact_set_left_cur.execute('''
			prepare fetch_exact_set_left as 
			select
				compound_id,
				b.username,
				a.id,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable
			from
				compounds a,
				users b,
				projects d
			where
				a.compound_id like ANY($1) AND
				d.project_name = $4 and
				a.user_id = b.id and
				a.project_id = d.id and
				a.archived_transaction_id is null
			order by a.date_record_created desc, a.compound_id
			limit $2 offset $3
		''')
 
		self.fetch_exact_set_left_count_cur = self.conn.cursor()
		self.fetch_exact_set_left_count_cur.execute('''
			prepare fetch_exact_set_left_count as 
			select
				count(*)
			from
				compounds a,
				users b,
				projects d
			where
				a.compound_id like  ANY($1) and
				d.project_name = $2 and
				a.user_id = b.id and
				a.project_id = d.id and
				a.archived_transaction_id is null
		''')
		
		self.fetch_ctab_set_only_count_cur = self.conn.cursor()
		self.fetch_ctab_set_only_count_cur.execute(''' 
			prepare fetch_ctab_set_only_count as
			select 
	        	count(compounds.compound_id)
	        from
	        (
	            select
	                custom_text_fields.entity_id
	            from 
	                custom_text_fields,
	                custom_fields,
	                compounds_idx
	            where
	                compounds_idx.custom_field_id = custom_text_fields.id and
	                compounds_idx.molecule@>$1 and
	                custom_text_fields.custom_field_id = custom_fields.id and
	                custom_fields.ss_field = true 
	        ) a join 
	        compounds on (compounds.id = a.entity_id) join
	        projects on (compounds.project_id = projects.id) join
	        users on (compounds.user_id = users.id) and
	        compounds.archived_transaction_id is null
	        where
	            projects.project_name = $2 
	            
		''')
		
		self.fetch_ctab_set_count_cur = self.conn.cursor()
		self.fetch_ctab_set_count_cur.execute(''' 
			prepare fetch_ctab_set_count as
			select 
			    count(distinct compound_id)
			from (
			    select
			        compounds.compound_id as compound_id
			    from
			        compounds,
			        users,
			        projects
			    where
			        (upper(compounds.compound_id) like any($3) or compounds.user_id = any(select id from users where upper(username) like any($3))) and
			        projects.project_name = $2 and
			        
			        compounds.project_id = projects.id and
			        compounds.user_id = users.id and 
			        compounds.archived_transaction_id is null			        
			    union
			        select
			            compounds.compound_id as compound_id
			        from
			            (
			                select 
			                    custom_varchar_fields.entity_id
			                from 
			                    custom_varchar_fields,
			                    custom_fields
			                where
			                    upper(custom_varchar_fields.custom_field_value) like any($3) and
			                    custom_varchar_fields.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            users on (compounds.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $2
			    union
			        select
			            compounds.compound_id as compound_id
			        from
			            (
			                select 
			                    custom_foreign_key_field.entity_id
			                from 
			                    custom_foreign_key_field,
			                    custom_fields
			                where
			                    upper(custom_foreign_key_field.custom_field_value) like any($3) and
			                    custom_foreign_key_field.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            users on (compounds.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $2 
			    union
			        select 
			        	compounds.compound_id
			        from
			        (
			            select
			                custom_text_fields.entity_id
			            from 
			                custom_text_fields,
			                custom_fields,
			                compounds_idx
			            where
			                compounds_idx.custom_field_id = custom_text_fields.id and
			                compounds_idx.molecule@>$1 and
			                custom_text_fields.custom_field_id = custom_fields.id and
			                custom_fields.ss_field = true 
			        ) a join 
			        compounds on (compounds.id = a.entity_id) join
			        projects on (compounds.project_id = projects.id) join
			        users on (compounds.user_id = users.id) and
			        compounds.archived_transaction_id is null
			        where
			            projects.project_name = $2 
			)  a
		''')
		
		self.fetch_ctab_set_only_cur = self.conn.cursor()
		self.fetch_ctab_set_only_cur.execute('''
			prepare fetch_ctab_set_only as
			select 
		        	compounds.compound_id,
		        	users.username,
		        	compounds.id,
		        	extract('epoch' from compounds.date_record_created) as date_record_created,
					compounds.batchable
		        from
		        (
		            select
		                custom_text_fields.entity_id
		            from 
		                custom_text_fields,
		                custom_fields,
		                compounds_idx
		            where
		                compounds_idx.custom_field_id = custom_text_fields.id and
		                compounds_idx.molecule@>$1 and
		                custom_text_fields.custom_field_id = custom_fields.id and
		                custom_fields.ss_field = true 
		        ) a join 
		        compounds on (compounds.id = a.entity_id) join
		        projects on (compounds.project_id = projects.id) join
		        users on (compounds.user_id = users.id) and
		        compounds.archived_transaction_id is null
		        where
		            projects.project_name = $4 
			order by date_record_created desc, compound_id
			limit $2 offset $3	
			    
		''')
  
		self.fetch_ctab_set_cur = self.conn.cursor()
		self.fetch_ctab_set_cur.execute('''
			prepare fetch_ctab_set as
			select 
			    a.compound_id,
			    a.username,
			    a.id,
			    a.date_record_created,
			    a.batchable
			from (
			    select
			        compounds.compound_id as compound_id,
			        	users.username,
			        	compounds.id,
			        	extract('epoch' from compounds.date_record_created) as date_record_created,
						compounds.batchable
			    from
			        compounds,
			        users,
			        projects
			    where
			       (upper(compounds.compound_id) like any($5) or compounds.user_id = any(select id from users where upper(username) like any($5))) and
			        projects.project_name = $4 and
			        compounds.project_id = projects.id and
			        compounds.user_id = users.id and 
			        compounds.archived_transaction_id is null
			    union
			        select
			            compounds.compound_id as compound_id,
			        	users.username,
			        	compounds.id,
			        	extract('epoch' from compounds.date_record_created) as date_record_created,
						compounds.batchable
			        from
			            (
			                select 
			                    custom_varchar_fields.entity_id
			                from 
			                    custom_varchar_fields,
			                    custom_fields
			                where
			                    upper(custom_varchar_fields.custom_field_value) like any($5) and
			                    custom_varchar_fields.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            users on (compounds.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $4 
			    union
			        select
			            compounds.compound_id as compound_id,
			        	users.username,
			        	compounds.id,
			        	extract('epoch' from compounds.date_record_created) as date_record_created,
						compounds.batchable
			        from
			            (
			                select 
			                    custom_foreign_key_field.entity_id
			                from 
			                    custom_foreign_key_field,
			                    custom_fields
			                where
			                    upper(custom_foreign_key_field.custom_field_value) like any($5) and
			                    custom_foreign_key_field.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            users on (compounds.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $4 
			    union
			        select 
			        	compounds.compound_id,
			        	users.username,
			        	compounds.id,
			        	extract('epoch' from compounds.date_record_created) as date_record_created,
						compounds.batchable
			        from
			        (
			            select
			                custom_text_fields.entity_id
			            from 
			                custom_text_fields,
			                custom_fields,
			                compounds_idx
			            where
			                compounds_idx.custom_field_id = custom_text_fields.id and
			                compounds_idx.molecule@>$1 and
			                custom_text_fields.custom_field_id = custom_fields.id and
			                custom_fields.ss_field = true 
			        ) a join 
			        compounds on (compounds.id = a.entity_id) join
			        projects on (compounds.project_id = projects.id) join
			        users on (compounds.user_id = users.id) and
			        compounds.archived_transaction_id is null
			        where
			            projects.project_name = $4 
			)  a
			order by a.date_record_created desc, a.compound_id
			limit $2 offset $3	
			
		''')
		
		self.fetch_set_count_cur = self.conn.cursor()
		self.fetch_set_count_cur.execute(''' 
			prepare fetch_set_count as
			select 
			    count(distinct compound_id)
			from (
			    select
			        compounds.compound_id as compound_id
			    from
			        compounds,
			        users,
			        projects
			    where
			        (upper(compounds.compound_id) like any($2) or compounds.user_id = any(select id from users where upper(username) like any($2))) and
			        projects.project_name = $1 and
			        compounds.project_id = projects.id and
			        compounds.user_id = users.id and 
			        compounds.archived_transaction_id is null
			    union
			        select
			            compounds.compound_id as compound_id
			        from
			            (
			                select 
			                    custom_varchar_fields.entity_id
			                from 
			                    custom_varchar_fields,
			                    custom_fields
			                where
			                    upper(custom_varchar_fields.custom_field_value) like any($2) and
			                    custom_varchar_fields.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            users on (compounds.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $1
			    union
			        select
			            compounds.compound_id as compound_id
			        from
			            (
			                select 
			                    custom_foreign_key_field.entity_id
			                from 
			                    custom_foreign_key_field,
			                    custom_fields
			                where
			                    upper(custom_foreign_key_field.custom_field_value) like any($2) and
			                    custom_foreign_key_field.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            users on (compounds.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $1
			)  a
		''')
		
		self.fetch_set_cur = self.conn.cursor()
		self.fetch_set_cur.execute('''
			prepare fetch_set as
			select 
			    a.compound_id,
			    a.username,
			    a.id,
			    a.date_record_created,
			    a.batchable
			from (
			    select
			        compounds.compound_id as compound_id,
			        	users.username,
			        	compounds.id,
			        	extract('epoch' from compounds.date_record_created) as date_record_created,
						compounds.batchable
			    from
			        compounds,
			        users,
			        projects
			    where
			        (upper(compounds.compound_id) like any($4) or compounds.user_id = any(select id from users where upper(username) like any($4))) and
			        projects.project_name = $3 and
			        compounds.project_id = projects.id and
					compounds.user_id = users.id and 
			        compounds.archived_transaction_id is null
			    union
			        select
			            compounds.compound_id as compound_id,
			        	users.username,
			        	compounds.id,
			        	extract('epoch' from compounds.date_record_created) as date_record_created,
						compounds.batchable
			        from
			            (
			                select 
			                    custom_varchar_fields.entity_id
			                from 
			                    custom_varchar_fields,
			                    custom_fields
			                where
			                    upper(custom_varchar_fields.custom_field_value) like any($4) and
			                    custom_varchar_fields.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            users on (compounds.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $3
			    union
			        select
			            compounds.compound_id as compound_id,
			        	users.username,
			        	compounds.id,
			        	extract('epoch' from compounds.date_record_created) as date_record_created,
						compounds.batchable
			        from
			            (
			                select 
			                    custom_foreign_key_field.entity_id
			                from 
			                    custom_foreign_key_field,
			                    custom_fields
			                where
			                    upper(custom_foreign_key_field.custom_field_value) like any($4) and
			                    custom_foreign_key_field.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            users on (compounds.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $3 
			)  a
			order by a.date_record_created desc, a.compound_id
			limit $1 offset $2	
			
		''')
		
		self.fetch_project_set_count_cur = self.conn.cursor()
		self.fetch_project_set_count_cur.execute(''' 
			prepare fetch_project_set_count as
			select
				count(*)	
			from
				compounds a,
				users c,
				projects d
			where
				a.user_id = c.id and 
				a.project_id = d.id and 
				d.project_name = $1 and
				a.archived_transaction_id is null
		''')
		
		self.fetch_project_set_cur = self.conn.cursor()
		self.fetch_project_set_cur.execute('''
			prepare fetch_project_set as
			select
				a.compound_id,
				c.username,
				a.id,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable
			from
				compounds a,
				users c,
				projects d
			where
				a.user_id = c.id and 
				a.project_id = d.id and
				d.project_name = $1 and
				a.archived_transaction_id is null
			order by a.date_record_created desc,a.compound_id
			limit $2 offset $3
		''')
		
		self.fetch_project_set_user_count_cur = self.conn.cursor()
		self.fetch_project_set_user_count_cur.execute(''' 
			prepare fetch_project_set_user_count as
			select
				count(*)	
			from
				compounds a,
				users c,
				projects d
			where
				a.user_id = c.id and 
				a.project_id = d.id and 
				d.project_name = $2 and
				a.archived_transaction_id is null and
				a.user_id = (select id from users where username = $1)
		''')
		
		self.fetch_project_set_user_cur = self.conn.cursor()
		self.fetch_project_set_user_cur.execute('''
			prepare fetch_project_set_user as
			select
				a.compound_id,
				c.username,
				a.id,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable
			from
				compounds a,
				users c,
				projects d
			where
				a.user_id = c.id and 
				a.project_id = d.id and
				d.project_name = $2 and
				a.archived_transaction_id is null and
				a.user_id = (select id from users where username = $1)
			order by a.date_record_created desc,a.compound_id
			limit $3 offset $4	
		''')
 
		self.fetch_terms_cur = self.conn.cursor()
		self.fetch_terms_cur.execute('''
			prepare fetch_terms as
			select 
			    distinct a.compound_id,
			    custom_field_value,
			    custom_field_name,
			    label
			from (
			    (select
			        compounds.compound_id as compound_id,
			        compounds.compound_id as custom_field_value,
			        'compound_id' as  custom_field_name,
			        compounds.compound_id || ' ' || users.username as label
			    from
			        compounds,
			        users,
			        user_to_project ,
			        projects
			    where
			        (upper(compounds.compound_id) like upper($1) || '%' or compounds.user_id = any(select id from users where upper(username) like upper($1) || '%')) and
			        projects.project_name = $3 and
			        users.username = $2 and
			        compounds.project_id = projects.id and
			        user_to_project.user_id = users.id and
			        user_to_project.project_id = projects.id and
			        compounds.archived_transaction_id is null
			    limit 20)
			    union
			        (select
			            compounds.compound_id as compound_id,
			            a.custom_field_value as custom_field_value,
			            a.name as custom_field_name,
			            compounds.compound_id || ' <= ' || a.custom_field_value || ' (' || a.human_name || ')' as label
			        from
			            (
			                select 
			                    custom_varchar_fields.id ,
			                    custom_fields.name,
			                    custom_varchar_fields.custom_field_value,
			                    custom_varchar_fields.entity_id,
			                    custom_fields.human_name
			                from 
			                    custom_varchar_fields,
			                    custom_fields
			                where
			                    upper(custom_varchar_fields.custom_field_value) like '%' || upper($1) || '%' and
			                    custom_varchar_fields.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            user_to_project on (user_to_project.project_id = projects.id)  join
			            users on (user_to_project.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $3 and
			            users.username = $2
			        limit 20)
			    union
			        (select
			            compounds.compound_id as compound_id,
			            a.custom_field_value as custom_field_value,
			            a.name as custom_field_name,
			            compounds.compound_id || ' <= ' || a.custom_field_value || ' (' || a.human_name || ')' as label
			        from
			            (
			                select 
			                    custom_foreign_key_field.id ,
			                    custom_fields.name,
			                    custom_foreign_key_field.custom_field_value,
			                    custom_foreign_key_field.entity_id,
			                    custom_fields.human_name
			                from 
			                    custom_foreign_key_field,
			                    custom_fields
			                where
			                    upper(custom_foreign_key_field.custom_field_value) like '%' || upper($1) || '%' and
			                    custom_foreign_key_field.custom_field_id = custom_fields.id and
			                    custom_fields.searchable = true 
			            ) a join 
			            compounds on (compounds.id = a.entity_id) join
			            projects on (compounds.project_id = projects.id) join
			            user_to_project on (user_to_project.project_id = projects.id)  join
			            users on (user_to_project.user_id = users.id) and
			        	compounds.archived_transaction_id is null
			        
			        where
			            projects.project_name = $3 and
			            users.username = $2
			        limit 20)
			)  a
			
			order by compound_id, custom_field_value, custom_field_name
			limit 20
		''')

		self.fetch_uploads = self.conn.cursor()
		self.fetch_uploads.execute('''
			prepare fetch_uploads as
			select
				uuid,
				file_name,
				file_path
			from
				file_uploads a,
				compounds b
			where
				b.id = $1 and
				a.compound_id = b.id and
				b.archived_transaction_id is null
		''')

		self.fetch_prefix_codes_cur = self.conn.cursor()
		self.fetch_prefix_codes_cur.execute(''' 
			prepare fetch_prefix_codes as
			select
				id,
				prefix_code,
				description
			from
				compound_prefixes
		''')

		self.fetch_prefix_cur = self.conn.cursor()
		self.fetch_prefix_cur.execute(''' 
			prepare fetch_prefix as
			select
				id,
				prefix_code,
				description
			from
				compound_prefixes
			where prefix_code = $1
		''')
		
		self.fetch_compound_cur = self.conn.cursor()
		self.fetch_compound_cur.execute(''' 
			prepare fetch_compound as
			select
				a.id,
				b.project_name,
				compound_id,
				c.username,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable
			from
				compounds a,
				projects b,
				users c
			where
				a.id = $1 and
				a.project_id = b.id and
				a.user_id = c.id and
				a.archived_transaction_id is null
		''')

		self.fetch_salts_cur = self.conn.cursor()
		self.fetch_salts_cur.execute('''
			prepare fetch_salts as
			select
				salt_code,
				salt_mol,
				salt_description
			from
				compound_salts
		''')

		self.fetch_last_salt_code = self.conn.cursor()
		self.fetch_last_salt_code.execute(''' 
			prepare fetch_last_salt_code as
			select
				salt_code
			from
				compound_salts
			order by salt_code DESC
		''')
		
		self.fetch_entity_pkey = self.conn.cursor()
		self.fetch_entity_pkey.execute(''' 
			prepare fetch_entity_pkey as
			select
				id
			from
				compounds
			where
				compound_id = $1 and
				archived_transaction_id is null
		''')
		
		self.fetch_new_compounds_cur = self.conn.cursor()
		self.fetch_new_compounds_cur.execute('''
			prepare fetch_new_compounds as 
			select
				compound_id,
				b.username,
				a.id,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable,
				a.insert_transaction_id,
				e.project_name
			from
				compounds a,
				users b,
				projects e
			where
				b.id = a.user_id and				
				a.insert_transaction_id > $1 and
				e.id = a.project_id and archived_transaction_id is  null and
				e.project_name =ANY ($2)  
			order by insert_transaction_id, compound_id
		''')
		
		self.fetch_updated_compounds_cur = self.conn.cursor()
		self.fetch_updated_compounds_cur.execute('''
			prepare fetch_updated_compounds as 
			select
				compound_id,
				b.username,
				a.id,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable,
				a.update_transaction_id,
				e.project_name				
			from
				compounds a,
				users b,
				projects e
			where
				b.id = a.user_id and
				a.update_transaction_id > $1 and
				e.id = a.project_id and  archived_transaction_id is  null and
				e.project_name =ANY($2)
			order by update_transaction_id, compound_id
		''')
		
		self.fetch_archived_compounds_cur = self.conn.cursor()
		self.fetch_archived_compounds_cur.execute('''
			prepare fetch_archived_compounds as 
			select
				compound_id,
				b.username,
				a.id,
				--to_char(a.date_record_created, 'Day DD Month YYYY HH:MM:SS'),
				extract('epoch' from date_record_created),
				a.batchable,
				a.archived_transaction_id,
				e.project_name
			from
				compounds a,
				users b,
				projects e
			where
				b.id = a.user_id and
				a.archived_transaction_id > $1 and
				e.id = a.project_id and
				e.project_name = ANY ($2)
			order by archived_transaction_id, compound_id
		''')
		
	def generate_custom_field_selects(self):
		self.custom_field_cursors = {}
		
		field_types = self.auth_manager.get_custom_field_types()
		for field in field_types:
			field_type = field['type_name']
			table_name = field['table_name']
			
			self.custom_field_cursors[field_type] = self.conn.cursor()
			self.custom_field_cursors[field_type].execute("prepare select_custom_field_" + field_type + "_values as select b.name, custom_field_value as field_name from " + table_name + ''' a, 
					custom_fields b,
					compounds c
				where
					a.custom_field_id = b.id and
					c.id = $1 and
					a.entity_id = c.id and
					c.archived_transaction_id is null
			''')
			
	def generate_custom_field_update_selects(self):
		self.custom_field_update_select_cursors = {'inserts':{}, 'updates':{}, 'archives': {}}
		
		field_types = self.auth_manager.get_custom_field_types()
		for field in field_types:
			field_type = field['type_name']
			table_name = field['table_name']
			
			self.custom_field_update_select_cursors['inserts'][field_type] = self.conn.cursor()
			self.custom_field_update_select_cursors['inserts'][field_type].execute(
				"prepare select_custom_field_" + field_type + "_inserted_values as " + 
				'''
				select 
						b.name, 
						custom_field_value
				from ''' + table_name + ''' a, 
						custom_fields b,
						compounds c
				where
						a.custom_field_id = b.id and
						c.id = $1 and
						a.entity_id = c.id and
						a.insert_transaction_id > $2
			''')
			
			self.custom_field_update_select_cursors['updates'][field_type] = self.conn.cursor()
			self.custom_field_update_select_cursors['updates'][field_type].execute(
				"prepare select_custom_field_" + field_type + "_updates_values as " + 
				'''
				select 
						b.name, 
						custom_field_value
				from ''' + table_name + ''' a, 
						custom_fields b,
						compounds c
				where
						a.custom_field_id = b.id and
						c.id = $1 and
						a.entity_id = c.id and
						a.update_transaction_id > $2
			''')
			
			self.custom_field_update_select_cursors['archives'][field_type] = self.conn.cursor()
			self.custom_field_update_select_cursors['archives'][field_type].execute(
				"prepare select_custom_field_" + field_type + "_archives_values as " + 
				'''
				select 
						b.name, 
						custom_field_value
				from ''' + table_name + ''' a, 
						custom_fields b,
						compounds c
				where
						a.custom_field_id = b.id and
						c.id = $1 and
						a.entity_id = c.id and
						a.archived_transaction_id > $2
			''')
			
	def get_entity(self, compound_pkey, minimal = True):
		self.fetch_compound_cur.execute("execute fetch_compound (%s)", (compound_pkey,))
		
		row = self.fetch_compound_cur.fetchone()
		
		if row is None:
			return None
		else:
			entity = {'id': row[0], 'project_name': row[1], 'compound_id': row[2], 'username': row[3],'date_record_created': row[4], 'batchable': row[5]}
			
			if not minimal:
				self.process_entity(entity)
				
			return entity 
		
	def get_entity_by_id(self, entity_id,  minimal = True):
		self.fetch_entity_pkey.execute('execute fetch_entity_pkey (%s)', (entity_id,))
		
		row = self.fetch_entity_pkey.fetchone()
		
		if row is not None:
			return self.get_entity(row[0], minimal)
		else:
			return None
		
	def get_salts(self):
		salts = []
		self.fetch_salts_cur.execute("execute fetch_salts")
	
		for row in self.fetch_salts_cur.fetchall():
			salt_str = row[1]
			salt_bytes = codecs.decode(salt_str.encode('utf8'), 'base64')
			salt_mol = pickle.loads(salt_bytes)
			salts.append({'salt_code': row[0], 'salt_mol': salt_mol, 'salt_description': row[2]})

		return salts
	
	def get_project_salts(self, project_name, username):
		salt_project = self.auth_manager.get_salt_field(project_name)
		
		salt_objs = self.fetch_project_set(0,100000000000000, username, salt_project)
		
		salts = []
		
		for salt_obj in salt_objs:
			if salt_obj['mol'] is None or salt_obj['mol'] == '':
				continue 
			
			salt_mol = Chem.MolFromSmarts(salt_obj['smarts'])
			salts.append({'salt_code': salt_obj['compound_id'], 'salt_mol': salt_mol, 'salt_description': salt_obj['description']})
			
		return salts

	def get_last_salt_code(self):
		self.fetch_last_salt_code.execute('execute fetch_last_salt_code')

		return self.fetch_last_salt_code.fetchone()


	def is_prefix(self, prefix_code):
		self.fetch_prefix_cur.execute("execute fetch_prefix (%s)", (prefix_code,))

		return False if self.fetch_prefix_cur.fetchone() is None else True

	def get_prefixes(self):
		self.fetch_prefix_codes_cur.execute("execute fetch_prefix_codes")
		
		prefixes = []	
		for row in self.fetch_prefix_codes_cur.fetchall():
			prefixes.append({'id': row[0], 'prefix_code': row[1], 'description':row[2]})

		return prefixes


	def get_file_uploads(self, id):
		file_uploads = []

		self.fetch_uploads.execute("execute fetch_uploads (%s)", (id,))

		for row in self.fetch_uploads.fetchall():
			file_uploads.append({'uuid': row[0], 'file_name': row[1], 'file_path':row[2]})
		return file_uploads
	
	def append_custom_fields(self, id, obj):
		for field_type in self.custom_field_cursors.keys():
			cur = self.custom_field_cursors[field_type]
			cur.execute("execute select_custom_field_" + field_type + "_values (%s)", (id,))
			
			for row in cur.fetchall():
				obj[row[0]] = row[1]

	def fetch_upload_set_count(self, upload_id, username):
		self.fetch_upload_set_count_cur.execute('''
			execute fetch_upload_set_count (%s)
		''', (upload_id,))
		
		row = self.fetch_upload_set_count_cur.fetchone()

		if row is not None:
			return row[0]

	def fetch_upload_set(self, upload_id, from_row, to_row, username):
		self.fetch_upload_set_cur.execute('''
			execute fetch_upload_set (%s,%s,%s)
		''', (upload_id,to_row - from_row + 1,from_row))
		
		rows = self.fetch_upload_set_cur.fetchall()

		upload_set = []

		return self.process_results(rows, None)
	
	def fetch_exact_set_count(self, ids, username, project_name):
		if self.strip_salts:
			new_ids = []
			
			for id in ids:
				new_ids.append(id + '%')
			
			self.fetch_exact_set_left_count_cur.execute('''
				execute fetch_exact_set_left_count (%s, %s)
			''', (new_ids, project_name))
			
			row = self.fetch_exact_set_left_count_cur.fetchone()
		else:		
			self.fetch_exact_set_count_cur.execute('''
				execute fetch_exact_set_count (%s, %s)
			''', (ids, project_name))
		
			row = self.fetch_exact_set_count_cur.fetchone()

		if row is not None:
			return row[0]

	def fetch_exact_set(self, ids, from_row, to_row, username, project_name):
		if self.strip_salts:
			new_ids = []
			
			for id in ids:
				new_ids.append(id + '%')
				
			
				
			self.fetch_exact_set_left_cur.execute('''
				execute fetch_exact_set_left (%s,%s,%s, %s)
			''', (new_ids,to_row - from_row + 1,from_row, project_name))
			
			rows = self.fetch_exact_set_left_cur.fetchall()
		else:
			self.fetch_exact_set_cur.execute('''
				execute fetch_exact_set (%s,%s,%s, %s)
			''', (ids,to_row - from_row + 1,from_row, project_name))
			
			rows = self.fetch_exact_set_cur.fetchall()

		upload_set = []

		return self.process_results(rows, None)
	
	def get_sdf(self, objs, out_directory, project_name, tz):
		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.sdf', dir=out_directory)

		writer = SDWriter(tmp_file.name)
		
		custom_fields = self.auth_manager.get_custom_fields(project_name)
		project_configuration = self.auth_manager.get_project_configuration(project_name)
		
		fields = []
		field_names = ['compound_id', 'username', 'date_record_created', 'batchable']
		field_name_to_human_name = {'compound_id': project_configuration['entity_name'], 'mol_image':'Structure', 'batchable': 'Batchable ID', 'username': 'Record Creator', 'date_record_created': 'Date Record Created','batchable':'Batchable'}
		
		for field_name in custom_fields.keys():
			if custom_fields[field_name]['visible']:
				fields.append(custom_fields)
				field_names.append(custom_fields[field_name]['field_name'])
				field_name_to_human_name[custom_fields[field_name]['field_name']]= custom_fields[field_name]['human_name']
		
		tz = dateutil.tz.gettz(tz)
		
		for obj in objs:
			if 'compound_sdf' in obj:
				mol = Chem.MolFromMolBlock(obj['compound_sdf'])
			else:
				mol = Chem.MolFromSmiles('')
			
			for field in field_names:
				if '_sdf' in field:
					continue
				
				if obj[field] is None:
					value = ''
				else:				
					value = str(obj[field])
				
				if field == 'date_record_created':
					created = datetime.datetime.fromtimestamp(float(value), pytz.utc)
					local = created.astimezone(tz)
					value = local.strftime('%Y-%m-%d %H:%M:%S')
					
							
				mol.SetProp(field_name_to_human_name[field], value)
		
			writer.write(mol)
		
		writer.close()
		tmp_file.close()

		return tmp_file.name
	
	def get_excel(self, objs, out_directory, project_name, tz):
		if 'svg2png' not in sys.modules:
			from cairosvg import svg2png
			
		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx', dir=out_directory)

		workbook = xlsxwriter.Workbook(tmp_file.name, {'remove_timezone': True})
		sheet = workbook.add_worksheet()
		
		headings_format = workbook.add_format({'bold': True, 'font_color': 'white', 'align': 'center', 'bg_color': 'black'})
		standard_text_format = workbook.add_format({'bold': False, 'font_color': 'black', 'align': 'vcenter'})
		standard_text_format.set_align('center')
		
		standard_text_format_left = workbook.add_format({'bold': False, 'font_color': 'black', 'align': 'vcenter'})
		standard_text_format_left.set_align('left')
		
		date_format = workbook.add_format({'num_format': 'yyyy-mm-dd','bold': False, 'font_color': 'black', 'align': 'vcenter'})
		date_format.set_align('center')
		custom_fields = self.auth_manager.get_custom_fields(project_name)
		project_configuration = self.auth_manager.get_project_configuration(project_name)
		
		fields = []
		
		if project_configuration['enable_structure_field']:
			field_names = ['compound_id', 'mol_image', 'batchable']
			field_name_to_human_name = {'compound_id': project_configuration['entity_name'], 'mol_image':'Structure', 'batchable': 'Batchable ID'}
		else:
			field_names = ['compound_id']
			field_name_to_human_name = {'compound_id': project_configuration['entity_name']}
		
		for field_name in custom_fields.keys():
			if custom_fields[field_name]['visible']:
				fields.append(custom_fields)
				field_names.append(custom_fields[field_name]['field_name'])
				field_name_to_human_name[custom_fields[field_name]['field_name']]= custom_fields[field_name]['human_name']
		
		field_names += ['username', 'date_record_created']
		field_name_to_human_name['username'] = 'Record Creator'
		field_name_to_human_name['date_record_created'] = 'Date Record Created'
		
		col_i = 0
		
		for field in field_names:
			if '_sdf' in field:
					continue
					
			sheet.write(0, col_i, field_name_to_human_name[field], headings_format)
			
			if field == 'mol_image':
				sheet.set_column(col_i, col_i, 200 )
			else:
				sheet.set_column(col_i, col_i, 30)
			
			col_i +=  1
			
		if project_configuration['enable_structure_field']:
			sheet.set_column(1,1, 40)

		row_i = 1
		
		tz = dateutil.tz.gettz(tz)
		
		sheet.freeze_panes(0, 2)
		
		for obj in objs:
			col_i = 0
			
			inserted_image = False
			
			for field in field_names:
				if '_sdf' in field:
					continue
				
				format = standard_text_format
				
				if field not in obj:
					sheet.write(row_i, col_i, '', format)
					
					col_i += 1
					continue
							
				value =  obj[field]
				
				if field == 'date_record_created':
					created = datetime.datetime.fromtimestamp(value, pytz.utc)
					local = created.astimezone(tz)
					#value = local.strftime('%Y-%m-%d %H:%M:%S')
					value = local
					
					format = date_format 
				
				if type(value) is list:
					value = ''
				
				if field == 'mol_image':
					tmp_file2 = tempfile.NamedTemporaryFile(delete=False, suffix='.png', dir=out_directory)
					
					lines = value.split('\n')
					lines.pop(0)
					
					if len(lines) != 0:											
						svg2png(bytestring='\n'.join(lines),write_to=tmp_file2.name)
						
						tmp_file2.close()
						
					sheet.write(row_i, col_i, '', format)
					
					if len(lines) != 0:			
						sheet.insert_image(row_i, col_i, tmp_file2.name, {'x_offset':10})
						
						inserted_image = True
				else:	
					if value == None:
						value = ' '
						
					if field != 'date_record_created' and len(str(value)) > 30:
						format = standard_text_format_left
					
					sheet.write(row_i, col_i, value, format)
					
				col_i += 1
				
			if project_configuration['enable_structure_field'] and inserted_image:
				sheet.set_row(row_i, 200 )

			row_i += 1
			
		sheet.autofilter(0, 0, len(field_names), len(field_names) - 1)
		
		workbook.close()			
		tmp_file.close()

		return tmp_file.name

	def export_excel_upload_set(self, upload_id, out_directory,username):
		self.fetch_upload_set_cur.execute('''
			execute fetch_upload_set (%s,%s,%s,%s)
		''', (upload_id,100000000000,0,username))
		
		rows = self.fetch_upload_set_cur.fetchall()

		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx', dir=out_directory)

		workbook = xlsxwriter.Workbook(tmp_file.name)
		sheet = workbook.add_worksheet()
		
		#TODO: Implement
		project_name = self.fetch_project_for_upload_set(upload_id)
		
		custom_fields = self.auth_manager.get_custom_fields(project_name)
		custom_fields_list = [custom_fields[x] for x in custom_fields.keys()]
		
		custom_fields_list.sort(key=lambda x:x.order)
		
		col_i = 0
		
		for field in custom_fields_list:
			sheet.write(0, col_i, field.human_name)

		row_i = 1

		for row in rows:
			ctab_content = row[1]

			mol = Chem.MolFromMolBlock(ctab_content)

			col_i += 0
			
			obj = {'compound_id': row[0], 'salted_sdf': row[1], 'supplier': row[2], 'supplier_id':row[3], 'username': row[4]}
			
			self.append_custom_fields(row[2], obj)
			
			for field in custom_fields_list:
				sheet.write(row_i, col_i, obj[field['field_name']])
				
				col_i += 1

			row_i += 1
		
		
		workbook.close()
		tmp_file.close()

		return tmp_file.name
	
	def ctab_to_desalted_ctab(self, ctab):
		mol = Chem.MolFromMolBlock(ctab)

		cleaner = SaltRemover()
		desalted_mol = cleaner.StripMol(mol)

		desalted_mol_block = Chem.MolToMolBlock(desalted_mol)
		
		return desalted_mol_block


	def fetch_ctab_set_count(self, ctab, username, terms, project):
		desalted_mol_block = self.ctab_to_desalted_ctab(ctab)
		
		any_terms = []
		for term in terms:
			if term == None or term == '':
				continue
				#term = 'k$FgAa8bx<.~#LkzcQ()SK['
			any_terms.append('%' + term.upper() + '%')
			
		mol = Chem.MolFromMolBlock(desalted_mol_block)
		
		if mol.GetNumAtoms() == 0:
			self.fetch_set_count_cur.execute('''
				execute fetch_set_count (%s,%s)
			''',(project, any_terms))
			
			row = self.fetch_set_count_cur.fetchone()
		else:
			smiles = Chem.MolToSmiles(mol)
			
			if len(terms) > 0:
				self.fetch_ctab_set_count_cur.execute('''
					execute fetch_ctab_set_count (%s,%s,%s)
				''',(smiles, project, any_terms))
				
				row = self.fetch_ctab_set_count_cur.fetchone()
			else:
				self.fetch_ctab_set_only_count_cur.execute('''
					execute fetch_ctab_set_only_count (%s,%s)
				''',(smiles, project))
				row = self.fetch_ctab_set_only_count_cur.fetchone()

		count = 0
		
		if row is not None:
			count = row[0]

		return count
		

	def fetch_ctab_set(self, ctab, from_row, to_row, username, terms, project):
		if ctab == '' or ctab is None:
			desalted_mol_block = ''
		else:
			desalted_mol_block = self.ctab_to_desalted_ctab(ctab)
			
		any_terms = []
		for term in terms:
			if term == None or term == '':
				continue
				
			any_terms.append('%' + term.upper() + '%')
			
		mol = Chem.MolFromMolBlock(desalted_mol_block)
		
		if mol is None or mol.GetNumAtoms() == 0:
			self.fetch_set_cur.execute('''
				execute fetch_set (%s, %s,%s,%s)
			''', (to_row - from_row + 1,from_row,  project, any_terms))
			
			rows = self.fetch_set_cur.fetchall()
	
			return self.process_results(rows, ctab)
		else:
			smiles = Chem.MolToSmiles(mol)
			
			if len(terms) > 0:
				self.fetch_ctab_set_cur.execute('''
					execute fetch_ctab_set (%s,%s, %s,%s,%s)
				''', (smiles,to_row - from_row + 1,from_row, project, any_terms))
				
				rows = self.fetch_ctab_set_cur.fetchall()
			else:
				self.fetch_ctab_set_only_cur.execute('''
					execute fetch_ctab_set_only (%s,%s, %s,%s)
				''', (smiles,to_row - from_row + 1,from_row, project))
				
				rows = self.fetch_ctab_set_only_cur.fetchall()
	
			return self.process_results(rows, ctab)
	
	def fetch_project_set_count(self, username, project):
		self.fetch_project_set_count_cur.execute('''
			execute fetch_project_set_count (%s)
		''',( project,))
		
		row = self.fetch_project_set_count_cur.fetchone()

		if row is not None:
			return row[0]

	def fetch_project_set(self, from_row, to_row, username, project):
		self.fetch_project_set_cur.execute('''
			execute fetch_project_set (%s,%s,%s)
		''', (project, to_row - from_row + 1, from_row))
		
		rows = self.fetch_project_set_cur.fetchall()

		return self.process_results(rows)
	
	def fetch_project_set_user_count(self, username, project):
		self.fetch_project_set_user_count_cur.execute('''
			execute fetch_project_set_user_count (%s,%s)
		''',(username, project))
		
		row = self.fetch_project_set_user_count_cur.fetchone()

		if row is not None:
			return row[0]

	def fetch_project_set_user(self, from_row, to_row, username, project):
		self.fetch_project_set_user_cur.execute('''
			execute fetch_project_set_user (%s,%s,%s,%s)
		''', (username,project, to_row - from_row + 1, from_row))
		
		rows = self.fetch_project_set_user_cur.fetchall()

		return self.process_results(rows)

	def process_results(self, rows, ctab = None):
		upload_set = []

		search_mol = None
		if ctab is not None:
			search_mol = Chem.MolFromMolBlock(ctab)
			
		upload_set = []

		for row in rows:	
			obj = {'compound_id': row[0],'username':row[1], 'id': row[2], 'date_record_created': row[3], 'batchable': row[4]}
			
			self.process_entity(obj, search_mol)
			
			upload_set.append(obj)
			
		return upload_set
			
	def process_entity(self, obj, search_mol = None):
			obj['attachments'] = self.get_file_uploads(obj['id'])
			
			self.append_custom_fields(obj['id'], obj)
			
			if self.strip_salts and len(obj['compound_id']) == 11:
				obj['_compound_id'] = obj['compound_id']
				obj['compound_id'] = obj['compound_id'][0:9]
			
			if 'salted_sdf' in obj and obj['salted_sdf'] is not None:		
				mol = Chem.MolFromInchi(obj['salted_inchi'])
			
				matching_atoms = None
				if search_mol is not None:
					matching_atoms = mol.GetSubstructMatch(search_mol)
	
				tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.svg')
				tmp_file.close()
	
				if mol is not None:
					try:
						AllChem.Compute2DCoords(mol, clearConfs = True, canonOrient  = True)
					except:
						pass
					
					if search_mol is not None and len(matching_atoms) > 0:
						Draw.MolToFile(mol,tmp_file.name,size=(200,200),highlightAtoms=matching_atoms )
					else:
						Draw.MolToFile(mol,tmp_file.name,size=(200,200))	
		
				content = ''
				with open(tmp_file.name, 'r') as f:
					content = f.read()
			
				content = re.sub('glyph',hashlib.md5(obj['salted_sdf'].encode()).hexdigest(),content)
	
				os.unlink(tmp_file.name)
				
				obj['compound_sdf'] = obj['salted_sdf']
				obj['mol_image'] = content

	def get_ctab_as_svg(self, ctab_content):
		mol = Chem.MolFromMolBlock(ctab_content)
		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.svg')
		tmp_file.close()

		Draw.MolToFile(mol,tmp_file.name,size=(200,200))

		content = ''
		with open(tmp_file.name, 'r') as f:
			content = f.read()

		content = re.sub('glyph',hashlib.md5(ctab_content.encode()).hexdigest(),content)
			
		os.unlink(tmp_file.name)

		return content

	def export_sdf_ctab_set(self, ctab, out_directory, username):
		desalted_mol_block = self.ctab_to_desalted_ctab(ctab)
		
		mol = Chem.MolFromMolBlock(desalted_mol_block)
		
		smiles = Chem.MolToSmiles(mol)

		self.fetch_ctab_set_cur.execute('''
			execute fetch_ctab_set (%s,%s,%s,%s)
		''', (smiles,10000000000,0, username))
		
		rows = self.fetch_ctab_set_cur.fetchall()
		return self.export_set_to_sdf(rows,out_directory)

	def export_set_to_sdf(self, rows, out_directory):
		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.sdf', dir=out_directory)

		writer = SDWriter(tmp_file.name)

		for row in rows:
			ctab_content = row[1]

			mol = Chem.MolFromMolBlock(ctab_content)

			mol.SetProp('Compound ID', row[0])
			mol.SetProp('SupplierName', row[2])
			mol.SetProp('SupplierID', row[3])
			mol.SetProp('User', row[4])
		
			writer.write(mol)

		writer.close()
		tmp_file.close()

		return tmp_file.name

	def export_excel_ctab_set(self, ctab, out_directory, username):
		desalted_mol_block = self.ctab_to_desalted_ctab(ctab)
		
		mol = Chem.MolFromMolBlock(desalted_mol_block)
		
		smiles = Chem.MolToSmiles(mol)

		self.fetch_ctab_set_cur.execute('''
			execute fetch_ctab_set (%s,%s,%s,%s)
		''', (smiles,10000000000,0,username))
		
		rows = self.fetch_ctab_set_cur.fetchall()

		return self.export_set_to_excel(rows, out_directory)

	def export_set_to_excel(self, rows, out_directory):

		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx', dir=out_directory)

		workbook = xlsxwriter.Workbook(tmp_file.name)
		sheet = workbook.add_worksheet()

		sheet.write(0,0, 'Compound ID')
		sheet.write(0,1, 'Supplier')
		sheet.write(0,2, 'Supplier ID')
		sheet.write(0,3, 'User')

		row_i = 1

		for row in rows:
			ctab_content = row[1]

			mol = Chem.MolFromMolBlock(ctab_content)

			sheet.write(row_i, 0, row[0])
			sheet.write(row_i, 1, row[2])
			sheet.write(row_i, 2, row[3])
			sheet.write(row_i, 3, row[4])

			row_i += 1
		
		workbook.close()
		tmp_file.close()

		return tmp_file.name

	def fetch_terms(self, term, username, project):
		terms = []
		self.fetch_terms_cur.execute("execute fetch_terms (%s, %s, %s)",(term, username, project))
		for row in self.fetch_terms_cur.fetchall():
			terms.append({'entity_id': row[0],'custom_field_value': row[1], 'custom_field_name': row[2], 'label': row[3]})
		return terms
	
	def generate_update_instructions(self, username, project_name, transaction_id, out_directory, no_records):		
		tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.log', dir=out_directory)
		tmp_file.write('{\n'.encode('utf-8'))
		
		self._append_insert_instructions(tmp_file, username, project_name, transaction_id, no_records)
		
		tmp_file.write(','.encode('utf-8'))
		
		self._append_update_instructions(tmp_file, username, project_name, transaction_id, no_records)
		
		tmp_file.write(','.encode('utf-8'))
		
		self._append_archived_instructions(tmp_file, username, project_name, transaction_id, no_records)
			
		tmp_file.write('}\n'.encode('utf-8'))	
		tmp_file.close()
		
		return tmp_file.name

	def _append_insert_instructions(self, tmp_file, username, project_name, transaction_id, no_records):
		tmp_file.write('\t"inserts":[\n'.encode('utf-8'))
		
		is_first = True
		
		cache_str = ''
		
		i = 0
		
		records = 0
		
		self.fetch_new_compounds_cur.execute('execute fetch_new_compounds (%s, %s)', (transaction_id, project_name))
		for row in self.fetch_new_compounds_cur.fetchall():
			if not is_first:
				cache_str += ',\n'
				
			obj = {'id': row[2], 'compound_id': row[0], 'username': row[1], 'date_record_created': row[3], 'transaction_id': row[5], 'project': row[6]}	
			
			if self.strip_salts and len(obj['compound_id']) == 11:
				obj['_compound_id'] = obj['compound_id']
				obj['compound_id'] = obj['compound_id'][0:9]
			
			for field_type in self.custom_field_update_select_cursors['inserts'].keys():
				self.custom_field_update_select_cursors['inserts'][field_type].execute(
					"execute select_custom_field_" + field_type + "_inserted_values (%s,%s)", (obj['id'], transaction_id))
				
				for cf_row in self.custom_field_update_select_cursors['inserts'][field_type].fetchall():
					obj[cf_row[0]] = cf_row[1]
					
			cache_str += '\t\t' + json.dumps(obj, ensure_ascii = False)
			
			i += 1
			
			if i % 500 == 0:	
				i=0
				tmp_file.write(cache_str.encode('utf-8'))
				cache_str = ''
				
			records += 1
			
			if no_records is not None and no_records != -1 and records == no_records:
				tmp_file.write(cache_str.encode('utf-8'))
				cache_str = ''
				
				break
			
			is_first = False
			
		tmp_file.write(cache_str.encode('utf-8'))
		tmp_file.write('\n\t]\n'.encode('utf-8'))
	
	def _append_update_instructions(self, tmp_file, username, project_name, transaction_id, no_records):
		tmp_file.write('\t"updates":[\n'.encode('utf-8'))
		
		is_first = True
		
		cache_str = ''
		
		i = 0
		
		records = 0
		
		self.fetch_updated_compounds_cur.execute('execute fetch_updated_compounds (%s, %s)', (transaction_id, project_name))
		for row in self.fetch_updated_compounds_cur.fetchall():
			if not is_first:
				cache_str += ',\n'
				
			obj = {'id': row[2], 'compound_id': row[0], 'username': row[1], 'date_record_created': row[3], 'transaction_id': row[5], 'project': row[6]}
			
			if self.strip_salts and len(obj['compound_id']) == 11:
				obj['_compound_id'] = obj['compound_id']
				obj['compound_id'] = obj['compound_id'][0:9]
				
			for field_type in self.custom_field_update_select_cursors['updates'].keys():
				self.custom_field_update_select_cursors['updates'][field_type].execute(
					"execute select_custom_field_" + field_type + "_updates_values (%s,%s)", (obj['id'], transaction_id))
				
				for cf_row in self.custom_field_update_select_cursors['updates'][field_type].fetchall():
					obj[cf_row[0]] = cf_row[1]
				
			cache_str += '\t\t' + json.dumps(obj, ensure_ascii = False)
			
			i += 1
			
			if i % 500 == 0:	
				i=0
				tmp_file.write(cache_str.encode('utf-8'))
				cache_str = ''
				
			records += 1
			
			if no_records is not None and no_records != -1 and records == no_records:
				tmp_file.write(cache_str.encode('utf-8'))
				cache_str = ''
				break
			
			is_first = False
		
		tmp_file.write(cache_str.encode('utf-8'))
		tmp_file.write('\n\t]\n'.encode('utf-8'))
		
	def _append_archived_instructions(self, tmp_file, username, project_name, transaction_id, no_records):
		tmp_file.write('\t"archived":[\n'.encode('utf-8'))
		
		is_first = True
		
		cache_str = ''
		
		i = 0
		
		records = 0
		
		self.fetch_new_compounds_cur.execute('execute fetch_archived_compounds (%s, %s)', (transaction_id, project_name))
		for row in self.fetch_new_compounds_cur.fetchall():
			if not is_first:
				cache_str += ',\n'
				
			obj = {'id': row[2], 'compound_id': row[0], 'username': row[1], 'date_record_created': row[3], 'transaction_id': row[5], 'project': row[6]}	
			
			if self.strip_salts and len(obj['compound_id']) == 11:
				obj['_compound_id'] = obj['compound_id']
				obj['compound_id'] = obj['compound_id'][0:9]
			
			for field_type in self.custom_field_update_select_cursors['archives'].keys():
				self.custom_field_update_select_cursors['archives'][field_type].execute(
					"execute select_custom_field_" + field_type + "_archives_values (%s,%s)", (obj['id'], transaction_id))
				
				for cf_row in self.custom_field_update_select_cursors['archives'][field_type].fetchall():
					obj[cf_row[0]] = cf_row[1]
				
			cache_str += '\t\t' + json.dumps(obj, ensure_ascii = False)
			
			i += 1
			
			if i % 500 == 0:	
				i=0
				tmp_file.write(cache_str.encode('utf-8'))
				cache_str = ''
				
			records += 1
			
			if no_records is not None and no_records != -1 and records == no_records:
				tmp_file.write(cache_str.encode('utf-8'))
				cache_str = ''
				break
			
			is_first = False
			
		tmp_file.write(cache_str.encode('utf-8'))
		tmp_file.write('\n\t]\n'.encode('utf-8'))
		
	def store_fetch(self, obj, project_name, username):
		if '/Search History' in project_name or 'Upload' in project_name:
			return
		
		if self.record_fetch:
			search_history_project = project_name + '/Search History'
			
			if not self.auth_manager.is_project(search_history_project):
				return
			
			if self.auth_manager.crud_manager is None:
				from sdf_register import CompoundManager
				
				crud_manager = CompoundManager(self.conn, self.auth_manager)
			else:
				crud_manager = self.auth_manager.crud_manager
			
			time_delta = datetime.datetime.now() - self.start_time
			
			obj['search_time'] =  re.sub('\..+$','',str(time_delta))
			obj['compound_id'] = str(uuid.uuid4())
			obj['project_name'] = project_name
			
			changes = {-1:obj}
			
			objs = crud_manager.save_changes(username, changes, search_history_project, {
				'batchable':{'map_column': None, 'default_value': None},
				'compound_id':{'map_column': 'compound_id', 'default_value': None},
				'classification':{'map_column': None, 'default_value': None}
			})
			
			self.conn.commit()
			
	def configure_for_user(self, user, project):
		if type(project) is list:
			project = project[0]
		
		self.user = user
		self.project = project
		
		self.user_settings = self.fetch_project_set(0, 9999999, self.user, self.user + '/Settings')
		
		for obj in self.user_settings:
			if obj['compound_id'] == 'Hide_Salt_Suffixes_' + self.project and obj['project'] == self.project and obj['option'] == 'Yes':
				self.strip_salts = True
				
	def convert_smiles_to_ctab(self, smiles):
		mol = Chem.MolFromSmiles(smiles)
		
		try:
			AllChem.Compute2DCoords(mol, clearConfs = True, canonOrient  = True)
		except:
			pass
		
		return Chem.MolToMolBlock(mol)

if __name__ == '__main__':
	if len(sys.argv) < 2:
  		sys.exit('Invalid number of arguments provided')
	
	input_json_path = sys.argv[len(sys.argv)-2]
	output_json_path = sys.argv[len(sys.argv)-1]
	
	input_json = None
	
	contents = ''
	
	with open(input_json_path, 'r') as f:
		input_json = rapidjson.loads(f.read())
	
	manager = CompoundFetchManager()

	upload_set = None

	output_json = {}
	
	user = None
	project = None
	
	if '_username' in input_json:
		user = input_json['_username']
		
	if 'project' in input_json:
		project = input_json['project']
		
	if user is not None and project is not None:
		manager.configure_for_user(user, project)
		
	safe = True	
		
	if 'project' in input_json:
		if type(input_json['project']) is list:
			for project in input_json['project']:
				if not manager.auth_manager.has_project(input_json['_username'], project):
					safe = False
		else:
			if not manager.auth_manager.has_project(input_json['_username'], input_json['project']):
				safe = False
	elif 'project_name' in input_json:
		if not manager.auth_manager.has_project(input_json['_username'], input_json['project_name']):
			safe = False
			
	if 'project' in input_json and not 'project_name' in input_json:
		input_json['project_name'] = input_json['project']
		
	if safe:
		if 'find_terms' in input_json:
				if input_json['find_terms'] == '':
					output_json['terms'] = []
				else:
					#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
					terms = manager.fetch_terms(input_json['find_terms'], input_json['_username'], input_json['project'])
					output_json['entities'] = terms
		elif 'action' in input_json:
				if input_json['action'] == 'search':
					if input_json['task'] == 'fetch':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						upload_set = manager.fetch_ctab_set(input_json['ctab_content'], input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['search_terms'], input_json['project'])
						output_json['upload_set'] = upload_set
					elif input_json['task'] == 'count':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						count = manager.fetch_ctab_set_count(input_json['ctab_content'], input_json['_username'], input_json['search_terms'], input_json['project'])
						output_json['count'] = count
					elif input_json['task'] == 'export_sdf':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						objs = manager.fetch_ctab_set(input_json['ctab_content'], input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['search_terms'], input_json['project'])
						sdf_file = manager.get_sdf(objs,  input_json['out_file'],  input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(sdf_file)
					elif input_json['task'] == 'export_excel':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						objs = manager.fetch_ctab_set(input_json['ctab_content'], input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['search_terms'], input_json['project'])
						excel_file = manager.get_excel(objs,  input_json['out_file'],  input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(excel_file)
				elif input_json['action'] == 'search_all':
					if input_json['task'] == 'fetch':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						upload_set = manager.fetch_project_set(input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['project'])
						output_json['upload_set'] = upload_set
					elif input_json['task'] == 'count':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						count = manager.fetch_project_set_count(input_json['_username'], input_json['project'])
						output_json['count'] = count
					elif input_json['task'] == 'export_sdf':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						upload_set = manager.fetch_project_set(input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['project'])
						sdf_file = manager.get_sdf(upload_set,  input_json['out_file'],  input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(sdf_file)
					elif input_json['task'] == 'export_excel':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						upload_set = manager.fetch_project_set(input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['project'])
						excel_file = manager.get_excel(upload_set,  input_json['out_file'],  input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(excel_file)
				elif input_json['action'] == 'search_user_all':
					if input_json['task'] == 'fetch':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						upload_set = manager.fetch_project_set_user(input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['project'])
						output_json['upload_set'] = upload_set
					elif input_json['task'] == 'count':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						count = manager.fetch_project_set_user_count(input_json['_username'], input_json['project'])
						output_json['count'] = count
					elif input_json['task'] == 'export_sdf':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						upload_set = manager.fetch_project_set_user(input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['project'])
						sdf_file = manager.get_sdf(upload_set,  input_json['out_file'],  input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(sdf_file)
					elif input_json['task'] == 'export_excel':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						upload_set = manager.fetch_project_set_user(input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['project'])
						excel_file = manager.get_excel(upload_set,  input_json['out_file'],  input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(excel_file)
				elif input_json['action'] == 'as_svg':
					#PROTECTION: no _username is provided to this call as this function only returns an SVG of the supplied ctab.
					#            NodeJS protects this function from unauthenticated users
					svg_content = manager.get_ctab_as_svg(input_json['ctab_content'])
					output_json['svg_content'] = svg_content
				elif input_json['action'] == 'fetch_prefixes':
					#PROTECTION: no _username is provided to this function as the list of prefixes is currently not project specific.
					#	     NodeJS protects this function from unathenticated users
					output_json['prefixes'] = manager.get_prefixes()
				elif input_json['action'] == 'fetch_upload':
					#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
					if input_json['task'] == 'fetch':
						upload_set = manager.fetch_upload_set(input_json['upload_id'], input_json['from_row'], input_json['to_row'], input_json['_username'])
						output_json['upload_set'] = upload_set
					elif input_json['task'] == 'count':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						count = manager.fetch_upload_set_count(input_json['upload_id'], input_json['_username'])
						output_json['count'] = count
					elif input_json['task'] == 'export_sdf':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						objs = manager.fetch_upload_set(input_json['upload_id'], input_json['from_row'],input_json['to_row'], input_json['_username'])
						sdf_file = manager.get_sdf(objs,  input_json['out_file'], input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(sdf_file)
					elif input_json['task'] == 'export_excel':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						objs = manager.fetch_upload_set(input_json['upload_id'], input_json['from_row'],input_json['to_row'], input_json['_username'])
						excel_file = manager.get_excel(objs,  input_json['out_file'],  input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(excel_file)
				elif input_json['action'] == 'fetch_exact':
					#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
					if input_json['task'] == 'fetch':
						upload_set = manager.fetch_exact_set(input_json['ids'], input_json['from_row'], input_json['to_row'], input_json['_username'], input_json['project_name'])
						output_json['upload_set'] = upload_set
					elif input_json['task'] == 'count':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						count = manager.fetch_exact_set_count(input_json['ids'], input_json['_username'], input_json['project_name'])
						output_json['count'] = count
					elif input_json['task'] == 'export_sdf':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						objs = manager.fetch_exact_set_count(input_json['ids'], input_json['from_row'],input_json['to_row'], input_json['_username'], input_json['project_name'])
						sdf_file = manager.get_sdf(objs,  input_json['out_file'], input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(sdf_file)
					elif input_json['task'] == 'export_excel':
						#PROTECTION: _username is filled in with the real username by NodeJS and can't be faked by the client. _username is used in all select statements
						objs = manager.fetch_exact_set_count(input_json['ids'], input_json['from_row'],input_json['to_row'], input_json['_username'], input_json['project_name'])
						excel_file = manager.get_excel(objs,  input_json['out_file'],  input_json['project'], input_json['tz'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(excel_file)
				elif input_json['action'] == 'update_instructions':
					if input_json['task'] == 'generate_update_instruction_file':
						log_file  = manager.generate_update_instructions(input_json['_username'], input_json['project'], input_json['since_transaction_id'],input_json['out_file'], input_json['no_records'])
						output_json['out_file'] = input_json['out_file'] + '/' + os.path.basename(log_file)
				elif input_json['action'] == 'convert_smiles_to_ctab':
					output_json['ctab_content'] = manager.convert_smiles_to_ctab(input_json['smiles'])
					
		if (('forget_search' in input_json and not input_json['forget_search']) or 'forget_search' not in input_json ) and 'task' in input_json and input_json['task'] == 'count':
			obj = {
				'terms': None,
				'compound_sdf': None,
				'description':'',
				'json': json.dumps(input_json),
				'result_count': None,
				'upload_upload_id': None
			}
			
			if 'ctab_content' in input_json:
				obj['compound_sdf'] = input_json['ctab_content']
				
			id_field = None	
			
			if 'search_terms' in input_json:
				id_field = 'search_terms'
			elif 'ids' in input_json:
				id_field = 'ids'
				
			if id_field is not None:
				search_terms = input_json[id_field]
				
				if search_terms is not None:			
					any_terms = []
					for term in search_terms:
						if term == None or term == '':
							continue
							#term = 'k$FgAa8bx<.~#LkzcQ()SK['
						any_terms.append(term)
						
					search_terms = any_terms
				
				obj['terms'] = ' '.join(input_json[id_field])
				
			if 'upload_id' in input_json:
				obj['upload_upload_id'] = input_json['upload_id']
				
			if 'count' in output_json:
				obj['result_count'] = output_json['count']
			else:
				obj['result_count'] = 0
			
			manager.store_fetch(obj, input_json['project'], input_json['_username'])
			
		if 'store_id' in input_json and 'task' in input_json and input_json['task'] in ('export_sdf', 'export_excel'):
			store_id = input_json['store_id']
			
			search_project = input_json['project'] + '/Search History'
			
			manager.auth_manager.has_compound_permission(input_json['_username'], store_id)
			
			if manager.auth_manager.crud_manager is None:
				from sdf_register import CompoundManager
					
				crud_manager = CompoundManager(manager.conn, manager.auth_manager)
			else:
				crud_manager = manager.auth_manager.crud_manager
				
			extension = None
			if input_json['task'] == 'export_sdf':
				extension = '.sdf'
			if input_json['task'] == 'export_excel':
				extension = '.xlsx'
			
			file_name = 'Results_' + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + extension
			
			uuid = crud_manager.attach_file(input_json['_username'], store_id, output_json['out_file'], file_name)
			
			output_json['uuid'] = uuid
			output_json['file_name'] = file_name
	else:
		output_json['error'] = 'Invalid user action'

	with open(output_json_path, 'w') as fw:
    		fw.write(rapidjson.dumps(output_json))
    		
    		
    		
    		
    		:quit