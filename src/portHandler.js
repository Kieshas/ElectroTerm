const { SerialPort, ReadlineParser } = require('serialport');
const serPort = require('serialport');

const FLUSH_INTERVAL_MS = 16; // batch received lines and send them to the renderer roughly once per frame

const escapeHtml = (text) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

class PortHandler {
    SPort = null;
    parser = null;
    currBaud = null;
    currPort = null;
    mainWindow = null;
    fileHandler = null;
    filters = null;
    autoResponses = null;
    altSendFn = null; // fallback transport (TCP) used when the serial port is not open
    lineBuf = [];
    lineBufFlt = [];
    flushTimer = null;

    constructor(mainWindow, fileHandler) {
        this.mainWindow = mainWindow;
        this.fileHandler = fileHandler;
        const settings = this.fileHandler.loadSettings();
        this.filters = settings != null ? settings.filters : null;
        this.autoResponses = settings != null ? settings.autoRsp : null;
    }

    set changeBaud(newBaud) {
        this.currBaud = newBaud;
    };
    set changePort(newPort) {
        this.currPort = newPort;
    };

    open() {
        return new Promise((resolve, reject) => {
            this.close(); // drop a previous instance and its listeners before creating a new one
            this.SPort = new SerialPort({ path: this.currPort, baudRate: this.currBaud, hupcl: false, autoOpen: false});
            this.parser = new ReadlineParser();
            this.SPort.pipe(this.parser);

            this.parser.on("data", (line) => {
                this.parserEvt(line);
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
    parserEvt(line) {
        line = line.replace(/\r+$/, ''); // ReadlineParser splits on \n and leaves the \r behind
        this.#checkAutoResp(line);
        const formattedLn = this.fileHandler.formatAndPrintLn(line);
        const { html, matched } = this.#applyFilters(formattedLn);
        this.#enqueueLine(html, matched);
    };
    #applyFilters(text) {
        const ranges = [];
        if (this.filters != null) {
            this.filters.forEach( (filterTriplet) => {
                const [filterText, filterColor, tempDisabled] = filterTriplet;
                if (!filterText || tempDisabled) return;
                let idx = text.indexOf(filterText);
                while (idx > -1) {
                    ranges.push({ start: idx, end: idx + filterText.length, color: filterColor });
                    idx = text.indexOf(filterText, idx + filterText.length);
                }
            });
        }
        if (ranges.length == 0) {
            return { html: escapeHtml(text), matched: false };
        }
        ranges.sort((a, b) => a.start - b.start);
        let html = "";
        let pos = 0;
        ranges.forEach((range) => {
            if (range.start < pos) return; // overlaps an earlier highlight
            html += escapeHtml(text.slice(pos, range.start));
            html += `<span style="background-color: ${range.color}; color: ${this.#getTextColor(range.color)}; padding: 0.2rem">`
                + escapeHtml(text.slice(range.start, range.end)) + '</span>';
            pos = range.end;
        });
        html += escapeHtml(text.slice(pos));
        return { html, matched: true };
    };
    #enqueueLine(html, matched) {
        this.lineBuf.push(html);
        if (matched) {
            this.lineBufFlt.push(html);
        }
        if (this.flushTimer == null) {
            this.flushTimer = setTimeout(() => this.#flushLines(), FLUSH_INTERVAL_MS);
        }
    };
    #flushLines() {
        this.flushTimer = null;
        if (this.mainWindow.isDestroyed()) return;
        if (this.lineBuf.length > 0) {
            this.mainWindow.webContents.send('printLn', this.lineBuf);
            this.lineBuf = [];
        }
        if (this.lineBufFlt.length > 0) {
            this.mainWindow.webContents.send('printFilteredLn', this.lineBufFlt);
            this.lineBufFlt = [];
        }
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
    #checkAutoResp(lineToCheck) {
        if (this.autoResponses != null) {
            this.autoResponses.forEach((asTriplet) => {
                if (asTriplet[0] && lineToCheck.indexOf(asTriplet[0]) > -1 && !asTriplet[2]) {//Found matching string and it is not temporarily disabled
                    this.internalLineEvt("[ARSP]->", asTriplet[1]);
                }
            });
        }
    }
    internalLineEvt(prefix, msgText) {
        const msgToSend = this.fileHandler.formatAndPrintLn(msgText, prefix);
        this.sendMsg(msgText); // send raw msg
        this.#enqueueLine(escapeHtml(msgToSend), false);
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
        if (this.parser != null) {
            this.SPort.unpipe(this.parser);
            this.parser.removeAllListeners('data');
        }
        if (this.SPort.isOpen) {
            this.SPort.close(() => {});
        }
        this.cleanUp();
    };
    sendMsg(msg) {
        if (this.SPort != null && this.SPort.isOpen) {
            this.SPort.write((msg + '\r\n'));
        } else if (this.altSendFn != null) {
            this.altSendFn(msg);
        }
    };
    updateFilters(filters) {
        this.filters = filters;
    }
    updateAutoResps(AResps) {
        this.autoResponses = AResps;
    }
};

module.exports = {
    PortHandler,
};
