#!/bin/bash
if [ "$#" -ne 2 ]; then
  echo "Usage: configfile \"firstname lastname\""
  exit 1
fi
ls config 2>/dev/null && echo "Please move away the config file" && exit 1
set -e
# usage: onboard.sh ../shared/config "Firsname Lastname"
ssb_appname=`node -e "var c = JSON.parse(require('fs').readFileSync('$1')); console.log(c.invite_appName || c.appName)"`
export ssb_appname
bin/update-onboarding-config "$1" "$(./getinvite $1)" "$2" > config
npm run build
npm run pack
./upload.sh
