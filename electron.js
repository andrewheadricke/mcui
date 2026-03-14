const { app, BrowserWindow, Notification, session } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    icon: './mcui.svg',
    width: 1024,
    height: 768,
  })
  win.setMenu(null)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type == "keyDown" && input.control) {
      if (input.key == "d") {
        win.webContents.openDevTools();
      }
    }
  })

  const filter = {
    urls: ['https://*/*']
  };
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['Referer'] = 'https://mcui.canop2p.com';
    // You can also set an Origin header if needed
    // details.requestHeaders['Origin'] = 'https://www.your-custom-referer.com';   
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  win.loadFile('dist/index.html')
  
  /*app.setBadgeCount(10)
  const myNotification = new Notification({
    title: 'New Alert',
    body: 'This is a notification from the main process.',
    // Optional: Add an icon path
    // icon: path.join(__dirname, 'icon.png')
  });

  myNotification.show();
  */
}

app.whenReady().then(() => {
  createWindow()
})
