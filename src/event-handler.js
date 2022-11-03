const { ipcMain } = require('electron');
const serPort = require('serialport');
const { SerialPort, ReadlineParser } = require('serialport');
const { userSelectFolder, userSaveFile } = require('./dialogWindow');
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
};

const fileHandler = {
    logToFile: false,
    currFileName: "",
    currFileLoc: mainWin.getPath('documents'),
    currFullPath: "",

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

    get getDefFileName() {
        this.currFileName = "log" + this.getCurrDate() + ".txt";
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
            fileSystem.appendFileSync(this.currFullPath, line, 'utf-8');
        }
    },
    restoreCurrFileLoc() {
        this.currFileLoc = mainWin.getPath('documents');
    },
    getCurrDate() {
        const currDate = new Date();
        let correctCurDate;
        correctCurDate = currDate.toJSON().slice(0, 10) + '_';
        correctCurDate += currDate.toJSON().slice(11, 19);
        correctCurDate = correctCurDate.replaceAll(':', '꞉');        
        return correctCurDate;
    },
}

ipcMain.handle('populateDD', () => {
    const portList = serPort.SerialPort.list();
    return new Promise((resolve) => {
        resolve(portList);
    });
});

ipcMain.handle('setPrmsAndConnect', (event, args) => { // check promise if COM access denied
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
})

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas