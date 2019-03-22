docker run -p 127.0.0.1:5432:5432 --name chemireg_postgres -e POSTGRES_PASSWORD=postgres_password -d chemireg_postgres

docker run -i -p 127.0.0.1:80:80 -p 127.0.0.1:443:443 -p 127.0.0.1:8888:8888 --name chemireg --link chemireg_postgres -d chemireg
docker exec -i -t chemireg /bin/bash

#docker run -it --rm --link chemireg_postgres postgres psql -h chemireg_postgres -U postgres chemireg