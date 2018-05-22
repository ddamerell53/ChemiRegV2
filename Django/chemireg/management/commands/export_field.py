from django.core.management.base import BaseCommand, CommandError

from chemireg.models import CustomForeignKeyField

# Example usage python manage.py export_field SGC classification  /tmp/out

class Command(BaseCommand):
    help = 'Export CSV of the form Compound ID,Field Value'
    requires_system_checks = False
    def add_arguments(self, parser):
        parser.add_argument('project_name', nargs=1, type=str)
        parser.add_argument('field_name', nargs=1, type=str)
        parser.add_argument('out_file', nargs=1, type=str)

    def handle(self, *args, **options):
        project_name = options['project_name'][0]
        field_name = options['field_name'][0]
        out_file = options['out_file'][0]

        self.stdout.write(project_name + '/' + field_name)
        query_set = CustomForeignKeyField.objects.filter(custom_field__name=field_name,custom_field__project__project_name=project_name, archived_transaction_id=None, entity__archived_transaction_id=None)
        i = 0
        with open(out_file, 'w') as fw:
            for item in query_set:
                i += 1
                self.stdout.write(str(i) + '/' + item.entity.compound_id)
                fw.write(item.entity.compound_id+','+item.custom_field_value + '\n')
