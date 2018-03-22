const pull = require('pull-stream')
const Context = require('./context')

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

// returns a pull-through, requires sync
function latestWebApp(author, appId, codeBranch, onFoundUpdate) {
  let latestUpdate = null
  let synced = false

  return pull.through( kv =>{
    if (kv.sync) {
      synced = true
      if (latestUpdate) {
        return onFoundUpdate(latestUpdate)
      }
    } else {
      if (
        kv.value.author === author &&
        kv.value.content.appId === appId &&
        kv.value.content.codeBranch === codeBranch
      ) {
        latestUpdate = kv
        if (synced) return onFoundUpdate(latestUpdate)
      }
    }
  })
}

module.exports = function(ssb, print, context, cb) {
  const config = context.sbotConfig
  cb = once(cb)
  if (!config.bootloader) return cb(new Error('No bootloader data in config'))
  let c = config.bootloader

  let webapp = c.webapp
  let url = c.url
  if (!webapp && !url) {
    return cb(new Error('No webapp and no url specified in bootloader in config'))
  }
  if (url) return cb(null, url)

  if (!webapp.author)
    return cb(new Error('No author specified in webapp in bootloader config'))
  if (!webapp.appId)
    return cb(new Error('No appId specified in webapp in bootloader config'))
  if (!webapp.codeBranch)
    return cb(new Error('No codeBranch specified in webapp in bootloader config'))

  print('Booting ...')

  print("Looking for webapp matching these criteria")
  print(JSON.stringify(webapp, null, 2))

  let found = false
  pull(
    ssb.createUserStream({id: webapp.author, live: true, sync: true}),
    latestWebApp(webapp.author, webapp.appId, webapp.codeBranch, kv => {
      found = true
      let codeBlob = kv.value.content && kv.value.content.code
      print(`latest webapp found, downloading blobId: ${codeBlob} ...`)
      //ssb.blobs.want(codeBlob, err => {
        //if (err) return cb(err)
        //print('Download complete')
        const url = Context.makeWebappURL(kv, context)
        cb(null, url, kv)
      //})
    }),
    pull.drain( kv => {
      if (kv.sync) {
        if (!found) print('No matching webapp found locally. Waiting for deployment ...')
      } else if (kv.value.content.type === 'webapp') {
        const c = kv.value.content
        print(`${kv.value.sequence} ${new Date(kv.value.timestamp).toISOString()} ${c.codeBranch || 'no branch'} ${ (c.appId || 'no appId').substr(0, 8)}`)
      }
    }, cb)
  )
}

module.exports.latestWebApp = latestWebApp
