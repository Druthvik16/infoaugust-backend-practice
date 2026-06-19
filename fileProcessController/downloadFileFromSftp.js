let errorCode = require('../common/error/errorCode');
let getCode = new errorCode();
let baseFolder = process.env.baseFolder;
let { sftpDirectories, sftpConfig, Client, retrySftpConnection } = require('./commonSftpFunctions');
const mime = require('mime-types');
const { pipeline } = require('stream/promises');

module.exports = require('express').Router().get('/:name/:fileName', async (req, res) => {
    let sftp = new Client();
    try {
        await sftp.connect(sftpConfig);
        if (!sftp?.sftp) await retrySftpConnection(sftp);
        sftp.client.setMaxListeners(30);
        
        const processName = req.params.name;
        const fileName = req.params.fileName;

        // Check if process name is valid
        if (!sftpDirectories[processName]) {
            await sftp.end();
            return res.status(404).json({
                "status_code": 404,
                "message": "Invalid Process Name",
                "status_name": getCode.getStatus(404)
            });
        }

        // Determine the correct remote path
        let remotePath;
        for (const dir of sftpDirectories[processName]) {
            const filePath = `${baseFolder}${dir}/${fileName}`;
            const fileInfo = await sftp.exists(filePath);
            if (fileInfo === '-') {
                remotePath = filePath;
                break;
            }
        }

        // If file not found, return 404
        if (!remotePath) {
            await sftp.end();
            return res.status(404).json({
                "status_code": 404,
                "message": "File Not Found",
                "status_name": getCode.getStatus(404)
            });
        }

        // Create read stream 
        const remoteStream = sftp.createReadStream(remotePath);
        res.header('Content-Disposition', `attachment; filename="${fileName}"`);
        res.header('Content-Type', mime.lookup(fileName) || 'application/octet-stream');

        await pipeline(
            remoteStream,
            res
        );

    } catch (err) {
        console.error('Caught an error:', err);
        if (!res.headersSent) {
            res.status(500).send('Internal server error');
        } else {
            res.destroy(err);
        }
    } finally {
        try {
            if (sftp && sftp.end) {
                await sftp.end();
            }
        } catch (err) {
            console.error('Error closing SFTP connection:', err);
        }
    }
});