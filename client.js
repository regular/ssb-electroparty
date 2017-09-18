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
  print(`argv: ${process.argv.join(' ')}`)
  print(`appName: ${sbotConfig.appName}`)
  print(`product name: ${sbotConfig.productName}`)
  print(`network key: ${sbotConfig.caps.shs}`)
  let keys = sbotConfig.keys
  delete sbotConfig.keys
  ssbClient(keys, {
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
