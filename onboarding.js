const fs = require('fs')
const path = require('path')

module.exports = function(ssb, print, messages, cb) {
  let config = JSON.parse(fs.readFileSync('config'))
  if (!config.onboarding) return cb(new Error('No onboarding data in config'))
  let c = config.onboarding
  let follow = c.autofollow
  if (!(follow && follow.length>0)) return cb(new Error('No autofollow in onboarding config'))
  print('Onbarding ...')

  function next(err, result) {
    if (err) return cb(err)
    if (result) print(JSON.stringify(result))

    if (messages.pub === false) {
      print(`Use invite code: ${c.inviteCode}`)
      if (!c.inviteCode) return cb(new Error('no invite code in onboarding config'))
      ssb.invite.accept(c.inviteCode, (err, result) => {
        if (!err) messages.pub = true
        return next(err, result)
      })
    } else if (messages.about === false) {
      print('Publish about message')
      if (!c.name) return cb(new Error('no name in onboarding config'))
      ssb.publish({
        type: 'about',
        name: c.name
      }, (err, result) => {
        if (!err) messages.about = true
        next(err, result)
      })
    } else if (messages.contact === false && follow.length) {
      let feed = follow.shift()
      print(`Follow ${feed}`)
      ssb.publish({
        type: "contact",
        contact: feed,
        following: true,
        blocking: false
      }, next)
    } else cb(null)
  }
  next()
}
