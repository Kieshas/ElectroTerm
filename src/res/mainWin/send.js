const sendText = document.getElementById('sendText');
const sendTmo = document.getElementById('sendTmo');
const sendBtn = document.getElementById('sendBtn');
const macroListBtn = document.getElementById('macroListBtn');
const macroListPop = document.getElementById('macroListPop');
const macroRowMain = document.getElementById('macroRowMain');
const macroRowExtra = document.getElementById('macroRowExtra');

const sendMsg = (msg) => {
    window.ipcRender.invoke('sendMsg', msg).then((sent) => {
        if (sent !== true) {
            stopContinuousSend();
            showToast('error', 'Nothing sent', workMode === 'TCP'
                ? 'No TCP client is connected yet'
                : 'The serial port is not open');
        }
    });
};

// --- repeat send ---
let stopContinuous = true;
const sendMsgContinuous = (msg) => {
    if (stopContinuous || !isConnected) return;
    sendMsg(msg);
    const tmo = Number(sendTmo.value);
    const delay = Number.isFinite(tmo) && tmo >= 10 ? tmo : 10; // clamp so an emptied field can't turn into a 0ms flood
    setTimeout(() => sendMsgContinuous(msg), delay);
};

const stopContinuousSend = () => {
    if (stopContinuous) return;
    stopContinuous = true;
    sendBtn.classList.remove('btn-danger');
    sendBtn.textContent = 'Send';
};

const handleSend = () => {
    if (!isConnected) {
        showToast('error', 'Not connected', 'Open a connection before sending');
        return;
    }
    const repeatMs = sendTmo.value !== '' && Number(sendTmo.value) !== 0;
    if (repeatMs && stopContinuous) {
        stopContinuous = false;
        sendBtn.classList.add('btn-danger');
        sendBtn.textContent = 'Stop';
        sendMsgContinuous(sendText.value);
    } else if (!stopContinuous) {
        stopContinuousSend();
    } else {
        sendMsg(sendText.value);
    }
};

sendBtn.addEventListener('click', handleSend);
sendText.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleSend();
});
sendTmo.addEventListener('input', () => {
    sendTmo.value = sendTmo.value.replace(/[^0-9]/g, '');
});

// --- macros.txt quick-insert list ---
const toggleMacroList = async () => {
    if (!macroListPop.classList.contains('hidden')) {
        macroListPop.classList.add('hidden');
        return;
    }
    macroListPop.replaceChildren();
    let lines = [];
    try {
        lines = (await window.ipcRender.invoke('requestMacros')).filter((line) => line.trim() !== '');
    } catch {
        // no macros.txt yet: walk the user straight into creating one
        showToast('ok', 'No quick-send list yet', 'Add your first commands here and hit Save');
        openPanel('macroFile');
        return;
    }
    lines.forEach((line) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'block w-full text-left px-3 py-2 font-mono text-sm text-ink hover:bg-panel2 cursor-pointer';
        item.textContent = line.trim();
        item.addEventListener('click', () => {
            sendText.value = line.trim();
            macroListPop.classList.add('hidden');
            sendText.focus();
        });
        macroListPop.append(item);
    });
    const editItem = document.createElement('button');
    editItem.type = 'button';
    editItem.className = 'block w-full text-left px-3 py-2 text-sm text-dim hover:bg-panel2 hover:text-ink cursor-pointer border-t border-edge';
    editItem.textContent = '✎ Edit list…';
    editItem.addEventListener('click', () => {
        macroListPop.classList.add('hidden');
        openPanel('macroFile');
    });
    macroListPop.append(editItem);
    macroListPop.classList.remove('hidden');
};
macroListBtn.addEventListener('click', toggleMacroList);
document.addEventListener('click', (event) => {
    if (!macroListPop.contains(event.target) && event.target !== macroListBtn) {
        macroListPop.classList.add('hidden');
    }
});

// --- macro buttons: 22 slots, click to send, right-click (or empty click) to edit ---
const MACRO_COUNT = 22;
let macroBtnVal = new Array(MACRO_COUNT);

const macroButton = (idx) => document.getElementById(`Macro-${idx + 1}`);

const styleMacroBtn = (idx) => {
    const btn = macroButton(idx);
    const filled = macroBtnVal[idx] != null && macroBtnVal[idx] !== '';
    btn.classList.toggle('text-dim', !filled);
    btn.classList.toggle('border-dashed', !filled);
    btn.title = filled ? `${macroBtnVal[idx]}\n(right-click to edit)` : 'Click to set up this macro';
};

const editMacro = (idx) => {
    const btn = macroButton(idx);
    showInputDialog({
        title: `Macro ${idx + 1}`,
        label1: 'Name (max 24 characters)',
        max1: 24,
        value1: btn.textContent === '-' ? '' : btn.textContent,
        label2: 'Message to send',
        value2: macroBtnVal[idx],
    }).then((input) => {
        if (input == null) return;
        btn.textContent = input[0] === '' ? '-' : input[0];
        macroBtnVal[idx] = input[1];
        styleMacroBtn(idx);
        updateMacroRows();
    });
};

const macroClick = (idx) => {
    const filled = macroBtnVal[idx] != null && macroBtnVal[idx] !== '';
    if (!filled) {
        editMacro(idx);
        return;
    }
    if (!isConnected) {
        showToast('error', 'Not connected', 'Open a connection before sending');
        return;
    }
    sendMsg(macroBtnVal[idx]);
};

for (let i = 0; i < MACRO_COUNT; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn overflow-hidden text-ellipsis px-1';
    btn.id = `Macro-${i + 1}`;
    btn.textContent = '-';
    btn.addEventListener('click', () => macroClick(i));
    btn.addEventListener('contextmenu', (event) => { event.preventDefault(); editMacro(i); });
    (i < 10 ? macroRowMain : macroRowExtra).append(btn);
    styleMacroBtn(i);
}

const macroExpandBtn = document.createElement('button');
macroExpandBtn.type = 'button';
macroExpandBtn.className = 'btn btn-ghost';
macroExpandBtn.textContent = '⌄';
macroExpandBtn.title = 'Show more macros';
macroExpandBtn.addEventListener('click', () => {
    const nowHidden = macroRowExtra.classList.toggle('hidden');
    macroExpandBtn.textContent = nowHidden ? '⌄' : '⌃';
    macroExpandBtn.title = nowHidden ? 'Show more macros' : 'Show fewer macros';
});
macroRowMain.append(macroExpandBtn);

// expand the extra row automatically when it holds saved macros
const updateMacroRows = () => {
    const extraFilled = macroBtnVal.slice(10).some((val) => val != null && val !== '');
    if (extraFilled && macroRowExtra.classList.contains('hidden')) {
        macroExpandBtn.click();
    }
};
