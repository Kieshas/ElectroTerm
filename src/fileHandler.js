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

    constructor(index, settingsFile) {
        this.index = index;
        this.currFileLoc = this.index.getPath('documents');
        this.settingsFile = settingsFile;
    };

    set setLogToFile(newState) {
        this.logToFile = newState;
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
        if (this.logToFile == true) {
            fileSystem.appendFileSync(this.currFullPath, "", 'utf-8');
        }
    };
    formatAndPrintLn(line, prefix) {
        let formattedLn = "";
        if (this.timeStamp == true) formattedLn = this.#getCurrDate('log');
        if (prefix !== undefined) formattedLn += prefix;
        formattedLn += line;
        if (this.hexOutput == true) formattedLn = this.#asciiToHex(line).toUpperCase();
        if (this.logToFile == true) {
            fileSystem.appendFileSync(this.currFullPath, formattedLn, 'utf-8');
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
    #getCurrDate(format) {
        const currDate = new Date();
        currDate.setHours(currDate.getHours() - (currDate.getTimezoneOffset() / 60));
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
    };
    #asciiToHex(str) { // needs some more attention. Kid of works and not in need of immediate attention
        let arr1 = [];
        for (let n = 0, l = str.length; n < l; n ++) {
            let hex = Number(str.charCodeAt(n)).toString(16);
            arr1.push(hex);
        }
        return arr1.join('') + "   ";
    };
}

module.exports = {
    FileHandler,
}
