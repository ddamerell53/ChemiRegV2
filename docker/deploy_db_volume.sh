docker pull postgres:9.6.6

cd sgc_rdkit_postgres
#wget https://github.com/rdkit/rdkit/archive/Release_2017_09_1.tar.gz

docker build -t sgc_rdkit_postgres:latest .

cd ../sgc_rdkit_postgres_bigm

docker build -t sgc_rdkit_postgres_bigm:latest .

cd ../../

docker build --build-arg VERSION=`date +%s` -t chemireg_postgres:latest -f docker/chemireg_postgres/Dockerfile .

docker build -t chemireg_postgres:latest . 
docker pull continuumio/anaconda3
docker build --build-arg VERSION=`date +%s` -t chemireg -f docker/chemireg/Dockerfile .

docker tag chemireg sgcit/chemireg:latest
docker tag chemireg_postgres sgcit/chemireg:postgres
docker tag sgc_rdkit_postgres_bigm sgcit/chemireg:sgc_rdkit_postgres_bigm

cd docker
sudo docker-compose -f docker-compose-db-volume down
sudo docker-compose -f docker-compose-db-volume up
