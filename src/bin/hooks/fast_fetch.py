# ChemiReg - web-based compound registration platform
# Written in 2017 by David Damerell <david.damerell@sgc.ox.ac.uk>, Brian Marsden <brian.marsden@sgc.ox.ac.uk>
# 
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# lGPL
import psycopg2

# Core Python
import sys
import json

# ChemiReg CC0
from connection_manager import ConnectionManager

if __name__ == '__main__':
    if len(sys.argv) < 2:
          sys.exit('Invalid number of arguments provided')
    
    input_json_path = sys.argv[len(sys.argv)-2]
    output_json_path = sys.argv[len(sys.argv)-1]
    
    input_json = None
    
    with open(input_json_path, 'r') as f:
          input_json = json.load(f)
          
    upload_set = None

    output_json = {}
    
    if 'find_terms' in input_json:
            if input_json['find_terms'] == '' or len(input_json['find_terms']) == 1:
                output_json['terms'] = []
            else:
                conn = ConnectionManager.get_new_connection()
                conn.cursor().execute("set join_collapse_limit =1")
                terms = []
                
                safe = True
                
                project = input_json['project']
                
                cursor = conn.cursor()
                cursor.execute('''
                    select
                        projects.project_name
                    from
                        users,
                        user_to_project,
                        projects
                    where
                        users.username = %(username)s and
                        projects.project_name = %(project)s and
                        user_to_project.user_id = users.id and
                        user_to_project.project_id = projects.id
                        
                ''',{'username':input_json['_username'], 'project':input_json['project']})
                
                row = cursor.fetchone()
                
                if row is None:
                    safe = False
                
                if safe:
                    cursor = conn.cursor()
                    cursor.execute('''
                        select 
                            distinct a.compound_id,
                            custom_field_value,
                            custom_field_name,
                            label,
                            human_label,
                            user
                        from (
                            (select
                                compounds.compound_id as compound_id,
                                compounds.compound_id as custom_field_value,
                                'compound_id' as  custom_field_name,
                                compounds.compound_id || coalesce((
                                    select
                                         ' (description=>' || custom_field_value || ')'
                                    from
                                        custom_varchar_fields,
                                        custom_fields
                                    where
                                        custom_varchar_fields.entity_id = compounds.id and
                                        custom_fields.name = 'description' and
                                        custom_varchar_fields.custom_field_id = custom_fields.id
                                
                                ),'')  as label,
                                null as human_label,
                                users.username as user
                            from
                                compounds,
                                users,
                                projects
                            where
                                (upper(compounds.compound_id) like  '%%' || upper(%(value)s) || '%%' or compounds.user_id = any(select id from users where upper(username) like upper(%(value)s) || '%%')) and
                                projects.project_name = %(project)s and
                                compounds.project_id = projects.id and
                                compounds.user_id = users.id and 
                                compounds.archived_transaction_id is null
                            limit 20)
                            union
                                (select
                                    compounds.compound_id as compound_id,
                                    a.custom_field_value as custom_field_value,
                                    a.name as custom_field_name,
                                    compounds.compound_id || ' <= ' || a.custom_field_value || ' (' || a.human_name || ')' as label,
                                    a.human_name as human_name,
                                    users.username as user
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
                                            upper(custom_varchar_fields.custom_field_value) like '%%' || upper(%(value)s) || '%%' and
                                            custom_varchar_fields.custom_field_id = custom_fields.id and
                                            custom_fields.searchable = true 
                                    ) a join 
                                    compounds on (compounds.id = a.entity_id) join
                                    projects on (compounds.project_id = projects.id) join
                                    users on (compounds.user_id = users.id)
                                where
                                    projects.project_name = %(project)s and
                                    compounds.archived_transaction_id is null
                                limit 20)
                            union
                                (select
                                    compounds.compound_id as compound_id,
                                    a.custom_field_value as custom_field_value,
                                    a.name as custom_field_name,
                                    compounds.compound_id || ' <= ' || a.custom_field_value || ' (' || a.human_name || ')' as label,
                                     a.human_name as human_name,
                                    users.username as user
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
                                            upper(custom_foreign_key_field.custom_field_value) like '%%' || upper(%(value)s) || '%%' and
                                            custom_foreign_key_field.custom_field_id = custom_fields.id and
                                            custom_fields.searchable = true 
                                    ) a join 
                                    compounds on (compounds.id = a.entity_id) join
                                    projects on (compounds.project_id = projects.id) join
                                    users on (compounds.user_id = users.id) 
                                    
                                
                                where
                                    projects.project_name = %(project)s and
                                    compounds.archived_transaction_id is null
                                limit 20)
                        )  a
                        
                        order by compound_id, custom_field_value, custom_field_name
                        limit 60''',{'value':input_json['find_terms'], 'project':input_json['project']})
                    
                    for row in cursor.fetchall():
                        terms.append({'entity_id': row[0],'custom_field_value': row[1], 'custom_field_name': row[2], 'label': row[3]})
    
                    output_json['entities'] = terms
                
    with open(output_json_path, 'w') as fw:
            fw.write(json.dumps(output_json))