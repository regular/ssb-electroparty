const ssbKeys = require('ssb-keys')
const querystring = require('querystring')

function parseConfig(str) {
  try {
    return JSON.parse(Buffer.from(querystring.parse(str).s, 'base64').toString())
  } catch(e) {
    return null
  }
}

module.exports = function getConfig() {
  let ret
  const fromEnv = process.env.config_hash
  ret = parseConfig(fromEnv)
  if (ret) {
    ret.keys = ssbKeys.loadOrCreateSync('electroparty-keys')
    console.log('ep: config from env')
    console.log(`browser pubkey: ${ret.keys.id}`)
    return ret
  }

  const fromUrl = document.location.hash && document.location.hash.slice(1)
  ret = parseConfig(fromUrl)
  if (ret) {
    console.log('ep: config from url')
    document.location.hash = ''
    localStorage['electroparty-config'] = fromUrl
    return ret
  }
  const fromStorage = localStorage['electroparty-config']
  if (fromStorage) {
    console.log('ep: config from localStorage')
    ret = parseConfig(fromStorage)
    return ret
  }
  throw new Error('ssb-electroparty did not find config data. D:')
}
