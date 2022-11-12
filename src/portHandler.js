const { SerialPort, ReadlineParser } = require('serialport');
const serPort = require('serialport');

class PortHandler {
    SPort = null;
    parser = null;
    currBaud = null;
    currPort = null;
    mainWindow = null;
    fileHandler = null;

    constructor(mainWindow, fileHandler) {
        this.mainWindow = mainWindow;
        this.fileHandler = fileHandler;
    }

    set changeBaud(newBaud) {
        this.currBaud = newBaud;
    };
    set changePort(newPort) {
        this.currPort = newPort;
    };

    open() {
        return new Promise((resolve, reject) => { 
            this.SPort = new SerialPort({ path: this.currPort, baudRate: this.currBaud, hupcl: false, autoOpen: false});
            this.parser = new ReadlineParser();
            this.SPort.pipe(this.parser);
    
            this.parser.on("data", (line) => {
                this.mainWindow.webContents.send('printLn', line);
                this.#parserEvt(line);
            });
            this.SPort.open((err) => {
                if (err == null) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    };
    PortList() { 
        return serPort.SerialPort.list();
    };
    cleanUp() {
        this.SPort = null;
        this.parser = null;
    };
    #parserEvt(line) {
        this.fileHandler.printLineToFile(line);
    };
    restart(args) {
        if (this.SPort == null) return;
        this.SPort.set({rts: args[0]}, () => {
            this.SPort.close(() => {
                this.cleanUp();
                this.open();
            });
        }); // true for ESP false for STM
    };
    close() {
        if (this.SPort == null) return;
        this.SPort.close(() => {
            this.cleanUp();
        });
    };
    sendMsg(msg) {
        this.SPort.write((msg + '\r\n'));
    };
};

module.exports = {
    PortHandler,
};