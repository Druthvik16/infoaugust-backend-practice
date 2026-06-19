let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let baseFolder = process.env.baseFolder;
let { retrySftpConnection, sftpDirectories , sftpConfig, Client } = require('./commonSftpFunctions');

module.exports = require('express').Router().get('/:name/:fileName', async (req, res) => {
    const sftp = new Client();
    try {
        await sftp.connect(sftpConfig);
        if (!sftp?.sftp) await retrySftpConnection(sftp);
        sftp.client.setMaxListeners(30);
        let processName = req.params.name;
        let fileName = req.params.fileName;
        if(!sftpDirectories[processName]){
            return res.status(404).json({
                "status_code" : 404,
                "message"     : "Invalid Process Name",
                "status_name" : getCode.getStatus(404)
            });
        }
        let isFileMarked = false;
        for(let dir of sftpDirectories[processName]){
            const filePath = baseFolder + dir + '/' + fileName;
            let fileNameParts = fileName.split('.');
            let extension = fileNameParts.pop(); 
            let baseName = fileNameParts.join('.');
            const newFilePath = baseFolder + dir + '/' + baseName + '_read.' + extension;
            let file = await sftp.exists(filePath);
            if(file === '-'){
                await sftp.rename(filePath, newFilePath);
                isFileMarked = true;
                break;
            }
        }
        if(!isFileMarked){
            return res.status(404).json({
                "status_code" : 404,
                "message"     : "File Not Found",
                "status_name" : getCode.getStatus(404)
            });
        }
        res.status(200).json({
            "status_code" : 200,
            "message"     : "File Marked",
            "status_name" : getCode.getStatus(200)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            "status_code" : 500,
            "message"     : "Internal error",
            "status_name" : getCode.getStatus(500)
        });
    } finally {
        await sftp?.end();
    }
});


