#!/bin/bash
cd /home/chemireg
redis-4.0.6/src/redis-server --port 6380&
export DEBUG=*
cd src
node chemireg.js services/chemireg.json&
/opt/conda/bin/jupyter notebook --notebook-dir=/home/chemireg/src --ip='*' --port=8888 --no-browser