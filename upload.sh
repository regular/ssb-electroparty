T="~/dev/lad/dist/"
rsync -avz build/SSB-Electroparty-darwin-x64 "korn:$T"
R=$(node -e "console.log(require('crypto').randomBytes(10).toString('hex'))")
ssh korn "cd ~/dev/lad/dist && zip -r /var/www/html/lad-$R.zip SSB-Electroparty-darwin-x64"
echo "http://pub.postpossessive.org/lad-$R.zip"
