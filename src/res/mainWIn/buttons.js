const connectBtn = document.getElementById('connect');
const clearBtn = document.getElementById('clearBtn');
const restartBtn = document.getElementById('restartBtn');
const logToFileBtn = document.getElementById('logToFileBtn');
const openFileBtn = document.getElementById('openFileBtn');
const sendMsgBtn = document.getElementById('sendMsgBtn');
const openFiltersBtn = document.getElementById('openFiltersBtn');

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
        window.ipcRender.invoke('setPrmsAndConnect', port, baud).then(() => {
            connectBtn.className = "col btn btn-outline-danger";
            connectBtn.textContent = "Disconnect";
        }).catch((err) => {
            err = err.toString();
            const unNeededStr = "'setPrmsAndConnect':";
            showPopup("Communication error", err.substr(err.indexOf(unNeededStr) + unNeededStr.length));
        });

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

logToFileBtn.addEventListener('click', () => {
    window.ipcRender.invoke('selectFile').then((mesg) => {
        if (mesg == true) {
            logToFileBtn.textContent = 'Stop logging';
            logToFileBtn.className = 'col btn btn-outline-danger';
        } else {
            logToFileBtn.textContent = 'Log To File';
            logToFileBtn.className = 'col btn btn-outline-primary';
        }
    });
});

openFileBtn.addEventListener('click', () => {
    if (logToFileBtn.className == 'col btn btn-outline-primary') {
        showPopup("Selection error", "Logging is not in progress");
        return;
    }
    window.ipcRender.send('openFile');
})

const sendMsg = (msg) => {
    window.ipcRender.send('sendMsg', msg);
    outputLine(msg + '\r\n');
}

sendMsgBtn.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        return;
    }
    sendMsg(document.getElementById('sendMsgText').value);
})

let macroCnt = 0;
document.querySelectorAll(".macroBtn").forEach( (btn) => { // prikraut dar viena eilute su 10 macrosu presetu, kurie switchina. Isviso 100tukas kad butu
    macroCnt++;
    btn.textContent = "-";
    btn.addEventListener('click', () => {
        if (editModeCb.checked) {
            promiseToWait = showInputPopup(btn.id, "Macro name (max 7 characters)", btn.textContent, "Message to be sent", macroBtnVal[(Number(btn.id.slice(6)) - 1)]);
            promiseToWait.then((input) => {
                btn.textContent = input[0];
                macroBtnVal[(Number(btn.id.slice(6)) - 1)] = input[1]; //subtract length of "Macro-" from the start - 1 since macro id's start from 1
            })
        } else {
            if (connectBtn.className == "col btn btn-outline-success") {
                showPopup("Communication Error", "Not connected");
                return;
            }
            sendMsg(macroBtnVal[(Number(btn.id.slice(6)) - 1)]); //subtract length of "Macro-" from the start - 1 since macro id's start from 1
        }
    });
});
let macroBtnVal = new Array(macroCnt);

openFiltersBtn.addEventListener('click', () => {
    window.ipcRender.send('openFilters', darkModeCb.checked);
});
