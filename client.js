const ssbClient = require('ssb-client')
const ssbKeys = require('ssb-keys')
const querystring = require('querystring')
const merge = require('deep-extend')

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

module.exports = function(opts, cb) {
  if (typeof opts === 'function') {cb = opts; opts = {}}
  opts = opts || {}
  const c = getConfig()
  const {keys, sbotConfig, manifest} = c
  merge(sbotConfig, {
    remote: sbotConfig.wsAddress,
    timers: {handshake: 30000},
    manifest: manifest
  }, opts)
  ssbClient(keys, sbotConfig, cb)
}

