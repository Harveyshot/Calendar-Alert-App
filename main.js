const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
let mainWindow;
let alertWindows = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'icon.ico'),
    show: false,
    titleBarStyle: 'default'
  });

  mainWindow.webContents.session.clearCache().then(() => {
    mainWindow.loadFile('CalendarCo.html');
});
  

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (process.platform === 'darwin') app.dock.show();
  });

  Menu.setApplicationMenu(null);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createAlertWindow(eventData) {
  const alertWin = new BrowserWindow({
    width: 340,
    height: 380,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: true,
    transparent: false,
    hasShadow: true,
    movable: true,
    show: false,
	focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  alertWin.loadFile('alert.html');

    alertWin.once('ready-to-show', () => {
    alertWin.show();
    alertWin.setAlwaysOnTop(true, 'screen-saver');
    alertWin.moveTop();
    alertWin.focus();
    alertWin.flashFrame(true);
    alertWin.webContents.send('event-data', eventData);
	
  });

  // Re-assert always-on-top if another window tries to cover it
let dropdownOpen = false;

alertWin.on('blur', () => {
    if (!alertWin.isDestroyed() && !dropdownOpen) {
        alertWin.setAlwaysOnTop(true, 'screen-saver');
       
	   }
});

  // Belt-and-suspenders: some Windows/Electron combinations don't reliably
  // fire 'blur' when another window quietly covers this one, so also
  // re-assert on a short timer while the alert is open.
  const topmostInterval = setInterval(() => {
    if (alertWin.isDestroyed()) {
      clearInterval(topmostInterval);
      return;
    }
    alertWin.setAlwaysOnTop(true, 'screen-saver');
    alertWin.moveTop();
  }, 1000);

  alertWin.on('closed', () => {
    clearInterval(topmostInterval);
    alertWindows = alertWindows.filter(w => w !== alertWin);
  });

  alertWindows.push(alertWin);
  return alertWin;
}

ipcMain.on('alert-accepted', (event, data) => {
  if (mainWindow) mainWindow.webContents.send('alert-accepted-main', data);
});

ipcMain.on('close-alert-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) { win.flashFrame(false); win.close(); }
});

ipcMain.on('alert-snoozed', (event, data) => {
  if (mainWindow) mainWindow.webContents.send('alert-snoozed-main', data);
});


ipcMain.on('show-alert', (event, eventData) => {
  createAlertWindow(eventData);
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => { event.preventDefault(); });
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});
