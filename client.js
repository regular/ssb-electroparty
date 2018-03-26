const Context = require('./context')
const nativeRequire = Context.nativeRequire

function SSBClient() {
  const n = nativeRequire('ssb-client')
  if (n) return n
  // for the browser, we rely on browserify
  console.warn('using browserified ssb-client')
  return require('ssb-client')
}

const ssbClient = SSBClient()
const merge = require('deep-extend')

module.exports = function(opts, cb) {
  if (typeof opts === 'function') {cb = opts; opts = {}}
  opts = opts || {}
  const c = Context()
  const {keys, sbotConfig, manifest} = c
  merge(sbotConfig, {
    remote: sbotConfig.wsAddress,
    timers: {handshake: 30000},
    manifest: manifest
  }, opts)
  ssbClient(keys, sbotConfig, cb)
}

