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

ipcMain.on('setPrmsAndConnect', (event, args) => { // check promise if COM access denied
    currPort = args[0];
    baudNum = Number(args[1]);
    SPort = new SerialPort({ path: currPort, baudRate: baudNum, hupcl: false});
    parser = new ReadlineParser();
    SPort.pipe(parser);

    parser.on("data", (line) => {
        mainWindow.webContents.send('printLn', line);
    });
});

ipcMain.on('disconnectPort', () => {
    SPort.close();
    SPort = null;
    parser = null;
});

const restart = () => {
    SPort.close(() => { // call close and after it is closed - reconnect which will result in a restart if RTS is pulled low //
        SPort = null;
        parser = null;
        SPort = new SerialPort({ path: currPort, baudRate: baudNum, hupcl: false});
        parser = new ReadlineParser();
        SPort.pipe(parser);
        
    
        parser.on("data", (line) => {
            mainWindow.webContents.send('printLn', line);
        });
    });
}

ipcMain.on('restartEvt', async (event, args) => {
    if (SPort == null) return;
    SPort.set({rts: args[0]}, restart); // true for ESP false for STM
});

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas