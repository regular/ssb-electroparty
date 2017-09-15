document.write('hello world')
process.stdout.write('hello world\n')

const ssbClient = require('ssb-client')
const path = require('path')

let pre = document.createElement('pre')
document.body.appendChild(pre)

function print(s) {
  pre.innerText += s + '\n'
  process.stdout.write(s + '\n')
}

module.exports = function({sbotConfig, manifest}) {
  //print(JSON.stringify(sbotConfig, null, 2))
  print(`network key: ${sbotConfig.caps.shs}`)
  ssbClient(sbotConfig.keys, {
    caps: sbotConfig.caps,
    remote: sbotConfig.wsAddress,
    timers: {handshake: 30000},
    manifest: manifest
  }, (err, ssb) => {
    print(`err: ${err}`)
    if (err) return
    ssb.whoami( (err, feed) => {
      print(`err: ${err}`)
      if (err) return
      print(`your pubkey: ${feed.id}`)
    })
  })
}
