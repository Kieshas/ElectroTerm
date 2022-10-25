let rowCnt = 0;

document.querySelectorAll(".row").forEach( () => { // runs one time at startup
    rowCnt++;
});

let gravitacineKonstanta = 63;

const resizeOutput = (size) => {
    if (size == undefined) return;
    let REMsize = parseInt(getComputedStyle(document. documentElement).fontSize, 10);
    let additionalPXS = ((REMsize * 0.25) * (rowCnt)); // add REMsize count of rows minus the textarea one (all of them have bottom margin) plus one at the top. Do not count bottom one since it comes from the last row
    let height = size[1] - (((rowCnt -1) * 38) + additionalPXS + gravitacineKonstanta); // subtract px count from all the rows plus size of the rows times rowcnt and also - gravitacine konstanta (size of the top bar and toolbar of widow)
    output.style.height = height.toString() + "px";
} 

window.ipcRender.receive('resizeEvt', (args) => { resizeOutput(args) });

const updtSzOnLoad = async () => {
    const size = await window.ipcRender.invoke('updateSizeOnLoad');
    resizeOutput(size);
};

updtSzOnLoad();
