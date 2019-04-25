FROM sgcit/chemireg:sgc_rdkit_postgres_bigm

MAINTAINER David Damerell <david.damerell@sgc.ox.ac.uk>

RUN apt-get update && \
 apt-get install -y git vim
RUN echo "2.1004" > /VERSION

ARG VERSION=unknown
RUN VERSION=${VERSION}

COPY . /tmp/ChemiRegV2

RUN cp /tmp/ChemiRegV2/chemireg.sql /docker-entrypoint-initdb.d/chemireg.sql
