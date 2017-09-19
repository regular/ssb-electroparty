# SSB Electroparty
Minimal(ish) sbot-in-electron setup

> NOTE: all this might change, the module is young.

> NOTE: this needs a patched version of ssb-party currently

Electroparty is a mashup of [electro](https://www.npmjs.com/package/electro) and [ssb-party](https://www.npmjs.com/package/ssb-party).
It is meant as a base for your next great SSB desktop client packed as an electron app. Additionally, it provides you with ways to deploy your client directly on ssb, so your users don't need to download anything from the centralised Internet to get updates of your ssb client! (if they already have Electroparty installed, the entire installation process does not need a traditional download-and-install ceremony at all - we can deploy sbb clients using our own app store kind of UI. Applications are indexhtmlified and packed into ssb blobs!)

Instead of bundling and controlling the lifetime of sbot (like patchwork does), electroparty checks whether an instance of sbot is already running and spawns one, if needed (like patchfoo does). The sbot instance runs in a headless electron process, no node is needed on the target machine. The sbot instnace outlivees your client. (it's a detached process) See ssb-party for details. You can stop an sbot instance started this way with `./sbot control.stop`. It automatically shutsdown after a configuratable idle time.

Because embedding sbot is done by electroparty, you can write 'isomorphic' clients that run in Electron as well as in the browser (then using a stand-alone sbot) or via http using an sbot on a pub. See dummy-client.js as an example of such a client.

# local config file

You can configure sbot and some aspects of electroparty in a local `config` file. This will not affect an sbot that already runs when your client starts. The config file is bundled with your client code. If electroparty starts sbot  and does not find a config file in `~/.{config.appName}/config`, it copies the local/bundled config file to that location. This allows you to interact with sbot from the command line. Use the provided `./sbot` script for convenience if you are using `ssb_appname` (non-standard ssb-network).

# Bootstraping

(TODO: this should probably be its own module)
A bootstrap script is provided that does two things:

## 1. Onboarding

After keys are generated or loaded in electron, the onboarding scripts checks for the existence of
- a pub message indicating that the feed is following a pub
- an about message authored by tha feed
- a contact message authored by the feed, indicating that it follows another (non-pub) feed

If one or more of these messages is not found, the missing ones are published using data found in a local `config` file. (one is provided for reference). The onboarding section looks like this:

```
  "onboarding": {
    "inviteCode": "pub.postpossessive.org:10000:@W0usBc5dFcUVSShld7ybYveGGhhZ1u6cLwFH6lYPCDo=.ed25519~lfg7zfhEIECym4xRRxf9FiOa9O7Hsi1LYhMiSRs1cmQ=",
    "name": "testperson",
    "autofollow": [
      "@nti4TWBH/WNZnfwEoSleF3bgagd63Z5yeEnmFIyq0KA=.ed25519",
      "@YWWdiYICsgdl884zIMjljdukzCHA2B8hnBzq3/em+pA=.ed25519"
    ]
  }
```

> Embedding an invite code and the name of the (future) ssb feed into the config file (and therefore into the application's binary) allows for an invite-by-email scenario: A user of your client wants to invite a friend to the network. They enter the friend's email address and name into a form. On the download-server/pub an invite code is created for this user and put into a config file, along with that friends's name and the feedid of the inviting user. An email is sent out to the friend containing a download URL that encodes that config file's data (new user's name, invite code, inviting user's feedid). If that link is clicked, a customized zipfile is created (replacing files in a zip is much faster than repacking the entire application). If the new user runs the application, they will automatically accpet the invite code, follow their friend and post an about message with their name. (or rather be presented with an input field pre-filled with their name or something similar)

## 2. Bootloading

After onboarding was successful (or was deemed unnecessary), the bootloading script retrieves an ssb message specified in the `config` file (bootloader.codeMessage). This message should have a `content.codeBlob` property that referes to a blob containing html. If the blob was downloaded successfully, the browser is redirected to the blob url, i.e. your application gets loaded and takes over. You can build an auto-update feature into your app, that keeps leeoking for incoming code messages (auhtored by you). See [ssb-cms](https://github.com/regular/ssb-cms) as an example.

This is how the bootloader section in `config` looks like:

```
  "bootloader": {
    "codeMessage": "%l8n4T9Y6UxXj66rWAq8QwoHhK0cwev5c0JpUOZj4ajs=.sha256"
  }
```

# npm scripts

- `npm run rebuild` -- rebuild native modules for the node runtime bundled with electron
- `npm run build` -- build `electroparty.html` (needed by the other scripts)
- `npm start` -- run index.js and bootstrap.js in electron (depending on your `config` filr , this boots into a client deployed to ssb
- `npm run pack` -- run electron-packager and get distrubitable binary for the platform you are working on
- `npm run pack-all` -- same for all platforms supported by electron-packager (untested)
- `npm run deploy-client` -- browserify and indexhtmlify dummy-client.js and deploy as a blob to ssb
- `npm run dev-client` -- run dummy-client.js in tour browser, for development

# Additional properties in config

 - `appName`, like the environment variable `ssb_appname`, lets tou specify where sbot looks for its config

There's a script that takes appName form the  `config` file in the current working directory and runs sbot. Example: `./sbot whoami`
