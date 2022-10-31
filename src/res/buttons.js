const connectBtn = document.getElementById('connect');
const clearBtn = document.getElementById('clearBtn');
const restartBtn = document.getElementById('restartBtn');

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

clearBtn.addEventListener('click', () => {
    ClearOutputs();
});

restartBtn.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        return;
    }
    if (platform == null) {
        showPopup("Communication Error", "Platform not selected");
        return;
    }
    
    let rtsState;
    if (platform == "ARM") {
        rtsState = false;
    } else if (platform == "ESP") {
        rtsState = true;
    }
    window.ipcRender.send('restartEvt', rtsState);
});
