const lockCb = document.getElementById('lockCb');
const tsCb = document.getElementById('timestampCb');
const hexCb = document.getElementById('hexCb');
const darkModeCb = document.getElementById('darkModeCb');
const editModeCb = document.getElementById('editModeCb');
const rtsCb = document.getElementById('rtsBtn');
const dtrCb = document.getElementById('dtrBtn');

lockCb.addEventListener('click', () => {
    if (lockCb.checked) {
        document.getElementById('lockedStat').src='res/resources/unlocked-nobg.png';
    } else {
        document.getElementById('lockedStat').src='res/resources/locked.png';
    }
});

tsCb.addEventListener('click', () => {
    if (tsCb.checked) {
        window.ipcRender.send('timeStamp', true);
    } else {
        window.ipcRender.send('timeStamp', false);
    }
});

hexCb.addEventListener('click', () => {
    if (hexCb.checked) {
        window.ipcRender.send('hexCheck', true);
    } else {
        window.ipcRender.send('hexCheck', false);
    }
})

darkModeCb.addEventListener('click', () => {
    if (darkModeCb.checked) {
        document.querySelectorAll(".darkBtn").forEach( element => {
            element.classList.remove("btn-outline-dark");
            element.classList.add("btn-outline-secondary");
        });
        document.getElementById('darkModeStat').src="res/resources/whiteShquare.png"
        parent.appendChild(DMcss);
    } else {
        document.querySelectorAll(".darkBtn").forEach( element => {
            element.classList.remove("btn-outline-secondary");
            element.classList.add("btn-outline-dark");
        });
        document.getElementById('darkModeStat').src="res/resources/darkShquare.png"
        parent.removeChild(DMcss);
    }
});

rtsCb.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        rtsCb.checked = false;
        return;
    }
    
    window.ipcRender.send('restartEvt', "RTS", rtsCb.checked);
});

dtrCb.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        dtrCb.checked = false;
        return;
    }
    
    window.ipcRender.send('restartEvt', "DTR", dtrCb.checked);
});
