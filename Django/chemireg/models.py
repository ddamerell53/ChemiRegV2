# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class CompoundPrefixes(models.Model):
    prefix_code = models.CharField(unique=True, max_length=2)
    description = models.CharField(max_length=4000)

    class Meta:
        managed = False
        db_table = 'compound_prefixes'


class CompoundSalts(models.Model):
    salt_code = models.CharField(unique=True, max_length=3)
    salt_mol = models.TextField()
    salt_description = models.CharField(max_length=4000, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'compound_salts'


class Compounds(models.Model):
    compound_id = models.CharField(max_length=200, blank=True, null=True)
    upload_id = models.CharField(max_length=37, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    project = models.ForeignKey('Projects', models.DO_NOTHING, blank=True, null=True)
    manual_id = models.CharField(max_length=20, blank=True, null=True)
    batchable = models.CharField(max_length=20, blank=True, null=True)
    date_record_created = models.DateTimeField(blank=True, null=True)
    insert_transaction_id = models.BigIntegerField()
    update_transaction_id = models.BigIntegerField(blank=True, null=True)
    archived_transaction_id = models.BigIntegerField(blank=True, null=True)
    archived = models.NullBooleanField()

    class Meta:
        managed = False
        db_table = 'compounds'
        unique_together = (('project', 'compound_id'),)


class CompoundsIdx(models.Model):
    custom_field = models.ForeignKey('CustomTextFields', models.DO_NOTHING, blank=True, null=True)
    molecule = models.TextField(blank=True, null=True)  # This field type is a guess.

    class Meta:
        managed = False
        db_table = 'compounds_idx'


class CustomBoolFields(models.Model):
    custom_field = models.ForeignKey('CustomFields', models.DO_NOTHING, blank=True, null=True)
    custom_field_value = models.NullBooleanField()
    entity = models.ForeignKey(Compounds, models.DO_NOTHING, blank=True, null=True)
    insert_transaction_id = models.BigIntegerField()
    update_transaction_id = models.BigIntegerField(blank=True, null=True)
    archived_transaction_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'custom_bool_fields'


class CustomFieldTypes(models.Model):
    name = models.CharField(max_length=4000, blank=True, null=True)
    table_name = models.CharField(max_length=4000, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'custom_field_types'


class CustomFields(models.Model):
    project = models.ForeignKey('Projects', models.DO_NOTHING)
    name = models.CharField(max_length=400)
    type = models.ForeignKey(CustomFieldTypes, models.DO_NOTHING)
    required = models.BooleanField()
    ss_field = models.BooleanField()
    auto_convert_mol = models.NullBooleanField()
    visible = models.NullBooleanField()
    human_name = models.CharField(max_length=400)
    project_foreign_key = models.ForeignKey('Projects', models.DO_NOTHING, blank=True, null=True)
    calculated = models.NullBooleanField()
    searchable = models.NullBooleanField()

    class Meta:
        managed = False
        db_table = 'custom_fields'
        unique_together = (('project', 'name'), ('project', 'human_name'),)


class CustomFloatFields(models.Model):
    custom_field = models.ForeignKey(CustomFields, models.DO_NOTHING, blank=True, null=True)
    custom_field_value = models.FloatField(blank=True, null=True)
    entity = models.ForeignKey(Compounds, models.DO_NOTHING, blank=True, null=True)
    insert_transaction_id = models.BigIntegerField()
    update_transaction_id = models.BigIntegerField(blank=True, null=True)
    archived_transaction_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'custom_float_fields'


class CustomForeignKeyField(models.Model):
    custom_field = models.ForeignKey(CustomFields, models.DO_NOTHING, blank=True, null=True)
    custom_field_value = models.CharField(max_length=300, blank=True, null=True)
    parent_project = models.ForeignKey(Compounds, models.DO_NOTHING, blank=True, null=True)
    entity = models.ForeignKey(Compounds, models.DO_NOTHING, blank=True, null=True)
    insert_transaction_id = models.BigIntegerField()
    update_transaction_id = models.BigIntegerField(blank=True, null=True)
    archived_transaction_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'custom_foreign_key_field'


class CustomIntFields(models.Model):
    custom_field = models.ForeignKey(CustomFields, models.DO_NOTHING, blank=True, null=True)
    custom_field_value = models.IntegerField(blank=True, null=True)
    entity = models.ForeignKey(Compounds, models.DO_NOTHING, blank=True, null=True)
    insert_transaction_id = models.BigIntegerField()
    update_transaction_id = models.BigIntegerField(blank=True, null=True)
    archived_transaction_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'custom_int_fields'


class CustomTextFields(models.Model):
    custom_field = models.ForeignKey(CustomFields, models.DO_NOTHING, blank=True, null=True)
    custom_field_value = models.TextField(blank=True, null=True)
    entity = models.ForeignKey(Compounds, models.DO_NOTHING, blank=True, null=True)
    insert_transaction_id = models.BigIntegerField()
    update_transaction_id = models.BigIntegerField(blank=True, null=True)
    archived_transaction_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'custom_text_fields'


class CustomVarcharFields(models.Model):
    custom_field = models.ForeignKey(CustomFields, models.DO_NOTHING, blank=True, null=True)
    custom_field_value = models.CharField(max_length=4000, blank=True, null=True)
    entity = models.ForeignKey(Compounds, models.DO_NOTHING, blank=True, null=True)
    insert_transaction_id = models.BigIntegerField()
    update_transaction_id = models.BigIntegerField(blank=True, null=True)
    archived_transaction_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'custom_varchar_fields'


class FileUploads(models.Model):
    compound = models.ForeignKey(Compounds, models.DO_NOTHING, blank=True, null=True)
    uuid = models.CharField(max_length=55, blank=True, null=True)
    file_path = models.CharField(max_length=4000, blank=True, null=True)
    file_name = models.CharField(max_length=4000, blank=True, null=True)
    transaction_id = models.BigIntegerField()

    class Meta:
        managed = False
        db_table = 'file_uploads'


class Projects(models.Model):
    project_name = models.CharField(unique=True, max_length=200, blank=True, null=True)
    entity_name = models.CharField(max_length=400, blank=True, null=True)
    enable_structure_field = models.NullBooleanField()
    enable_attachment_field = models.NullBooleanField()
    id_group_name = models.CharField(max_length=400, blank=True, null=True)
    enable_addition = models.NullBooleanField()

    class Meta:
        managed = False
        db_table = 'projects'


class Suppliers(models.Model):
    name = models.CharField(unique=True, max_length=4000, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'suppliers'


class UserToProject(models.Model):
    project = models.ForeignKey(Projects, models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('Users', models.DO_NOTHING, blank=True, null=True)
    default_project = models.NullBooleanField()
    is_administrator = models.NullBooleanField()

    class Meta:
        managed = False
        db_table = 'user_to_project'
        unique_together = (('project', 'user'),)


class Users(models.Model):
    first_name = models.CharField(max_length=200, blank=True, null=True)
    last_name = models.CharField(max_length=200, blank=True, null=True)
    email = models.CharField(max_length=200, blank=True, null=True)
    username = models.CharField(unique=True, max_length=200, blank=True, null=True)
    password_hash = models.CharField(max_length=2000, blank=True, null=True)
    account_type = models.CharField(max_length=200, blank=True, null=True)
    reset_password_token = models.CharField(max_length=200, blank=True, null=True)
    reset_token_timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'

#CustomVarcharFields.objects.filter(custom_field__name='description', custom_field__project__project_name='Test/Compound Classifications', entity__compound_id='ZZ')[0].custom_field_value