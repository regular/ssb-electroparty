const path = require('path')
const qs = require('querystring')
const Obv = require('obv')

var argv = []
function processArgv() {
  var _argv = []

  var i = process.argv.indexOf('--')

  if(~i) {
    argv = process.argv.slice(2, i)
    _argv = process.argv.slice(i + 1)
  }
  else
    argv = process.argv.slice(2)

  var opts = require('minimist')(_argv)
  argv.unshift('electroparty')
  return opts
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;
var electron = require('electron')
var BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
let ready = Obv()
var app = electron.app;  // Module to control application life.
app.on('ready', () => ready.set(true) )

function openWindow(opts, cb) {
  console.log('Waiting for ready')
  ready.once( ()=> {
    console.log('electron ready')

    app.on('window-all-closed', function() {
      app.quit();
    });

    process.removeAllListeners('uncaughtException')
    process.removeAllListeners('exit')

    process.stdin.pause()

    mainWindow = new BrowserWindow(opts)
    mainWindow.setMenu(null)

    mainWindow.webContents.on('new-window', function (e, url) {
      // open in the browser
      e.preventDefault()
      electron.shell.openExternal(url)
    })

    if (opts.dev) {
      mainWindow.webContents.openDevTools()
    }
      
    mainWindow.on('closed', function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    })

    // shouldn't be needed but is.
    // https://github.com/electron/electron/issues/4932
    if (opts.width && opts.height && opts.enableLargerThanScreen) {
      mainWindow.setContentSize(opts.width, opts.height)
    }

    cb(null, mainWindow)
  })
}

function loadWebContent(filename, cb) {
  console.log(`loading ${filename} ...`)

  var proc = { argv: argv }
  proc.stdin = process.stdin.isTTY
  proc.stderr = process.stderr.isTTY
  proc.stdout = process.stdout.isTTY

  console.log('proc', proc)

  mainWindow.loadURL('file://' + path.join(__dirname, filename) + '?' +
  encodeURIComponent(qs.stringify(proc)));

  let handledDomReady = false
  mainWindow.webContents.on('dom-ready', function () {
    if (handledDomReady) return
    handledDomReady = true
    console.log('dom ready')
    process.stdin
      .on('data', function (data) {
        mainWindow.send('process.stdin', data.toString('base64'))
      })
      .on('end', function () {
        mainWindow.send('process.stdin', null)
      })
      .resume()

    var ipc = electron.ipcMain
    ipc.on('process.stdout', function (s, data) {
      process.stdout.write(new Buffer(data, 'base64'))
    })

    ipc.on('process.stderr', function (s, data) {
      process.stderr.write(new Buffer(data, 'base64'))
    })
    cb(null)
  })

}

module.exports = {
  ready,
  electron,
  processArgv,
  openWindow,
  loadWebContent
}
