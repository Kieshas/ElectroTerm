const portDD = document.getElementById('portDropDown');
const portDDcontent = document.getElementById('portDDcontent');
const connectBtn = document.getElementById('connect');

const dtrBtn = document.getElementById('dtr');
const BSDtrBtn = new bootstrap.Button(dtrBtn);

const rtsBtn = document.getElementById('rts');
const BSRtsBtn = new bootstrap.Button(rtsBtn);

const output = document.getElementById('output');

let modalWrap = null;

let port = null;
let baud = null;

let GetPopulatedDD = async (portNum) => {
    let content = await window.ipcbridge.populateDD(portNum);
    return content;
};

const PortDDclickEvent = (element) => {
    element.addEventListener("click", () => {
        port = element.text;
        document.getElementById('portDropDown').textContent = port;
    });
}

portDD.addEventListener('show.bs.dropdown', () => {
    if (portDDcontent != null) {
        while (portDDcontent.firstChild) {
            portDDcontent.removeChild(portDDcontent.firstChild);
        }
    }
    let result = GetPopulatedDD(0);

    result.then ((portContent) => {
        if (portContent == null) {
            portDDcontent.empty();
        } else {
            portContent.forEach(port => {
                let li = document.createElement("li");
                let link = document.createElement("a");
                let text = document.createTextNode(port.path);
                link.appendChild(text);
                link.className = "dropdown-item";
                link.href = "#";
                PortDDclickEvent(link);
                li.appendChild(link);
                portDDcontent.appendChild(li);
            });
        }
    });
});


document.querySelectorAll(".dropdown-menu a").forEach( a => { // runs one time at startup
    a.addEventListener("click", () => {
        baud = a.text;
        document.getElementById('baudDropDown').textContent = baud;
    })
});

const showPopup = (title, body) => {
    if (modalWrap !== null) {
        modalWrap.remove();
    }

    modalWrap = document.createElement('div');
    modalWrap.innerHTML = `
        <div class="modal" tabindex="-1">
            <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title", id = titleText></h5>
                </div>
                <div class="modal-body">
                    <p id = bodyText></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
            </div>
        </div>
    `;

    document.body.append(modalWrap);

    document.getElementById("titleText").textContent = title;
    document.getElementById("bodyText").textContent = body;

    let modal = new bootstrap.Modal(modalWrap.querySelector('.modal'));
    modal.show();
};

connectBtn.addEventListener('click', () => {
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
        connectBtn.className = "col btn btn-outline-danger";
        connectBtn.textContent = "Disconnect";
        window.ipcbridge.setPrmsAndConnect(port, baud);
    } else {
        connectBtn.className = "col btn btn-outline-success";
        connectBtn.textContent = "Connect";
        window.ipcbridge.disconnectPort();
    }
});

rtsBtn.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        return;
    }
    if (rtsBtn.className == "col btn btn-outline-primary") {
        rtsBtn.className = "col btn btn-primary";
        window.ipcbridge.rtsEvt(false);
    } else {
        rtsBtn.className = "col btn btn-outline-primary";
        window.ipcbridge.rtsEvt(true);
    }
});

dtrBtn.addEventListener('click', () => {
    if (connectBtn.className == "col btn btn-outline-success") {
        showPopup("Communication Error", "Not connected");
        return;
    }
    console.log(connectBtn.textContent)
    if (dtrBtn.className == "col btn btn-outline-primary") {
        dtrBtn.className = "col btn btn-primary";
        window.ipcbridge.dtrEvt(false);
    } else {
        dtrBtn.className = "col btn btn-outline-primary";
        window.ipcbridge.dtrEvt(true);
    }
});

let rowCnt = 0;

document.querySelectorAll(".row").forEach( () => { // runs one time at startup
    rowCnt++;
});

const resizeOutput = (size) => {
    let REMsize = parseInt(getComputedStyle(document. documentElement).fontSize, 10);
    let additionalPXS = ((REMsize * 0.25) * (rowCnt + 1)); // add REMsize count of rows(all of them have bottom margin) plus one at the top. Do not count bottom one since it comes from the last row
    let height = size[1] - ((rowCnt * 45) + additionalPXS); // subtract px count from all the rows plus size of the rows times rowcnt
    output.style.height = height.toString() + "px";
} 

const updtSzOnLoad = async () => {
    const size = await window.ipcbridge.updateSizeOnLoad();
    resizeOutput(size);
};

updtSzOnLoad();

window.ipcbridge.resizeStuff((event, size) => {
    resizeOutput(size);
});

window.ipcbridge.printLn((event, line) => {
    output.textContent += line;
    output.scrollTop = output.scrollHeight;
});


