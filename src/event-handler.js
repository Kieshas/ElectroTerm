const { ipcMain, shell } = require('electron');
const { userSaveFile } = require('./dialogWindow');
const index = require('./index');
const { FileHandler } = require('./fileHandler');
const { PortHandler } = require('./portHandler');
const { TCPHandler } = require('./tcp');

const mainWindow = index.getMainWin();
const settingsFile = (index.getAppPath() + '/settings.json');

const fileHandler = new FileHandler(index, settingsFile);
const portHandler = new PortHandler(mainWindow, fileHandler);
const tcpHandler = new TCPHandler((data) => { portHandler.parserEvt(data); });
portHandler.altSendFn = (msg) => tcpHandler.sendMsg(msg); // sends (incl. auto-responses) go out over TCP when serial is closed

// Maps a setting name used in code to its key inside settings.json.
// The 'lasUsed*' misspellings are kept so existing settings.json files keep working.
const SETTINGS_KEY_MAP = {
    filterSettings: 'filters',
    autoRspSettings: 'autoRsp',
    macroSettings: 'macros',
    lastUsedPort: 'lastUsedPort',
    lastUsedFont: 'lastUsedFont',
    lastUsedSerPort: 'lasUsedSerPort',
    lastUsedSerBaud: 'lasUsedSerBaud',
    proportionOutput: 'proportionOutput',
    proportionOutputFl: 'proportionOutputFl',
    winPosX: 'winPosX',
    winPosY: 'winPosY',
    winSizeX: 'winSizeX',
    winSizeY: 'winSizeY',
    maximized: 'winMaximized',
    scrollback: 'scrollback',
    lastLogFile: 'lastLogFile',
};

// well-known USB vendor ids seen on serial adapters and dev boards
const USB_VENDOR_NAMES = {
    '0403': 'FTDI',
    '10c4': 'Silicon Labs',
    '1a86': 'WCH CH340',
    '303a': 'Espressif',
    '0483': 'STMicroelectronics',
    '2341': 'Arduino',
    '067b': 'Prolific',
    '0d28': 'DAPLink',
    '1915': 'Nordic',
    '04d8': 'Microchip',
    '2e8a': 'Raspberry Pi',
};

// The USB product string ("ESP32-S3", "Dual RS232-HS", ...) is not part of what
// serialport exposes, but Windows stores it as the bus-reported device description.
// One PowerShell query fills a session cache keyed by PnP instance id.
const busDescCache = new Map();
const fetchBusDescriptions = () => {
    return new Promise((resolve) => {
        const script = "Get-PnpDevice -Class Ports -PresentOnly | " +
            "Get-PnpDeviceProperty -KeyName 'DEVPKEY_Device_BusReportedDeviceDesc' -ErrorAction SilentlyContinue | " +
            "ForEach-Object { if ($_.Data) { Write-Output ($_.InstanceId + '|' + $_.Data) } }";
        require('child_process').execFile('powershell.exe',
            ['-NoProfile', '-NonInteractive', '-Command', script],
            { timeout: 10000, windowsHide: true }, (err, stdout) => {
                if (err) return resolve(false); // failed or timed out: try again next refresh
                stdout.split('\n').forEach((line) => {
                    const sep = line.indexOf('|');
                    if (sep > 0) busDescCache.set(line.slice(0, sep).trim().toUpperCase(), line.slice(sep + 1).trim());
                });
                resolve(true);
            });
    });
};

const describePort = (port) => {
    const usb = port.vendorId != null && port.vendorId !== '';
    let name = port.friendlyName || '';
    name = name.replace(' (' + port.path + ')', ''); // the path is shown up front already
    const busDesc = port.pnpId != null ? busDescCache.get(port.pnpId.toUpperCase()) : null;
    if (busDesc && busDesc !== name) name = busDesc; // the device's own product string beats the driver's generic name
    const vendor = usb
        ? (USB_VENDOR_NAMES[port.vendorId.toLowerCase()] || port.manufacturer || null)
        : null;
    const bits = [];
    if (name) bits.push(name);
    if (vendor && !name.toLowerCase().includes(vendor.toLowerCase())) bits.push(vendor);
    if (usb) bits.push('USB');
    const title = [
        port.friendlyName,
        port.manufacturer,
        port.serialNumber ? 'S/N ' + port.serialNumber : null,
        usb ? `VID ${port.vendorId} PID ${port.productId}` : null,
    ].filter(Boolean).join(' · ');
    return {
        path: port.path,
        label: bits.length > 0 ? `${port.path} — ${bits.join(' · ')}` : port.path,
        title,
    };
};

// Kick the PowerShell lookup off in the background (single-flight) — populateDD
// must NEVER wait for it: PowerShell cold-start plus antivirus scanning can take
// seconds, and blocking here made app startup feel stuck. The dropdown re-reads
// on every open, so the enriched labels appear on the next refresh.
let busFetchInFlight = null;
const ensureBusDescriptions = (ports) => {
    if (process.platform !== 'win32' || busFetchInFlight != null) return;
    const missing = ports.some((port) => port.pnpId != null && !busDescCache.has(port.pnpId.toUpperCase()));
    if (!missing) return;
    busFetchInFlight = fetchBusDescriptions().then((ok) => {
        busFetchInFlight = null;
        if (ok) {
            ports.forEach((port) => { // remember misses so devices without the property don't re-trigger the query
                if (port.pnpId != null && !busDescCache.has(port.pnpId.toUpperCase())) {
                    busDescCache.set(port.pnpId.toUpperCase(), null);
                }
            });
        }
    });
};

ipcMain.handle('populateDD', async () => {
    const ports = await portHandler.PortList();
    ensureBusDescriptions(ports);
    return ports.map(describePort);
});

// warm the description cache right after launch so the first dropdown open is already enriched
portHandler.PortList().then(ensureBusDescriptions).catch(() => {});

ipcMain.handle('setPrmsAndConnect', (event, args) => {
    portHandler.changePort = args[0];
    portHandler.changeBaud = Number(args[1]);
    const retVal = portHandler.open();

    return new Promise((resolve, reject) => {
        retVal.then(() => {
            resolve();
        }).catch((err) => {
            portHandler.cleanUp();
            reject(err);
        })
    })
});

ipcMain.handle('sendMsg', (event, args) => {
    return portHandler.internalLineEvt("[SEND]->", args[0]);
});

ipcMain.handle('saveMacros', (event, args) => {
    fileHandler.writeFile(index.getAppPath() + '/macros.txt', args[0].join('\n') + '\n');
});

ipcMain.on('disconnectPort', () => {
    portHandler.close();
});

ipcMain.on('restartEvt', (event, args) => {
    const DtrRts = args[0];
    if (DtrRts === 'DTR') {
        portHandler.DTREvt(args[1]);
    } else {
        portHandler.RTSEvt(args[1]);
    }
});

ipcMain.on('timeStamp', (event, args) => {
    fileHandler.setTSFlag = args[0];
});

ipcMain.on('hexCheck', (event, args) => {
    fileHandler.setHexFlag = args[0];
})

ipcMain.handle('openFile', () => {
    let target = fileHandler.currFullPath;
    if (target === "") { // not logging right now: fall back to the last file we logged to
        const settings = fileHandler.loadSettings();
        target = (settings != null && settings.lastLogFile != null) ? settings.lastLogFile : "";
    }
    if (target === "" || !fileHandler.fileExists(target)) return false;
    shell.openPath(target);
    return true;
});

ipcMain.handle('selectFile', () => {
    return new Promise((resolve) => {
        if (fileHandler.getLogToFile == true) {
            fileHandler.setLogToFile = false;
            fileHandler.restoreCurrLogFileLoc();
            return resolve(false);
        }
        const selectFile = userSaveFile(fileHandler.currFileLoc + '\\' + fileHandler.getDefFileName);
        selectFile.then(({filePath}) => {
            fileHandler.setCurrFilePath = filePath;
            fileHandler.setLogToFile = true;
            fileHandler.createNewLogFile();
            SaveSettings('lastLogFile', filePath); // so "Open log" works after logging stops
            resolve(true);
        }).catch(() => {
            fileHandler.setLogToFile = false;
            fileHandler.restoreCurrLogFileLoc();
            resolve(false);
        })
    });
});

const SaveSettings = (dst, settingVal) => {
    return new Promise((resolve) => {
        const key = SETTINGS_KEY_MAP[dst];
        if (key == undefined) return resolve();
        let fileObj;
        try {
            fileObj = JSON.parse(fileHandler.readFile(settingsFile));
        } catch {
            fileObj = {};
        }
        fileObj[key] = settingVal;
        if (dst === "filterSettings") portHandler.updateFilters(settingVal);
        if (dst === "autoRspSettings") portHandler.updateAutoResps(settingVal);
        fileHandler.writeFile(settingsFile, JSON.stringify(fileObj, null, 4));
        resolve();
    })
}

const LoadSettings = (dst) => {
    return new Promise((resolve) => {
        const key = SETTINGS_KEY_MAP[dst];
        let fileContent;
        try {
            fileContent = JSON.parse(fileHandler.readFile(settingsFile));
        } catch {
            fileContent = null;
        }
        if (key == undefined || fileContent == null) return resolve(null);
        resolve(fileContent[key] != undefined ? fileContent[key] : null);
    });
}

ipcMain.handle('saveSettings', (event, args) => {
    return SaveSettings(args[0], args[1]);
});

ipcMain.handle('requestSettings', (event, args) => {
    return LoadSettings(args[0]);
})

ipcMain.handle('openServer', (event, args) => {
    const retVal = tcpHandler.openServer(args[0]);

    return new Promise((resolve, reject) => {
        retVal.then(() => {
            resolve();
        }).catch((err) => {
            reject(err);
        })
    })
});

ipcMain.on('closeServer', () => {
    tcpHandler.closeServer();
});

ipcMain.handle('requestMacros', () => {
    return new Promise((resolve, reject) => {
        let fileCont
        try {
            fileCont = fileHandler.readFile(index.getAppPath() + '/macros.txt');
            fileCont = fileCont.toString().split('\n');
            resolve(fileCont);
        } catch {
            reject("File macros.txt not found in app directory");
        }
    })
});

ipcMain.on('safeToClose', () => {
    mainWindow.close();
});

module.exports = {
    SaveSettings,
    LoadSettings,
};

  //todo autoresponsus pagal tai ka mato terminale. Cool featuresas
  // spalvu filtra ir autoresponsus tiesiog padaryt viena ir tada pliusiukas dameta eilute ir taip iki begalybes ir pohui
