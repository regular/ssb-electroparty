const fs = require('fs')
const path = require('path')
const party = require('ssb-party')
const ssbKeys = require('ssb-keys')
const electro = require('./electro')

console.log(`Node version: ${process.version}`)

// if we are run by electron, the first argument is the path to the electron executable
// and the 2nd arg is our filename (index,js)
// If however, we ere packed as a native application, the first argument is that
// application's path and our index.js does not appear in the argv array
//
if (process.argv[0].split(path.sep).slice(-1)[0].toLowerCase() !== 'electron') {
  process.argv = [process.argv[0]].concat([`${__dirname}/index.js`]).concat(process.argv.slice(1))
}

if (process.argv.length<3) {
  console.log('adding default argument')
  process.argv.push(`${__dirname}/client.js`)
}

let opts = electro.processArgv()

let cannedOpts = {}
try {
  cannedOpts = JSON.parse(fs.readFileSync(__dirname + path.sep + "config"))
} catch(e) {
  console.error('Unable to read canned options from config file:' + e.message)
}

opts = Object.assign({}, cannedOpts, opts)


electro.openWindow(opts, (err, mainWindow)=>{
  if (err) return console.error(err)
  const {ipcMain} = require('electron')
  ipcMain.on('pubkey', function (s, browserKey) {
    console.log('Pubkey in browser', browserKey)
    opts.master = opts.master || []
    opts.master.push(`@${browserKey}`)

    console.log('Options', opts)
    
    party(opts, (err, ssb, config) => {
      if (err) return console.error(err)
      //console.log('sbot config', config)
      const manifest = config.manifest || JSON.parse(fs.readFileSync(config.manifestFile))

      ssb.ws.getAddress( (err, wsAddress)=>{
        if (err) return console.error(err)
        config.wsAddress = wsAddress
        console.log('Sbot config', config)

        console.log('Sending config ...')
        mainWindow.send('sbot.config', JSON.stringify({
          manifest, 
          sbotConfig: config
        }))
      })
    })
  })

  electro.loadWebContent('index.html', (err) => {
    if (err) return console.error(err)
  })
})
