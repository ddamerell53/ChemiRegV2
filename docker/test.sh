#! /bin/bash

sh redeploy_travis_minimal.sh

sleep 10

sudo docker exec -i -t docker_chemireg_1 python /home/chemireg/ChemiRegV2/src/bin/hooks/ChemiRegTester.py
