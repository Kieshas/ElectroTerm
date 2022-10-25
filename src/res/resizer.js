let rowCnt = 0;

document.querySelectorAll(".row").forEach( () => { // runs one time at startup
    rowCnt++;
});

const resizeOutput = (size) => {
    if (size == undefined) return;
    let REMsize = parseInt(getComputedStyle(document. documentElement).fontSize, 10);
    let additionalPXS = ((REMsize * 0.25) * (rowCnt + 1)); // all rows use mb-1 (margin of 0.25rem) so we count the ammount of PX that we need to subtract from contentSize to compensate for margins
    let height = size[1] - (((rowCnt -1) * 38) + additionalPXS); // subtract calculated px ammount from contentsize (rowcnt - 1 because we dont take textare row into account)
    output.style.height = height.toString() + "px";
} 

window.ipcRender.receive('resizeEvt', (args) => { resizeOutput(args) });

const updtSzOnLoad = async () => {
    const size = await window.ipcRender.invoke('updateSizeOnLoad');
    resizeOutput(size);
};

updtSzOnLoad();
