const fs = require('fs')
const path = require('path')
const childproc = require('child_process')
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

  console.log('PACKED')
  
  // is this an attempt to run sbot?
  if (process.argv.length > 1) {
    console.log('argv[1]', process.argv[1])
    let s = process.argv[1].split(path.sep)
    if (s.length>2) {
      s = s.slice(-2)
      if (s[0] === 'ssb-party') {
        console.log('We are the sbot process')
        process.removeAllListeners('uncaughtException')
        process.removeAllListeners('exit')
        process.title = 'sbot'
        return require(process.argv[1])
      }
    }
  } else {
    console.log('** Electroparty Bouncer **')

    const startChild = () => {
      // With no arguments, we are the watchdog process
      console.log('Starting child')
      const child = childproc.spawn(process.execPath, ['--started-by-watchdog'], {
        stdio: ['inherit', 'inherit', 'inherit'],
      })
      console.log(`Pid: ${child.pid}`)
      child.on('close', code => {
        console.log(`child process exited with code ${code}`)
        if (code !== 0) {
          console.log('Will restart')
          setTimeout(startChild, 1000)
        } else {
          process.exit(0)
        }
      })
    }
    startChild()
    return
  }
  
  // cd into __dirname
  console.log(`cd into ${__dirname}`)
  process.chdir(__dirname)
  
  process.argv = [process.argv[0]].concat([`${__dirname}/index.js`]).concat(process.argv.slice(1))
}

// filter OSX process serial number argument
// https://stackoverflow.com/questions/10242115/os-x-strange-psn-command-line-parameter-when-launched-from-finder
// only passed on first launch ever??
process.argv = process.argv.filter( x => !/-psn/.test(x) )
// also remove watchdog flag
process.argv = process.argv.filter( x => x !== '--started-by-watchdog' )

if (process.argv.length<3) {
  console.log('adding default argument')
  process.argv.push(`${__dirname}/bootstrap.js`)
}

let opts = electro.processArgv()

let cannedOpts = {}
try {
  cannedOpts = JSON.parse(fs.readFileSync("config"))
} catch(e) {
  console.error('Unable to read canned options from config file:' + e.message)
  process.exit(1)
}

opts = Object.assign({}, cannedOpts, opts)

electro.ready.once( r => {
  if (!r) return
  const electron = electro.electron
  const Menu = electron.Menu
  const defaultMenu = require('electron-default-menu')
  const menu = defaultMenu(electron.app, electron.shell)

  const menuEntries = (opts.electroparty && opts.electroparty.menu) || {}
  for (let k in menuEntries) {
    //jshint -W083
    const view = menu.find(x => x.label === k)
    //jshint +W083
    if (view) view.submenu = menuEntries[k]
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
})

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
          sbotConfig: config,
          ips: require('./get-ips')()
        }))
      })
    })
  })

  electro.loadWebContent('electroparty.html', (err) => {
    if (err) return console.error(err)
  })
})
