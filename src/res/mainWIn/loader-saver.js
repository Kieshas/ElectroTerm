const loadSettingsOnStart = () => {
    // LOAD macro buttons
    window.ipcRender.invoke('requestSettings', 'macroSettings').then((args) => {
        if (args == null) {
            updateMacroRows();
            return;
        }
        for (let i = 0; i < args.length; i++) {
            document.getElementById(`Macro-${i + 1}`).textContent = args[i][0];
            macroBtnVal[i] = args[i][1];
        }
        activateMacro();
        updateMacroRows();
    });
    // LOAD last used font size
    window.ipcRender.invoke('requestSettings', 'lastUsedFont').then((args) => {
        if (args == null) return;
        fontDD.textContent = "Font: " + args;
        output.style.fontSize = args;
        outputFiltered.style.fontSize = args;
    });
    // LOAD last used serial port
    window.ipcRender.invoke('requestSettings', 'lastUsedSerPort').then((args) => {
        if (args == null) return;
        portDD.textContent = args;
        port = args;
    });
    // LOAD last used serial baud rate
    window.ipcRender.invoke('requestSettings', 'lastUsedSerBaud').then((args) => {
        if (args == null) return;
        baudDD.textContent = args;
        baud = args;
    });
    // LOAD last used TCP port
    window.ipcRender.invoke('requestSettings', 'lastUsedPort').then((args) => {
        if (args == null) return;
        TCPportInput.value = args;
    });
    //LOAD Output window proportion
    window.ipcRender.invoke('requestSettings', 'proportionOutput').then((args) => {
        if (args == null) return;
        outputProportion = args;
    });
    //LOAD Output filtered window proportion
    window.ipcRender.invoke('requestSettings', 'proportionOutputFl').then((args) => {
        if (args == null) return;
        outputFilteredProportion = args;
    });
}

const saveSettingsOnClose = () => { // nested invokes to make sure we finish the write. idk probably a shit idea we will see
    return new Promise((resolve) => {
        // SAVE macro buttons
        macroBtnSaver();
        // SAVE last used font size
        window.ipcRender.invoke('saveSettings', "lastUsedFont", currFont).then(() => {
        // SAVE last used serial port
        window.ipcRender.invoke('saveSettings', "lastUsedSerPort", port).then(() => {
        // SAVE last used serial baud
        window.ipcRender.invoke('saveSettings', "lastUsedSerBaud", baud).then(() => {
        // SAVE last used TCP port
        window.ipcRender.invoke('saveSettings', "lastUsedPort", TCPportInput.value).then(() => {
        // SAVE Output window proportion
        window.ipcRender.invoke('saveSettings', "proportionOutput", outputProportion).then(() => {     
        // SAVE Output filtered window proportion
        window.ipcRender.invoke('saveSettings', "proportionOutputFl", outputFilteredProportion).then(() => {     
            resolve();
        });
        });
        });
        });
        });        
        });
    })
}

window.ipcRender.receive('onCloseEvt', () => {
    saveSettingsOnClose().then(() => {
        window.ipcRender.send('safeToClose');
    })
});

const macroBtnSaver = () => {
    let valToSave = new Array;
    for(let i = 0; i < macroBtnVal.length; i++) {
        let valToSavePair = new Array;
        valToSavePair.push(document.getElementById(`Macro-${i + 1}`).textContent);
        valToSavePair.push(macroBtnVal[i]);
        valToSave.push(valToSavePair);
    }
    window.ipcRender.invoke('saveSettings', "macroSettings", valToSave);
}
