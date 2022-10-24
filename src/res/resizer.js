let rowCnt = 0;

document.querySelectorAll(".row").forEach( () => { // runs one time at startup
    rowCnt++;
});

const resizeOutput = (size) => {
    let REMsize = parseInt(getComputedStyle(document. documentElement).fontSize, 10);
    let additionalPXS = ((REMsize * 0.25) * (rowCnt + 1)); // add REMsize count of rows(all of them have bottom margin) plus one at the top. Do not count bottom one since it comes from the last row
    let height = size[1] - ((rowCnt * 45) + additionalPXS); // subtract px count from all the rows plus size of the rows times rowcnt
    output.style.height = height.toString() + "px";
} 

const updtSzOnLoad = async () => {
    const size = await window.ipcbridge.updateSizeOnLoad();
    resizeOutput(size);
};

window.ipcbridge.resizeStuff((event, size) => {
    resizeOutput(size);
});

updtSzOnLoad();
