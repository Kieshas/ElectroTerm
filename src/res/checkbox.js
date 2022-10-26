const dtrCb = document.getElementById('dtrCb');
const rtsCb = document.getElementById('rtsCb');
const lockCb = document.getElementById('lockCb');
const tsCb = document.getElementById('timestampCb');
const hexCb = document.getElementById('hexCb');
const darkModeCb = document.getElementById('darkModeCb');

rtsCb.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        rtsCb.checked = !rtsCb.checked;
        return;
    }
    window.ipcRender.send('rtsEvt', !rtsCb.checked);//INVERT
});

dtrCb.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        dtrCb.checked = !dtrCb.checked;
        return;
    }
    window.ipcRender.send('dtrEvt', !dtrCb.checked);//INVERT
});

lockCb.addEventListener('click', () => {
    if (lockCb.checked) {
        document.getElementById('lockedStat').src='res/resources/unlocked-nobg.png';
    } else {
        document.getElementById('lockedStat').src='res/resources/locked.png';
    }
});

darkModeCb.addEventListener('click', () => {
    if (darkModeCb.checked) {
        document.querySelectorAll(".darkBtn").forEach( element => {
            element.classList.remove("btn-outline-dark");
            element.classList.add("btn-outline-secondary");
        });
        parent.appendChild(DMcss);
    } else {
        document.querySelectorAll(".darkBtn").forEach( element => {
            element.classList.remove("btn-outline-secondary");
            element.classList.add("btn-outline-dark");
        });
        parent.removeChild(DMcss);
    }
});
