let db = require('./dbQueryProcessController')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const { getDiskSpaceStatus } = require('../diskSpaceChecker/diskSpaceChecker.js');
module.exports = require('express').Router().get('/:clientUuid',async(req,res) => 
{
    try
    {
        let clientUuid = req.params.clientUuid
        let getClient = await db.getClientData(clientUuid)
        if(getClient?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Client not found",
                "status_name" : getCode.getStatus(400)
            });
        }
        if(!getClient[0]?.sftpHost || getClient[0]?.sftpHost?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Client SFTP credentials not found",
                "status_name" : getCode.getStatus(400)
            });
        }
        console.log("Client SFTP credentials testing", getClient);
        let testConnection = await uniqueFunction.testSftpConnection(getClient[0]?.sftpHost, getClient[0]?.sftpPort,getClient[0]?.sftpUserName, getClient[0]?.sftpPassword, 'test.txt')
        let isConnection = testConnection.result
        console.log('connection', testConnection)

        const disk = getDiskSpaceStatus();

        getProcessSequences = await db.getProcessSequences(getClient[0]?.id)
        console.log("Data Received and Sent", getProcessSequences?.length , new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"processSequences" : getProcessSequences, 'isSftpConnection': isConnection, isDiskSpaceAvaiable : disk.isAvailable, availableGB:disk.availableGB},
            "status_name" : getCode.getStatus(200)
        });
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})