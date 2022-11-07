const DMcss = document.getElementById('darkModeCss');
const parent = DMcss.parentNode;

window.ipcRender.invoke('filtersLoaded').then((args) => {
    if (args) {
        parent.appendChild(DMcss);
    } else {
        parent.removeChild(DMcss);
    }
});