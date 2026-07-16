const output = document.getElementById('output');
const outputFiltered = document.getElementById('outputFiltered');

const SCROLL_BOTTOM_TOLERANCE_PX = 100;

// Scrollback: how many lines each pane keeps. Configurable from the toolbar.
let maxLines = 2000;

const isNearBottom = (element) => {
    return (element.scrollHeight - element.scrollTop - element.clientHeight) <= SCROLL_BOTTOM_TOLERANCE_PX;
};

// Each pane pauses independently. Pausing happens on upward scroll only;
// resuming happens near the bottom, by wheel-down close to the bottom
// (so a constant stream can still be "caught"), or via the pane's pill.
const createPane = (el, pill) => {
    const pane = { el, pill, paused: false, lastTop: 0, suppressPauseUntil: 0, progUntil: 0 };

    const setPaused = (paused) => {
        pane.paused = paused;
        pill.classList.toggle('hidden', !paused);
    };
    pane.resume = () => {
        setPaused(false);
        pane.suppressPauseUntil = performance.now() + 200; // scroll events racing the jump must not re-pause
        el.scrollTop = el.scrollHeight;
    };
    pane.markProgrammatic = () => { // our own scroll writes must never read as user intent
        pane.progUntil = performance.now() + 100;
    };

    el.addEventListener('scroll', () => {
        const now = performance.now();
        const nearBottom = isNearBottom(el);
        const movedUp = el.scrollTop < pane.lastTop - 1;
        pane.lastTop = el.scrollTop;
        if (pane.paused) {
            if (nearBottom) setPaused(false);
        } else if (movedUp && !nearBottom && now > pane.progUntil && now > pane.suppressPauseUntil) {
            // scrollbar drags land here; appends are masked by progUntil
            setPaused(true);
        }
    });
    el.addEventListener('wheel', (evt) => {
        if (!pane.paused && evt.deltaY < 0 && el.scrollHeight > el.clientHeight) {
            setPaused(true); // wheel-up is unambiguous user intent, pause immediately
        } else if (pane.paused && evt.deltaY > 0
            && (el.scrollHeight - el.scrollTop - el.clientHeight) < el.clientHeight * 1.5) {
            // under a constant stream the bottom runs away from the user —
            // one wheel-down close to it snaps down and resumes
            pane.resume();
        }
    });
    pill.addEventListener('click', () => pane.resume());
    return pane;
};

const outputPane = createPane(output, document.getElementById('jumpPillMain'));
const filteredPane = createPane(outputFiltered, document.getElementById('jumpPillFlt'));

const ClearOutputs = () => {
    output.replaceChildren();
    outputFiltered.replaceChildren();
    outputPane.resume();
    filteredPane.resume();
};

const setScrollback = (lines) => {
    maxLines = lines;
    [output, outputFiltered].forEach((el) => {
        while (el.childElementCount > maxLines) el.firstElementChild.remove();
    });
};

const appendLines = (pane, lines) => {
    const el = pane.el;
    const fragment = document.createDocumentFragment();
    lines.forEach((html) => {
        const lineDiv = document.createElement('div');
        lineDiv.innerHTML = html === "" ? '&nbsp;' : html; // keep blank lines visible
        fragment.append(lineDiv);
    });
    el.append(fragment);

    const excess = el.childElementCount - maxLines;
    if (excess > 0) {
        const heightBefore = pane.paused ? el.scrollHeight : 0;
        for (let i = 0; i < excess; i++) {
            el.firstElementChild.remove();
        }
        if (pane.paused) { // keep the view in place while history is trimmed above it
            pane.markProgrammatic();
            el.scrollTop -= (heightBefore - el.scrollHeight);
        }
    }
    if (!pane.paused) {
        pane.markProgrammatic();
        el.scrollTop = el.scrollHeight;
        // freshly appended lines only have estimated heights (content-visibility)
        // until the next frame renders them — snap once more with real sizes so a
        // large chunk still lands exactly at the bottom
        if (!pane.snapQueued) {
            pane.snapQueued = true;
            requestAnimationFrame(() => {
                pane.snapQueued = false;
                if (!pane.paused) {
                    pane.markProgrammatic();
                    el.scrollTop = el.scrollHeight;
                }
            });
        }
    }
};

window.ipcRender.receive('printLn', (lines) => appendLines(outputPane, lines));

window.ipcRender.receive('printFilteredLn', (lines) => appendLines(filteredPane, lines));
