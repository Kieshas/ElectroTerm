const net = require('net');

class TCPHandler { // simple single way draft
    serverHandle = null;
    currSocket = null;
    sendDataFn = null;

    constructor(sendDataFn) {
        this.sendDataFn = sendDataFn;
    }
    
    openServer(port) {
        return new Promise ((resolve, reject) => {
            this.serverHandle = net.createServer({port: port, keepAlive: false}, (socket) => {
                this.currSocket = socket;
                this.currSocket.on('data', (data) => this.#processData(data));
            });
            this.serverHandle.listen({port: port}, (err) => {
                resolve();
            });
            this.serverHandle.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    reject("Port already in use");
                }
            });
        })
    };
    closeServer() {    
        if (this.serverHandle == null) return;
        this.serverHandle.close();
        this.currSocket.destroy();
        this.currSocket.unref();
    };
    #processData(data) {
        if (this.sendDataFn != null) {
            const temp = data.toString().split('\n');
            temp.forEach( (line) => {
                this.sendDataFn(line);
            });
        }
    };
};

module.exports = {
    TCPHandler,
};