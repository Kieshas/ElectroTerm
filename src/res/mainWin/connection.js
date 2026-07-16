const modeSerialBtn = document.getElementById('modeSerialBtn');
const modeTcpBtn = document.getElementById('modeTcpBtn');
const serialFields = document.getElementById('serialFields');
const portSelect = document.getElementById('portSelect');
const baudSelect = document.getElementById('baudSelect');
const tcpPortInput = document.getElementById('tcpPortInput');
const connectBtn = document.getElementById('connectBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const tsBtn = document.getElementById('tsBtn');
const hexBtn = document.getElementById('hexBtn');
const fontSelect = document.getElementById('fontSelect');
const rtsBtn = document.getElementById('rtsBtn');
const dtrBtn = document.getElementById('dtrBtn');

let workMode = 'SERIAL';
let isConnected = false;

const setMode = (mode) => {
    if (isConnected) disconnect();
    workMode = mode;
    setPressed(modeSerialBtn, mode === 'SERIAL');
    setPressed(modeTcpBtn, mode === 'TCP');
    serialFields.classList.toggle('hidden', mode !== 'SERIAL');
    tcpPortInput.classList.toggle('hidden', mode !== 'TCP');
    connectBtn.textContent = mode === 'SERIAL' ? 'Connect' : 'Listen';
};

modeSerialBtn.addEventListener('click', () => setMode('SERIAL'));
modeTcpBtn.addEventListener('click', () => setMode('TCP'));

const refreshPorts = async () => {
    const current = portSelect.value;
    const ports = await window.ipcRender.invoke('populateDD').catch(() => []);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Port…';
    portSelect.replaceChildren(placeholder);
    ports.forEach((port) => {
        const option = document.createElement('option');
        option.value = port.path;
        option.textContent = port.label;
        option.title = port.title;
        portSelect.append(option);
    });
    if (ports.some((port) => port.path === current)) portSelect.value = current;
};
portSelect.addEventListener('pointerdown', () => { refreshPorts(); });

const setStatus = (state, text) => {
    statusText.textContent = text;
    statusDot.className = 'size-2 rounded-full ' + (state === 'on' ? 'bg-accent' : 'bg-dim/60');
};

const setConnected = (connected) => {
    isConnected = connected;
    connectBtn.classList.toggle('btn-primary', !connected);
    connectBtn.classList.toggle('btn-danger', connected);
    if (connected) {
        connectBtn.textContent = workMode === 'SERIAL' ? 'Disconnect' : 'Close';
        setStatus('on', workMode === 'SERIAL'
            ? `${portSelect.value} @ ${baudSelect.value}`
            : `Listening on :${tcpPortInput.value}`);
    } else {
        connectBtn.textContent = workMode === 'SERIAL' ? 'Connect' : 'Listen';
        setStatus('off', 'Disconnected');
    }
};

const disconnect = () => {
    stopContinuousSend();
    setPressed(rtsBtn, false);
    setPressed(dtrBtn, false);
    window.ipcRender.send(workMode === 'SERIAL' ? 'disconnectPort' : 'closeServer');
    setConnected(false);
};

const ipcErrText = (err, channel) => {
    err = err.toString();
    const marker = `'${channel}':`;
    const idx = err.indexOf(marker);
    return idx > -1 ? err.slice(idx + marker.length).trim() : err;
};

const connect = () => {
    if (workMode === 'SERIAL') {
        if (!portSelect.value || !baudSelect.value) {
            showToast('error', 'Nothing selected', 'Pick a serial port and baud rate first');
            return;
        }
        window.ipcRender.invoke('setPrmsAndConnect', portSelect.value, baudSelect.value)
            .then(() => setConnected(true))
            .catch((err) => showToast('error', 'Connection failed', ipcErrText(err, 'setPrmsAndConnect')));
    } else {
        if (tcpPortInput.value === '') {
            showToast('error', 'No port', 'Enter a TCP port to listen on');
            return;
        }
        window.ipcRender.invoke('openServer', tcpPortInput.value)
            .then(() => setConnected(true))
            .catch((err) => showToast('error', 'Server failed', ipcErrText(err, 'openServer')));
    }
};

connectBtn.addEventListener('click', () => {
    if (isConnected) disconnect(); else connect();
});

tcpPortInput.addEventListener('input', () => {
    tcpPortInput.value = tcpPortInput.value.replace(/[^0-9]/g, '');
});

// received-data options
tsBtn.addEventListener('click', () => {
    setPressed(tsBtn, !isPressed(tsBtn));
    window.ipcRender.send('timeStamp', isPressed(tsBtn));
});
hexBtn.addEventListener('click', () => {
    setPressed(hexBtn, !isPressed(hexBtn));
    window.ipcRender.send('hexCheck', isPressed(hexBtn));
});

fontSelect.addEventListener('change', () => {
    output.style.fontSize = fontSelect.value;
    outputFiltered.style.fontSize = fontSelect.value;
});

// output tools row
const clearBtn = document.getElementById('clearBtn');
const logBtn = document.getElementById('logBtn');
const openFileBtn = document.getElementById('openFileBtn');
const scrollbackSelect = document.getElementById('scrollbackSelect');
let isLogging = false;

clearBtn.addEventListener('click', () => {
    ClearOutputs();
});

logBtn.addEventListener('click', () => {
    window.ipcRender.invoke('selectFile').then((started) => {
        isLogging = started === true;
        logBtn.textContent = isLogging ? 'Stop logging' : 'Log to file';
        logBtn.classList.toggle('btn-danger', isLogging);
    });
});

openFileBtn.addEventListener('click', () => {
    window.ipcRender.invoke('openFile').then((opened) => {
        if (opened !== true) showToast('error', 'No log file', 'Nothing has been logged yet');
    });
});

scrollbackSelect.addEventListener('change', () => {
    setScrollback(Number(scrollbackSelect.value));
    window.ipcRender.invoke('saveSettings', 'scrollback', Number(scrollbackSelect.value));
});

// serial control lines
const toggleCtrlLine = (btn, name) => {
    if (!isConnected || workMode !== 'SERIAL') {
        showToast('error', 'Not connected', 'Open a serial connection first');
        return;
    }
    setPressed(btn, !isPressed(btn));
    if (name === 'RTS') setPressed(dtrBtn, false); else setPressed(rtsBtn, false); // driver drops the other line
    window.ipcRender.send('restartEvt', name, isPressed(btn));
};
rtsBtn.addEventListener('click', () => toggleCtrlLine(rtsBtn, 'RTS'));
dtrBtn.addEventListener('click', () => toggleCtrlLine(dtrBtn, 'DTR'));
