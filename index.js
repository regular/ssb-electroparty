const fs = require('fs')
const path = require('path')
const party = require('ssb-party')
const ssbKeys = require('ssb-keys')

console.log(`Node version: ${process.version}`)

// if we are run by electron, the first argument is the path to the electron executable
// and the 2nd arg is our filename (index,js)
// If however, we ere packed as a native application, the first argument is that
// application's path and our index.js does not appear in the argv array
//
if (process.argv[0].split(path.sep).slice(-1)[0].toLowerCase() !== 'electron') {
  process.argv = [process.argv[0]].concat([`${__dirname}/index.js`]).concat(process.argv.slice(1))
}

//console.log('fixed argv', process.argv)

if (process.argv.length<3) {
  console.log('adding default argument')
  process.argv.push(`${__dirname}/client.js`)
}

const electro = require('./electro')

let cannedOpts = {}
try {
  cannedOpts = JSON.parse(fs.readFileSync(__dirname + path.sep + "config"))
} catch(e) {
  console.error('Unable to read canned options from config file:' + e.message)
}

party(Object.assign({}, cannedOpts, electro.opts), (err, ssb, config) => {
  if (err) return console.error(err)
  //console.log('sbot config', config)
  const manifest = config.manifest || JSON.parse(fs.readFileSync(config.manifestFile))
  const keys = config.keys || (config.keys =
    ssbKeys.loadOrCreateSync(path.join(config.path, 'secret')))
  ssb.ws.getAddress( (err, wsAddress)=>{
    if (err) return console.error(err)
    config.wsAddress = wsAddress
    electro(null, {manifest, sbotConfig: config})
  })
})

