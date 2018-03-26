const path = require('path')
const ssbClient = require('ssb-client')
const pull = require('pull-stream')
const querystring = require('querystring')

const onboarding = require('./onboarding')
const bootloader = require('./bootloader')

let pre = document.createElement('pre')
document.body.appendChild(pre)
document.body.style.backgroundColor = '#002833'
pre.style.color = '#839496'
pre.style.backgroundColor = '#002833'
pre.style.fontWeight = 800

function print(s) {
  pre.innerText += s + '\n'
  process.stdout.write(s + '\n')
}

module.exports = function({keys, sbotConfig, manifest, ips}) {
  print(`argv: ${process.argv.join(' ')}`)
  print(`appName: ${sbotConfig.appName}`)
  print(`product name: ${sbotConfig.productName}`)
  print(`network key: ${sbotConfig.caps.shs}`)
  print(`browser pubkey: ${keys.id}`)
  print('network interfaces:')
  ips.forEach( ({name, address}) => {
    print(`- ${name}: ${address}`)
  })
  print(`about.name: ${sbotConfig.onboarding && sbotConfig.onboarding.about.name}`)
  ssbClient(keys, {
    caps: sbotConfig.caps,
    remote: sbotConfig.wsAddress,
    timers: {handshake: 30000},
    manifest: manifest
  }, (err, ssb) => {
    if (err) return print(`Failed to connect to sbot from client: ${err.message}`)
    // TODO: implement version command in sbot
    //ssb.version( (err, version) => {
      //if (err) return print(`Failed to get sbot version: ${err.message}`)
      //print(`scuttlebot version: ${version}`)
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
          drain = pull.drain( kv => { }, err => {
            if (err) return print(err)
            if (Object.values(requiredMsgTypes).includes(false)) {
              print('Needs onboarding')
              if (sbotConfig.onboarding) {
                onboarding(ssb, sbotConfig, print, requiredMsgTypes, ips, (err) => {
                  if (err) return print(`Onboarding failed: ${err.message}`)
                  print('Onboarding successful!')
                  run()
                })
              } else {
                print('No onboarding data in config -- skipping')
                run()
              }
            } else {
              print('Does not need onboarding')
              run()
            }
          })
        )

        function run() {
          const context = {keys, sbotConfig, manifest, versions: process.versions}
          bootloader(ssb, print, context, (err, url) => {
            if (err) return print(`Bootloader failed: ${err.message}`)
            if (ssb.control) {
              print('(times out after 30 seconds)')
              setTimeout( ()=>{
                // if we are still here after 30 seconds
                // we stop the sbot, which will cause
                // all processes except the watchdog to quit (well ... crash)
                // This hupefullt fixes a situation where sbot
                // simply does not sync anymore and we wait for
                // the code blob indefinitely.
                ssb.control.stop()
              }, 30000)
            } else {
              print('(does not time out, because sbot does not support control.stop)')
            }
            setTimeout( ()=>{
              document.location.href = url
            }, 100)
          })
        }

      })
    //})
  })
}
