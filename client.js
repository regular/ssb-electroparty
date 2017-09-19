const path = require('path')
const ssbClient = require('ssb-client')
const pull = require('pull-stream')
const querystring = require('querystring')

const onboarding = require('./onboarding')
const bootloader = require('./bootloader')

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
    if (err) return print(`Failed to connect to sbot from client: ${err.message}`)
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
            onboarding(ssb, print, requiredMsgTypes, (err) => {
              if (err) return print(`Onboarding failed: ${err.message}`)
              print('Onboarding successful!')
              run()
            })
          } else {
            print('Does not need onboarding')
            run()
          }
        })
      )

      function run() {
        bootloader(ssb, print, {keys, sbotConfig, manifest}, (err, codeBlob) => {
          if (err) return print(`Bootloader failed: ${err.message}`)
          const url = `http://${sbotConfig.host || 'localhost'}:${sbotConfig.ws.port}/blobs/get/${codeBlob}`
          print(`Loading ${url}`)
          let configB64 = Buffer.from(JSON.stringify({keys, sbotConfig, manifest})).toString('base64')
          let fragment = querystring.stringify({s:configB64})
          document.location.href = `${url}#${fragment}`
        })
      }

    })
  })
}
