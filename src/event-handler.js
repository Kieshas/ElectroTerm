const { ipcMain } = require('electron');
const serPort = require('serialport');
const { SerialPort, ReadlineParser } = require('serialport');
const mainWin = require('./index');

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
    }
};
  
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

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas