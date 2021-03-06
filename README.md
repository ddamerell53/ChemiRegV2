[![Build Status](https://travis-ci.org/ddamerell53/ChemiRegV2.svg?branch=master)](https://travis-ci.org/ddamerell53/ChemiRegV2)

Alpha quality project!

Whilst we are refining and documentating you can play with the docker images as follows

* run docker/install_from_store.ps1 (commands are valid in Linux as well)
* Navigate to http://localhost:8888 to access the ChemiReg Jupyter notebook (password = password)
* Run Setup.ipynb (set the administrator password and run all code blocks)
* Login to ChemiReg (http://localhost) as the administrator with the password you just entered

More documentation to follow

To develop using the Docker images for the time being the simplest solution is the following 

* Do all of the above and then
* Clone this repository to a directory of choice from which you will be able to rsync
* Enter the running ChemiReg container (docker exec -i -t chemireg /bin/bash)
* Stop NodeJS (ps aux | grep "node" and then kill the process by ID)
* rsync -auv ddamerell@hestia:/home/ddamerell/GIT_REPOS/chemireg/src .
* To start ChemiReg with your latest code run cd src & start.sh
