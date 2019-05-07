FROM sgcit/chemireg:latest 

MAINTAINER David Damerell <david.damerell@sgc.ox.ac.uk>

USER chemireg

ARG VERSION=unknown
RUN VERSION=${VERSION}
COPY . /home/chemireg/ChemiRegV2

USER root

RUN chown -R chemireg:users /home/chemireg/ChemiRegV2
RUN chmod u+x /home/chemireg/ChemiRegV2/src/start.sh

USER chemireg
RUN cat /home/chemireg/ChemiRegV2/src/chemireg.js > /home/chemireg/ChemiRegV2/src/start.js
RUN cat /home/chemireg/ChemiRegV2/src/routes.js >> /home/chemireg/ChemiRegV2/src/start.js

CMD /home/chemireg/ChemiRegV2/src/start.sh
