const db = require('./dbQueryProcessController');
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let baseFolder = process.env.baseFolder;
let { getFileListFromSftp, retrySftpConnection , sftpDirectories , sftpConfig, Client } = require('./commonSftpFunctions');


module.exports = require('express').Router().get('/:type/:name', async (req, res) => {
    const sftp = new Client();
    try {
        await sftp.connect(sftpConfig);
        if (!sftp?.sftp) await retrySftpConnection(sftp);
        sftp.client.setMaxListeners(30);
        let processName = req.params.name;
        let processType = req.params.type;
        const rows = await db.getDataFromProcessSequenceMaster(processType, 0 , processName);
        if(rows.length === 0){
            return res.status(404).json({
                "status_code" : 404,
                "message"     : "No Files Found",
                "status_name" : getCode.getStatus(404)
            });
        }
        const unreadedFileList = [];
        const directories = sftpDirectories[processName];  
        if(!directories){
            return res.status(404).json({
                "status_code" : 404,
                "message"     : "Invalid Process Name",
                "status_name" : getCode.getStatus(404)
            });
        }
        let listAll = (await Promise.all(directories.map(dir => getFileListFromSftp(sftp, baseFolder + dir)))).flat();
        // if multiple sftp directories for a processName
        for (let file of listAll) {
            if (file.type === 'd') continue;
            let fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
            if (!fileNameWithoutExtension.endsWith('_read')) unreadedFileList.push({ processName, processType, fileName: file.name, date: new Date(file.modifyTime).toISOString() });
        }

        res.status(200).json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {fileList : unreadedFileList},
            "status_name" : getCode.getStatus(200)
        }
        );
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal error');
    } finally {
        await sftp?.end();
    }
});


