const fileSystem = require('fs');

class FileHandler {
    logToFile = false;
    currFileName = "";
    currFileLoc = "";
    currFullPath = "";
    timeStamp = false;
    hexOutput = false;
    mainWin = null;

    constructor(mainWindow) {
        this.mainWin = mainWindow;
        this.currFileLoc = this.mainWin.getPath('documents');
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

    createNewFile() {
        if (this.logToFile == true) {
            fileSystem.appendFileSync(this.currFullPath, "", 'utf-8');
        }
    };
    printLineToFile(line) {
        if (this.timeStamp == true) line = this.#getCurrDate('log') + line; //TODO: probably this should be used instead of one in frontend process and one in backend
        if (this.hexOutput == true) line = this.#asciiToHex(line).toUpperCase();
        if (this.logToFile == true) {
            fileSystem.appendFileSync(this.currFullPath, line, 'utf-8');
        }
        return line;
    };
    restoreCurrFileLoc() {
        this.currFileLoc = this.mainWin.getPath('documents');
        this.currFileName = "";
        this.currFullPath = "";
    };
    #getCurrDate(format) {
        const currDate = new Date();
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
