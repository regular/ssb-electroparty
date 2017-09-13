const path = require('path')
console.log(process.version)

// if we are run by electron, the first argument is the path to the electron executable
// and the 2nd arg is our filename (index,js)
// If however, we ere packed as a native application, the first argument is that
// application's path and our index.js does not appear in the argv array
//
if (process.argv[0].split(path.sep).slice(-1)[0].toLowerCase() !== 'electron') {
  process.argv = [process.argv[0]].concat([`${__dirname}/index.js`]).concat(process.argv.slice(1))

}

console.log('fixed argv', process.argv)

if (process.argv.length<3) {
  console.log('adding default argument')
  process.argv.push(`${__dirname}/client.js`)
}
console.log('loading electro')
require('electro')

