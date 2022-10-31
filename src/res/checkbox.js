const lockCb = document.getElementById('lockCb');
const tsCb = document.getElementById('timestampCb');
const hexCb = document.getElementById('hexCb');
const darkModeCb = document.getElementById('darkModeCb');

lockCb.addEventListener('click', () => {
    if (lockCb.checked) {
        document.getElementById('lockedStat').src='res/resources/unlocked-nobg.png';
    } else {
        document.getElementById('lockedStat').src='res/resources/locked.png';
    }
});

darkModeCb.addEventListener('click', () => {
    if (darkModeCb.checked) {
        document.querySelectorAll(".darkBtn").forEach( element => {
            element.classList.remove("btn-outline-dark");
            element.classList.add("btn-outline-secondary");
        });
        parent.appendChild(DMcss);
    } else {
        document.querySelectorAll(".darkBtn").forEach( element => {
            element.classList.remove("btn-outline-secondary");
            element.classList.add("btn-outline-dark");
        });
        parent.removeChild(DMcss);
    }
});
