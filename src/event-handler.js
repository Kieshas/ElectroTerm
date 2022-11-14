const { ipcMain, shell } = require('electron');
const { userSaveFile } = require('./dialogWindow');
const index = require('./index');
const { FileHandler } = require('./fileHandler');
const { PortHandler } = require('./portHandler');

const mainWindow = index.getMainWin();
const settingsFile = (index.getPath('userData') + '/settings.txt');

const fileHandler = new FileHandler(index, settingsFile);
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
    const DtrRts = args[0];
    console.log(DtrRts);
    if (DtrRts === 'DTR') {
        console.log("DTR evt" + args[1]);
        portHandler.DTREvt(args[1]);
    } else {
        console.log("RTS evt" + args[1]);
        portHandler.RTSEvt(args[1]);
    }
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
            fileHandler.restoreCurrLogFileLoc();
            return resolve(false);
        }
        const selectFile = userSaveFile(fileHandler.currFileLoc + '\\' + fileHandler.getDefFileName);
        selectFile.then(({filePath}) => {
            fileHandler.setCurrFilePath = filePath;
            fileHandler.setLogToFile = true;
            fileHandler.createNewLogFile();
            resolve(true);
        }).catch(() => {
            fileHandler.setLogToFile = false;
            fileHandler.restoreCurrLogFileLoc();
            resolve(false);
        })
    });
});

ipcMain.on('openFilters', (event, args) => {
    let filterWin;
    filterWin = index.createFilterWindow();
    mainWindow.setMovable(false);
    mainWindow.setMinimizable(false);
    ipcMain.handle('filtersLoaded', () => {
        return new Promise((resolve) => {
            let savedFilters;
            try {
                savedFilters = JSON.parse(fileHandler.readFile(settingsFile));
                savedFilters = savedFilters.filters;
            } catch {
                savedFilters = null;
            }
            retval = [args[0], savedFilters];
            resolve(retval);
        })
    });
    filterWin.on('closed', () => {
        ipcMain.removeHandler('filtersLoaded');
        mainWindow.setMovable(true);
        mainWindow.setMinimizable(true);
        filterWin = null;
    });
});

ipcMain.on('saveSettings', (event, args) => {
    let destination = args[0];
    let fileCont;
    let fileObj = {
        filters: null,
        macros: null,
    };
    try {
        fileCont = JSON.parse(fileHandler.readFile(settingsFile));
    } catch {
        fileCont = null;
    }
    if (fileCont != null) { // not sure if this will work with more settings. For a later date
        fileObj = fileCont;
    }

    switch (destination) {
        case "filterSettings":
            fileObj.filters = args[1];
            portHandler.updateFilters(fileObj.filters);
            break;
        case "macroSettings":
            fileObj.macros = args[1];
            break;
        default:
            break;
    }
    fileHandler.writeFile(settingsFile, "");
    fileHandler.appendFile(settingsFile, (JSON.stringify(fileObj, null, 4)));
});

ipcMain.handle('requestSettings', (event, args) => {
    let destination = args[0];
    return new Promise((resolve) => {
        let fileContent = null;
        try {
            fileContent = JSON.parse(fileHandler.readFile(settingsFile));
        } catch {
            fileContent = null;
            resolve(null);
        }
        switch(destination) {
            case "macroSettings":
                resolve(fileContent.macros);
                break;
            default:
                break;
        }
    });
})

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas
  // spalvu filtra ir autoresponsus tiesiog padaryt viena ir tada pliusiukas dameta eilute ir taip iki begalybes ir pohui