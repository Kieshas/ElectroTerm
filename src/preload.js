const { contextBridge, ipcRenderer } = require('electron');

const Stuff = {
    populateDD: () => ipcRenderer.invoke('populateDD'),
    setPrmsAndConnect: (port, baud) => ipcRenderer.send('setPrmsAndConnect', port, baud),
    disconnectPort: () => ipcRenderer.send('disconnectPort'),
    dtrEvt: (set) => ipcRenderer.send('dtrEvt', set),
    rtsEvt: (set) => ipcRenderer.send('rtsEvt', set),
    resizeStuff: (size) => ipcRenderer.on('resizeEvt', size),
    updateSizeOnLoad: () => ipcRenderer.invoke('updateSizeOnLoad'),
    printLn: (lineContent) => ipcRenderer.on('printLn', lineContent),

}

contextBridge.exposeInMainWorld('ipcbridge', Stuff);