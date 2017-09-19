console.log('I am a dummy client')

const ssbClient = require('ssb-client')
const querystring = require('querystring')
const {keys, sbotConfig, manifest} = JSON.parse(Buffer.from(querystring.parse(document.location.hash.slice(1)).s, 'base64').toString())
document.location.hash = ''

ssbClient(keys, {
  caps: sbotConfig.caps,
  remote: sbotConfig.wsAddress,
  timers: {handshake: 30000},
  manifest: manifest
}, (err, ssb) => {
  if (err) return console.error(`Failed to connect to sbot from client: ${err.message}`)
  ssb.whoami( (err, feed) => {
    if (err) return console.errort(err.message)
    console.log(`your sbot's pubkey: ${feed.id}`)
  })
})

