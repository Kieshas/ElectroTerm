const { ipcMain } = require('electron');
const serPort = require('serialport');
const { SerialPort, ReadlineParser } = require('serialport');
const mainWin = require('./index'); // asynco kazkokios reikia bbz

const mainWindow = mainWin.getMainWin();

let SPort;
let parser;
let baudNum;

ipcMain.handle('updateSizeOnLoad', async () => {
    console.log(mainWindow);
    let sz = mainWindow.getSize();
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
    let port = args[0];
    let baud = args[1];
    baudNum = Number(baud);
    SPort = new SerialPort({ path: port, baudRate: baudNum });
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

ipcMain.on('rtsEvt', (event, args) => {
    if (SPort == null) return;
    console.log("RTS", args[0]);
    SPort.set({rts: args[0]});
});

ipcMain.on('dtrEvt', (event, args) => {
    if (SPort == null) return;
    console.log("DTR", args[0]);
    SPort.set({dtr: args[0]});
});

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas