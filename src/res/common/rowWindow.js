// Shared logic for the Filters and Autoresponses windows.
// Each window defines ROW_WINDOW_CONFIG (inline in its HTML) before this script runs:
//   loadedChannel   - invoke channel that returns [darkmode, savedTriplets]
//   saveKey         - saveSettings destination key
//   firstPlaceholder- placeholder of the first (match text) input
//   secondField     - { type: 'color' | 'text', idPrefix, placeholder? }
const DMcss = document.getElementById('darkModeCss');
const parent = DMcss.parentNode;
const containerDiv = document.getElementById('container');
const saveBtn = document.getElementById('saveBtn');
const closeBtn = document.getElementById('closeBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const cfg = ROW_WINDOW_CONFIG;

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

const secondFieldMarkup = (rowIdx) => {
    if (cfg.secondField.type === 'color') {
        return `
        <div class="col-2 col-md-1 p-0">
        <input type="color" class="form-control h-100" aria-label="${cfg.secondField.idPrefix}" id="${cfg.secondField.idPrefix}${rowIdx}">
        </div>`;
    }
    return `
        <div class="col p-0">
        <input type="text" class="form-control" aria-label="${cfg.secondField.idPrefix}" id="${cfg.secondField.idPrefix}${rowIdx}" placeholder="${cfg.secondField.placeholder}">
        </div>`;
}

const clearRowInputs = (row, rowIdx) => {
    row.querySelector(`#filterText${rowIdx}`).value = "";
    row.querySelector(`#${cfg.secondField.idPrefix}${rowIdx}`).value = cfg.secondField.type === 'color' ? "#000000" : "";
    row.querySelector(`#tempDisabled${rowIdx}`).checked = false;
}

const addNewRow = ({firstVal, secondVal, tempDisabled}) => {
    const rowIdx = findNextAvailableIdx();
    const newRow = document.createElement('div');
    newRow.className = "row mb-1 justify-content-center filterRow";
    newRow.id = `contentRow${rowIdx}`;
    if (rows.length > 0) {
        document.getElementById('addNewRowBtn').remove();
    }
    newRow.innerHTML =
    `
        <div class="col p-0">
        <input type="text" class="form-control textCntnt" aria-label="filterText" id="filterText${rowIdx}" placeholder="${cfg.firstPlaceholder}">
        </div>
        ${secondFieldMarkup(rowIdx)}
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
    if (firstVal) {
        newRow.querySelector(`#filterText${rowIdx}`).value = firstVal;
    }
    if (secondVal) {
        newRow.querySelector(`#${cfg.secondField.idPrefix}${rowIdx}`).value = secondVal;
    }
    if (tempDisabled) {
        newRow.querySelector(`#tempDisabled${rowIdx}`).checked = true;
    }
    newRow.querySelector('#addNewRowBtn').addEventListener('click', () => {
        addNewRow({});
        window.scrollTo(0, document.body.scrollHeight);
    });
    newRow.querySelector(`#rmRowBtn${rowIdx}`).addEventListener('click', () => {
        if (newRow.querySelector('#addNewRowBtn') != null) { // last row carries the "+" button: clear it instead of removing
            clearRowInputs(newRow, rowIdx);
        } else {
            newRow.remove();
            rows = rows.filter((row) => row !== newRow);
        }
    });
}

const saveAction = () => {
    let tripletsToSave = new Array();
    document.querySelectorAll('.textCntnt').forEach((input) => {
        if (!input.value) return;
        const currId = input.id.slice(10);
        tripletsToSave.push([
            input.value,
            document.getElementById(cfg.secondField.idPrefix + currId).value,
            document.getElementById('tempDisabled' + currId).checked,
        ]);
    });
    window.ipcRender.invoke('saveSettings', cfg.saveKey, tripletsToSave).then(() => {
        window.close();
    });
}

saveBtn.addEventListener('click', () => {
    saveAction();
});

closeBtn.addEventListener('click', () => {
    window.close();
});

clearAllBtn.addEventListener('click', () => {
    rows.slice().forEach((row) => {
        const rowIdx = row.id.slice(10);
        if (row.querySelector('#addNewRowBtn') != null) {
            clearRowInputs(row, rowIdx);
        } else {
            row.remove();
            rows = rows.filter((r) => r !== row);
        }
    });
});

window.ipcRender.invoke(cfg.loadedChannel).then((args) => {
    const darkmode = args[0];
    const savedRows = args[1];
    if (darkmode) {
        parent.appendChild(DMcss);
    } else {
        parent.removeChild(DMcss);
    }
    if (savedRows == null || savedRows.length == 0) {
        addNewRow({});
    } else {
        savedRows.forEach( (savedRow) => {
            addNewRow({firstVal: savedRow[0], secondVal: savedRow[1], tempDisabled: savedRow[2]});
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
