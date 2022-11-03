const { dialog } = require('electron');

const userSelectFolder = async (path) => {
    return new Promise((resolve, reject) => {
        const result = dialog.showOpenDialog({
            properties: ['openFile', 'createDirectory'],
            buttons: ['Select Folder', 'Cancel'],
            title: 'Select Folder',
            defaultPath: path,
        });
    
        result.then((results) => {
            resolve(results);
        });
    
        result.catch((err) => {
            reject(err);
        });
    });
}

const userSaveFile = async (path) => {
    return new Promise((resolve, reject) => {
        const result = dialog.showSaveDialog({
            properties: ['createDirectory'],
            buttons: ['Select', 'Cancel'],
            title: 'Select Folder',
            defaultPath: path,
            filters :[
                {name: 'txt', extensions: ['txt']},
                {name: 'All Files', extensions: ['*']}
            ]
        });
    
        result.then((results) => {
            resolve(results);
        });
    
        result.catch((err) => {
            reject(err);
        });
    });
}

module.exports = {
    userSelectFolder,
    userSaveFile,
}