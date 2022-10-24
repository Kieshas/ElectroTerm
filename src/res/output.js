const output = document.getElementById('output');

const outputLine = (lineCont) => {
    output.textContent += lineCont;
    output.scrollTop = output.scrollHeight;
}

window.ipcRender.receive('printLn', (lineCont) => outputLine(lineCont));

// window.ipcRender.receive(('printLn', lineCnt) => {

// });

// window.ipcbridge.printLn((event, line) => {
    
// });