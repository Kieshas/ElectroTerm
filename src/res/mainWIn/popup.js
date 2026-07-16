let modalWrap = null;

const disposeCurrentPopup = () => {
    if (modalWrap == null) return;
    const modalEl = modalWrap.querySelector('.modal');
    const instance = bootstrap.Modal.getInstance(modalEl);
    if (instance != null) {
        instance.dispose();
    }
    modalWrap.remove();
    modalWrap = null;
    // dispose() of an open modal does not clean these up
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
};

const cleanupOnHidden = (wrap, modalEl) => {
    modalEl.addEventListener('hidden.bs.modal', () => {
        if (modalWrap === wrap) {
            disposeCurrentPopup();
        } else {
            wrap.remove(); // already replaced by a newer popup
        }
    });
};

const showPopup = (title, body) => {
    disposeCurrentPopup();

    modalWrap = document.createElement('div');
    modalWrap.innerHTML = `
        <div class="modal fade" tabindex="-1">
            <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="titleText"></h5>
                </div>
                <div class="modal-body">
                    <p id="bodyText"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
            </div>
        </div>
    `;

    document.body.append(modalWrap);

    modalWrap.querySelector("#titleText").textContent = title;
    modalWrap.querySelector("#bodyText").textContent = body;

    const modalEl = modalWrap.querySelector('.modal');
    cleanupOnHidden(modalWrap, modalEl);
    let modal = new bootstrap.Modal(modalEl);
    modal.show();
};

const showInputPopup = (title, ...args) => {
    disposeCurrentPopup();

    modalWrap = document.createElement('div');
    modalWrap.innerHTML = `
        <div class="modal fade" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="titleText"></h5>
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

    modalWrap.querySelector("#titleText").textContent = title;
    modalWrap.querySelector("#input1Label").textContent = args[0];
    modalWrap.querySelector("#input1").value = args[1] == undefined ? "" : args[1];
    modalWrap.querySelector("#input2Label").textContent = args[2];
    modalWrap.querySelector("#input2").value = args[3] == undefined ? "" : args[3];

    const wrap = modalWrap;
    const modalEl = modalWrap.querySelector('.modal');
    let modal = new bootstrap.Modal(modalEl);
    modal.show();
    return new Promise((resolve) => {
        let saved = false;
        wrap.querySelector('#saveBtn').addEventListener('click', () => {
            saved = true;
            resolve([wrap.querySelector('#input1').value, wrap.querySelector('#input2').value]);
        });
        modalEl.addEventListener('hidden.bs.modal', () => {
            if (!saved) resolve(null); // dismissed without saving
            if (modalWrap === wrap) {
                disposeCurrentPopup();
            } else {
                wrap.remove();
            }
        });
    });
};
