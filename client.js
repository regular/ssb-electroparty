document.write('hello world')
process.stdout.write('hello world\n')

const ssbClient = require('ssb-client')
const path = require('path')

let pre = document.createElement('pre')
document.body.appendChild(pre)

function print(s) {
  pre.innerText += s + '\n'
}

module.exports = function(config) {
  print(JSON.stringify(config, null, 2))
  ssbClient( (err, ssb) => {
    print(`err: ${err}`)
    if (err) return
    ssb.whoami( (err, feed) => {
      print(`err: ${err}`)
      if (err) return
      print(`your pubkey: ${feed.id}`)
    })
  })
}
