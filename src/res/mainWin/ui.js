// Shared UI primitives: toasts, the two-field input dialog, theme handling.

const toastsHost = document.getElementById('toasts');

const showToast = (kind, title, body) => {
    const colors = kind === 'error' ? 'border-danger/60' : 'border-accent/60';
    const toast = document.createElement('div');
    toast.className = `w-80 rounded-md border ${colors} bg-panel shadow-xl px-3 py-2 text-sm transition-opacity duration-300`;
    const titleEl = document.createElement('div');
    titleEl.className = 'font-medium ' + (kind === 'error' ? 'text-danger' : 'text-accent');
    titleEl.textContent = title;
    const bodyEl = document.createElement('div');
    bodyEl.className = 'text-dim mt-0.5 break-words';
    bodyEl.textContent = body;
    toast.append(titleEl, bodyEl);
    toast.addEventListener('click', () => toast.remove());
    toastsHost.append(toast);
    setTimeout(() => { toast.style.opacity = '0'; }, 4000);
    setTimeout(() => { toast.remove(); }, 4400);
};

// Two-field input dialog. Resolves [value1, value2], or null when cancelled.
const inputDialog = document.getElementById('inputDialog');
const showInputDialog = ({ title, label1, value1, label2, value2, max1 }) => {
    inputDialog.querySelector('#dlgTitle').textContent = title;
    inputDialog.querySelector('#dlgLabel1').textContent = label1;
    inputDialog.querySelector('#dlgLabel2').textContent = label2;
    const input1 = inputDialog.querySelector('#dlgInput1');
    const input2 = inputDialog.querySelector('#dlgInput2');
    if (max1) input1.maxLength = max1; else input1.removeAttribute('maxlength');
    input1.value = value1 == null ? '' : value1;
    input2.value = value2 == null ? '' : value2;
    inputDialog.showModal();
    input1.select();
    return new Promise((resolve) => {
        inputDialog.addEventListener('close', () => {
            resolve(inputDialog.returnValue === 'submit' ? [input1.value, input2.value] : null);
        }, { once: true });
    });
};
inputDialog.querySelector('#dlgCancel').addEventListener('click', () => inputDialog.close('cancel'));

// Theme: dataset.theme was set pre-paint in index.html; persist the user's choice.
const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.theme = next;
});
matchMedia('(prefers-color-scheme: light)').addEventListener('change', (evt) => {
    if (!localStorage.theme) { // only follow the system while the user hasn't chosen
        document.documentElement.dataset.theme = evt.matches ? 'light' : 'dark';
    }
});

const setPressed = (btn, pressed) => btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
const isPressed = (btn) => btn.getAttribute('aria-pressed') === 'true';
