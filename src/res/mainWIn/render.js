const DMcss = document.getElementById('darkModeCss');
const parent = DMcss.parentNode;
const TCPportInput = document.getElementById('TCPportInput');

let lastUpdate;
const updateViewPort = (wrkMode) => {
    switch (wrkMode) {
        case "SERIAL ":
            document.querySelectorAll('.collapsableRow').forEach( (element) => {
                element.style.display = "";
            });
            if (lastUpdate != wrkMode) {
                document.querySelectorAll('.collapsableCol').forEach( (element) => {
                    element.style.display = element.style.display == "" ? "none" : "";
                });
            }
            lastUpdate = wrkMode;
            connectBtn.textContent = "Connect";
            updtSzOnLoad();
            break;
        case "TCP ":
            document.querySelectorAll('.collapsableRow').forEach( (element) => {
                element.style.display = "none";
            });
            if (lastUpdate != wrkMode) {
                document.querySelectorAll('.collapsableCol').forEach( (element) => {
                    element.style.display = element.style.display == "" ? "none" : "";
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