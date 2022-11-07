const { ipcMain, shell } = require('electron');
const serPort = require('serialport');
const { SerialPort, ReadlineParser } = require('serialport');
const { userSaveFile } = require('./dialogWindow');
const mainWin = require('./index');
const fileSystem = require('fs');

const mainWindow = mainWin.getMainWin();

const portHandler = {
    SPort: null,
    parser: null,
    currBaud: null,
    currPort: null,

    set changeBaud(newBaud) {
        this.currBaud = newBaud;
    },
    set changePort(newPort) {
        this.currPort = newPort;
    },

    open() {
        return new Promise((resolve, reject) => { 
            this.SPort = new SerialPort({ path: this.currPort, baudRate: this.currBaud, hupcl: false, autoOpen: false});
            this.parser = new ReadlineParser();
            this.SPort.pipe(this.parser);
    
            this.parser.on("data", (line) => {
                mainWindow.webContents.send('printLn', line);
                portHandler.parserEvt(line);
            });
            this.SPort.open((err) => {
                if (err == null) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    },
    cleanUp() {
        this.SPort = null;
        this.parser = null;
    },
    parserEvt(line) {
        fileHandler.printLineToFile(line);
    },
    restart(args) {
        if (this.SPort == null) return;
        this.SPort.set({rts: args[0]}, () => {
            this.SPort.close(() => {
                this.cleanUp();
                this.open();
            });
        }); // true for ESP false for STM
    },
    close() {
        if (this.SPort == null) return;
        this.SPort.close(() => {
            this.cleanUp();
        });
    },
    sendMsg(msg) {
        this.SPort.write((msg + '\r\n'));
    }
};

ipcMain.handle('populateDD', () => {
    const portList = serPort.SerialPort.list();
    return new Promise((resolve) => {
        resolve(portList);
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


const fileHandler = {
    logToFile: false,
    currFileName: "",
    currFileLoc: mainWin.getPath('documents'),
    currFullPath: "",
    timeStamp: false,
    hexOutput: false,

    set setLogToFile(newState) {
        this.logToFile = newState;
    },
    set setCurrFilePath(path) {
        let strIdx;
        this.currFullPath = path;
        strIdx = path.lastIndexOf('\\');
        this.currFileName = path.substr(strIdx + 1);
        strIdx = path.lastIndexOf('\\');
        this.currFileLoc = path.slice(0, strIdx);
    },
    set setTSFlag(newVal) {
        this.timeStamp = newVal;
    },
    set setHexFlag(newVal) {
        this.hexOutput = newVal;
    },

    get getDefFileName() {
        this.currFileName = "log" + this.getCurrDate('file') + ".txt";
        return this.currFileName;
    },
    get getLogToFile() {
        console.log(this.logToFile);
        return this.logToFile;
    },

    createNewFile() {
        if (this.logToFile == true) {
            fileSystem.appendFileSync(this.currFullPath, "", 'utf-8');
        }
    },
    printLineToFile(line) {
        if (this.logToFile == true) {
            if (this.timeStamp == true) line = this.getCurrDate('log') + line; //TODO: probably this should be used instead of one in frontend process and one in backend
            if (this.hexOutput == true) line = this.asciiToHex(line).toUpperCase();
            fileSystem.appendFileSync(this.currFullPath, line, 'utf-8');
        }
    },
    restoreCurrFileLoc() {
        this.currFileLoc = mainWin.getPath('documents');
        this.currFileName = "";
        this.currFullPath = "";
    },
    getCurrDate(format) {
        const currDate = new Date();
        let correctCurDate;
        if (format == 'file') {
            correctCurDate = currDate.toJSON().slice(0, 10) + '_';
            correctCurDate += currDate.toJSON().slice(11, 19);
            correctCurDate = correctCurDate.replaceAll(':', '꞉');    
        } else if (format == 'log') {
            correctCurDate = currDate.toJSON().slice(0, 10) + " ";
            correctCurDate += currDate.toJSON().slice(11, 23) + " ";
        }
        return correctCurDate;
    },
    asciiToHex(str) { // needs some more attention. Kid of works and not in need of immediate attention
        let arr1 = [];
        for (let n = 0, l = str.length; n < l; n ++) {
            let hex = Number(str.charCodeAt(n)).toString(16);
            arr1.push(hex);
        }
        return arr1.join('') + "   ";
    },
}

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
    filterWin = mainWin.createFilterWindow();
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

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas
  // spalvu filtra ir autoresponsus tiesiog padaryt viena ir tada pliusiukas dameta eilute ir taip iki begalybes ir pohui