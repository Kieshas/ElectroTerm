const output = document.getElementById('output');
const outputFiltered = document.getElementById('outputFiltered');
const lockedStatImg = document.getElementById('lockedStat');

// Lines are individual elements now, so trimming old history is cheap.
// Raise this for even more scrollback; the only cost is relayout time on window resize.
const MAX_LINES = 10000;
const SCROLL_BOTTOM_TOLERANCE_PX = 100;

const ClearOutputs = () => {
    output.replaceChildren();
    outputFiltered.replaceChildren();
    setScrollLock(false);
}

const setScrollLock = (locked) => {
    lockCb.checked = locked;
    lockedStatImg.src = locked ? 'res/resources/locked.png' : 'res/resources/unlocked-nobg.png';
}

const isNearBottom = (element) => {
    return (element.scrollHeight - element.scrollTop - element.clientHeight) <= SCROLL_BOTTOM_TOLERANCE_PX;
}

const appendLines = (element, lines) => {
    const fragment = document.createDocumentFragment();
    lines.forEach((html) => {
        const lineDiv = document.createElement('div');
        lineDiv.innerHTML = html === "" ? '&nbsp;' : html; // keep blank lines visible
        fragment.append(lineDiv);
    });
    element.append(fragment);

    const excess = element.childElementCount - MAX_LINES;
    if (excess > 0) {
        const heightBefore = element.scrollHeight;
        for (let i = 0; i < excess; i++) {
            element.firstElementChild.remove();
        }
        if (lockCb.checked) { // keep the view in place while history is trimmed above it
            element.scrollTop -= (heightBefore - element.scrollHeight);
        }
    }
    if (!lockCb.checked) {
        element.scrollTop = element.scrollHeight;
    }
}

window.ipcRender.receive('printLn', (lines) => appendLines(output, lines));

window.ipcRender.receive('printFilteredLn', (lines) => appendLines(outputFiltered, lines));

// Scrolling away from the bottom of either pane pauses auto-scroll, scrolling back down resumes it.
output.addEventListener('scroll', () => {
    setScrollLock(!isNearBottom(output));
});

outputFiltered.addEventListener('scroll', () => {
    setScrollLock(!isNearBottom(outputFiltered));
});
