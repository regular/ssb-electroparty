const fs = require('fs')
const path = require('path')
const party = require('ssb-party')
const ssbKeys = require('ssb-keys')
const createConfig = require('ssb-config/inject')
const electro = require('./electro')

console.log(`Node version: ${process.version}`)

// if we are run by electron, the first argument is the path to the electron executable
// and the 2nd arg is our filename (index,js)
// If however, we ere packed as a native application, the first argument is that
// application's path and our index.js does not appear in the argv array
//
if (process.argv[0].split(path.sep).slice(-1)[0].toLowerCase() !== 'electron') {
  
  // is this an attempt to run sbot?
  if (process.argv[1]) {
    let s = process.argv[1].split(path.sep)
    if (s.length>2) {
      s = s.slice(-2)
      if (s[0] === 'ssb-party') {
        return require(process.argv[1])
      }
    }
  }

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

    console.log('Options', opts)

    let partyConfig = createConfig(process.env.ssb_appname || opts.appName, opts)  
    partyConfig.ignoreConfigfile = true
    partyConfig.master.push(`@${browserKey}`)

    party(partyConfig, (err, ssb, config) => {
      if (err) return console.error(err)
      const manifest = config.manifest || JSON.parse(fs.readFileSync(config.manifestFile))
      const configPath = `${config.path + path.sep}config`
      const hasConfig = fs.existsSync(configPath)
      console.log('has config', hasConfig)
      if (!hasConfig) {
        console.log('Writing config to', configPath)
        let c = Object.assign({}, config)
        delete c.master
        delete c._
        delete c.path
        delete c.appName
        delete c.productName
        delete c.onboarding
        delete c.title
        delete c.dev
        delete c.manifestFile
        fs.writeFileSync(configPath, JSON.stringify(c, null, 2), 'utf-8')
      }

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

  electro.loadWebContent('electroparty.html', (err) => {
    if (err) return console.error(err)
  })
})
