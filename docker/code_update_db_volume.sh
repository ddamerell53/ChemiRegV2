cd sgc_rdkit_postgres
docker pull sgcit/chemireg:sgc_rdkit_postgres_bigm
cd ../../
docker build --build-arg VERSION=`date +%s` -t chemireg_postgres:latest -f docker/chemireg_postgres/Dockerfile .

docker build --build-arg VERSION=`date +%s` -t chemireg -f docker/chemireg_code_update/Dockerfile .

cd docker

docker-compose -f docker-compose-db-volume down
docker-compose -f docker-compose-db-volume up 
