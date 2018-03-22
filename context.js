
// HACK
if (typeof window !== 'undefined' && window.Buffer) {
  window.Buffer.prototype._isBuffer = true
}

const ssbKeys = require('ssb-keys')
const querystring = require('querystring')

function urlDecode(str) {
  try {
    return JSON.parse(Buffer.from(querystring.parse(str).s, 'base64').toString())
  } catch(e) {
    return null
  }
}

function urlEncode(keys, sbotConfig, manifest, versions) {
  const configB64 = Buffer.from(JSON.stringify({keys, sbotConfig, manifest, versions})).toString('base64')
  return querystring.stringify({s:configB64})
}

const getContext = (function() {
  let cache
  return function() {
    if (!cache) cache = _getContext()
    return cache
  }
})()

function _getContext() {
  let ret
  const fromEnv = process.env.config_hash
  ret = urlDecode(fromEnv)
  if (ret) {
    ret.keys = ssbKeys.loadOrCreateSync('electroparty-keys')
    console.log('ep: config from env', ret)
    console.log(`browser pubkey: ${ret.keys.id}`)
    return ret
  }

  const fromUrl = document.location.hash && document.location.hash.slice(1)
  ret = urlDecode(fromUrl)
  if (ret) {
    console.log('ep: config from url', ret)
    history.replaceState({}, '', document.location.href.replace(document.location.hash, ''))
    localStorage['electroparty-config'] = fromUrl
    return ret
  }
  const fromStorage = localStorage['electroparty-config']
  if (fromStorage) {
    console.log('ep: config from localStorage', ret)
    ret = urlDecode(fromStorage)
    return ret
  }
  throw new Error('ssb-electroparty did not find config data. D:')
}

function makeWebappURL(webappKv, context) {
  if (!context) context = getContext()
  let {keys, sbotConfig, manifest, versions} = context
  versions = Object.assign({}, versions, {
    webapp: {
      codeMessage: webappKv.key,
      author: webappKv.value.author,
      sequence: webappKv.value.sequence,
      codeBranch: webappKv.value.content.codeBranch,
      appId: webappKv.value.content.appId,
      codeBlob: webappKv.value.content.code
    }
  })
  const codeBlob = webappKv.value.content && webappKv.value.content.code
  const blobURL = `http://${sbotConfig.host || 'localhost'}:${sbotConfig.ws.port}/blobs/get/${codeBlob}`
  const fragment = urlEncode(keys, sbotConfig, manifest, versions)
  return `${blobURL}#${fragment}`
}

module.exports = getContext
module.exports.urlEncode = urlEncode
module.exports.urlDecode = urlDecode
module.exports.makeWebappURL = makeWebappURL
