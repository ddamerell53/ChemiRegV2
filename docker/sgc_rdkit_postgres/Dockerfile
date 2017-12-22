FROM postgres:9.6.6

MAINTAINER David Damerell <david.damerell@sgc.ox.ac.uk>

ENV ARCHIVE=Release_2017_09_1.tar.gz \
RDKIT_DIR=/opt/rdkit \
LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$RDKIT_DIR/lib:/usr/lib/x86_64-linux-gnu \
PYTHONPATH=$PYTHONPATH:$RDKIT_DIR

RUN apt-get update && \
apt-get install -y \
build-essential \
cmake \
libboost-dev \
libboost-python-dev \
libboost-regex-dev \
libboost-serialization-dev \
libboost-system-dev \
libboost-thread-dev \
libsqlite3-dev \
postgresql-client-9.6 \
postgresql-plpython-9.6 \
postgresql-plpython3-9.6 \
postgresql-server-dev-9.6 \
python-dev \
python-numpy \
sqlite3 \
wget && \
rm -rf /var/lib/apt/lists/* && \
wget -q https://github.com/rdkit/rdkit/archive/$ARCHIVE && \
tar xf $ARCHIVE && \
rm $ARCHIVE && \
mv rdkit-Release* $RDKIT_DIR && \
mkdir $RDKIT_DIR/build && \
cd $RDKIT_DIR/build && \
cmake -DRDK_BUILD_INCHI_SUPPORT=ON -DRDK_BUILD_PGSQL=ON -DPostgreSQL_ROOT=/usr/lib/postgresql/$PG_MAJOR -DPostgreSQL_TYPE_INCLUDE_DIR=/usr/include/postgresql/$PG_MAJOR/server .. && \
make && \
make install && \
sh $RDKIT_DIR/build/Code/PgSQL/rdkit/pgsql_install.sh && \
cd / && \
rm -rf $RDKIT_DIR/build && \
apt-get autoremove --purge -y build-essential cmake wget && \
apt-get clean
