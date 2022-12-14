const connectBtn = document.getElementById('connect');
const clearBtn = document.getElementById('clearBtn');
const logToFileBtn = document.getElementById('logToFileBtn');
const openFileBtn = document.getElementById('openFileBtn');
const sendMsgBtn = document.getElementById('sendMsgBtn');
const openFiltersBtn = document.getElementById('openFiltersBtn');
const openAutoRspBtn = document.getElementById('openAutoRspBtn');
const sendMsgText = document.getElementById('sendMsgText');
const sendMsgTmo = document.getElementById('sendTmo');

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
}

let stopContinuous = true;
const sendMsgContinuous = (msg) => {
    if (stopContinuous) return;
    window.ipcRender.send('sendMsg', msg);
    setTimeout(() => {sendMsgContinuous(msg)}, Number(sendMsgTmo.value, 10));
}

const timeoutSendMagic = (msgToSend) => {
    if ((sendMsgTmo.value != "" && sendMsgTmo.value != 0) && sendMsgBtn.classList.contains('btn-outline-secondary')) {
        sendMsgBtn.textContent = "Stop";
        sendMsgBtn.classList.remove('btn-outline-secondary');
        sendMsgBtn.classList.add('btn-outline-danger');
        stopContinuous = false;
        sendMsgContinuous(msgToSend)
    } else if (sendMsgTmo.value != "" && sendMsgTmo.value != 0) { // turn off periodical send
        sendMsgBtn.classList.remove('btn-outline-danger');
        sendMsgBtn.classList.add('btn-outline-secondary');
        sendMsgBtn.textContent = "Send";
        stopContinuous = true;
    } else {
        sendMsg(msgToSend);
    }
}

sendMsgBtn.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        return;
    }
    timeoutSendMagic(sendMsgText.value);
})

sendMsgText.addEventListener('keydown', (event) => {
    if (event.key === "Enter") {
        if (connectBtn.className == "col btn btn-outline-success") {
            showPopup("Communication Error", "Not connected");
            return;
        }
        timeoutSendMagic(sendMsgText.value);
    }
});

const updateMacroRows = () => {
    document.querySelector('.showIfMacrosFilled').style.display = "";
    for (let i = 0; i < document.querySelectorAll('.macroBtn').length; i++) {
        if ((macroBtnVal[i] == null || macroBtnVal[i] === "") && (i < (document.getElementById('macroExpansionControl')).querySelectorAll('.macroBtn').length)) {
            document.querySelector('.showIfMacrosFilled').style.display = "none";
        } else if ((macroBtnVal[i] != null && macroBtnVal[i] !== "") && (i > (document.getElementById('macroExpansionControl')).querySelectorAll('.macroBtn').length)) {
            document.querySelector('.showIfMacrosFilled').style.display = "";
        }
    }
    updtSzOnLoad();
}

const activateMacro = () => {
    try {
        document.querySelectorAll(".macroBtn").forEach( (btn) => {
            if (macroBtnVal[(Number(btn.id.slice(6)) - 1)] != null && macroBtnVal[(Number(btn.id.slice(6)) - 1)] != "") {
                btn.classList.remove("btn-outline-primary");
                btn.classList.add("btn-outline-info");
            } else {
                btn.classList.remove("btn-outline-info");
                btn.classList.add("btn-outline-primary");
            }
        });
    } catch {

    }
}

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
                activateMacro();
                updateMacroRows();
            });
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

openFiltersBtn.addEventListener('click', () => {
    window.ipcRender.send('openFilters', darkModeCb.checked);
});

openAutoRspBtn.addEventListener('click', () => {
    window.ipcRender.send('openAutoRsp', darkModeCb.checked);
});
