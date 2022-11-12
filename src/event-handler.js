const { ipcMain, shell } = require('electron');
const { userSaveFile } = require('./dialogWindow');
const index = require('./index');
const { FileHandler } = require('./fileHandler');
const { PortHandler } = require('./portHandler');

const mainWindow = index.getMainWin();

const fileHandler = new FileHandler(index);
const portHandler = new PortHandler(mainWindow, fileHandler);

ipcMain.handle('populateDD', () => {
    return new Promise((resolve) => {
        resolve(portHandler.PortList());
    });
});

ipcMain.handle('setPrmsAndConnect', (event, args) => {
    portHandler.changePort = args[0];
    portHandler.changeBaud = Number(args[1]);
    const retVal = portHandler.open();

    return new Promise((resolve, reject) => {
        retVal.then(() => {
            resolve();
        }).catch((err) => {
            portHandler.cleanUp();
            reject(err);
        })
    })    
});

ipcMain.on('sendMsg', (event, args) => {
    portHandler.sendMsg(args[0]);
});

ipcMain.on('disconnectPort', () => {
    portHandler.close();
});

ipcMain.on('restartEvt', (event, args) => {
    portHandler.restart(args);
});

ipcMain.handle('updateSizeOnLoad', async () => {
    let sz = mainWindow.getContentSize();
    return new Promise((resolve) => {
      resolve(sz);
    })
});

ipcMain.on('timeStamp', (event, args) => {
    fileHandler.setTSFlag = args[0];
});

ipcMain.on('hexCheck', (event, args) => {
    fileHandler.setHexFlag = args[0];
})

ipcMain.on('openFile', () => {
    shell.openPath(fileHandler.currFullPath);
});

ipcMain.handle('selectFile', () => {
    return new Promise((resolve) => {
        if (fileHandler.getLogToFile == true) {
            fileHandler.setLogToFile = false;
            fileHandler.restoreCurrFileLoc();
            return resolve(false);
        }
        const selectFile = userSaveFile(fileHandler.currFileLoc + '\\' + fileHandler.getDefFileName);
        selectFile.then(({filePath}) => {
            fileHandler.setCurrFilePath = filePath;
            fileHandler.setLogToFile = true;
            fileHandler.createNewFile();
            resolve(true);
        }).catch(() => {
            fileHandler.setLogToFile = false;
            fileHandler.restoreCurrFileLoc();
            resolve(false);
        })
    });
});

let filterWin;

ipcMain.on('openFilters', (event, args) => {
    // mainWindow.setSize(200, 400);
    // mainWindow.setMinimumSize(200, 400); // in dire need of normal resizing in future
    filterWin = index.createFilterWindow();
    mainWindow.setMovable(false);
    mainWindow.setMinimizable(false);
    ipcMain.handle('filtersLoaded', () => {
        return new Promise((resolve) => {
            resolve(args[0]);
        })
    });
    filterWin.on('closed', () => {
        ipcMain.removeHandler('filtersLoaded');
        mainWindow.setMovable(true);
        mainWindow.setMinimizable(true);
        filterWin = null;
    }); // sukurt klase, kuri kursis vis nauja i lista kai pasispaus pliusas ir ez pz
});

ipcMain.on('saveSettings', (event, args) => {
    let destination = args[0];
    let values = args[1];
    console.log(settingsHandler.filePath);

});

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas
  // spalvu filtra ir autoresponsus tiesiog padaryt viena ir tada pliusiukas dameta eilute ir taip iki begalybes ir pohui