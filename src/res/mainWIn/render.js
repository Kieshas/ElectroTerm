const DMcss = document.getElementById('darkModeCss');
const parent = DMcss.parentNode;
const TCPportInput = document.getElementById('TCPportInput');

let lastUpdate = "SERIAL "; //First load is on serial
const updateViewPort = (wrkMode) => {
    switch (wrkMode) {
        case "SERIAL ":
            if (lastUpdate != wrkMode) {
                document.querySelectorAll('.collapsableRow').forEach( (element) => {
                    element.style.display = "";
                });
                document.querySelectorAll('.collapsableCol').forEach( (element) => {
                    element.style.display = element.style.display == "" ? "none" : "";
                });
                updateMacroRows();
            }
            lastUpdate = wrkMode;
            connectBtn.textContent = "Connect";
            updtSzOnLoad();
            break;
        case "TCP ":
            if (lastUpdate != wrkMode) {
                document.querySelectorAll('.collapsableCol').forEach( (element) => {
                    element.style.display = element.style.display == "" ? "none" : "";
                });
                document.querySelectorAll('.collapsableRow').forEach( (element) => {
                    element.style.display = "none";
                });
            }
            lastUpdate = wrkMode;
            connectBtn.textContent = "Open";
            window.ipcRender.invoke('requestSettings', 'lastUsedPort').then( (args) => {
                if (args == null) return;
                TCPportInput.value = args;
            });
            updtSzOnLoad();
            break;
        default:
            break;
    }
}