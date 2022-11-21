let rowCnt = 0;
let outputProportion = 0.5;
let outputFilteredProportion = 0.5;

const resizeOutput = (size) => {
    rowCnt = 0;
    document.querySelectorAll(".row").forEach( (row) => { // runs one time at startup
        if (row.style.display !== "none") {
            rowCnt++;
        }
    });
    if (size == undefined) return;
    let REMsize = parseInt(getComputedStyle(document. documentElement).fontSize, 10);
    let additionalPXS = ((REMsize * 0.25) * (rowCnt + 1)); // all rows use mb-1 (margin of 0.25rem) so we count the ammount of PX that we need to subtract from contentSize to compensate for margins
    let height = 0;
    document.querySelectorAll(".row").forEach( (row) => {
        if (row.id == "outputRow") return; // exception for output row
        height += row.offsetHeight;
    });
    height = size[1] - (height + additionalPXS);
    output.style.height = height.toString() + "px";
    outputFiltered.style.height = height.toString() + "px";
    output.style.maxWidth = (size[0] * outputProportion) + 'px';
    outputFiltered.style.maxWidth = (size[0] * outputFilteredProportion) + 'px';
    macroDDContent.style.maxHeight = size[1]/2 + "px";
    height = 0;
} 

window.ipcRender.receive('resizeEvt', (args) => { 
    resizeOutput(args); 
    setTimeout(resizeOutput(args), 100); // double down for more smoothness
});

const updtSzOnLoad = async () => {
    const size = await window.ipcRender.invoke('updateSizeOnLoad');
    resizeOutput(size);
};

updtSzOnLoad();

// Custom drag based resizer for bootstrap collumn based text output elements
const offsetThr = 15;
let clicked = false;

const getSizeInDec = (element) => {
    return Number(element.style.maxWidth.slice(0, element.style.maxWidth.indexOf('px')), 10);
}

const preventSelection = (evt) => {
    evt.preventDefault();
}

const adjustProportions = () => {
    outputProportion = getSizeInDec(output) / (getSizeInDec(outputFiltered) + getSizeInDec(output));
    outputFilteredProportion = getSizeInDec(outputFiltered) / (getSizeInDec(outputFiltered) + getSizeInDec(output));
    console.log("propsOp " + outputProportion + " propsOpFl " + outputFilteredProportion);
}

const ritualBeforeDrag = () => {
    clicked = true;
    output.addEventListener('selectstart', preventSelection);
    outputFiltered.addEventListener('selectstart', preventSelection);
}

const ritualAfterDrag = () => {
    clicked = false;
    output.removeEventListener('selectstart', preventSelection);
    outputFiltered.removeEventListener('selectstart', preventSelection);
}

const mouseMoveRitual = (evt) => {
    if (clicked) {
        outputFiltered.style.maxWidth = (getSizeInDec(outputFiltered) - evt.movementX) + 'px';
        output.style.maxWidth = (getSizeInDec(output) + evt.movementX) + 'px';
        adjustProportions();
    }
}

outputFiltered.addEventListener('mousemove', (event) => {
        mouseMoveRitual(event);
});

output.addEventListener('mousemove', (event) => {
        mouseMoveRitual(event);
});

outputFiltered.addEventListener('mouseup', () => {
    ritualAfterDrag();
});

output.addEventListener('mouseup', () => {
    ritualAfterDrag();
});

outputFiltered.addEventListener('mousedown', (event) => {
    if (event.offsetX <= offsetThr) {
        ritualBeforeDrag();
    }
});

output.addEventListener('mousedown', (event) => {
    if (event.offsetX >= (output.offsetWidth - offsetThr)) {
        ritualBeforeDrag();
    }
});

