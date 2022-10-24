const connectBtn = document.getElementById('connect');

const dtrBtn = document.getElementById('dtr');
const BSDtrBtn = new bootstrap.Button(dtrBtn);

const rtsBtn = document.getElementById('rts');
const BSRtsBtn = new bootstrap.Button(rtsBtn);

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

rtsBtn.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        return;
    }
    if (rtsBtn.className == "col btn btn-outline-primary") {
        rtsBtn.className = "col btn btn-primary";
        window.ipcRender.send('rtsEvt', false);
    } else {
        rtsBtn.className = "col btn btn-outline-primary";
        window.ipcRender.send('rtsEvt', true);
    }
});

dtrBtn.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        return;
    }
    if (dtrBtn.className == "col btn btn-outline-primary") {
        dtrBtn.className = "col btn btn-primary";
        window.ipcRender.send('dtrEvt', false);
    } else {
        dtrBtn.className = "col btn btn-outline-primary";
        window.ipcRender.send('dtrEvt', true);
    }
});
