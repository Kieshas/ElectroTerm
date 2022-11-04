let modalWrap = null;

const showPopup = (title, body) => {
    if (modalWrap !== null) {
        modalWrap.remove();
    }

    modalWrap = document.createElement('div');
    modalWrap.innerHTML = `
        <div class="modal fade" tabindex="-1">
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

const showInputPopup = (title, ...args) => {
    if (modalWrap !== null) {
        modalWrap.remove();
    }

    modalWrap = document.createElement('div');
    modalWrap.innerHTML = `
        <div class="modal fade" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title", id = titleText></h5>
                </div>
                <div class="modal-body">
                    <input type="text" id="input1" class="form-control validate" maxlength=7>
                    <label data-error="wrong" data-success="right" for="input1" id="input1Label"></label>
                </div>
                <div class="modal-body">
                    <input type="text" id="input2" class="form-control validate">
                    <label data-error="wrong" data-success="right" for="input2" id="input2Label"></label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="saveBtn">Save</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
            </div>
        </div>
    `;

    document.body.append(modalWrap);

    document.getElementById("titleText").textContent = title;
    document.getElementById("input1Label").textContent = args[0];
    document.getElementById("input1").value = args[1] == undefined ? "" : args[1];
    document.getElementById("input2Label").textContent = args[2];
    document.getElementById("input2").value = args[3] == undefined ? "" : args[3];

    let modal = new bootstrap.Modal(modalWrap.querySelector('.modal'));
    modal.show();
    return new Promise((resolve) => {
        document.getElementById('saveBtn').addEventListener('click', () => {
            retval = [document.getElementById('input1').value, document.getElementById('input2').value];
            resolve(retval);
        });
    });
};