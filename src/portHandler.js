const { SerialPort, ReadlineParser } = require('serialport');
const serPort = require('serialport');

class PortHandler {
    SPort = null;
    parser = null;
    currBaud = null;
    currPort = null;
    mainWindow = null;
    fileHandler = null;
    filters = null;

    constructor(mainWindow, fileHandler) {
        this.mainWindow = mainWindow;
        this.fileHandler = fileHandler;
        this.filters = this.fileHandler.loadSettings() != null ? this.fileHandler.loadSettings().filters : null;
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
        let formattedLn = this.fileHandler.formatAndPrintLn(line);
        let filterMatched = false;
        if (this.filters != null) {
            this.filters.forEach( (filterPair) => {
                if (formattedLn.includes(filterPair[0])) {
                    const filterColor = filterPair[1];
                    const indexOfFilter = formattedLn.indexOf(filterPair[0]);
                    const textColor = this.#getTextColor(filterPair[1]);
                    formattedLn = formattedLn.slice(0, indexOfFilter) + `<mark style="background-color: ${filterColor}; color: ${textColor}">` + formattedLn.slice(indexOfFilter, filterPair[0].length + indexOfFilter) + '</mark>' + formattedLn.slice(indexOfFilter + filterPair[0].length);
                    filterMatched = true;
                }
            });
        }
        if (filterMatched) {
            this.mainWindow.webContents.send('printFilteredLn', formattedLn);
        }
        this.mainWindow.webContents.send('printLn', formattedLn);
    };
    #getTextColor(hexBackground) {
        const red = parseInt(hexBackground.slice(1, 3), 16);
        const green = parseInt(hexBackground.slice(3, 5), 16);
        const blue = parseInt(hexBackground.slice(5, 7), 16);
        let textColor;
        if ((red * 0.299 + green * 0.587 + blue * 0.114) > 160) {
            textColor = "#000000";
        } else {
            textColor = "#ffffff";
        }
        return textColor;
    }
    RTSEvt(args) {
        if (this.SPort == null) return;
        this.SPort.set({rts: args, dtr: false});
    };
    DTREvt(args) {
        if (this.SPort == null) return;
        this.SPort.set({dtr: args, rts: false});
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
    updateFilters(filters) {
        this.filters = filters;
    }
};

module.exports = {
    PortHandler,
};