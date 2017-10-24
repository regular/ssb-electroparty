const fs = require('fs')
const path = require('path')
const pull = require('pull-stream')
const many = require('pull-many')

module.exports = function(ssb, print, config, cb) {
  if (!config.bootloader) return cb(new Error('No bootloader data in config'))
  let c = config.bootloader
  print('Booting ...')
  let codeMessage = c.codeMessage
  if (!codeMessage) {
    return cb(new Error('No codeMessages specified bootloader in config'))
  }
  print(`Looking for client-update messages ${codeMessage} ...`)
  let synced = false
  let drain
  pull(
    ssb.createLogStream({live: true, sync: true}),
    pull.filter( kv => {
      //print(JSON.stringify(kv))
      if (kv.sync) {
        synced = true
        return false
      }
      return true
    }),
    drain = pull.drain( kv => {
      if (kv.key === codeMessage) {
        let codeBlob = kv.value.content && kv.value.content.code
        print(`clinet-update found, downloading blobId: ${codeBlob} ...`)
        ssb.blobs.want(codeBlob, err => {
          if (err) return cb(err)
          print('Download complete')
          cb(null, codeBlob)
        })
      }
    }, err => {
      if (err) return cb(err)
    })
  )
}
