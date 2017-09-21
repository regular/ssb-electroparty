#!/usr/bin/env node
const fs = require('fs')
const merge = require('deep-extend')

if (process.argv.length < 3) {
  console.error('specify a number')
  process.exit(1)
}

const i = +process.argv[2]
console.error('Making config for test network', i)
const appKey = Buffer.from([i, ...new Array(31).fill(0)]).toString('base64')

const pubConfig = {
  "caps": {
    "shs": appKey,
  },
  "port": 11000 + i,
  "ws": {
    "port": 12000 + i
  },
  "timers": {
    "handshake": 30000
  },
  "blobs": {
    "legacy": false,
    "sympathy": 10,
    "max": 104857600
  }
}

const localConfig = merge({}, pubConfig, {
  "width": 1120,
  "height": 653,
  "dev": true,
  "appName": `ssb-testnet-${i}`,
  "productName": `ssb-testnet-${i}`,
  "party": {
    "out": false
  },
  "host": "127.0.0.1",
  "allowPrivate": true,
  "timers": {
    "handshake": 30000,
    "keepalive": 240000
  },
  "cms": {
    "root": "%HBQXn4hHFwQxy1ULBr6qLALOBPBP/P5Ue4mWSspblz0=.sha256"
  },
  "onboarding": {
    "inviteCode": "xxx",
    "about": {
      "root": "%HBQXn4hHFwQxy1ULBr6qLALOBPBP/P5Ue4mWSspblz0=.sha256",
      "branch": "%RroaUJpcn/S6CZT2hrsZzxGXq9uSE+HT49fE0MdvmIg=.sha256",
      "name": "Testperson 1"
    },
    "autofollow": [
      "@nti4TWBH/WNZnfwEoSleF3bgagd63Z5yeEnmFIyq0KA=.ed25519",
      "@YWWdiYICsgdl884zIMjljdukzCHA2B8hnBzq3/em+pA=.ed25519"
    ]
  }
})

fs.writeFileSync('testnet-config', JSON.stringify(localConfig, null, 2))
fs.writeFileSync('testnet-config.pub', JSON.stringify(pubConfig, null, 2))
