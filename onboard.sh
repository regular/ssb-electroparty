#!/bin/bash
if [ "$#" -ne 2 ]; then
  echo "Usage: configfile \"firstname lastname\""
  exit 1
fi
ls config 2>/dev/null && echo "Please move away the config file" && exit 1
set -e
# usage: onboard.sh ../shared/config "Firsname Lastname"
bin/update-onboarding-config "$1" "$(./getinvite $1)" "$2" > config
npm run build
npm run pack
./upload.sh
