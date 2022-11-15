const portDD = document.getElementById('portDropDown');
const portDDcontent = document.getElementById('portDDcontent');
const macroDD = document.getElementById('macroDD');
const macroDDContent = document.getElementById('macroDDContent');

let port = null;
let baud = null;
let workMode = "SERIAL ";

document.querySelectorAll(".baud a").forEach( a => { // runs one time at startup
    a.addEventListener("click", () => {
        baud = a.text;
        document.getElementById('baudDropDown').textContent = baud;
    })
});

window.ipcRender.invoke('requestSettings', 'lastUsedFont').then( (args) => {
    if (args == null) return;
    document.getElementById('fontDropDown').textContent = "Font: " + args;
    output.style.fontSize = args;
    outputFiltered.style.fontSize = args;
});

document.querySelectorAll(".font a").forEach( a => { // runs one time at startup
    a.addEventListener("click", () => {
        document.getElementById('fontDropDown').textContent = "Font: " + a.text;
        output.style.fontSize = a.text;
        outputFiltered.style.fontSize = a.text;
        window.ipcRender.send('saveSettings', "lastUsedFont", a.text);
    })
});

document.querySelectorAll(".mode a").forEach( a => {
    a.addEventListener("click", () => {
        document.getElementById('modeDropDown').textContent = a.text;
        disconnectPort(); // close previous work mode
        workMode = a.text;
        updateViewPort(workMode);
    });
});

const GetPopulatedDD = async () => {
    const content = await window.ipcRender.invoke('populateDD');
    return content;
};

const PortDDclickEvent = (element) => {
    element.addEventListener("click", () => {
        port = element.text;
        document.getElementById('portDropDown').textContent = port;
        disconnectPort();
    });
}

portDD.addEventListener('show.bs.dropdown', () => {
    if (portDDcontent != null) {
        while (portDDcontent.firstChild) {
            portDDcontent.removeChild(portDDcontent.firstChild);
        }
    }
    let result = GetPopulatedDD();

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

macroDD.addEventListener('show.bs.dropdown', () => {
    window.ipcRender.invoke('requestMacros').then((args) => {
        if (macroDDContent != null) {
            while (macroDDContent.firstChild) {
                macroDDContent.removeChild(macroDDContent.firstChild);
            }
        }
        args.forEach( (arg) => {
            let li = document.createElement("li");
            let link = document.createElement("a");
            let text = document.createTextNode(arg);
            link.appendChild(text);
            link.className = "dropdown-item";
            link.href = "#";
            link.addEventListener("click", () => {
                sendMsgText.value = link.textContent;
            });
            li.appendChild(link);
            macroDDContent.appendChild(li);
        });
    }).catch( (err) => {
        err = err.toString();
        const unNeededStr = "'requestMacros':";
        showPopup("Read error", err.substr(err.indexOf(unNeededStr) + unNeededStr.length));
    });
});
