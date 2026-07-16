const { app, BrowserWindow } = require('electron');
const ElectronPath = require('path');

let safeToClose = false;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) {
  app.quit();
}

const handleSize = (mainWin) => {
  mainWin.on('resize', () => {
    const size = mainWin.getContentSize();
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
    autoHideMenuBar: true,
    webPreferences: {
      preload: ElectronPath.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(ElectronPath.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  actionOnLoad().then(() => {
    handleSize(mainWindow);
  });
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const createFilterWindow = () => {
  // Create the browser window.
  const filterWindow = new BrowserWindow({
    width: 400,
    height: 400,
    minHeight: 400,
    minWidth: 400,
    alwaysOnTop: true,
    minimizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: ElectronPath.join(__dirname, 'preload.js'),
    },
  });

  filterWindow.loadFile(ElectronPath.join(__dirname, 'filters.html'));
  return filterWindow;
};

const createAutoRspWindow = () => {
  // Create the browser window.
  const filterWindow = new BrowserWindow({
    width: 400,
    height: 400,
    minHeight: 400,
    minWidth: 400,
    alwaysOnTop: true,
    minimizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: ElectronPath.join(__dirname, 'preload.js'),
    },
  });

  filterWindow.loadFile(ElectronPath.join(__dirname, 'autoResponse.html'));
  return filterWindow;
};

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
  createFilterWindow,
  createAutoRspWindow,
};
