// Slide-over editor used for Filters, Autoresponses, and the macros.txt quick-send list.
// Filter/autoresponse entries are [matchText, value, tempDisabled] triplets in settings,
// the same format the main process consumes live. The macros list is one command per row.

const panelScrim = document.getElementById('panelScrim');
const sidePanel = document.getElementById('sidePanel');
const panelTitle = document.getElementById('panelTitle');
const panelHint = document.getElementById('panelHint');
const panelRows = document.getElementById('panelRows');
const panelAddBtn = document.getElementById('panelAddBtn');
const panelClearBtn = document.getElementById('panelClearBtn');
const panelSaveBtn = document.getElementById('panelSaveBtn');
const panelCloseBtn = document.getElementById('panelCloseBtn');

const PANEL_CONFIGS = {
    filters: {
        title: 'Filters',
        hint: 'Lines containing a match are highlighted and copied to the right pane. Untick a row to disable it temporarily.',
        matchPlaceholder: 'Text to match',
        valueType: 'color',
        load: () => window.ipcRender.invoke('requestSettings', 'filterSettings'),
        save: (rows) => window.ipcRender.invoke('saveSettings', 'filterSettings', rows),
    },
    autoRsp: {
        title: 'Autoresponses',
        hint: 'When a received line contains the request text, the response is sent back automatically. Untick a row to disable it temporarily.',
        matchPlaceholder: 'Request text',
        valuePlaceholder: 'Response to send',
        valueType: 'text',
        load: () => window.ipcRender.invoke('requestSettings', 'autoRspSettings'),
        save: (rows) => window.ipcRender.invoke('saveSettings', 'autoRspSettings', rows),
    },
    macroFile: {
        title: 'Quick-send list',
        hint: 'One command per line — pick them from the ☰ menu next to Send. Stored in macros.txt in the app folder.',
        matchPlaceholder: 'Command',
        valueType: 'none',
        load: () => window.ipcRender.invoke('requestMacros')
            .then((lines) => lines.filter((line) => line.trim() !== '').map((line) => [line.trim()]))
            .catch(() => null),
        save: (rows) => window.ipcRender.invoke('saveMacros', rows.map((row) => row[0])),
    },
};

let activePanel = null;

const addPanelRow = (cfg, entry) => {
    const [matchVal, value, tempDisabled] = entry || ['', cfg.valueType === 'color' ? '#facc15' : '', false];
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 panel-row';

    if (cfg.valueType !== 'none') {
        const enabledBox = document.createElement('input');
        enabledBox.type = 'checkbox';
        enabledBox.className = 'row-enabled size-5 accent-[var(--accent)] shrink-0 cursor-pointer';
        enabledBox.checked = !tempDisabled;
        enabledBox.title = 'Enabled';
        row.append(enabledBox);
    }

    const matchInput = document.createElement('input');
    matchInput.type = 'text';
    matchInput.className = 'row-match field flex-1 font-mono text-sm';
    matchInput.placeholder = cfg.matchPlaceholder;
    matchInput.value = matchVal;
    row.append(matchInput);

    if (cfg.valueType === 'color') {
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'row-value h-10 w-12 shrink-0 rounded-md border border-edge bg-panel cursor-pointer p-0.5';
        colorInput.value = value || '#facc15';
        colorInput.title = 'Highlight color';
        row.append(colorInput);
    } else if (cfg.valueType === 'text') {
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'row-value field flex-1 font-mono text-sm';
        valueInput.placeholder = cfg.valuePlaceholder;
        valueInput.value = value || '';
        row.append(valueInput);
    }

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-ghost shrink-0 px-2';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove row';
    removeBtn.addEventListener('click', () => row.remove());
    row.append(removeBtn);

    panelRows.append(row);
    return row;
};

const openPanel = async (name) => {
    const cfg = PANEL_CONFIGS[name];
    activePanel = name;
    panelTitle.textContent = cfg.title;
    panelHint.textContent = cfg.hint;
    panelRows.replaceChildren();
    const saved = await cfg.load();
    if (saved != null && saved.length > 0) {
        saved.forEach((entry) => addPanelRow(cfg, entry));
    } else {
        addPanelRow(cfg);
    }
    panelScrim.classList.remove('hidden');
    sidePanel.classList.add('open');
    sidePanel.setAttribute('aria-hidden', 'false');
    panelRows.querySelector('.row-match').focus();
};

const closePanel = () => {
    activePanel = null;
    panelScrim.classList.add('hidden');
    sidePanel.classList.remove('open');
    sidePanel.setAttribute('aria-hidden', 'true');
};

const savePanel = () => {
    if (activePanel == null) return;
    const name = activePanel;
    const cfg = PANEL_CONFIGS[name];
    const rows = [];
    panelRows.querySelectorAll('.panel-row').forEach((row) => {
        const match = row.querySelector('.row-match').value;
        if (!match) return;
        if (cfg.valueType === 'none') {
            rows.push([match]);
        } else {
            rows.push([
                match,
                row.querySelector('.row-value').value,
                !row.querySelector('.row-enabled').checked,
            ]);
        }
    });
    cfg.save(rows).then(() => {
        showToast('ok', cfg.title + ' saved', `${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`);
        closePanel();
    });
};

panelAddBtn.addEventListener('click', () => {
    const row = addPanelRow(PANEL_CONFIGS[activePanel]);
    row.querySelector('.row-match').focus();
});
panelClearBtn.addEventListener('click', () => panelRows.replaceChildren());
panelSaveBtn.addEventListener('click', savePanel);
panelCloseBtn.addEventListener('click', closePanel);
panelScrim.addEventListener('click', closePanel);

document.getElementById('filtersBtn').addEventListener('click', () => openPanel('filters'));
document.getElementById('autoRspBtn').addEventListener('click', () => openPanel('autoRsp'));

window.addEventListener('keydown', (event) => {
    if (activePanel == null) return;
    if (event.key === 'Escape') closePanel();
    if (event.key === 'Enter' && event.target.closest('#sidePanel')) savePanel();
});
