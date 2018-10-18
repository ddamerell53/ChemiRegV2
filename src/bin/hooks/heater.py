from chemireg import ChemiReg

class Heater(object):
    def __init__(self, hostname, port, username, password):
        self.hostname = hostname
        self.port = port
        self.username = username
        self.password = password
        self.chemireg = None

    def on(self):
        self.chemireg = ChemiReg(self.hostname, self.port, self.username, self.password)
        try:
            self.chemireg.connect()

            self.chemireg.fetch(['MT029775g','NU000796a','KD036452a','PK007117a','PK007120a','XS088858a','MT013773a'],'SGC', 0, 10)

            results = self.chemireg.fetch_wild(['MT029775g','NU000796a','KD036452a','PK007117a','PK007120a','XS088858a','MT013773a'],'SGC', 0, 10)

            print(results)

            terms = ['Pfizer', 'GSK', 'Collaborator', 'Sussex', 'Merck', 'GSK', 'Sigma']
            projects = ['SGC', 'SGC - Oxford']

            for project in projects:
                for term in terms:
                    results = self.chemireg.fast_fetch(project, term)

                    print(results)

                    results = self.chemireg.fast_fetch(project, term[0:3])

                    print(results)

                    results = self.chemireg.fetch_wild(term, project, 0, 10)

                    print(results)

            results = self.chemireg.fetch_all('SGC/Salts', 0, 10000)

            print(results)

            results = self.chemireg.fetch_all('SGC/Compound Classifications', 0, 10000)

            print(results)
        finally:
            self.chemireg.close()

if __name__ == '__main__':
    hostname = None
    port = None
    username = None
    password = None

    heater = Heater(hostname, port, username, password)
    heater.on()