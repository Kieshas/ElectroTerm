const DMcss = document.getElementById('darkModeCss');
const parent = DMcss.parentNode;
const containerDiv = document.getElementById('container');
let addNewRowBtn;// reassignable
let rmRowBtn;// reassignable

let rows = new Array();

window.ipcRender.invoke('filtersLoaded').then((args) => {
    if (args) {
        parent.appendChild(DMcss);
    } else {
        parent.removeChild(DMcss);
    }
});

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

const addNewRow = () => {
    rowIdx = findNextAvailableIdx();
    const newRow = document.createElement('div');
    newRow.className = "row mb-1 justify-content-center";
    newRow.id = `contentRow${rowIdx}`;
    if (rows.length > 0) {
        document.getElementById('addNewRowBtn').remove();
    }
    newRow.innerHTML =         
    `   
        <div class="col p-0">
        <input type="text" class="form-control" aria-label="filterText" id="filterText${rowIdx}" placeholder="Filter text">
        </div>  
        <div class="col-2 col-md-1 p-0">
        <input type="color" class="form-control h-100" aria-label="filterColor" id="filterColor${rowIdx}">
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
    console.log(rows);
    addNewRowBtn = document.getElementById('addNewRowBtn');
    rmRowBtn = document.getElementById(`rmRowBtn${rowIdx}`);
    addNewRowBtn.addEventListener('click', () => {
        addNewRow();
        window.scrollTo(0, document.body.scrollHeight);
    });
    // kazkur persidengia sitos xunios indexai, reikia perrasyt normaliai kad nebutu pagal kazkoki rows.length kuris bbz koks gali 
    // but at any time. reik kazkokio mechanizmuko mazo kuris sektu laisvus indexus ir i juos kaisiotu
    rmRowBtn.addEventListener('click', fn = (args) => {
        console.log(args);
        let arrIdx = rows.indexOf(args.path[1]); // adjust path index in case inner HTML gets changed
        if ((rowIdx > 0) && (arrIdx > -1)) {
            if (!(rows[arrIdx].innerHTML.toString().includes("addNewRowBtn"))) {
                document.getElementById(rows[arrIdx].id).remove();
                rows = rows.filter(item => item !== args.path[1]);
                this.removeEventListener('click', fn, false);
            }
            // window.scrollTo(0, document.body.scrollHeight);
        }
    });
}

addNewRow();
