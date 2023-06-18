const DMcss = document.getElementById('darkModeCss');
const parent = DMcss.parentNode;
const containerDiv = document.getElementById('container');
const saveBtn = document.getElementById('saveBtn');
const closeBtn = document.getElementById('closeBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
let addNewRowBtn;// reassignable
let rmRowBtn;// reassignable

let rows = new Array();

const findNextAvailableIdx = () => {
    let availableIdx = 0;
    let matchNotFound = false;
    while (matchNotFound != true) {
        matchNotFound = true;
        rows.forEach((row) => {
            if (availableIdx == row.id.slice(10)) {
                matchNotFound = false;
            }
        })
        if (matchNotFound == false) {
            availableIdx++;
        } 
    }
    return availableIdx;
}

const addNewRow = ({matchVal, respVal, tempDisabled}) => {
    rowIdx = findNextAvailableIdx();
    const newRow = document.createElement('div');
    newRow.className = "row mb-1 justify-content-center filterRow";
    newRow.id = `contentRow${rowIdx}`;
    if (rows.length > 0) {
        document.getElementById('addNewRowBtn').remove();
    }
    newRow.innerHTML =         
    `   
        <div class="col p-0">
        <input type="text" class="form-control textCntnt" aria-label="filterText" id="filterText${rowIdx}" placeholder="Request">
        </div>  
        <div class="col p-0">
        <input type="text" class="form-control" aria-label="respText" id="respText${rowIdx}" placeholder="Response">
        </div>
        <button class="col-2 col-md-1 btn btn-outline-primary" type="button" id="addNewRowBtn">
        +
        </button>
        <button class="col-2 col-md-1 btn btn-outline-primary" type="button" id="rmRowBtn${rowIdx}">
        -
        </button>
        <input type="checkbox" class="btn-check" id="tempDisabled${rowIdx}" autocomplete="off">
        <label class="col-2 col-md-1 btn btn-outline-primary" for="tempDisabled${rowIdx}">X</label>
    `
    containerDiv.append(newRow);
    rows.push(newRow);
    addNewRowBtn = document.getElementById('addNewRowBtn');
    rmRowBtn = document.getElementById(`rmRowBtn${rowIdx}`);
    if (matchVal) {
        document.getElementById(`filterText${rowIdx}`).value = matchVal;
    }
    if (respVal) {
        document.getElementById(`respText${rowIdx}`).value = respVal;
    }
    if (tempDisabled) {
        document.getElementById(`tempDisabled${rowIdx}`).checked = true;
    }
    addNewRowBtn.addEventListener('click', () => {
        addNewRow({matchVal: null, respVal: null});
        window.scrollTo(0, document.body.scrollHeight);
    });
    rmRowBtn.addEventListener('click', fn = (args) => {
        let arrIdx = rows.indexOf(args.path[1]); // adjust path index in case inner HTML gets changed
        if ((rowIdx > 0) && (arrIdx > -1)) {
            if (!(rows[arrIdx].innerHTML.toString().includes("addNewRowBtn"))) {
                document.getElementById(rows[arrIdx].id).remove();
                rows = rows.filter(item => item !== args.path[1]);
                this.removeEventListener('click', fn, false);
            } else {
                document.getElementById(`filterText${rowIdx}`).value = null;
                document.getElementById(`respText${rowIdx}`).value = null;
            }
            // window.scrollTo(0, document.body.scrollHeight);
        }
    });
}

const saveAction = () => {
    let tripletsToSave = new Array();
    document.querySelectorAll('.textCntnt').forEach((args) => {
        let triplet = new Array();
        if (args.value) {
            const currId = args.id.slice(10);
            triplet.push(args.value, document.getElementById('respText' + currId).value, document.getElementById('tempDisabled' + currId).checked);
            tripletsToSave.push(triplet);
        }
    });
    window.ipcRender.invoke('saveSettings', "autoRspSettings", tripletsToSave);
    window.close();
}

saveBtn.addEventListener('click', () => {
    saveAction();
});

closeBtn.addEventListener('click', () => {
    window.close();
});

clearAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.filterRow').forEach((args) => {
        if (!args.innerHTML.toString().includes("addNewRowBtn")) {
            args.remove();
        } else {
            document.getElementById('filterText' + args.id.slice(10)).value = "";
            document.getElementById('respText' + args.id.slice(10)).value = "";
        }
    });
});

window.ipcRender.invoke('autoRspLoaded').then((args) => {
    const darkmode = args[0];
    const autoResps = args[1];
    if (darkmode) {
        parent.appendChild(DMcss);
    } else {
        parent.removeChild(DMcss);
    }

    if (autoResps == null || autoResps.length == 0) {
        addNewRow({matchVal: null, respVal: null});
    } else {
        autoResps.forEach( (autoResp) => {
            console.log(autoResp);
            addNewRow({matchVal: autoResp[0], respVal: autoResp[1], tempDisabled: autoResp[2]});
        })
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === "Enter") {
        saveAction();
    }
    if (event.key === "Escape") {
        window.close();
    }
});
