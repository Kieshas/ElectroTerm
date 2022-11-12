const output = document.getElementById('output');
const outputFiltered = document.getElementById('outputFiltered');

let lineCount = 0;

const ClearOutputs = () => {
    output.textContent = "";
    outputFiltered.textContent = "";
    lineCount = 0;
}

const asciiToHex = (str) => { // needs some more attention. Kid of works and not in need of immediate attention
    let arr1 = [];
	for (let n = 0, l = str.length; n < l; n ++) {
		let hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	}
	return arr1.join('') + "   ";
}

const getCurrDate = () => {
    const currDate = new Date();
    let correctCurDate;
    correctCurDate = currDate.toJSON().slice(0, 10) + " ";
    correctCurDate += currDate.toJSON().slice(11, 23) + " ";
    return correctCurDate;
}

const outputLine = (line) => {
    if (lineCount >= 10000) {
        ClearOutputs();
    }
    lineCount++;

    output.append(line);

    if (!lockCb.checked) {
        output.scrollTop = output.scrollHeight;
        outputFiltered.scrollTop = output.scrollHeight;
    }
}

window.ipcRender.receive('printLn', (line) => outputLine(line));
