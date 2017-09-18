const path = require('path')
const ssbClient = require('ssb-client')
const pull = require('pull-stream')

let pre = document.createElement('pre')
document.body.appendChild(pre)

function print(s) {
  pre.innerText += s + '\n'
  process.stdout.write(s + '\n')
}

module.exports = function({keys, sbotConfig, manifest}) {
  //print(JSON.stringify(sbotConfig, null, 2))
  print(`argv: ${process.argv.join(' ')}`)
  print(`appName: ${sbotConfig.appName}`)
  print(`product name: ${sbotConfig.productName}`)
  print(`network key: ${sbotConfig.caps.shs}`)
  print(`browser pubkey: ${keys.public}`)
  ssbClient(keys, {
    caps: sbotConfig.caps,
    remote: sbotConfig.wsAddress,
    timers: {handshake: 30000},
    manifest: manifest
  }, (err, ssb) => {
    ssb.whoami( (err, feed) => {
      if (err) return print(err.message)
      print(`your sbot's pubkey: ${feed.id}`)

      let requiredMsgTypes = {
        about: false,
        pub: false,
        contact: false
      }

      let drain
      pull(
        ssb.createHistoryStream({id: feed.id}),
        pull.filter( kv => {
          let t = kv.value.content && kv.value.content.type
          if (Object.keys(requiredMsgTypes).includes(t) && requiredMsgTypes[t] === false) {
            if (t === 'contact' && kv.value.content.autofollow) return false
            requiredMsgTypes[t] = kv.value.sequence
            print(`Found ${t} message with sequence number ${kv.value.sequence}`)
            if (!Object.values(requiredMsgTypes).includes(false)) drain.abort()
            return true
          }
          return false
        }),
        drain = pull.drain( kv => {
        }, err => {
          if (err) return print(err)
          if (Object.values(requiredMsgTypes).includes(false)) {
            print('Needs onboarding')
          } else {
            print('Does not need onboarding')
          }
        })
      )
    })
  })
}
