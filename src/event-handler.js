const { ipcMain } = require('electron');
const serPort = require('serialport');
const { SerialPort, ReadlineParser } = require('serialport');
const mainWin = require('./index');

const mainWindow = mainWin.getMainWin();

let SPort;
let parser;
let baudNum;
let currPort;

ipcMain.handle('updateSizeOnLoad', async () => {
    let sz = mainWindow.getContentSize();
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

const openPort = () => {
    return new Promise((resolve, reject) => { 
        SPort = new SerialPort({ path: currPort, baudRate: baudNum, hupcl: false, autoOpen: false});
        parser = new ReadlineParser();
        SPort.pipe(parser);

        parser.on("data", (line) => {
            mainWindow.webContents.send('printLn', line);
        });
        SPort.open((err) => {
            if (err == null) {
                resolve();
            } else {
                reject(err);
            }
        });
    });
}

const cleanUpPort = () => {
    SPort = null;
    parser = null;
}

ipcMain.handle('setPrmsAndConnect', (event, args) => { // check promise if COM access denied
    currPort = args[0];
    baudNum = Number(args[1]);
    const retVal = openPort();

    return new Promise((resolve, reject) => {
        retVal.then(() => {
            resolve();
        }).catch((err) => {
            cleanUpPort();
            reject(err);
        })
    })    
});

ipcMain.on('disconnectPort', () => {
    SPort.close();
    cleanUpPort();
});

const restart = () => {
    SPort.close(() => {
        SPort = null;
        parser = null;
        openPort();
    });
}

ipcMain.on('restartEvt', (event, args) => {
    if (SPort == null) return;
    SPort.set({rts: args[0]}, restart); // true for ESP false for STM
});

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas