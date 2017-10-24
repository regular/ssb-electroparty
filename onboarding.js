const fs = require('fs')
const path = require('path')

module.exports = function(ssb, config, print, messages, ips, cb) {
  if (!config.onboarding) return cb(new Error('No onboarding data in config'))
  let c = config.onboarding
  if (!c.inviteCode) print('no invite code in onboarding config')
  let follow = c.autofollow
  if (!(follow && follow.length>0)) return cb(new Error('No autofollow in onboarding config'))
  print('Onbarding ...')

  function next(err, result) {
    if (err) return cb(err)
    if (result) print(JSON.stringify(result))

    if (messages.pub === false) {
      if (!c.inviteCode) {
	 print('Skipping invite step.')
	 messages.pub = true
	 return next()
      }
      print(`Use invite code: ${c.inviteCode}`)
      ssb.invite.accept(c.inviteCode, (err, result) => {
        if (!err) messages.pub = true
        return next(err, result)
      })
    } else if (messages.about === false) {
      print('Publish about message')
      if (!c.about) return cb(new Error('no about in onboarding config'))
      if (!c.about.name) return cb(new Error('no about.name in onboarding config'))
      ssb.whoami( (err, feed) => {
        if (err) return cb(err)
        ssb.publish(Object.assign(c.about.includeIPs ? {ips} : {} , {
          type: 'about',
          about: feed.id,
          name: c.about.name,
          root: c.about.root,
          branch: c.about.branch
        }), (err, result) => {
          if (!err) messages.about = true
          next(err, result)
        })
      })
    } else if (messages.contact === false && follow.length) {
      // TODO: check to see if we already follow that feed or not
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
