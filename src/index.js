const { app, BrowserWindow, ipcMain } = require('electron');
const ElectronPath = require('path');
const serPort = require('serialport');
const { SerialPort, ReadlineParser } = require('serialport');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) {
  app.quit();
}

const handleSize = (mainWin) => {
  mainWin.on('resize', () => {
    size = mainWin.getSize();
    mainWin.webContents.send('resizeEvt', size);
  });
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      preload: ElectronPath.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(ElectronPath.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  handleSize(mainWindow);

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle('updateSizeOnLoad', async () => {
  let sz = mainWindow.getSize();
  return new Promise((resolve) => {
    resolve(sz);
  })
});

ipcMain.handle('populateDD', async () => {
  const portList = serPort.SerialPort.list();
  return new Promise((resolve, reject) => {
    resolve(portList);
  });
});

let SPort;
let parser;
let baudNum;

ipcMain.on('setPrmsAndConnect', (event, port, baud) => {
  baudNum = Number(baud);
  SPort = new SerialPort({ path: port, baudRate: baudNum });
  parser = new ReadlineParser();
  SPort.pipe(parser);

  parser.on("data", (line) => {
    mainWindow.webContents.send('printLn', line);
  });
});

ipcMain.on('disconnectPort', () => {
  SPort.close();
  SPort = null;
  parser = null;
});

ipcMain.on('rtsEvt', (event, set) => {
  if (SPort == null) return;
  console.log("RTS", set);
  SPort.set({rts: set});
});

ipcMain.on('dtrEvt', (event, set) => {
  if (SPort == null) return;
  console.log("DTR", set);
  SPort.set({dtr: set});
});
//todo autoresponsus pagal tai ka mato terminale. Cool featuresas