
// HACK
if (typeof window !== 'undefined' && window.Buffer) {
  window.Buffer.prototype._isBuffer = true
}

const ssbKeys = require('ssb-keys')
const querystring = require('querystring')

function urlDecodeConfig(str) {
  try {
    return JSON.parse(Buffer.from(querystring.parse(str).s, 'base64').toString())
  } catch(e) {
    return null
  }
}

function urlEncodeConfig(keys, sbotConfig, manifest, versions) {
  const configB64 = Buffer.from(JSON.stringify({keys, sbotConfig, manifest, versions})).toString('base64')
  return querystring.stringify({s:configB64})
}

function getConfig() {
  let ret
  const fromEnv = process.env.config_hash
  ret = urlDecodeConfig(fromEnv)
  if (ret) {
    ret.keys = ssbKeys.loadOrCreateSync('electroparty-keys')
    console.log('ep: config from env', ret)
    console.log(`browser pubkey: ${ret.keys.id}`)
    return ret
  }

  const fromUrl = document.location.hash && document.location.hash.slice(1)
  ret = urlDecodeConfig(fromUrl)
  if (ret) {
    console.log('ep: config from url', ret)
    history.replaceState({}, '', document.location.href.replace(document.location.hash, ''))
    localStorage['electroparty-config'] = fromUrl
    return ret
  }
  const fromStorage = localStorage['electroparty-config']
  if (fromStorage) {
    console.log('ep: config from localStorage', ret)
    ret = urlDecodeConfig(fromStorage)
    return ret
  }
  throw new Error('ssb-electroparty did not find config data. D:')
}

module.exports = getConfig
module.exports.urlEncodeConfig = urlEncodeConfig
module.exports.urlDecodeConfig = urlDecodeConfig
