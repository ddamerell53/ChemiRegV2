create user chemireg with login password 'password';
create database chemireg;
grant all privileges on database chemireg to chemireg;

\c chemireg 

--CREATE EXTENSION pg_trgm;
create extension pg_bigm;
create extension btree_gin;
create extension rdkit;

\c chemireg chemireg


drop table if exists custom_varchar_fields;
drop table if exists custom_float_fields;
drop table if exists custom_int_fields;
drop table if exists compounds_idx;
drop table if exists custom_text_fields;
drop table if exists custom_foreign_key_field;
drop table if exists custom_bool_fields;

alter table if exists custom_fields drop constraint if exists custom_fields_custom_field_fk_id_fkey;

drop table if exists custom_fields;
drop table if exists custom_field_types;

drop table if exists file_uploads;
drop table if exists compounds;
drop table if exists suppliers;
drop table if exists compound_prefixes;
drop table if exists compound_salts;

drop table if exists user_to_project;
drop table if exists projects;
drop table if exists users;
drop table if exists compound_salts;

create sequence transaction_counter increment by 1 minvalue 1;
create sequence monotone_transaction_counter;



create table suppliers (
    id serial PRIMARY KEY,
    name varchar(4000)
);

alter table suppliers add constraint supplier_idx UNIQUE (name);

create table users (
    id serial primary key,
    first_name varchar(200),
    last_name varchar(200),
    email varchar(200),
    username varchar(200),
    password_hash varchar(2000),
    account_type varchar(200) default 'internal',
    reset_password_token varchar(200),
    reset_token_timestamp timestamp
);

alter table users add constraint users_idx UNIQUE (username);
create index users_idx2 on users (username);
create index users_idx3 on users (id);

create table projects (
    id serial primary key,
    project_name varchar(200),
    entity_name varchar(400),
   	enable_structure_field boolean default false,
    enable_attachment_field boolean default false,
    id_group_name varchar(400),
    enable_addition boolean default true
);


alter table projects add constraint project_idx UNIQUE (project_name);

insert into projects (project_name) values('Public');

create table user_to_project (
    id serial primary key,
    project_id int REFERENCES projects (id) on delete cascade,
    user_id int REFERENCES users (id) on delete cascade,
    default_project boolean,
    is_administrator boolean default false
);

alter table user_to_project add constraint useR_project_idx UNIQUE (project_id, user_id);

create table error_log (
	id SERIAL primary key,
	error_uuid char(55),
	error_description text
)

create table compounds (
  id SERIAL primary key,
  compound_id varchar(200),
  upload_id char(37),
  user_id int references users(id),
  project_id int references projects(id),
  manual_id varchar(20),
  batchable varchar(20),
  date_record_created timestamp default current_timestamp,
  insert_transaction_id bigint not null,
  update_transaction_id bigint,
  archived_transaction_id bigint,
  archived boolean default false
 
);

create unique index compounds_uidx1 on compounds(project_id,compound_id);
create index copounds_idx1 on compounds(compound_id);
create index copounds_idx2 on compounds(upper(compound_id));

--create index copounds_idx3 on compounds using gin (compound_id gin_trgm_ops);
--create index copounds_idx4 on compounds using gin (upper(compound_id) gin_trgm_ops);

create index copounds_idx3 on compounds using gin (compound_id gin_bigm_ops);
create index copounds_idx4 on compounds using gin (upper(compound_id) gin_bigm_ops);

create index compounds_id on compounds (id);
create index upload_id_idx on compounds (upload_id);
create index batchable_idx on compounds (batchable);
create index compounds_insert_transaction_id on compounds (insert_transaction_id);
create index compounds_update_transaction_id on compounds (update_transaction_id);
create index compounds_delete_transaction_id on compounds (archived_transaction_id);

create index compounds_users_idx on compounds(user_id);

create index compounds_composite_idx1 on compounds (project_id,archived_transaction_id);
create index compounds_composite_idx2 on compounds (compound_id, id, archived_transaction_id);
create index compounds_composite_idx6 on compounds (id, archived_transaction_id);
create index compounds_composite_idx7 on compounds (id, project_id,archived_transaction_id);
create index compounds_composite_idx5 on compounds (compound_id, batchable, archived_transaction_id);
create index compounds_composite_idx8 on compounds (project_id, user_id);

create index compounds_text_idx1 on compounds using gin (upper(compound_id) gin_bigm_ops,project_id , archived_transaction_id  );

--select * into compounds_idx from (select id,mol_from_ctab(desalted_sdf::cstring) desalted_mol  from compounds) tmp where desalted_mol is not null;

create table compound_prefixes (
    id SERIAL primary key,
    prefix_code char(2) not null,
    description varchar(4000) not null
);

alter table compound_prefixes add constraint compound_prefixes_udx UNIQUE (prefix_code);

create table compound_salts (
    id SERIAL primary key,
    salt_code varchar(3) not null,
    salt_mol text not null,
    salt_description varchar(4000)
);

alter table compound_salts add constraint compound_salts_udx UNIQUE (salt_code);

create table file_uploads (
    id SERIAL primary key,
    compound_id int references compounds(id) on delete cascade,
    uuid char(55),
    file_path varchar(4000),
    file_name varchar(4000),
    transaction_id bigint not null
);

create index file_uploads_transaction_id on file_uploads (transaction_id);

-- Custom field tables

create table custom_field_types (
	id SERIAL primary key,
	name varchar(4000),
	table_name varchar(4000)
);

insert into custom_field_types (
	name,
	table_name
)

values ('varchar', 'custom_varchar_fields'),
	   ('float', 'custom_float_fields'),
	   ('int', 'custom_int_fields'),
	   ('text', 'custom_text_fields'),
	   ('bool', 'custom_bool_fields'),
	   ('foreign_key', 'custom_foreign_key_field');

create table custom_fields (
	id SERIAL primary key,
	project_id int references projects(id) on delete cascade not null,
	name varchar(400) not null,
	type_id int references custom_field_types(id) not null,
	required boolean default FALSE not null,
	ss_field boolean default FALSE not null,
	auto_convert_mol boolean default FALSE,
	visible boolean default false,
	human_name varchar(400) not null,
	project_foreign_key_id int references projects(id),
	calculated bool default false,
	searchable bool default false,
	before_update_function varchar(400)
);


create unique index custom_fields_uqx on custom_fields(project_id, name);
create unique index custom_fields_uqx2 on custom_fields(project_id, human_name);
create index custom_field_idx1 on custom_fields(name);
create index custom_field_idx2 on custom_fields(project_id);
create index custom_field_idx3 on custom_fields(type_id);
create index custom_field_idx4 on custom_fields(project_foreign_key_id);
create index custom_field_idx5 on custom_fields(searchable, id);
create index custom_field_idx6 on custom_fields(ss_field);

create table custom_varchar_fields (
	id SERIAL primary key,
	custom_field_id int references custom_fields(id) on delete cascade,
	custom_field_value varchar(4000),
	entity_id int references compounds(id) on delete cascade,
	insert_transaction_id bigint not null,
  	update_transaction_id bigint,
  	archived_transaction_id bigint
);


-- create index custom_varchar_fields_value_id6 on custom_varchar_fields using gin(tsvector(custom_field_value));

--create index custom_varchar_fields_value_id6 on custom_varchar_fields using gin (custom_field_value gin_trgm_ops);
--create index custom_varchar_fields_value_id7 on custom_varchar_fields using gin (upper(custom_field_value) gin_trgm_ops);

create index custom_varchar_fields_value_id6 on custom_varchar_fields using gin (custom_field_value gin_bigm_ops);
create index custom_varchar_fields_value_id7 on custom_varchar_fields using gin (upper(custom_field_value) gin_bigm_ops);


create index custom_varchar_fields_value_id8 on custom_varchar_fields (entity_id, custom_field_id);
create index custom_varchar_fields_value_id9 on custom_varchar_fields (custom_field_id, entity_id);

create index custom_varchar_fields_value_idx on custom_varchar_fields (custom_field_value);
create index custom_varchar_fields_value_id5 on custom_varchar_fields (upper(custom_field_value));
create index custom_varchar_fields_value_id2 on custom_varchar_fields (custom_field_id);
create index custom_varchar_fields_value_id3 on custom_varchar_fields (entity_id);
create index custom_varchar_fields_insert_transaction_id on custom_varchar_fields (insert_transaction_id);
create index custom_varchar_fields_update_transaction_id on custom_varchar_fields (update_transaction_id);
create index custom_varchar_fields_archived_transaction_id on custom_varchar_fields (archived_transaction_id);
create index custom_varchar_fields_value_id4 on custom_varchar_fields (entity_id, insert_transaction_id, custom_field_id);

create table custom_text_fields (
	id SERIAL primary key,
	custom_field_id int references custom_fields(id) on delete cascade,
	custom_field_value text,
	entity_id int references compounds(id) on delete cascade,
	insert_transaction_id bigint not null,
	update_transaction_id bigint,
	archived_transaction_id bigint
);

-- create index custom_text_fields_value_idx on custom_text_fields using gin(tsvector(custom_field_value));

create index custom_text_fields_value_idx on custom_text_fields (substr(custom_field_value, 2728));

create index custom_text_fields_value_id2 on custom_text_fields (custom_field_id);
create index custom_text_fields_value_id3 on custom_text_fields (entity_id);
create index custom_text_fields_insert_transaction_id on custom_text_fields (insert_transaction_id);
create index custom_text_fields_update_transaction_id on custom_text_fields (update_transaction_id);
create index custom_text_fields_archived_transaction_id on custom_text_fields (archived_transaction_id);
create index custom_text_fields_value_id4 on custom_text_fields (entity_id, insert_transaction_id, custom_field_id);
create index custom_text_fields_id5 on custom_text_fields (entity_id, custom_field_id);


create table custom_float_fields (
	id SERIAL primary key,
	custom_field_id int references custom_fields(id) on delete cascade,
	custom_field_value float,
	entity_id int references compounds(id) on delete cascade,
	insert_transaction_id bigint not null,
  	update_transaction_id bigint,
  	archived_transaction_id bigint
);

create index custom_float_fields_value_idx on custom_float_fields (custom_field_value);
create index custom_float_fields_value_id2 on custom_float_fields (custom_field_id);
create index custom_float_fields_value_id3 on custom_float_fields (entity_id);
create index custom_float_fields_insert_transaction_id on custom_float_fields (insert_transaction_id);
create index custom_float_fields_update_transaction_id on custom_float_fields (update_transaction_id);
create index custom_float_fields_archived_transaction_id on custom_float_fields (archived_transaction_id);
create index custom_float_fields_value_id4 on custom_float_fields (entity_id, insert_transaction_id, custom_field_id);

create table custom_int_fields (
	id SERIAL primary key,
	custom_field_id int references custom_fields(id) on delete cascade,
	custom_field_value int,
	entity_id int references compounds(id) on delete cascade,
	insert_transaction_id bigint not null,
  	update_transaction_id bigint,
  	archived_transaction_id bigint
);

create index custom_int_fields_value_idx on custom_int_fields (custom_field_value);
create index custom_int_fields_value_id2 on custom_int_fields (custom_field_id);
create index custom_int_fields_value_id3 on custom_int_fields (entity_id);
create index custom_int_fields_insert_transaction_id on custom_int_fields (insert_transaction_id);
create index custom_int_fields_update_transaction_id on custom_int_fields (update_transaction_id);
create index custom_int_fields_archived_transaction_id on custom_int_fields (archived_transaction_id);
create index custom_int_fields_value_id4 on custom_int_fields (entity_id, insert_transaction_id, custom_field_id);


create table custom_bool_fields (
	id SERIAL primary key,
	custom_field_id int references custom_fields(id) on delete cascade,
	custom_field_value bool,
	entity_id int references compounds(id) on delete cascade,
	insert_transaction_id bigint not null,
  	update_transaction_id bigint,
  	archived_transaction_id bigint
);

create index custom_bool_fields_value_idx on custom_bool_fields (custom_field_value);
create index custom_bool_fields_value_id2 on custom_bool_fields (custom_field_id);
create index custom_bool_fields_value_id3 on custom_bool_fields (entity_id);
create index custom_bool_fields_insert_transaction_id on custom_bool_fields (insert_transaction_id);
create index custom_bool_fields_update_transaction_id on custom_bool_fields (update_transaction_id);
create index custom_bool_fields_archived_transaction_id on custom_bool_fields (archived_transaction_id);
create index custom_bool_fields_value_id4 on custom_bool_fields (entity_id, insert_transaction_id, custom_field_id);


create table custom_foreign_key_field (
	id SERIAL primary key,
	custom_field_id int references custom_fields(id) on delete cascade,
	custom_field_value varchar(300),
	parent_project_id int references projects(id),
	entity_id int references compounds(id) on delete cascade,
	foreign key(parent_project_id, custom_field_value) references compounds(project_id, compound_id),
	insert_transaction_id bigint not null,
  	update_transaction_id bigint,
  	archived_transaction_id bigint
);

create index custom_foreign_fields_value_id8 on custom_foreign_key_field using gin (custom_field_value gin_bigm_ops );
create index custom_foreign_fields_value_id9 on custom_foreign_key_field using gin (upper(custom_field_value) gin_bigm_ops );

create index custom_foreign_fields_value_idx on custom_foreign_key_field (custom_field_value);
create index custom_foreign_fields_value_id2 on custom_foreign_key_field (custom_field_id);
create index custom_foreign_fields_value_id3 on custom_foreign_key_field (entity_id);
create index custom_foreign_fields_value_id4 on custom_foreign_key_field (parent_project_id);
create index custom_foreign_key_field_insert_transaction_id on custom_foreign_key_field (insert_transaction_id);
create index custom_foreign_key_field_update_transaction_id on custom_foreign_key_field (update_transaction_id);
create index custom_foreign_key_field_archived_transaction_id on custom_foreign_key_field (archived_transaction_id);
create index custom_foreign_fields_value_id5 on custom_foreign_key_field (entity_id, insert_transaction_id, custom_field_id);
create index custom_foreign_fields_value_id7 on custom_foreign_key_field (entity_id, custom_field_id);


create table compounds_idx (
	id SERIAL primary key,
	custom_field_id int references custom_text_fields(id) on delete cascade,
	molecule mol
);

create index compound_idx_id on compounds_idx (custom_field_id);
create index molecule_mol_idx on compounds_idx using gist(molecule);


-- import string into the following
-- sudo  vim /usr/local/anaconda_cos6/envs/sat_reg/lib/python2.7/site-packages/rdkit/sping/SVG/pidSVG.py
-- (sat_reg) -bash-4.1$ sudo vim /usr/local/anaconda_cos6/envs/sat_reg/lib/python2.7/site-packages/rdkit/sping/PDF/pdfmetrics.py

-- create index test1 on compounds using gist(project_id, archived_transaction_id, upper(compound_id) gin_bigm_ops);