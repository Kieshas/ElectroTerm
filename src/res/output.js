const output = document.getElementById('output');

window.ipcbridge.printLn((event, line) => {
    output.textContent += line;
    output.scrollTop = output.scrollHeight;
});