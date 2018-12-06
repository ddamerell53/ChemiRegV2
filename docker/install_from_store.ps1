docker pull ddamerell/chemireg:latest
docker pull ddamerell/chemireg:postgres

docker network create chemireg

docker run --net chemireg -p 127.0.0.1:5432:5432 --name chemireg_postgres -e POSTGRES_PASSWORD=postgres_password -d ddamerell/chemireg:postgres -c listen_addresses="*"

docker run -i --net chemireg -p 127.0.0.1:80:80 -p 127.0.0.1:443:443 -p 127.0.0.1:8888:8888 --name chemireg -d ddamerell/chemireg:latest
docker exec -i -t chemireg /bin/bash