const ssbClient = require('ssb-client')
const merge = require('deep-extend')
const getContext = require('./context')

module.exports = function(opts, cb) {
  if (typeof opts === 'function') {cb = opts; opts = {}}
  opts = opts || {}
  const c = getContext()
  const {keys, sbotConfig, manifest} = c
  merge(sbotConfig, {
    remote: sbotConfig.wsAddress,
    timers: {handshake: 30000},
    manifest: manifest
  }, opts)
  ssbClient(keys, sbotConfig, cb)
}

