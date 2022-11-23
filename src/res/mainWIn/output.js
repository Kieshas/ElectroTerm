const output = document.getElementById('output');
const outputFiltered = document.getElementById('outputFiltered');

let lineCount = 0;
let lineCountFlt = 0;
let countForSlicing = 0;
let countForSlicingFlt = 0;
let lineCntNoScroll = 0;
let lineCntNoScrollFlt = 0;

const ClearOutputs = () => {
    output.textContent = "";
    outputFiltered.textContent = "";
    lineCount = 0;
    lineCountFlt = 0;
    countForSlicing = 0;
    lineCntNoScroll = 0;
    lineCntNoScrollFlt = 0;
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

const scrollToBottom = () => {
    output.scrollTop = output.scrollHeight;
    outputFiltered.scrollTop = output.scrollHeight;
}

const sliceNumOfLines = (element, lineNum) => {
    let lastIdx = 0;
    for (let i = 0; i < lineNum; i++) {
        lastIdx = element.innerHTML.indexOf('\n', lastIdx) + 1;
    }
    element.innerHTML = element.innerHTML.slice(lastIdx);
    scrollToBottom();
    return 0;
}

const slicerCheck = (elementToCheck) => {
    switch (elementToCheck) {
        case "FilteredOutput":
            if (lockCb.checked) {
                lineCntNoScrollFlt++;
            } else {
                countForSlicingFlt++;
                if (lineCntNoScrollFlt != 0) {
                    lineCntNoScrollFlt = sliceNumOfLines(outputFiltered, lineCntNoScrollFlt);
                }
                if (countForSlicingFlt > 50) {
                    countForSlicingFlt = sliceNumOfLines(outputFiltered, countForSlicingFlt);
                }
            }
            break;
        case "RegularOutput":
            if (lockCb.checked) {
                lineCntNoScroll++;
                if (lineCntNoScroll >= 2000) {
                    scrollToBottom(); // let's be safe because it is possible to break app with overflow here
                    if (lineCntNoScroll == 2000) {
                        showPopup("Warning", "Scrolling action was held for too long, clearing");
                    }
                }
            } else {
                countForSlicing++;
                if (lineCntNoScroll != 0) {
                    lineCntNoScroll = sliceNumOfLines(output, lineCntNoScroll);
                }
                if (countForSlicing > 50) {
                    countForSlicing = sliceNumOfLines(output, countForSlicing);
                }
            }
            break;
        default:
            break;
    }
}

const outputLine = (line) => {
    
    if (lineCount >= 200) {
        slicerCheck("RegularOutput");
    } else {
        lineCount++;
    }

    if (line.includes('<span')) { // reduce DOM reloads
        output.innerHTML += (line);
    } else {
        output.append(line + '\n');
    }

    if (!lockCb.checked) {
        scrollToBottom();
    }
}


const outputFilteredLine = (line) => {
    if (lineCountFlt >= 200) {
        slicerCheck("FilteredOutput");
    } else {
        lineCountFlt++;
    }
    outputFiltered.innerHTML += (line);
}

window.ipcRender.receive('printLn', (line) => outputLine(line)); // maybe it is possible in the future to somehow "bundle" lines so they wouldn't be sent 1 by 1. that way we would save on so much ipc resource

window.ipcRender.receive('printFilteredLn', (line) => outputFilteredLine(line));

output.addEventListener('scroll', () => {
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
