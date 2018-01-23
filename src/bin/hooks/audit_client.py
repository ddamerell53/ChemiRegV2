from chemireg import ChemiReg

from abc import ABC
from abc import abstractmethod

import ijson

class AuditClient(ABC):
    def __init__(self, hostname, port, username, password, since_transaction_id, projects, no_records):
        self.since_transaction_id = since_transaction_id
        self.transaction_log = None
        self.no_records = no_records
        
        self.projects = projects
        
        self.chemireg = ChemiReg(hostname, port, username, password)
        
    def process_updates(self):
        self.chemireg.connect()
        
        self.transaction_log = self.chemireg.fetch_updates(since_transaction_id=self.since_transaction_id,project=self.projects,no_records=self.no_records)
       
        self.process_log()

        self.chemireg.close()
 
    def process_log(self):    
        with open(self.transaction_log, 'r') as f:
            items = ijson.items(f, 'inserts.item')
            self.insert_items(items)
                
        with open(self.transaction_log, 'r') as f:
            items = ijson.items(f, 'updates.item')
            self.update_items(items)       
            
        self.after_insert_and_update()
            
        with open(self.transaction_log, 'r') as f:
            items = ijson.items(f, 'archived.item')
            self.archive_items(items)
                
        self.on_done()
        
    @abstractmethod
    def after_insert_and_update(self):
        pass
    
    @abstractmethod
    def on_done(self):
        pass        
        
    @abstractmethod
    def insert_items(self, items):
        pass
    
    @abstractmethod
    def update_items(self, items):
        pass
    
    @abstractmethod
    def archive_items(self, items):
        pass

