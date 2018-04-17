
// HACK
if (typeof window !== 'undefined' && window.Buffer) {
  window.Buffer.prototype._isBuffer = true
}

const querystring = require('querystring')

// jshint -W069
function nativeRequire(modname) {
  // we use native require if available,
  // so we have a chance to get native crypto code
  // in node and electron.
  const g = typeof window !== 'undefined' ? window : global
  if (g['require']) {
    console.warn(`Using native ${modname}`)
    let modpath = modname
    const argv0 = g['process'] && g['process'].argv0
    console.warn(`process.argv0 in ep client: ${argv0}`)
    if (argv0.includes('node_modules')) {
      // it seems we are in an non-packed electron-environment
      // In this case, the module will not be found with require.resolve
      const path = g['require']('path')
      modpath = path.join(argv0.replace(/node_modules.*/, ''), 'node_modules', modname)
    }
    console.warn(`Trying to require ${modpath}`)
    try {
      return g['require'](modpath)
    } catch(e) {
      console.warn(`Failed: ${e.message}`)
    }
  }
  return null
}
// jshint +W069

function SSBKeys() {
  const n = nativeRequire('ssb-keys')
  if (n) return n
  console.warn('Using browserified ssb-keys')
  return require('ssb-keys')
}

console.warn('context requires ssb-keys')
const ssbKeys = SSBKeys() 

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
    ret.keys = ret.keys || ssbKeys.loadOrCreateSync('electroparty-keys')
    console.log('ep: config from url', ret)
    history.replaceState({}, '', document.location.href.replace(document.location.hash, ''))
    localStorage['electroparty-config'] = fromUrl
    return ret
  }
  const fromStorage = localStorage['electroparty-config']
  if (fromStorage) {
    ret = urlDecode(fromStorage)
    ret.keys = ret.keys || ssbKeys.loadOrCreateSync('electroparty-keys')
    console.log('ep: config from localStorage', ret)
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
module.exports.nativeRequire = nativeRequire
