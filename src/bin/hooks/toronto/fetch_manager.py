# FetchManager has a few utility methods in to fetch primary keys
class FetchManager(object):
    def __init__(self,parent):
        self.parent = parent

    # get_library_pkey returns the primary key for the library_name and creates it if it doesn't exist
    def get_library_pkey(self, library_name, item):
        if library_name is None:
            return None

        # Inner function as we'll need to call the code within twice if we have to create the library
        def fetch_pkey():
            sql = 'SELECT PKEY FROM  ' + self.parent.schema_name + '.CH_CHEMLIB WHERE ID = :ID'

            query = self.parent.bh.cursor()
            query.execute(sql, {':ID': library_name})

            return query.fetchone()

        # Fetch primary key for library
        row = fetch_pkey()

        if row is None:
            # We get here when the library doesn't exist yet
            sql = "INSERT INTO "+ self.parent.schema_name + ".CH_CHEMLIB (ID, CREATED_AT, CREATED_BY) VALUES(:ID, TO_TIMESTAMP('1970-01-01 00:00:00.0','YYYY-MM-DD HH24:MI:SS.FF') + NUMTODSINTERVAL(:CREATED_AT, 'SECOND'), :CREATED_BY)"

            self.parent.bh.cursor().execute(sql, {':CREATED_AT':item['date_record_created'], ':CREATED_BY': item['username'], ':ID': library_name})

            # Fetch primary key for library
            row = fetch_pkey()

        return row[0]

    # get_provider_pkey returns the primary key for provider_name and creates it if it doesn't exist
    def get_provider_pkey(self, provider_name, item):
        if provider_name is None:
            return None

        # Inner function as we'll need to call the code within twice if we have to create the provider
        def fetch_pkey():
            sql = 'SELECT PKEY FROM  ' + self.parent.schema_name + '.CH_PROVIDER WHERE ID = :ID'

            query = self.parent.bh.cursor()
            query.execute(sql, {':ID': provider_name})

            return query.fetchone()

        # Fetch primary key for provider
        row = fetch_pkey()

        if row is None:
            sql = "INSERT INTO " + self.parent.schema_name + ".CH_PROVIDER (ID, CREATED_AT, CREATED_BY) VALUES(:ID, TO_TIMESTAMP('1970-01-01 00:00:00.0','YYYY-MM-DD HH24:MI:SS.FF') + NUMTODSINTERVAL(:CREATED_AT, 'SECOND'), :CREATED_BY)"

            self.parent.bh.cursor().execute(sql, {'CREATED_AT': item['date_record_created'], 'CREATED_BY': item['username'],'ID': provider_name})

            # Fetch primary key for provider
            row = fetch_pkey()

        return row[0]

    # get_plate_pkey returns the primary key for plate_name and creates it if it doesn't exist
    def get_plate_pkey(self, plate_name,item):
        if plate_name is None:
            return None

        def fetch_pkey():
            sql = 'SELECT PKEY FROM  ' + self.parent.schema_name + '.CH_PLATE WHERE ID = :ID'

            query = self.parent.bh.cursor()
            query.execute(sql, {':ID': plate_name})

            return query.fetchone()

        # Fetch primary key for plate
        row = fetch_pkey()

        if row is None:
            sql = "INSERT INTO " + self.parent.schema_name + ".CH_PLATE (ID, CREATED_AT, CREATED_BY) VALUES(:ID, TO_TIMESTAMP('1970-01-01 00:00:00.0','YYYY-MM-DD HH24:MI:SS.FF') + NUMTODSINTERVAL(:CREATED_AT, 'SECOND'), :CREATED_BY)"

            self.parent.bh.cursor().execute(sql, {'CREATED_AT': item['date_record_created'], 'CREATED_BY': item['username'],'ID': plate_name})

            # Fetch primary key for plate
            row = fetch_pkey()

        return row[0]

    # get_compound_pkey returns the PKEY for the compound identified by chemireg_pkey on CH_COMPOUND
    def get_compound_pkey(self, chemireg_pkey):
        query = self.parent.bh.cursor()
        query.execute('SELECT PKEY FROM ' + self.parent.schema_name + '.CH_COMPOUND WHERE CHEMIREG_PKEY = :CHEMIREG_PKEY',
                      {':CHEMIREG_PKEY': chemireg_pkey})

        row = query.fetchone()

        if row is None:
            return None

        return row[0]

    # get_compound_chemlib_pkey returns the PKEY for the compound identified by CH_COMPOUND_PKEY
    def get_compound_chemlib_pkey(self, compound_pkey):
        query = self.parent.bh.cursor()
        query.execute(
            'SELECT PKEY FROM ' + self.parent.schema_name + '.CH_COMPOUND_CHEMLIB WHERE CH_COMPOUND_PKEY=:CH_COMPOUND_PKEY',
            {'CH_COMPOUND_PKEY': compound_pkey})

        row = query.fetchone()

        if row is None:
            raise Exception('Unable to find CH_COMPOUND_CHEMLIB record for ' + str(compound_pkey))

        return row[0]