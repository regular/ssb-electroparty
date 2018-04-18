T="~/dev/$ssb_appname/dist/"
ssh korn "mkdir -p $T"
rsync -avz build/SSB-Electroparty-darwin-x64 "korn:$T"
R=$(node -e "console.log(require('crypto').randomBytes(10).toString('hex'))")
ssh korn "cd ~/dev/$ssb_appname/dist && zip -r /var/www/html/$ssb_appname-$R.zip SSB-Electroparty-darwin-x64"
echo "http://pub.postpossessive.org/$ssb_appname-$R.zip"
