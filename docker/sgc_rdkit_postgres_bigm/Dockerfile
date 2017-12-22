FROM sgc_rdkit_postgres:latest

MAINTAINER David Damerell <david.damerell@sgc.ox.ac.uk>

RUN apt-get update && apt-get --yes install wget build-essential
RUN wget https://osdn.net/projects/pgbigm/downloads/66565/pg_bigm-1.2-20161011.tar.gz && \
tar zxvf pg_bigm-1.2-20161011.tar.gz
RUN cd pg_bigm-1.2-20161011 && \
make USE_PGXS=1 && \
make USE_PGXS=1 install