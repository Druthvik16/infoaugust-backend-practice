let db = require('./dbQueryCronTab')
let manualBlockerDb  = require('../manualRunApiBlocker/dbQueryManualRunBlocker')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
const folderName = process.env.currentFolder
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let fs = require('fs')
let axios = require('axios')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let sourceFolder = 'Input_Invoice_Summary_Raw_Sap_dump'
let clients;
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "invoiceSummaryLogFile-"
let apiName = ''
const { getDiskSpaceStatus } = require('../diskSpaceChecker/diskSpaceChecker.js');

module.exports = require('express').Router().get('/',async(req,res) => 
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
    let blockerStarted = false
    let processName = 'Invoice Note Summary'
    try
    {
            /* ================= BLOCKER CHECK ================= */
    
            /* ===== STATUS CHECK ===== */
            let status = await manualBlockerDb.getStatus()
    
            if (status?.is_working === 1) {
                return res.status(409).json({
                    status_code: 409,
                    message: `Process already running : ${status.process_name}`,
                    status_name: getCode.getStatus(409)
                })
            }
    
            /* ===== START PROCESS ===== */
            await manualBlockerDb.startProcess(processName)
            blockerStarted = true
    
            /* ================= BLOCKER COMPLETED ================= */
        
        logFileName = "invoiceSummaryLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        apiName = req.baseUrl
        clients = await db.getClientsUuid()
        clients = clients.map(client => client.uuid)
        if(clients?.length == 0)
        {
            await uniqueFunction.writeLogIntoFile("Client List is empty", logFileName, "**************", getPath.getName('s3/invoice/summary'), 'red')
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Client Not Exists",
                "status_name" : getCode.getStatus(500)
            });
        }

        let getDailyActivityLog = await db.getDailyActivityLog(new Date())
        if(getDailyActivityLog?.length == 0)
        {
            let saveDailyActivityLog = await db.saveDailyActivityLog(new Date())
        }
        getListObjectFromS3Bucket(clients, 0, clients?.length, res)
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", getPath.getName('s3/invoice/summary'), 'red')
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500)
        });
    }    
    finally {
    /* ===== RESET BLOCKER ===== */
    if (blockerStarted) {
        try {
            await manualBlockerDb.resetProcess()
        } catch (err) {
            console.error('Failed to reset manual api blocker', err)
        }
    }
}
})

async function getListObjectFromS3Bucket(clientUuids, start, end, res)
{
    try
    {
        if(start < end)
        {
            let clientUuid = clientUuids[start]
            let localFilePathListObject = getPath.getName('documentFolders') + "/"  + clientUuid + "/" + sourceFolder + "/"
            let dirents = fs.readdirSync(localFilePathListObject, {withFileTypes : true});
            let files = dirents
            .filter(dirent => dirent.isFile())
            .map(dirent => {
                dirent["clientUuid"] = clientUuid;
                dirent['task'] = {}
                dirent["task"]["Key"] = localFilePathListObject  + dirent.name;
                return dirent;
            });  
            if(files?.length > 0)
            {
                let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Invoice Summary', 'File processing started, No. of files available :' + files.length, clientUuid, new Date())
                getFileObject(files, 0, files.length, start, end, res)
            }    
            else
            {
                let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Invoice Summary', 'File processing started, No. of files available :' + files.length, clientUuid, new Date())
                

                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailForClient('Process Local File', 'Invoice Summary', 'File Process completed', clientUuid, new Date())
                await uniqueFunction.writeLogIntoFile("Invoice summary local folder is empty", logFileName, "*******************", getPath.getName('s3/invoice/summary'), 'green')
                start++;
                getListObjectFromS3Bucket(clientUuids, start, end,res)
            }  
        }
        else
        {
            await uniqueFunction.writeLogIntoFile("All clients files passed to process api", logFileName, "ClientUUID : " + clientUuids[start-1], getPath.getName('s3/invoice/summary'), 'green')
           console.log("Process completed successfully")
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
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "ClientUUID : " + clientUuids[start], getPath.getName('s3/invoice/summary'), 'red')
        console.log(e)
        start++;
        getListObjectFromS3Bucket(clientUuids, start, end, res)
    }
}

async function getFileObject(files, start, end, masterStart, masterEnd, res)
{
    try
    {
        if(start < end)
        { 
            let file = files[start];
            try
            {
                console.log("Getting invoice summary file for processing , file :" + (start + 1) + " from " + end)
                await uniqueFunction.writeLogIntoFile("Getting invoice summary file for processing , file :" + (start + 1) + " from " + end, logFileName, file.task.Key.split('/').pop(), getPath.getName('sftp/invoice/summary'), 'Purple') 
                let fileObj = fs.readFileSync(file['task']['Key'])
                file['file'] = {}
                file['file']['Body'] = fileObj
                const fileName = file.name;
                file.file['originalFilename'] = fileName
                let stat = fs.statSync(file['task']['Key'])
                let saveDataTransactLog = await db.saveDataTransactLog('DN', 'SU', '', '',stat.size, apiName, 'LOC', new Date(), file?.task?.Key.split('/')[1], fileName)
                let encryptKey = await db.getEncryptionData(fileName)
                if(encryptKey?.length == 0)
                {
                    await uniqueFunction.writeLogIntoFile("Encryption key not present", logFileName, file?.task.Key, getPath.getName('s3/invoice/summary'), 'red')
                    start++;
                    getFileObject(files, start, end, masterStart, masterEnd, res);
                }
                else
                {
                    file['encriptionKey'] = encryptKey[0].encryption_key
                    file['encriptionIV'] = encryptKey[0].encryption_iv
                    let decryptedData = await uniqueFunction.decryptFileBuffer(file.file['Body'], fileName, encryptKey[0].encryption_key, encryptKey[0].encryption_iv)
                    if(decryptedData?.result)
                    {
                        await uniqueFunction.writeLogIntoFile("file decrypted, Calling invoice summary script", logFileName, file?.task.Key, getPath.getName('s3/invoice/summary'), 'green')
                        file.file['Body'] = decryptedData?.file
                        console.log("Calling invoice summary script", file.task.Key)
                        let isFileSaved = await sendToISScript(file)
                        if(isFileSaved)
                        {
                            start++;
                            getFileObject(files, start, end, masterStart, masterEnd, res);
                        }
                    }
                    else
                    {
                        await uniqueFunction.writeLogIntoFile("file not decrypted", logFileName, file?.task.Key, getPath.getName('s3/invoice/summary'), 'red')
                        start++;
                        getFileObject(files, start, end, masterStart, masterEnd, res);
                    }                    
                }
            }
            catch(fileError)
            {
                await uniqueFunction.writeLogIntoFile(fileError?.stack, logFileName, file['task']['Key'], getPath.getName('s3/invoice/summary'), 'red')
                console.error('Error list:', fileError);
                start++;
                getFileObject(files, start, end, masterStart, masterEnd, res);
            }      
        }
        else
        {        
            await uniqueFunction.writeLogIntoFile("File send to API", logFileName, JSON.stringify(files[start-1]), getPath.getName('s3/invoice/summary'), 'green')
            masterStart++;
            getListObjectFromS3Bucket(clients, masterStart, masterEnd, res)
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "*********", getPath.getName('s3/invoice/summary'), 'red')
        console.log(e)
        start++
        getFileObject(files, start, end, masterStart, masterEnd, res)
    }
}

async function sendToISScript(file) 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            const fileName = file.file['originalFilename']
            fs.writeFileSync("cron/"+fileName,file.file.Body)
            let params = {
                uploadISFile : fs.createReadStream("cron/"+fileName),
                client : JSON.stringify({"uuid": file?.clientUuid}),
                inputFolderPath : file.task.Key,
                encriptionKey : file.encriptionKey,
                encriptionIV : file.encriptionIV
            }
            axios.post(api.serviceApi + api.uploadedDoc + api.processInvoiceSummaryLocal, params,
            {
                headers: 
                {
                    "Content-Type" : 'multipart/form-data'
                }
            }).
            then(async(response) => {
                params.uploadISFile?.close();
                uniqueFunction.removeFileFromDirectory("cron/"+fileName)
                await uniqueFunction.writeLogIntoFile(response?.data, logFileName, file?.task.Key, getPath.getName('s3/invoice/summary'), 'green')     
                return resolve(true)
            })
            .catch(async(err) => {
                params.uploadISFile?.close();
                uniqueFunction.removeFileFromDirectory("cron/"+fileName)  
                await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, file?.task.Key, getPath.getName('s3/invoice/summary'), 'red')  
                console.log('err', err?.file)  
                return resolve(true)
            })
        }
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, file?.task.Key, getPath.getName('s3/invoice/summary'), 'red')
            console.log(e)
            return resolve(true)
        }
    })
}
