const portDD = document.getElementById('portDropDown');
const portDDcontent = document.getElementById('portDDcontent');

let port = null;
let baud = null;
let platform = null;

document.querySelectorAll(".baud a").forEach( a => { // runs one time at startup
    a.addEventListener("click", () => {
        baud = a.text;
        document.getElementById('baudDropDown').textContent = baud;
    })
});

document.querySelectorAll(".font a").forEach( a => { // runs one time at startup
    a.addEventListener("click", () => {
        document.getElementById('fontDropDown').textContent = "Font: " + a.text;
        output.style.fontSize = a.text;
        outputFiltered.style.fontSize = a.text;
    })
});

document.querySelectorAll(".platform a").forEach( a => {
    a.addEventListener("click", () => {
        document.getElementById('platformDropDown').textContent = a.text;
        platform = a.text;
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
        window.ipcRender.send('disconnectPort');
        connectBtn.className = "col btn btn-outline-success";
        connectBtn.textContent = "Connect";
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
