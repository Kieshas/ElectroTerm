const output = document.getElementById('output');
const outputFiltered = document.getElementById('outputFiltered');

let lineCount = 0;
let lineCountFiltered = 0;

const ClearOutputs = () => {
    output.textContent = "";
    outputFiltered.textContent = "";
    lineCount = 0;
    lineCountFiltered = 0;
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

let lineCntNoScroll = 0;
const outputLine = (line) => {
    let textTemp;
    if (lineCount >= 1000) {
        if (lockCb.checked) {
            lineCntNoScroll++;
        } else {
            for (let i = 0; i <= lineCntNoScroll; i++) {
                textTemp = output.innerHTML.slice(output.innerHTML.indexOf('\n') + 1);
                output.innerHTML = textTemp;
            }
            lineCntNoScroll = 0;
        }
    } else {
        lineCount++;
    }

    if (line.includes('<mark')) { // reduce DOM reloads
        output.innerHTML += (line);
    } else {
        output.append(line + '\n');
    }

    if (!lockCb.checked) {
        output.scrollTop = output.scrollHeight;
        outputFiltered.scrollTop = output.scrollHeight;
    }
}

let lineCntNoScrollFlt = 0;
const outputFilteredLine = (line) => {
    let textTemp;
    if (lineCountFiltered >= 1000) {
        if (lockCb.checked) {
            lineCntNoScrollFlt++;
        } else {
            for (let i = 0; i <= lineCntNoScrollFlt; i++) {
                textTemp = outputFiltered.innerHTML.slice(outputFiltered.innerHTML.indexOf('\n') + 1);
                outputFiltered.innerHTML = textTemp;
            }
            lineCntNoScrollFlt = 0;
        }
    } else {
        lineCountFiltered++;
    }
    outputFiltered.innerHTML += (line);
}

window.ipcRender.receive('printLn', (line) => outputLine(line));

window.ipcRender.receive('printFilteredLn', (line) => outputFilteredLine(line));

output.addEventListener('scroll', () => {
    // console.log(Math.abs(output.scrollHeight - output.scrollTop - output.clientHeight));
    if (Math.abs(output.scrollHeight - output.scrollTop - output.clientHeight) <= 30.0) { // 30px tolerance
        if (lockCb.checked) {
            document.getElementById('lockedStat').src='res/resources/locked.png';
            lockCb.checked = false;
        }
    } else {
        lockCb.checked = true;
        document.getElementById('lockedStat').src='res/resources/locked.png';
    }
});

outputFiltered.addEventListener('scroll', () => {
    if (Math.abs(outputFiltered.scrollHeight - outputFiltered.scrollTop - outputFiltered.clientHeight) <= 30.0) {
        if (lockCb.checked) {
            document.getElementById('lockedStat').src='res/resources/locked.png';
            lockCb.checked = false;
        }
    } else {
        lockCb.checked = true;
        document.getElementById('lockedStat').src='res/resources/locked.png';
    }
});
