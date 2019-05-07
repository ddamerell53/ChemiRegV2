#!/bin/bash

cd ../sgc_rdkit_postgres
docker pull sgcit/chemireg:sgc_rdkit_postgres_bigm

cd ../../

docker build --build-arg VERSION=`date +%s` -t sgcit/chemireg:postgres -f docker/chemireg_postgres/Dockerfile .

cd docker/hub

docker build --build-arg VERSION=`date +%s` -t sgcit/chemireg:latest -f Dockerfile .

docker-compose down
docker-compose up 


