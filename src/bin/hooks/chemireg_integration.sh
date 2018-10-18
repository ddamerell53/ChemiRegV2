#!/bin/bash

export PYTHONPATH="/home/oracle/ChemiRegV2/src/bin/hooks:/home/oracle/python_scripts/src"
export LD_LIBRARY_PATH="/usr/local/lib:/usr/local/oracle/product/11.2.0/lib:/lib:/usr/lib"
export LD_LIBRARY_PATH="/usr/local/lib:/usr/local/oracle/product/11.2.0/lib:/lib:/usr/lib"
export ORACLE_BASE="/usr/local/oracle"
export ORACLE_HOME="/usr/local/oracle/product/11.2.0"
export ORACLE_HOSTNAME="sgcdata.sgc.ox.ac.uk"
export ORACLE_SID="eln"
export ORACLE_UNQNAME="eln"
export PATH="/usr/local/anaconda3/bin:/usr/local/oracle/product/11.2.0/bin:/usr/sbin:/usr/lib64/qt-3.3/bin:/usr/local/bin:/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/sbin"
export NLS_LANG=".WE8ISO8859P1"
export NLS_LNCHAR="AL32UTF8"

if mkdir /home/oracle/.chemireg_update; then
  echo "Looking for updates"

  python /home/oracle/ChemiRegV2/src/bin/hooks/sgc_sync.py

  rm -rf /home/oracle/.chemireg_update
else
  echo "Blocked, waiting"
  exit 1
fi
