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

const addNewRow = ({textVal, colorVal}) => {
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
        <input type="text" class="form-control textCntnt" aria-label="filterText" id="filterText${rowIdx}" placeholder="Filter text">
        </div>  
        <div class="col-2 col-md-1 p-0">
        <input type="color" class="form-control h-100 filterCntnt" aria-label="filterColor" id="filterColor${rowIdx}">
        </div>
        <button class="col-2 col-md-1 btn btn-outline-primary" type="button" id="addNewRowBtn">
        +
        </button>
        <button class="col-2 col-md-1 btn btn-outline-primary" type="button" id="rmRowBtn${rowIdx}">
        -
        </button>
    `
    containerDiv.append(newRow);
    rows.push(newRow);
    addNewRowBtn = document.getElementById('addNewRowBtn');
    rmRowBtn = document.getElementById(`rmRowBtn${rowIdx}`);
    if (textVal) {
        document.getElementById(`filterText${rowIdx}`).value = textVal;
    }
    if (colorVal) {
        document.getElementById(`filterColor${rowIdx}`).value = colorVal;
    }
    addNewRowBtn.addEventListener('click', () => {
        addNewRow({textVal: null, colorVal: null});
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
                document.getElementById(`filterColor${rowIdx}`).value = null;
            }
            // window.scrollTo(0, document.body.scrollHeight);
        }
    });
}

const saveAction = () => {
    let pairsToSave = new Array();
    document.querySelectorAll('.textCntnt').forEach((args) => {
        let pair = new Array();
        if (args.value) {
            pair.push(args.value, document.getElementById('filterColor' + args.id.slice(10)).value);
            pairsToSave.push(pair);
        }
    });
    window.ipcRender.invoke('saveSettings', "filterSettings", pairsToSave);
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
            document.getElementById('filterColor' + args.id.slice(10)).value = "#000000";
        }
    });
});

window.ipcRender.invoke('filtersLoaded').then((args) => {
    const darkmode = args[0];
    const filters = args[1];
    if (darkmode) {
        parent.appendChild(DMcss);
    } else {
        parent.removeChild(DMcss);
    }
    if (filters == null || filters.length == 0) {
        addNewRow({textVal: null, colorVal: null});
    } else {
        filters.forEach( (filter) => {
            addNewRow({textVal: filter[0], colorVal: filter[1]});
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
