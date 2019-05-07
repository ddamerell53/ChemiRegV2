#!/bin/bash
redis-server --port 6380&
export DEBUG=*

sleep 5

node start.js services/chemireg.json&
jupyter notebook --notebook-dir=. --ip='0.0.0.0' --port=8888 --no-browser


