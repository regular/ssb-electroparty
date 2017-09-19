console.log('I am a dummy client')

const ssbClient = require('ssb-client')
const ssbKeys = require('ssb-keys')
const querystring = require('querystring')

function parseConfig(str) {
  try {
    return JSON.parse(Buffer.from(querystring.parse(str).s, 'base64').toString())
  } catch(e) {
    return null
  }
}

function getConfig() {
  let ret
  const fromEnv = process.env.config_hash
  ret = parseConfig(fromEnv)
  if (ret) {
    ret.keys = ssbKeys.loadOrCreateSync('electroparty-keys')
    console.log(`browser pubkey: ${ret.keys.id}`)
    return ret
  }

  const fromUrl = document.location.hash && document.location.hash.slice(1)
  ret = parseConfig(fromUrl)
  if (ret) {
    document.location.hash = ''
    // TODO: save to localStorage
    return ret
  }

  // TODO: load from localStorage
}

const c = getConfig()
console.log(c)
const {keys, sbotConfig, manifest} = c 
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

