const { app, BrowserWindow } = require('electron');
const ElectronPath = require('path');

let safeToClose = false;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    minHeight: 560,
    minWidth: 860,
    autoHideMenuBar: true,
    backgroundColor: '#16171b',
    webPreferences: {
      preload: ElectronPath.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(ElectronPath.join(__dirname, 'index.html'));

  actionOnLoad();
  mainWindow.on('close', actionOnClose); // register evt after window creation
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  app.quit();
  // }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const actionOnClose = (evt) => {
  const { SaveSettings } = require('./event-handler');
  if (!safeToClose) {
    evt.preventDefault();
    SaveSettings("winPosX", mainWindow.getPosition()[0]);
    SaveSettings("winPosY", mainWindow.getPosition()[1]);
    SaveSettings("winSizeX", mainWindow.getContentSize()[0]);
    SaveSettings("winSizeY", mainWindow.getContentSize()[1]);
    SaveSettings("maximized", mainWindow.isMaximized());
    mainWindow.webContents.send('onCloseEvt');
    safeToClose = true;
  }
}

const actionOnLoad = async () => {
  const { LoadSettings } = require('./event-handler');
  const [width, height, posX, posY, maximized] = await Promise.all([
    LoadSettings("winSizeX"),
    LoadSettings("winSizeY"),
    LoadSettings("winPosX"),
    LoadSettings("winPosY"),
    LoadSettings("maximized"),
  ]);
  if (width != null && height != null) mainWindow.setContentSize(width, height);
  if (posX != null && posY != null)    mainWindow.setPosition(posX, posY);
  if (maximized)                       mainWindow.maximize();
}

const getMainWin = () => mainWindow;
const getPath = (name) => app.getPath(name);
const getAppPath = () => app.getAppPath();

module.exports = {
  getMainWin,
  getPath,
  getAppPath,
};
