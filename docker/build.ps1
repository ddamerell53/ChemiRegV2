﻿docker pull postgres:9.6.6
cd sgc_rdkit_postgres
wget https://github.com/rdkit/rdkit/archive/Release_2017_09_1.tar.gz
docker build -t sgc_rdkit_postgres:latest .
cd ../sgc_rdkit_postgres_bigm
docker build -t sgc_rdkit_postgres_bigm:latest .
cd ../chemireg_postgres
docker build -t chemireg_postgres:latest .
cd ../chemireg
docker pull continuumio/anaconda3
docker build -t chemireg .

docker tag chemireg ddamerell/chemireg:latest
docker tag chemireg_postgres ddamerell/chemireg:postgres

docker push ddamerell/chemireg:latest
docker push ddamerell/chemireg:postgres