let db = require('./dbQueryProcessController')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

let copyOutstandingReportSummary = require('./fileSyncProcess/copyOutstandingReportSummaryFileFromSftpToLocal')
let copyAdjustmentReportSummary = require('./fileSyncProcess/copyAdjustmentReportSummaryFileFromSftpToLocal')

let getOutstandingReportSummary = require('./fileProcess/getOutstandingReportSummaryFileFromInputFolderLocal')
let getAdjustmentReportSummary = require('./fileProcess/getAdjustmentReportSummaryFileFromInputFolderLocal')

const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const { getDiskSpaceStatus } = require('../diskSpaceChecker/diskSpaceChecker.js');

module.exports = require('express').Router().get('/:clientUuid',async(req,res) => 
{
    try
    {
            const disk = getDiskSpaceStatus();
            if(!disk.isAvailable)
            {
                return res.json({
                    status_code: 500,
                    message: "Insufficient disk space available for file processing",
                    data: {
                        isDiskSpaceAvailable: disk.isAvailable,
                        availableGB: disk.availableGB
                    },
                    status_name: getCode.getStatus(500)
                });
            }
        console.log('called')
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
        let host = getClient[0].sftpHost;
        let port = getClient[0].sftpPort;
        let username = getClient[0].sftpUserName;
        let password = getClient[0].sftpPassword;
        let algorithms = getClient[0].sftpAlgorithm;
        let baseFolder = getClient[0].sftpBaseFolder;
        let clientId = getClient[0].id;
        let client = {
            host : host,
            port : port,
            username : username,
            password : password,
            algorithms : algorithms,
            baseFolder : baseFolder,
            id : clientId,
            uuid : clientUuid
        }
        let checkSftpconnection = await uniqueFunction.testSftpConnection(host, port, username, password, 'test.txt')
        if(!checkSftpconnection.result)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "SFTP not available",
                "status_name" : getCode.getStatus(500),
                "error" : checkSftpconnection?.error
            });
        }
        let interuptProcess = await db.getInteruptProcess(clientId);
        if(interuptProcess[0].isWorking == 1)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Process is working",
                "status_name" : getCode.getStatus(500)
            });
        }
        else
        {
            let updateInteruptProcess = await db.updateInteruptProcess(1, new Date(), clientId)
        }
        let checkWorking = await db.getProcessSequenceStatus(clientId)
        if(checkWorking[0].working == 1)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Process is running",
                "status_name" : getCode.getStatus(500)
            });
        }
        console.log("master api ", new Date())
        let updateProcessSequenceIsComplete = await db.updateProcessSequenceIsComplete(0, clientId);
        let uniqueProcessSequenceTypes = await db.getUniqueProcessSequencetype(clientId)
        if(uniqueProcessSequenceTypes?.length > 0)
        {
            getProcessSequenceList(uniqueProcessSequenceTypes, 0, uniqueProcessSequenceTypes.length, res, clientId, client)
        }
        else
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack || e?.message
        });
    }
})

async function getProcessSequenceList(uniqueProcessSequenceTypes, start, end, res, clientId, client) 
{
    try
    {

        let interuptProcess = await db.getInteruptProcess(clientId);
        if(interuptProcess[0].isWorking == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Process is reset",
                "status_name" : getCode.getStatus(500)
            });
        }
        if(start < end)
        {
            let processSequences;
            let processType = uniqueProcessSequenceTypes[start]?.type
            let isActive = 1
            processSequences = await db.getProcessSequence(processType, isActive, clientId)
            console.log(`${processType} started for sequence list: ${processSequences?.length}`)
            if(processSequences?.length > 0)
            { 
                let process = await processSequenceList(processSequences, 0, processSequences?.length, res, start, end, uniqueProcessSequenceTypes, clientId, client)
                if(!process)
                {
                    start = end
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message"     : "Something went wrong",
                        "status_name" : getCode.getStatus(500),
                        "error" : "Check sftp connection"
                    });
                }
            }
            else
            {
                start++;
                return getProcessSequenceList(uniqueProcessSequenceTypes, start, end, res, clientId, client)
            }
        }
        else
        {
            let updateInteruptProcess = await db.updateInteruptProcess(0, new Date(), clientId)
            console.log("All process completed")
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch (e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack || e?.message
        });
    }
}

async function processSequenceList(processSequences, start, end, res, masterStart, masterEnd, uniqueProcessSequenceTypes, clientId, client) 
{
    try
    {
        let interuptProcess = await db.getInteruptProcess(clientId);
        if(interuptProcess[0].isWorking == 0)
        {
            masterStart = masterEnd
            console.log("masterStart", masterStart, interuptProcess)
            return false;
        }
        if(start < end)
        {
            let processType = uniqueProcessSequenceTypes[masterStart]?.type
            let sequenceList = processSequences[start]?.name
            let readType = processSequences[start]?.readType
            let list = await db.getProcessSequence(processType, 1, clientId)
            if(list.length > 0)
            {                
                let saveProcessSequenceLog = await db.saveProcessSequenceLog(sequenceList, processType, new Date(), clientId)
                console.log(`${processType} started for ${sequenceList}`)
                let result = await executeProcessSequence(processType, sequenceList, readType, clientId, client)
                if(result)
                {
                    let updateProcessSequenceLog = await db.updateProcessSequenceLog(sequenceList, processType, new Date(), clientId)
                    let updateProcessSequence = await db.updateProcessSequence(0, '', processType, sequenceList, 1, 0, clientId)
                    start++;
                    return processSequenceList(processSequences, start, end, res, masterStart, masterEnd, uniqueProcessSequenceTypes, clientId, client)
                }
                else
                {
                    console.log("************************************Return From Here ******************************")
                    masterStart = masterEnd
                    start = end
                    let resetProcessSequence = await db.resetProcessSequence(0,0,0)
                    let updateInteruptProces = await db.updateInteruptProcess(0, new Date(), clientId)
                    return false;
                    // let updateProcessSequenceError = await db.updateProcessSequenceError(processType, sequenceList, 1)
                    // processSequenceList(processSequences, start, end, res, masterStart, masterEnd, uniqueProcessSequenceTypes, clientId, client) 
                }
            }
            else
            {
                // setTimeout(() => {
                //     processSequenceList(processSequences, start, end, res, masterStart, masterEnd, uniqueProcessSequenceTypes, clientId, client)
                // }, 120000)
                return true;
            }
        }
        else
        {
            masterStart++;
            return getProcessSequenceList(uniqueProcessSequenceTypes, masterStart, masterEnd, res, clientId, client)
        }
    }
    catch (e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack || e?.message
        });
    }
}

async function executeProcessSequence(processType, sequence, readType, clientId, client)
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
        
            let interuptProcess = await db.getInteruptProcess(clientId);
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false)
            }
            let updateProcessSequence = await db.updateProcessSequence(1, '', processType, sequence, 0,0, clientId)
            if(sequence == 'OutstandingReportSummary' && processType == 'FileSync')
            {
                return resolve(await copyOutstandingReportSummary.getFileList(readType, client))
            }
            else if(sequence == 'AdjustmentReportSummary' && processType == 'FileSync')
            {
                return resolve(await copyAdjustmentReportSummary.getFileList(readType, client))
            }
            else if(sequence == 'OutstandingReportSummary' && processType == 'FileProcess')
            {
                return resolve(await getOutstandingReportSummary.getFileList(client))
            }
            else if(sequence == 'AdjustmentReportSummary' && processType == 'FileProcess')
            {
                return resolve(await getAdjustmentReportSummary.getFileList(client))
            }
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}