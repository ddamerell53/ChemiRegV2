docker pull postgres:9.6.6
cd sgc_rdkit_postgres
docker pull sgcit/chemireg:sgc_rdkit_postgres_bigm
cd ../../
docker build --build-arg VERSION=`date +%s` -t chemireg_postgres:latest -f docker/chemireg_postgres/Dockerfile .

docker pull continuumio/anaconda3
docker build --build-arg VERSION=`date +%s` -t chemireg -f docker/chemireg/Dockerfile .

docker tag chemireg sgcit/chemireg:latest
docker tag chemireg_postgres sgcit/chemireg:postgres


