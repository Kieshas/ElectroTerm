const portDD = document.getElementById('portDropDown');
const portDDcontent = document.getElementById('portDDcontent');

let port = null;
let baud = null;

document.querySelectorAll(".dropdown-menu a").forEach( a => { // runs one time at startup
    a.addEventListener("click", () => {
        baud = a.text;
        document.getElementById('baudDropDown').textContent = baud;
    })
});

const GetPopulatedDD = async () => {
    const content = await window.ipcRender.invoke('populateDD');
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
