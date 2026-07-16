// Pane split: flexbox handles all sizing, the divider drag just rebalances
// the two pane wrappers' flex-basis percentages.

const divider = document.getElementById('divider');
const outputWrap = document.getElementById('outputWrap');
const outputFilteredWrap = document.getElementById('outputFilteredWrap');

let outputProportion = 0.5;
let outputFilteredProportion = 0.5;

const applyProportions = () => {
    outputWrap.style.flex = `1 1 ${outputProportion * 100}%`;
    outputFilteredWrap.style.flex = `1 1 ${outputFilteredProportion * 100}%`;
};

divider.addEventListener('pointerdown', (downEvt) => {
    downEvt.preventDefault();
    divider.setPointerCapture(downEvt.pointerId);
    const totalWidth = outputWrap.offsetWidth + outputFilteredWrap.offsetWidth;
    const startX = downEvt.clientX;
    const startProportion = outputWrap.offsetWidth / totalWidth;

    const onMove = (moveEvt) => {
        const delta = (moveEvt.clientX - startX) / totalWidth;
        outputProportion = Math.min(0.9, Math.max(0.1, startProportion + delta));
        outputFilteredProportion = 1 - outputProportion;
        applyProportions();
    };
    const onUp = () => {
        divider.removeEventListener('pointermove', onMove);
        divider.removeEventListener('pointerup', onUp);
    };
    divider.addEventListener('pointermove', onMove);
    divider.addEventListener('pointerup', onUp);
});
