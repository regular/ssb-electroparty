const streams = require('stream')
const ipc = require('electron').ipcRenderer
const ssbKeys = require('ssb-keys')

const opts = require('querystring').parse(decodeURIComponent(location.search.substring(1)))

process.argv = opts.argv
process.stdin.isTTY = opts.stdin == 'true'
process.stdout.isTTY = opts.stdout == 'true'
process.stderr.isTTY = opts.stderr == 'true'

process.title = 'electroparty'

var stdin = process.stdin

stdin._read = function () {
  this.push('')
}

ipc.on('process.stdin', function (data, data2) {
  if('string' == typeof data2)
    stdin.push(new Buffer(data2, 'base64'))
  else if('string' === typeof data)
    stdin.push(new Buffer(data1, 'base64'))
  else stdin.push(null)
})

function stdo (name) {
  var stream = process[name] =  new streams.Writable()
  var event = 'process.'+name
  stream._write = function (data, enc, callback) {
    if(Buffer.isBuffer(data))
      ipc.send(event, data.toString('base64'))
    else
      ipc.send(event, new Buffer(data, enc || 'utf8').toString('base64'))
    callback()
  }
}

stdo('stdout')
stdo('stderr')

const keys = ssbKeys.loadOrCreateSync('electroparty-keys')
ipc.send('pubkey', keys.public)

ipc.on('sbot.config', function (_, json) {
  let config = JSON.parse(json)
  config.keys = keys
  require(require('path').resolve(process.argv[1]))(config)
})
