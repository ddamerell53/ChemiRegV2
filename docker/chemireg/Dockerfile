FROM continuumio/anaconda3

MAINTAINER David Damerell <david.damerell@sgc.ox.ac.uk>

RUN apt-get update && \
apt-get install -y git vim build-essential libcap2-bin libcairo2 postgresql-client
RUN useradd -ms /bin/bash chemireg
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
RUN cd /home/chemireg && \
wget https://api.github.com/repos/ddamerell53/ChemiRegV2/git/refs/heads/master -o version.json && \
git clone https://github.com/ddamerell53/ChemiRegV2.git

USER root

RUN cd /home/chemireg/ChemiRegV2/src && \
conda install --yes --file python_requirements.txt
RUN pip install git+git://github.com/ddamerell53/socketIO-client-2.0.3
RUN conda install --yes -c rdkit rdkit
RUN conda install --yes cairo
RUN pip install zxcvbn-python
RUN pip install cairosvg
RUN pip install ijson

USER chemireg

ENV PYTHONPATH=/home/chemireg/ChemiRegV2/src/bin/hooks
ENV PATH=/home/chemireg/redis-4.0.6/src/:/opt/conda/bin:${PATH}
RUN chmod u+x /home/chemireg/ChemiRegV2/src/start.sh
RUN echo "2.1005" > /home/chemireg/VERSION
RUN mkdir /home/chemireg/.jupyter
RUN cp /home/chemireg/ChemiRegV2/jupyter_notebook_config.json /home/chemireg/.jupyter/
WORKDIR /home/chemireg/ChemiRegV2/src/
CMD /home/chemireg/ChemiRegV2/src/start.sh