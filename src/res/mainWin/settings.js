// Loads persisted settings on startup and saves them back when the window closes.

const loadSettingsOnStart = () => {
    const req = (key) => window.ipcRender.invoke('requestSettings', key);

    req('macroSettings').then((args) => {
        if (args == null) return;
        for (let i = 0; i < args.length && i < macroBtnVal.length; i++) {
            if (args[i][0] != null && args[i][0] !== '') {
                document.getElementById(`Macro-${i + 1}`).textContent = args[i][0];
            }
            macroBtnVal[i] = args[i][1];
            styleMacroBtn(i);
        }
        updateMacroRows();
    });
    req('lastUsedFont').then((args) => {
        if (args == null) return;
        fontSelect.value = args;
        output.style.fontSize = args;
        outputFiltered.style.fontSize = args;
    });
    req('lastUsedSerPort').then(async (args) => {
        if (args == null) return;
        await refreshPorts();
        if ([...portSelect.options].some((opt) => opt.value === args)) {
            portSelect.value = args;
        }
    });
    req('lastUsedSerBaud').then((args) => {
        if (args == null) return;
        baudSelect.value = String(args).trim();
    });
    req('lastUsedPort').then((args) => {
        if (args == null) return;
        tcpPortInput.value = args;
    });
    req('proportionOutput').then((args) => {
        if (args == null) return;
        outputProportion = args;
        outputFilteredProportion = 1 - args;
        applyProportions();
    });
    req('scrollback').then((args) => {
        if (args == null) return;
        setScrollback(Number(args));
        scrollbackSelect.value = String(args);
    });
};

// Each saveSettings invoke is handled synchronously in the main process, so
// concurrent invokes cannot interleave mid-write; Promise.all is safe here.
const saveSettingsOnClose = () => {
    const save = (key, val) => window.ipcRender.invoke('saveSettings', key, val);
    const macroPairs = [];
    for (let i = 0; i < macroBtnVal.length; i++) {
        macroPairs.push([
            document.getElementById(`Macro-${i + 1}`).textContent,
            macroBtnVal[i] === '' ? null : macroBtnVal[i],
        ]);
    }
    return Promise.all([
        save('macroSettings', macroPairs),
        save('lastUsedFont', fontSelect.value),
        save('lastUsedSerPort', portSelect.value || null),
        save('lastUsedSerBaud', baudSelect.value || null),
        save('lastUsedPort', tcpPortInput.value),
        save('proportionOutput', outputProportion),
        save('proportionOutputFl', outputFilteredProportion),
    ]);
};

window.ipcRender.receive('onCloseEvt', () => {
    saveSettingsOnClose().then(() => {
        window.ipcRender.send('safeToClose');
    });
});

loadSettingsOnStart();
refreshPorts();
