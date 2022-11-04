let rowCnt = 0;

document.querySelectorAll(".row").forEach( () => { // runs one time at startup
    rowCnt++;
});

const resizeOutput = (size) => {
    if (size == undefined) return;
    let REMsize = parseInt(getComputedStyle(document. documentElement).fontSize, 10);
    let additionalPXS = ((REMsize * 0.25) * (rowCnt + 1)); // all rows use mb-1 (margin of 0.25rem) so we count the ammount of PX that we need to subtract from contentSize to compensate for margins
    let height = 0;
    document.querySelectorAll(".row").forEach( (row) => { // runs one time at startup
        if (row.id == "outputRow") return; // exception for output row
        height += row.offsetHeight;
    });
    height = size[1] - (height + additionalPXS);
    output.style.height = height.toString() + "px";
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
