#!/bin/bash
redis-server --port 6380 --appendonly yes --dir /home/chemireg/redis/&

sleep 5

python install_base_db.py

node start.js services/chemireg.json&
jupyter notebook --notebook-dir=. --ip='0.0.0.0' --port=8888 --no-browser


