const portDD = document.getElementById('portDropDown');
const portDDcontent = document.getElementById('portDDcontent');
const macroDD = document.getElementById('macroDD');
const macroDDContent = document.getElementById('macroDDContent');
const baudDD = document.getElementById('baudDropDown');
const fontDD = document.getElementById('fontDropDown');

let port = null;
let baud = null;
let currFont = null;
let workMode = "SERIAL ";

document.querySelectorAll(".baud a").forEach( a => { // runs one time at startup
    a.addEventListener("click", () => {
        baud = a.text;
        baudDD.textContent = baud;
    })
});

document.querySelectorAll(".font a").forEach( a => { // runs one time at startup
    a.addEventListener("click", () => {
        fontDD.textContent = "Font: " + a.text;
        currFont = a.text;
        output.style.fontSize = currFont;
        outputFiltered.style.fontSize = currFont;
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

const PortDDclickEvent = (name) => {
    port = name;
    document.getElementById('portDropDown').textContent = name;
    disconnectPort();
}

const registerDDItems = (selName, DDToFill, clickFn) => {
    let li = document.createElement("li");
    let link = document.createElement("a");
    let text = document.createTextNode(selName);
    link.appendChild(text);
    link.className = "dropdown-item";
    link.href = "#";
    link.addEventListener("click", clickFn);
    li.appendChild(link);
    DDToFill.appendChild(li);
}

const handleDropDown = (requestMsg, DDToFill, clickFn) => {
    window.ipcRender.invoke(requestMsg).then((args) => {
        if (DDToFill != null) {
            while (DDToFill.firstChild) {
                DDToFill.removeChild(DDToFill.firstChild);
            }
        }
        args.forEach( (arg) => {
            registerDDItems(arg, DDToFill, () => {clickFn(arg)});
        });
    }).catch( (err) => {
        err = err.toString();
        const unNeededStr = requestMsg + ":";
        showPopup("Read error", err.substr(err.indexOf(unNeededStr) + unNeededStr.length));
    });
}

portDD.addEventListener('show.bs.dropdown', () => {
    handleDropDown('populateDD', portDDcontent, (arg) => {PortDDclickEvent(arg);});
});

macroDD.addEventListener('show.bs.dropdown', () => {
    handleDropDown('requestMacros', macroDDContent, (arg) => {sendMsgText.value = arg;});
});
