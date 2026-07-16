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
portHandler.altSendFn = (msg) => { tcpHandler.sendMsg(msg); }; // sends (incl. auto-responses) go out over TCP when serial is closed

// Maps a setting name used in code to its key inside settings.json.
// The 'lasUsed*' misspellings are kept so existing settings.json files keep working.
const SETTINGS_KEY_MAP = {
    filterSettings: 'filters',
    autoRspSettings: 'autoRsp',
    macroSettings: 'macros',
    lastUsedPort: 'lastUsedPort',
    lastUsedFont: 'lastUsedFont',
    lastUsedSerPort: 'lasUsedSerPort',
    lastUsedSerBaud: 'lasUsedSerBaud',
    proportionOutput: 'proportionOutput',
    proportionOutputFl: 'proportionOutputFl',
    winPosX: 'winPosX',
    winPosY: 'winPosY',
    winSizeX: 'winSizeX',
    winSizeY: 'winSizeY',
    maximized: 'winMaximized',
};

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
    if (fileHandler.currFullPath !== "") {
        shell.openPath(fileHandler.currFullPath);
    }
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

let filterWin = null;
let autoRspWin = null;

ipcMain.on('openFilters', (event, args) => {
    if (filterWin !== null) return;
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
            resolve([args[0], savedFilters]);
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
    if (autoRspWin !== null) return;
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
            resolve([args[0], savedStruct]);
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
        const key = SETTINGS_KEY_MAP[dst];
        if (key == undefined) return resolve();
        let fileObj;
        try {
            fileObj = JSON.parse(fileHandler.readFile(settingsFile));
        } catch {
            fileObj = {};
        }
        fileObj[key] = settingVal;
        if (dst === "filterSettings") portHandler.updateFilters(settingVal);
        if (dst === "autoRspSettings") portHandler.updateAutoResps(settingVal);
        fileHandler.writeFile(settingsFile, JSON.stringify(fileObj, null, 4));
        resolve();
    })
}

const LoadSettings = (dst) => {
    return new Promise((resolve) => {
        const key = SETTINGS_KEY_MAP[dst];
        let fileContent;
        try {
            fileContent = JSON.parse(fileHandler.readFile(settingsFile));
        } catch {
            fileContent = null;
        }
        if (key == undefined || fileContent == null) return resolve(null);
        resolve(fileContent[key] != undefined ? fileContent[key] : null);
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
