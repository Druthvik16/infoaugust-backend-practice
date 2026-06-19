let db = require('./dbQueryProcessController')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let copyCreditNoteSummary = require('./fileSyncProcess/copyCreditNoteSummaryFileFromSftpToLocal')
let copyCreditNotePdf = require('./fileSyncProcess/copyCreditNotePdfFileFromSftpToLocal')
let copyInvoiceSummary = require('./fileSyncProcess/copyInvoiceSummaryFileFromSftpToLocal')
let copyInvoicePdf = require('./fileSyncProcess/copyInvoicePdfFileFromSftpToLocal')
let copyCreditNoteWorking = require('./fileSyncProcess/copyCreditNoteWorkingFileFromSftpToLocal')
let copyLedgerSummary = require('./fileSyncProcess/copyLedgerSummaryFileFromSftpToLocal')
let copyMonthlyTransactionSummary = require('./fileSyncProcess/copyMonthlyTransactionFileFromSftpToLocal')
let copyInvoicePt = require('./fileSyncProcess/copyInvoicePtFileFromSftpToLocal')
let copyPartnerFile = require('./fileSyncProcess/copyPartnerFileFromSftpToLocal')

let getCreditNoteSummary = require('./fileProcess/getCreditNoteSummaryFileFromInputFolderLocal')
let getInvoiceSummary = require('./fileProcess/getInvoiceSummaryFileFromInputFolderLocal')
let getInvoicePt = require('./fileProcess/getInvoicePtFileFromInputFolderLocal')
let getCreditNoteWorking = require('./fileProcess/getCreditNoteWorkingFileFromInputFolderLocal')
let getLedgerSummary = require('./fileProcess/getLedgerSummaryFileFromInputFolderLocal')
let getMonthlyTransactionSummary = require('./fileProcess/getMonthlyTransactionFileFromInputFolderLocal')
let getPartnerFile = require('./fileProcess/getPartnerFileFromInputFolderLocal')


let setCreditNotePdfBotStatus = require('./botProcess/setCreditNotePdfBotStatus')
let setInvoicePdfBotStatus = require('./botProcess/setInvoicePdfBotStatus')

let uniqueProcessSequenceTypes;
let processSequences;
const { getDiskSpaceStatus } = require('../diskSpaceChecker/diskSpaceChecker.js');

const Client = require('ssh2-sftp-client');
const sftp = new Client();

const getSftpConfig = require('../common/sftpConfig');
const config = getSftpConfig();

//const config = {
 //   host: process.env.sftpHost,
 //   port: process.env.sftpPort,
  //  username: process.env.sftpUserName,
 //   password: process.env.sftpPassword,
 //   algorithms: JSON.parse(process.env.sftpAlgorithms)
//};


/////// for qa and dev
// const config = {
//     host: process.env.sftpHost,
//     port: process.env.sftpPort,
//     username: 'ubuntu',
//    privateKey: fs.readFileSync('./infomap-tgbl-new-qa.pem')
// };

module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
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
            
            await sftp.connect(config)
            await sftp?.end()
        }
        catch (e)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "SFTP not available",
                "status_name" : getCode.getStatus(500),
                "error" : e?.stack || e?.message
            });
        }
        let interuptProcess = await db.getInteruptProcess();
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
            let updateInteruptProcess = await db.updateInteruptProcess(1, new Date())
        }
        let checkWorking = await db.getProcessSequenceStatus()
        if(checkWorking[0].working == 1)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Process is working",
                "status_name" : getCode.getStatus(500)
            });
        }
        let uniqueProcessSequenceTypes;
        console.log("master api ", new Date())
        let updateProcessSequenceIsComplete = await db.updateProcessSequenceIsComplete(0);
        uniqueProcessSequenceTypes = await db.getUniqueProcessSequencetype()
        if(uniqueProcessSequenceTypes?.length > 0)
        {
            getProcessSequenceList(uniqueProcessSequenceTypes, 0, uniqueProcessSequenceTypes.length, res)
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

async function getProcessSequenceList(uniqueProcessSequenceTypes, start, end, res) 
{
    try
    {
        
        let interuptProcess = await db.getInteruptProcess();
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
            processSequences = await db.getProcessSequence(processType, isActive)
            console.log(`${processType} started for sequence list: ${processSequences?.length}`)
            if(processSequences?.length > 0)
            { 
                let process = await processSequenceList(processSequences, 0, processSequences?.length, res, start, end, uniqueProcessSequenceTypes)
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
                return getProcessSequenceList(uniqueProcessSequenceTypes, start, end, res)
            }
        }
        else
        {
            let updateInteruptProcess = await db.updateInteruptProcess(0, new Date())
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

async function processSequenceList(processSequences, start, end, res, masterStart, masterEnd, uniqueProcessSequenceTypes) 
{
    try
    {
        
        let interuptProcess = await db.getInteruptProcess();
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
            let list = await db.getProcessSequence(processType, 1)
            if(list.length > 0)
            {                
                let saveProcessSequenceLog = await db.saveProcessSequenceLog(sequenceList, processType, new Date())
                console.log(`${processType} started for ${sequenceList}`)
                let result = await executeProcessSequence(processType, sequenceList, readType)
                if(result)
                {
                    let updateProcessSequenceLog = await db.updateProcessSequenceLog(sequenceList, processType, new Date())
                    let updateProcessSequence = await db.updateProcessSequence(0, '', processType, sequenceList, 1, 0)
                    start++;
                    return processSequenceList(processSequences, start, end, res, masterStart, masterEnd, uniqueProcessSequenceTypes)
                }
                else
                {
                    masterStart = masterEnd
                    start = end
                    let resetProcessSequence = await db.resetProcessSequence(0,0,0)
                    let uinteruptProcess = await db.updateInteruptProcess(0, new Date())
                    return false;
                    // let updateProcessSequenceError = await db.updateProcessSequenceError(processType, sequenceList, 1)
                    // processSequenceList(processSequences, start, end, res, masterStart, masterEnd, uniqueProcessSequenceTypes) 
                }
            }
            else
            {
                // setTimeout(() => {
                //     processSequenceList(processSequences, start, end, res, masterStart, masterEnd, uniqueProcessSequenceTypes)
                // }, 120000)
                return true;
            }
        }
        else
        {
            masterStart++;
            return getProcessSequenceList(uniqueProcessSequenceTypes, masterStart, masterEnd, res)
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

async function executeProcessSequence(processType, sequence, readType)
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
        
            let interuptProcess = await db.getInteruptProcess();
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false)
            }
            let updateProcessSequence = await db.updateProcessSequence(1, '', processType, sequence, 0)
            if(sequence == 'CreditNoteSummary' && processType == 'FileSync')
            {
                return resolve(await copyCreditNoteSummary.getFileList(readType))
            }
            else if(sequence == 'Partner' && processType == 'FileSync')
            {
                return resolve(await copyPartnerFile.getFileList(readType))
            }
            else  if(sequence == 'CreditNotePdf' && processType == 'FileSync')
            {
                return resolve(await copyCreditNotePdf.getFileList(readType))
            }
            else  if(sequence == 'CreditNoteWorking' && processType == 'FileSync')
            {
                return resolve(await copyCreditNoteWorking.getFileList(readType))
            }
            else  if(sequence == 'LedgerSummary' && processType == 'FileSync')
            {
                return resolve(await copyLedgerSummary.getFileList(readType))
            }
            else  if(sequence == 'InvoiceSummary' && processType == 'FileSync')
            {
                return resolve(await copyInvoiceSummary.getFileList(readType))
            }
            else  if(sequence == 'InvoicePdf' && processType == 'FileSync')
            {
                return resolve(await copyInvoicePdf.getFileList(readType))
            }
            else  if(sequence == 'MonthlyTransactionSummary' && processType == 'FileSync')
            {
                return resolve(await copyMonthlyTransactionSummary.getFileList(readType))
            }
            else  if(sequence == 'InvoicePt' && processType == 'FileSync')
            {
                return resolve(await copyInvoicePt.getFileList(readType))
            }
            else if(sequence == 'CreditNoteSummary' && processType == 'FileProcess')
            {
                return resolve(await getCreditNoteSummary.getFileList())
            }
            else if(sequence == 'Partner' && processType == 'FileProcess')
            {
                return resolve(await getPartnerFile.getFileList())
            }
            else  if(sequence == 'CreditNoteWorking' && processType == 'FileProcess')
            {
                return resolve(await getCreditNoteWorking.getFileList())
            }
            else  if(sequence == 'LedgerSummary' && processType == 'FileProcess')
            {
                return resolve(await getLedgerSummary.getFileList())
            }
            else  if(sequence == 'InvoiceSummary' && processType == 'FileProcess')
            {
                return resolve(await getInvoiceSummary.getFileList())
            }
            else  if(sequence == 'MonthlyTransactionSummary' && processType == 'FileProcess')
            {
                return resolve(await getMonthlyTransactionSummary.getFileList())
            }
            else  if(sequence == 'InvoicePt' && processType == 'FileProcess')
            {
                return resolve(await getInvoicePt.getFileList())
            }
            else  if(sequence == 'InvoicePdf' && processType == 'BotProcess')
            {
                let response = await setInvoicePdfBotStatus.getFileList()
                console.log(response)
                return resolve(response?.result)
            }
            else  if(sequence == 'CreditNotePdf' && processType == 'BotProcess')
            {
                let response = await setCreditNotePdfBotStatus.getFileList()
                console.log(response)
                return resolve(response?.result)
            }
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}