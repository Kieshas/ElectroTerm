const net = require('net');

class TCPHandler { // single-client server: a new connection replaces the previous one
    serverHandle = null;
    currSocket = null;
    sendDataFn = null;

    constructor(sendDataFn) {
        this.sendDataFn = sendDataFn;
    }

    openServer(port) {
        return new Promise ((resolve, reject) => {
            this.closeServer();
            this.serverHandle = net.createServer((socket) => {
                if (this.currSocket != null) {
                    this.currSocket.destroy();
                }
                this.currSocket = socket;
                let pending = ""; // TCP chunks do not align with lines, keep the partial tail until it completes
                socket.on('data', (data) => {
                    pending += data.toString();
                    const lines = pending.split('\n');
                    pending = lines.pop();
                    lines.forEach((line) => this.sendDataFn(line));
                });
                socket.on('close', () => {
                    if (pending !== "") {
                        this.sendDataFn(pending);
                        pending = "";
                    }
                    if (this.currSocket === socket) {
                        this.currSocket = null;
                    }
                });
                socket.on('error', () => {}); // 'close' follows and does the cleanup
            });
            this.serverHandle.on('error', (err) => {
                reject(err.code === 'EADDRINUSE' ? "Port already in use" : err.message);
            });
            this.serverHandle.listen({port: Number(port)}, () => {
                resolve();
            });
        })
    };
    closeServer() {
        if (this.currSocket != null) {
            this.currSocket.destroy();
            this.currSocket = null;
        }
        if (this.serverHandle != null) {
            this.serverHandle.close();
            this.serverHandle = null;
        }
    };
    sendMsg(msg) {
        if (this.currSocket == null) return false;
        this.currSocket.write(msg + '\r\n');
        return true;
    };
};

module.exports = {
    TCPHandler,
};
