#!/bin/bash

cd sgc_rdkit_postgres
docker pull sgcit/chemireg:sgc_rdkit_postgres_bigm
cd ../chemireg_postgres
docker build -t chemireg_postgres:latest . 
cd ../../
docker build --build-arg VERSION=`date +%s` -t chemireg -f docker/chemireg_code_update/Dockerfile .

docker tag chemireg sgcit/chemireg:latest
docker tag chemireg_postgres sgcit/chemireg:postgres


