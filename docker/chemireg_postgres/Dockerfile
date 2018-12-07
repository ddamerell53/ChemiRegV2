FROM sgcit/chemireg:sgc_rdkit_postgres_bigm

MAINTAINER David Damerell <david.damerell@sgc.ox.ac.uk>

RUN apt-get update && \
 apt-get install -y git vim
RUN echo "2.1004" > /VERSION
RUN cd /tmp/ && \
git clone https://github.com/ddamerell53/ChemiRegV2.git
RUN cp /tmp/ChemiRegV2/chemireg.sql /docker-entrypoint-initdb.d/chemireg.sql
