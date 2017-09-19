const electroparty = require('./client')

console.log('I am a dummy client')

electroparty( (err, ssb) => {
  if (err) return console.error(`Failed to connect to sbot from client: ${err.message}`)
  ssb.whoami( (err, feed) => {
    if (err) return console.errort(err.message)
    document.write(`<h1>your sbot's pubkey: ${feed.id}</h1>`)
  })
})

