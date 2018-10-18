from rdkit import Chem
import cx_Oracle

# ArchiveManager handles all deletes from the Toronto schema


class ArchiveManager(object):
    def __init__(self, parent):
        self.parent = parent

    # archive_compounds deletes @compounds from the Toronto schema
    def archive_compounds(self, compounds):
        # Iterate @compounds
        for compound in compounds:
            # Delete @compound
            self.archive_compound(compound)

    # archive_compound deletes @compound from the Toronto schema
    def archive_compound(self, compound):
        self.parent.archive_count += 1

        self.archive_ch_stock(compound)
        self.archive_ch_compound_chemlib(compound)
        self.archive_ch_compound(compound)

        if self.parent.has_molcart:
            # We get here if Molcart is present
            self.archive_from_molcart(compound)

    # archive_ch_compound deletes @compound from the CH_COMPOUND table
    def archive_ch_compound(self, compound):
        if self.parent.debug_actions:
            print('Removing CH_COMPOUND' + compound['compound_id'])

        query = self.parent.bh.cursor()

        sql = 'DELETE FROM ' + self.parent.schema_name + '.CH_COMPOUND WHERE CHEMIREG_PKEY=:CHEMIREG_PKEY'
        params = {':CHEMIREG_PKEY': compound['id']}

        if self.parent.debug_sql:
            print(sql)
            print(params)

        query.execute(sql,params)

    # archive_ch_compound_chemlib deletes @compound from the CH_COMPOUND_CHEMLIB table
    def archive_ch_compound_chemlib(self, compound):
        if self.parent.debug_actions:
            print('REmoving from CH_COMPOUND_CHEMLIB ' + compound['compound_id'])

        query = self.parent.bh.cursor()

        sql = 'DELETE FROM ' + self.parent.schema_name + '.CH_COMPOUND_CHEMLIB WHERE CHEMIREG_PKEY=:CHEMIREG_PKEY'
        params = {':CHEMIREG_PKEY': compound['id']}

        if self.parent.debug_sql:
            print(sql)
            print(params)

        query.execute(sql,params)

    # archive_ch_stock deletes @compound from the CH_STOCK table
    def archive_ch_stock(self, compound):
        if self.parent.debug_actions:
            print('Removing from CH_STOCK ' + compound['compound_id'])

        query = self.parent.bh.cursor()

        sql = 'DELETE FROM ' + self.parent.schema_name + '.CH_STOCK WHERE CHEMIREG_PKEY=:CHEMIREG_PKEY'
        params = {':CHEMIREG_PKEY': compound['id']}

        if self.parent.debug_sql:
            print(sql)
            print(params)

        query.execute(sql,params)

    # archive_from_molcart deletes @compound from the Molcart table
    def archive_from_molcart(self, compound):
        if self.parent.debug_actions:
            print('Removing from Molcart ' + compound['compound_id'])

        query = self.parent.mbh.cursor()

        sql = 'delete from ' + self.parent.mysql_info['molcart_database'] + '.' + self.parent.mysql_info['molcart_table_name'] + ' where chemireg_pkey = %s'
        params = (compound['id'],)

        if self.parent.debug_sql:
            print(sql)
            print(params)

        query.execute(sql, params)

