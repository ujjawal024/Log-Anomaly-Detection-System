const { app, BrowserWindow } = require('electron');
const path = require('path');
app.whenReady().then(() => {
  let win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile('index.html');
  win.webContents.on('console-message', (e, l, m) => console.log('RENDERER MSG:', m));
  win.webContents.on('did-fail-load', (e, code, desc) => console.log('FAIL LOAD:', desc));
  win.webContents.on('crashed', () => console.log('CRASHED'));
  win.webContents.on('plugin-crashed', () => console.log('PLUGIN CRASHED'));
  setTimeout(() => app.quit(), 5000);
});
