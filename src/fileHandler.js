const fileSystem = require('fs');

class FileHandler { // visa sita pathu slamsta turetu handlint porto clase i think. maybe in the future
    logToFile = false;
    currFileName = "";
    currFileLoc = "";
    currFullPath = "";
    timeStamp = false;
    hexOutput = false;
    index = null;
    settingsFile = null;
    logStream = null;

    constructor(index, settingsFile) {
        this.index = index;
        this.currFileLoc = this.index.getPath('documents');
        this.settingsFile = settingsFile;
    };

    set setLogToFile(newState) {
        this.logToFile = newState;
        if (newState == false) {
            this.#closeLogStream();
        }
    };
    set setCurrFilePath(path) {
        let strIdx;
        this.currFullPath = path;
        strIdx = path.lastIndexOf('\\');
        this.currFileName = path.substr(strIdx + 1);
        strIdx = path.lastIndexOf('\\');
        this.currFileLoc = path.slice(0, strIdx);
    };
    set setTSFlag(newVal) {
        this.timeStamp = newVal;
    };
    set setHexFlag(newVal) {
        this.hexOutput = newVal;
    };

    get getDefFileName() {
        this.currFileName = "log" + this.#getCurrDate('file') + ".txt";
        return this.currFileName;
    };
    get getLogToFile() {
        return this.logToFile;
    };

    readFile(filePath) {
        return fileSystem.readFileSync(filePath)
    };
    createFile(filePath) {
        fileSystem.appendFileSync(filePath, "", 'utf-8');
    };
    writeFile(filePath, content) {
        fileSystem.writeFileSync(filePath, content, 'utf-8');
    };
    appendFile(filePath, content) {
        fileSystem.appendFileSync(filePath, content, 'utf-8');
    };
    createNewLogFile() {
        this.#closeLogStream();
        if (this.logToFile == true && this.currFullPath !== "") {
            this.logStream = fileSystem.createWriteStream(this.currFullPath, { flags: 'a' });
            this.logStream.on('error', (err) => {
                console.error('Log file write failed: ' + err.message);
                this.logToFile = false;
                this.#closeLogStream();
            });
        }
    };
    formatAndPrintLn(line, prefix) {
        let formattedLn = "";
        if (this.timeStamp == true) formattedLn = this.#getCurrDate('log');
        if (prefix !== undefined) formattedLn += prefix;
        formattedLn += this.hexOutput == true ? this.#asciiToHex(line).toUpperCase() : line;
        if (this.logToFile == true && this.logStream != null) {
            this.logStream.write(formattedLn + '\n');
        }
        return formattedLn;
    };
    restoreCurrLogFileLoc() {
        this.currFileLoc = this.currFileLoc.slice(0, this.currFileLoc.indexOf(this.currFileName));
        this.currFileName = "";
        this.currFullPath = "";
    };
    loadSettings() {
        let fileCont;
        try {
            fileCont = JSON.parse(this.readFile(this.settingsFile));
        } catch {
            fileCont = null;
        }
        if (fileCont != null) {
            return fileCont;
        }
    }
    #closeLogStream() {
        if (this.logStream != null) {
            this.logStream.end();
            this.logStream = null;
        }
    };
    #getCurrDate(format) {
        const currDate = new Date();
        const pad = (num, len = 2) => String(num).padStart(len, '0');
        const datePart = `${currDate.getFullYear()}-${pad(currDate.getMonth() + 1)}-${pad(currDate.getDate())}`;
        if (format == 'file') {
            return datePart + '_' + `${pad(currDate.getHours())}꞉${pad(currDate.getMinutes())}꞉${pad(currDate.getSeconds())}`;
        }
        return datePart + ` ${pad(currDate.getHours())}:${pad(currDate.getMinutes())}:${pad(currDate.getSeconds())}.${pad(currDate.getMilliseconds(), 3)} `;
    };
    #asciiToHex(str) {
        let arr1 = [];
        for (let n = 0, l = str.length; n < l; n ++) {
            arr1.push(str.charCodeAt(n).toString(16).padStart(2, '0'));
        }
        return arr1.join('') + "   ";
    };
}

module.exports = {
    FileHandler,
}
