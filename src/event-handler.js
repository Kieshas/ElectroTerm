const { ipcMain, shell } = require('electron');
const { userSaveFile } = require('./dialogWindow');
const index = require('./index');
const { FileHandler } = require('./fileHandler');
const { PortHandler } = require('./portHandler');
const { TCPHandler } = require('./tcp');

const mainWindow = index.getMainWin();
const settingsFile = (index.getAppPath() + '/settings.json');

const fileHandler = new FileHandler(index, settingsFile);
const portHandler = new PortHandler(mainWindow, fileHandler);
const tcpHandler = new TCPHandler((data) => { portHandler.parserEvt(data); });

ipcMain.handle('populateDD', () => {
    return new Promise((resolve) => {
        let portArr = new Array;
        portHandler.PortList().then((result) => {
            result.forEach((port) => {
                portArr.push(port.path);
            })
            resolve(portArr);
        })
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
    portHandler.internalLineEvt("[SEND]->", args[0]);
});

ipcMain.on('disconnectPort', () => {
    portHandler.close();
});

ipcMain.on('restartEvt', (event, args) => {
    const DtrRts = args[0];
    if (DtrRts === 'DTR') {
        portHandler.DTREvt(args[1]);
    } else {
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
    const mainWinPos = mainWindow.getPosition();
    const mainWinSz = mainWindow.getSize();
    filterWin = index.createFilterWindow();
    const filterWinSz = filterWin.getSize();
    const xPos = Math.round((mainWinPos[0] + (mainWinSz[0] / 2)) - (filterWinSz[0] / 2));
    const yPos = Math.round((mainWinPos[1] + (mainWinSz[1] / 2)) - (filterWinSz[1] / 2));
    filterWin.setPosition(xPos, yPos);
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

ipcMain.on('openAutoRsp', (event, args) => {
    let autoRspWin;
    const mainWinPos = mainWindow.getPosition();
    const mainWinSz = mainWindow.getSize();
    autoRspWin = index.createAutoRspWindow();
    const autoRspWinSz = autoRspWin.getSize();
    const xPos = Math.round((mainWinPos[0] + (mainWinSz[0] / 2)) - (autoRspWinSz[0] / 2));
    const yPos = Math.round((mainWinPos[1] + (mainWinSz[1] / 2)) - (autoRspWinSz[1] / 2));
    autoRspWin.setPosition(xPos, yPos);

    mainWindow.setMovable(false);
    mainWindow.setMinimizable(false);
    ipcMain.handle('autoRspLoaded', () => {
        return new Promise((resolve) => {
            let savedStruct;
            try {
                savedStruct = JSON.parse(fileHandler.readFile(settingsFile));
                savedStruct = savedStruct.autoRsp;
            } catch {
                savedStruct = null;
            }
            retval = [args[0], savedStruct];
            resolve(retval);
        })
    });
    autoRspWin.on('closed', () => {
        ipcMain.removeHandler('autoRspLoaded');
        mainWindow.setMovable(true);
        mainWindow.setMinimizable(true);
        autoRspWin = null;
    });
});

const SaveSettings = (dst, settingVal) => {
    return new Promise((resolve) => {
        let destination = dst;
        let fileCont;
        let fileObj = {
            filters: null,
            autoRsp: null,
            macros: null,
            lastUsedPort: null,
            lasUsedSerPort: null,
            lasUsedSerBaud: null,
            proportionOutput: null,
            proportionOutputFl: null,
            winPosX: null,
            winPosY: null,
            winSizeX: null,
            winSizeY: null,
            winMaximized: null,
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
                fileObj.filters = settingVal;
                portHandler.updateFilters(fileObj.filters);
                break;
            case "autoRspSettings":
                fileObj.autoRsp = settingVal;
                portHandler.updateAutoResps(fileObj.autoRsp);
                break;
            case "macroSettings":
                fileObj.macros = settingVal;
                break;
            case "lastUsedPort":
                fileObj.lastUsedPort = settingVal;
                break;
            case "lastUsedFont":
                fileObj.lastUsedFont = settingVal;
                break;
            case "lastUsedSerPort":
                fileObj.lasUsedSerPort = settingVal;
                break;
            case "lastUsedSerBaud":
                fileObj.lasUsedSerBaud = settingVal;
                break;
            case "proportionOutput":
                fileObj.proportionOutput = settingVal;
                break;
            case "proportionOutputFl":
                fileObj.proportionOutputFl = settingVal;
                break;
            case "winPosX":
                fileObj.winPosX = settingVal;
                break;
            case "winPosY":
                fileObj.winPosY = settingVal;
                break;
            case "winSizeX":
                fileObj.winSizeX = settingVal;
                break;
            case "winSizeY":
                fileObj.winSizeY = settingVal;
                break;
            case "maximized":
                fileObj.winMaximized = settingVal;
                break;
            default:
                break;
        }
        fileHandler.writeFile(settingsFile, "");
        fileHandler.appendFile(settingsFile, (JSON.stringify(fileObj, null, 4)));
        resolve();
    })
}

const LoadSettings = (dst) => {
    return new Promise((resolve) => {
        let fileContent = null;
        try {
            fileContent = JSON.parse(fileHandler.readFile(settingsFile));
        } catch {
            fileContent = null;
            resolve(null);
        }
        switch(dst) { // make key value MAP instead of this spaghetti in the future.
            case "filterSettings":
                resolve(fileContent.filters);
                break;
            case "autoRspSettings":
                resolve(fileContent.autoRsp);
                break;
            case "macroSettings":
                resolve(fileContent.macros);
                break;
            case "lastUsedPort":
                resolve(fileContent.lastUsedPort);
                break;
            case "lastUsedFont":
                resolve(fileContent.lastUsedFont);
                break;
            case "lastUsedSerPort":
                resolve(fileContent.lasUsedSerPort);
                break;
            case "lastUsedSerBaud":
                resolve(fileContent.lasUsedSerBaud);
                break;            
            case "proportionOutput":
                resolve(fileContent.proportionOutput);
                break;
            case "proportionOutputFl":
                resolve(fileContent.proportionOutputFl);
                break;
            case "winPosX":
                resolve(fileContent.winPosX);
                break;
            case "winPosY":
                resolve(fileContent.winPosY);
                break;
            case "winSizeX":
                resolve(fileContent.winSizeX);
                break;
            case "winSizeY":
                resolve(fileContent.winSizeY);
                break;
            case "maximized":
                resolve(fileContent.winMaximized);
                break;
            default:
                break;
        }
    });
}

ipcMain.handle('saveSettings', (event, args) => {
    return SaveSettings(args[0], args[1]);
});

ipcMain.handle('requestSettings', (event, args) => {
    return LoadSettings(args[0]);
})

ipcMain.handle('openServer', (event, args) => {
    const retVal = tcpHandler.openServer(args[0]);

    return new Promise((resolve, reject) => {
        retVal.then(() => {
            resolve();
        }).catch((err) => {
            // portHandler.cleanUp();
            reject(err);
        })
    })   
});

ipcMain.on('closeServer', () => {
    tcpHandler.closeServer();
});

ipcMain.handle('requestMacros', () => {
    return new Promise((resolve, reject) => {
        let fileCont
        try {
            fileCont = fileHandler.readFile(index.getAppPath() + '/macros.txt');
            fileCont = fileCont.toString().split('\n');
            resolve(fileCont);
        } catch {
            reject("File macros.txt not found in app directory");
        }
    })
});

ipcMain.on('safeToClose', () => {
    mainWindow.close();
});

module.exports = {
    SaveSettings,
    LoadSettings,
};

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas
  // spalvu filtra ir autoresponsus tiesiog padaryt viena ir tada pliusiukas dameta eilute ir taip iki begalybes ir pohui