const connectBtn = document.getElementById('connect');
const clearBtn = document.getElementById('clearBtn');
const logToFileBtn = document.getElementById('logToFileBtn');
const openFileBtn = document.getElementById('openFileBtn');
const sendMsgBtn = document.getElementById('sendMsgBtn');
const openFiltersBtn = document.getElementById('openFiltersBtn');

const disconnectPort = () => {
    switch (workMode) {
        case "SERIAL ":
            window.ipcRender.send('disconnectPort');
            connectBtn.className = "col btn btn-outline-success";
            connectBtn.textContent = "Connect";
            break;
        case "TCP ":
            window.ipcRender.send('closeServer');
            connectBtn.className = "col btn btn-outline-success";
            connectBtn.textContent = "Open";
            break;
        default:
            break;
    }
}

const connectActionSerial = () => {
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
        disconnectPort();
    }
}

const connectActionTCP = () => {
    if (TCPportInput.value == "") {
        showPopup("Selection error", "Please input Port");
        return;
    }

    if (connectBtn.className == "col btn btn-outline-success") {
        window.ipcRender.invoke('openServer', TCPportInput.value).then(() => {
            connectBtn.className = "col btn btn-outline-danger";
            connectBtn.textContent = "Close";
            window.ipcRender.send('saveSettings', "lastUsedPort", TCPportInput.value);
        }).catch((err) => {
            err = err.toString();
            const unNeededStr = "'openServer':";
            showPopup("Communication error", err.substr(err.indexOf(unNeededStr) + unNeededStr.length));
        });
    } else {
        disconnectPort();
    }
}

connectBtn.addEventListener('click', () => {
    switch (workMode) {
        case "SERIAL ":
            connectActionSerial();
            break;
        case "TCP ":
            connectActionTCP();
            break;
        default:
            break;
    }
});

clearBtn.addEventListener('click', () => {
    ClearOutputs();
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

                let valToSave = new Array;
                for(let i = 0; i < macroBtnVal.length; i++) {
                    let valToSavePair = new Array;
                    valToSavePair.push(document.getElementById(`Macro-${i + 1}`).textContent);
                    valToSavePair.push(macroBtnVal[i]);
                    valToSave.push(valToSavePair);
                }
                window.ipcRender.send('saveSettings', "macroSettings", valToSave);
            })
        } else {
            if (connectBtn.className == "col btn btn-outline-success") {
                showPopup("Communication Error", "Not connected");
                return;
            }
            if (macroBtnVal[(Number(btn.id.slice(6)) - 1)]) {
                sendMsg(macroBtnVal[(Number(btn.id.slice(6)) - 1)]); //subtract length of "Macro-" from the start - 1 since macro id's start from 1
            }
        }
    });
});
let macroBtnVal = new Array(macroCnt);

window.ipcRender.invoke('requestSettings', 'macroSettings').then( (args) => {
    if (args == null) return;
    for (let i = 0; i < args.length; i++) {
        document.getElementById(`Macro-${i + 1}`).textContent = args[i][0];
        macroBtnVal[i] = args[i][1];
    }
});

openFiltersBtn.addEventListener('click', () => {
    window.ipcRender.send('openFilters', darkModeCb.checked);
});
