FROM continuumio/anaconda3
#FROM frolvlad/alpine-miniconda3

MAINTAINER David Damerell <david.damerell@sgc.ox.ac.uk>

RUN apt-get update && \
apt-get install -y  git vim build-essential libcap2-bin libcairo2 postgresql-client
#RUN apk add --update alpine-sdk linux-headers
#RUN apk update && \
#apk add git vim alphine-sdk  libcap2-bin  postgresql-client

RUN useradd -ms /bin/bash chemireg
#RUN adduser -s /bin/bash -D chemireg

RUN echo "2.1006" > /VERSION

USER chemireg

RUN cd /home/chemireg && \
wget http://download.redis.io/releases/redis-4.0.6.tar.gz && \
tar zxvf redis-4.0.6.tar.gz && \
cd redis-4.0.6 && \
make

USER chemireg

RUN cd /home/chemireg && \
wget https://nodejs.org/dist/v8.9.3/node-v8.9.3-linux-x64.tar.xz && \
tar xvf node-v8.9.3-linux-x64.tar.xz
ENV PATH="/home/chemireg/node-v8.9.3-linux-x64/bin:${PATH}"
RUN cd /home/chemireg/ && \
npm install restify tempfile debug bull jsonwebtoken redis fs-extra pg temp socket.io node-uuid socketio-jwt restify-cookies

USER root

RUN setcap 'cap_net_bind_service=+ep' /home/chemireg/node-v8.9.3-linux-x64/bin/node
RUN /opt/conda/bin/conda install jupyter -y --quiet && \
mkdir /opt/notebooks

USER chemireg
RUN mkdir /home/chemireg/ChemiRegV2/src -p
COPY src/python_requirements.txt /home/chemireg/ChemiRegV2/src/

USER root

RUN cd /home/chemireg/ChemiRegV2/src && \
conda install --yes --file python_requirements.txt
RUN pip install git+git://github.com/ddamerell53/socketIO-client-2.0.3
RUN conda install --yes -c rdkit rdkit
RUN conda install --yes cairo
RUN pip install zxcvbn-python
RUN pip install cairosvg
RUN pip install ijson
RUN conda install django

USER chemireg

ARG VERSION=unknown
RUN VERSION=${VERSION}
COPY . /home/chemireg/ChemiRegV2

USER root

RUN chown -R chemireg:users /home/chemireg/ChemiRegV2
RUN chmod u+x /home/chemireg/ChemiRegV2/src/start.sh
RUN apt-get remove -y build-essential
RUN apt-get clean
RUN apt -y autoremove

USER chemireg

ENV PYTHONPATH=/home/chemireg/ChemiRegV2/src/bin/hooks
ENV PATH=/home/chemireg/redis-4.0.6/src/:/opt/conda/bin:${PATH}
RUN mkdir /home/chemireg/.jupyter
RUN cp /home/chemireg/ChemiRegV2/jupyter_notebook_config.json /home/chemireg/.jupyter/
WORKDIR /home/chemireg/ChemiRegV2/src/
RUN cat /home/chemireg/ChemiRegV2/src/chemireg.js > /home/chemireg/ChemiRegV2/src/start.js
RUN cat /home/chemireg/ChemiRegV2/src/routes.js >> /home/chemireg/ChemiRegV2/src/start.js
CMD /home/chemireg/ChemiRegV2/src/start.sh
