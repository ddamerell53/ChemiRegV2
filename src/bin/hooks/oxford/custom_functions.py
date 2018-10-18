from org.sgc.CommonCore import CommonCore

from exceptions import InvalidCustomFieldValue

class CustomFunctionManager:
    pass

cfm = CustomFunctionManager()
cfm.query_is_xtal = None
cfm.query_is_compound = None

def handle_follow_up_compounds(field_name, obj, compound_id):
    if cfm.query_is_xtal is None:
        # Query to test if a crystal ID is correct
        cfm.query_is_xtal = CommonCore.bh.cursor()
        cfm.query_is_xtal.prepare('SELECT PKEY FROM SGC.XTAL_MOUNT WHERE UPPER(XTAL_MOUNT_ID) = UPPER(:XTAL_ID)')

        # Query to test if a parent compound ID is correct
        cfm.query_is_compound = CommonCore.bh.cursor()
        cfm.query_is_compound.prepare('SELECT PKEY FROM SGC.SGCCOMPOUND WHERE UPPER(SGCGLOBALID) = UPPER(:SGCGLOBALID)')

    field_value = obj[field_name]

    pairs = field_value.split(',')

    for pair in pairs:
        # Split the pair into Crystal ID and Compound ID
        parts = pair.split(':')

        if len(parts) != 2:
            msg = 'Compound ' + compound_id + ' has an invalid follow-up reference: ' + pair + ' the format is CrystalID:CompoundID'
            raise InvalidCustomFieldValue(msg)

        xtal_id = parts[0].rstrip().lstrip()
        compound_id = parts[1].rstrip().lstrip()

        # Test if the crystal ID exists
        cfm.query_is_xtal.execute(None, {':XTAL_ID': xtal_id})

        xtal_row = cfm.query_is_xtal.fetchone()
        if xtal_row is None:
            msg = 'Compound ' + compound_id + ' references  mounted crystal ' + xtal_id + ' which doesn\'t exist'

            raise InvalidCustomFieldValue(msg)

        # Test if compound exists
        cfm.query_is_compound.execute(None, {':SGCGLOBALID': compound_id})

        compound_row = cfm.query_is_compound.fetchone()

        if compound_row is None:
            msg = 'Compound ' + compound_id + ' references parent compound ' + compound_id + ' which doesn\'t exist'

            raise InvalidCustomFieldValue(msg)
