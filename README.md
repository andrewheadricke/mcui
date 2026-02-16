MCUI
====
A MeshCore compatible UI.

This client essentially turns the MeshCore radio into a dumb modem, simply using RXLog and SendRawPacket only. The hardware private key is not used and no syncing of nodes or messages takes place.

All app data (radios, identites, contacts etc) is stored in the browsers localStorage

### Features

* Meshcore over Websocket support
* Multiple radios, with auto-connect for Websocket radios
* Multiple identities, including importing existing MeshCore identities
* Browser side cryptography, AES, ed25519, x25519, hmac
* Passive link/route mapping
* Decrypt all traffic for which a private key/secrets are known
* Responsive UI, looks great on mobile and desktop

### Notes

* Requires a MeshCore firmware with SEND_RAWPACKET support, otherwise will operate in READONLY mode.
* A small (1 line) patch to @noble/ed25519 is required for MeshCore public key derivation to work properly.
* Requires meshcore.js with WebSocket support (currently not merged)

### Build
```
git clone ....  
npm i
npm run patch
npx vite build
```

### Ways to use/install this app
* Hosted or self hosted website (https://mcui.canop2p.com)
* Installed PWA for Desktop & Phone (https://mcui.canop2p.com)
* Android wrapped webview app (https://zapstore.dev/apps/naddr1qvzqqqr7pvpzp0m4lv26wskze24h697t8m0euacr9hyj2fzgwkey2sg2ms5ljhkhqqgxxmmd9e3kzmn0wqe8qtndvd6kjn7cd92)
* Electron (raw html files, bundled asar, or a full electron bundle)

### HTTP Security issues

If accessing from https/pwa you may only be able to connect to secure (wss://) or ws://localhost websockets.
Here are two workarounds:

* add the websocket url to the exceptions list in the browser  
  `brave://flags/#unsafely-treat-insecure-origin-as-secure`

* use a locally run port bouncer with socat  
  `socat TCP-LISTEN:5000,reuseaddr,fork TCP:192.168.0.<your host>:5000`