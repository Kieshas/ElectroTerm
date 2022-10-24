// const { contextBridge, ipcRenderer } = require('electron');

// const Stuff = {
//     populateDD: () => ipcRenderer.invoke('populateDD'),
//     setPrmsAndConnect: (port, baud) => ipcRenderer.send('setPrmsAndConnect', port, baud),
//     disconnectPort: () => ipcRenderer.send('disconnectPort'),
//     dtrEvt: (set) => ipcRenderer.send('dtrEvt', set),
//     rtsEvt: (set) => ipcRenderer.send('rtsEvt', set),
//     resizeStuff: (size) => ipcRenderer.on('resizeEvt', size),
//     updateSizeOnLoad: () => ipcRenderer.invoke('updateSizeOnLoad'),
//     printLn: (lineContent) => ipcRenderer.on('printLn', lineContent),



// }

// contextBridge.exposeInMainWorld('ipcbridge', Stuff);

// Import the necessary Electron components.
const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;

// White-listed channels.
const ipc = {
    'render': {
        // From render to main.
        'send': [
            'setPrmsAndConnect',
            'disconnectPort',
            'dtrEvt',
            'rtsEvt',
        ],
        // From main to render.
        'receive': [
            'resizeEvt',
            'printLn',
        ],
        // From render to main and back again.
        'sendReceive': [
            'populateDD',
            'updateSizeOnLoad',
        ]
    }
};

// Exposed protected methods in the render process.
contextBridge.exposeInMainWorld(
    // Allowed 'ipcRenderer' methods.
    'ipcRender', {
        // From render to main.
        send: (channel, ...args) => {
            let validChannels = ipc.render.send;
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, args);
            }
        },
        // From main to render.
        receive: (channel, listener) => {
            let validChannels = ipc.render.receive;
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender`.
                ipcRenderer.on(channel, (event, ...args) => listener(...args));
            }
        },
        // From render to main and back again.
        invoke: (channel, args) => {
            let validChannels = ipc.render.sendReceive;
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, args);
            }
        }
    }
);
