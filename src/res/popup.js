let modalWrap = null;

const showPopup = (title, body) => {
    if (modalWrap !== null) {
        modalWrap.remove();
    }

    modalWrap = document.createElement('div');
    modalWrap.innerHTML = `
        <div class="modal" tabindex="-1">
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