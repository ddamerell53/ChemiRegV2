FROM continuumio/anaconda3

MAINTAINER David Damerell <david.damerell@sgc.ox.ac.uk>

RUN apt-get update && \
apt-get install -y git vim build-essential libcap2-bin libcairo2
RUN useradd -ms /bin/bash chemireg
USER chemireg
COPY chemireg.tar.gz /tmp/chemireg.tar.gz
RUN cd /home/chemireg && \
tar zxvf /tmp/chemireg.tar.gz
USER root
RUN cd /home/chemireg/src && \
conda install --yes --file python_requirements.txt
RUN pip install git+git://github.com/ddamerell53/socketIO-client-2.0.3
RUN conda install --yes -c rdkit rdkit
RUN conda install --yes cairo
RUN pip install zxcvbn-python
RUN pip install cairosvg
RUN pip install ijson
USER chemireg
RUN cd /home/chemireg && \
wget https://nodejs.org/dist/v8.9.3/node-v8.9.3-linux-x64.tar.xz && \
tar xvf node-v8.9.3-linux-x64.tar.xz 
ENV PATH="/home/chemireg/node-v8.9.3-linux-x64/bin:${PATH}"
RUN cd /home/chemireg/ && \
npm install restify@4.3.1 tempfile debug bull jsonwebtoken@7.4.1 redis fs-extra pg temp socket.io node-uuid socketio-jwt
RUN cd /home/chemireg && \
wget http://download.redis.io/releases/redis-4.0.6.tar.gz && \
tar zxvf redis-4.0.6.tar.gz && \
cd redis-4.0.6 && \
make
USER root
RUN setcap 'cap_net_bind_service=+ep' /home/chemireg/node-v8.9.3-linux-x64/bin/node
RUN /opt/conda/bin/conda install jupyter -y --quiet && \
mkdir /opt/notebooks
USER chemireg
RUN cd / &&\
tar zxvf /home/chemireg/src/jupyter.tar.gz && \
rm /home/chemireg/src/jupyter.tar.gz
ENV PYTHONPATH=/home/chemireg/src/bin/hooks
RUN chmod u+x /home/chemireg/src/start.sh
CMD /home/chemireg/src/start.sh