const connectBtn = document.getElementById('connect');

const dtrCb = document.getElementById('dtrCb');

const rtsCb = document.getElementById('rtsCb');

connectBtn.addEventListener('click', () => {
    if (baud == null && port == null) {
        showPopup("Selection error", "Please select port and baud rate");
        return;
    } else if (baud == null) {
        showPopup("Selection error", "Please select baud rate");
        return;
    } else if (port == null) {
        showPopup("Selection error", "Please select port");
        return;
    }

    if (connectBtn.className == "col btn btn-outline-success") {
        connectBtn.className = "col btn btn-outline-danger";
        connectBtn.textContent = "Disconnect";
        window.ipcRender.send('setPrmsAndConnect', port, baud);
    } else {
        connectBtn.className = "col btn btn-outline-success";
        connectBtn.textContent = "Connect";
        window.ipcRender.send('disconnectPort');
    }
});

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
