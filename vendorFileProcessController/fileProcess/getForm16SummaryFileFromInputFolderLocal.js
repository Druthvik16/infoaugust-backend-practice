let db = require('../dbQueryProcessController')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
let apiUrl = require('../../apiUrl')
let api = new apiUrl()
let fs = require('fs')
const path = require('path');
const mime = require('mime');
let axios = require('axios')
const uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction');
let sourceFolder = 'Input_form16_Summary_Raw_Sap_dump'
let clients;
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "form16SummaryLogFile-"
let apiName = '/api/vendorFileProcessController/getForm16SummaryFileFromInputFolderLocal'
let processForm16SummaryLocal = require('../scriptProcessing/processForm16SummaryLocal')
const logFilePath = getPath.getName('vendor/s3/form16/summary')
const vendorModuleClientPath = '/' + uniqueFunction.vendorModule + 'client'
let clientID;

let getForm16Summary = {}

getForm16Summary.getFileList = (client) => 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            clientID = client.id
            let interuptProcess = await db.getInteruptProcess(client?.id);
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false)
            }
            logFileName = "form16SummaryLogFile-"
            logFileName = logFileName + new Date().toISOString().slice(0, 10)
            // clients = await db.getClientsUuid()
            clients = [client]
            clients = clients.map(client => client.uuid)
            if(clients?.length == 0)
            {
                await uniqueFunction.writeLogIntoFile("Client List is empty", logFileName, "**************", logFilePath, 'red')
                return resolve(false)
            }
    
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            if(getDailyActivityLog?.length == 0)
            {
                let saveDailyActivityLog = await db.saveDailyActivityLog(new Date())
            }
            return resolve(getListObjectFromS3Bucket(clients, 0, clients?.length, ''))
        }
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", logFilePath, 'red')
            console.log(e)
            return resolve(false)
        }
    })
}

async function getListObjectFromS3Bucket(clientUuids, start, end,res)
{
    try
    {
        let interuptProcess = await db.getInteruptProcess(clientID);
        if(interuptProcess[0].isWorking == 0)
        {
            return false
        }
        if(start < end)
        {
            let clientUuid = clientUuids[start]
            let localFilePathListObject = getPath.getName('documentFolders') + vendorModuleClientPath + "/"  + clientUuid + "/" + sourceFolder + "/"
            console.log(localFilePathListObject)
            let dirents = fs.readdirSync(localFilePathListObject, {withFileTypes : true});
            let files = dirents
            .filter(dirent => dirent.isFile())
            .map(dirent => {
                dirent["clientUuid"] = clientUuid;
                dirent['task'] = {}
                dirent["task"]["Key"] = localFilePathListObject + dirent.name;
                return dirent;
            });
            if(files?.length > 0)
            {
                let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Form16A Summary', 'File processing started, No. of files available :' + files.length, clientUuid, new Date())
                return getFileObject(files, 0, files.length, start, end, res)
            }    
            else
            {
                
                let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Form16A Summary', 'File processing started, No. of files available :' + files.length, clientUuid, new Date())
                

                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailForClient('Process Local File', 'Form16A Summary', 'File Process completed', clientUuid, new Date())

                await uniqueFunction.writeLogIntoFile("Form16A summary local folder is empty", logFileName, "*******************", logFilePath, 'green')
                start++;
                return getListObjectFromS3Bucket(clientUuids, start, end,res)
            } 
        }
        else
        {
            await uniqueFunction.writeLogIntoFile("All clients files passed to process api", logFileName, "********* " + " ClientUUID : " + clientUuids[start-1], logFilePath, 'green')
            console.log("Process completed successfully")
            return true
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, " ClientUUID : " + clientUuids[start], logFilePath, 'red')
        console.log(e)
        start++;
        return getListObjectFromS3Bucket(clientUuids, start, end, res)
    }
}

async function getFileObject(files, start, end, masterStart, masterEnd, res)
{
    try
    {
        let interuptProcess = await db.getInteruptProcess(clientID);
        if(interuptProcess[0].isWorking == 0)
        {
            return false
        }
        if(start < end)
        { 
            let file = files[start];
            try
            {
                console.log("Getting form16A summary file for processing , file :" + (start + 1) + " from " + end)
                await uniqueFunction.writeLogIntoFile("Getting form16A summary file for processing , file :" + (start + 1) + " from " + end, logFileName, file.task.Key.split('/').pop(), getPath.getName('vendor/sftp/form16/summary'), 'Purple') 
                let fileObj = fs.readFileSync(file['task']['Key'])
                file['file'] = {}
                file['file']['Body'] = fileObj
                const fileName = file.name;
                file.file['originalFilename'] = fileName
                let stat = fs.statSync(file['task']['Key'])
                let saveDataTransactLog = await db.saveDataTransactLog('DN', 'SU', '', '',stat.size, apiName, 'LOC', new Date(), file?.clientUuid, fileName)
                let encryptKey = await db.getEncryptionData(fileName)
                if(encryptKey?.length == 0)
                {
                    await uniqueFunction.writeLogIntoFile("Encryption key not present", logFileName, file?.task.Key, logFilePath, 'red')
                    start++;
                    return getFileObject(files, start, end, masterStart, masterEnd, res);
                }
                else
                {
                    file['encriptionKey'] = encryptKey[0].encryption_key
                    file['encriptionIV'] = encryptKey[0].encryption_iv
                    let decryptedData = await uniqueFunction.decryptFileBuffer(file.file['Body'], fileName, encryptKey[0].encryption_key, encryptKey[0].encryption_iv)
                    if(decryptedData?.result)
                    {
                        await uniqueFunction.writeLogIntoFile("file decrypted, Calling form16A summary script", logFileName, file?.task.Key, logFilePath, 'green')
                        file.file['Body'] = decryptedData?.file
                        console.log("Calling form16A summary script", file.task.Key)
                        let isFileSaved = await sendToCNSScript(file)
                        if(isFileSaved)
                        {
                            start++;
                            return getFileObject(files, start, end, masterStart, masterEnd, res);
                        }
                    }
                    else
                    {
                        await uniqueFunction.writeLogIntoFile("file not decrypted", logFileName, file?.task.Key, logFilePath, 'red')
                        start++;
                        return getFileObject(files, start, end, masterStart, masterEnd, res);
                    }
                }
            }  
            catch(fileError)
            {
                await uniqueFunction.writeLogIntoFile(fileError?.stack, logFileName, file['task']['Key'], logFilePath, 'red')
                console.error('Error list:', fileError);
                start++;
                return getFileObject(files, start, end, masterStart, masterEnd, res);
            }
        }
        else
        {

            await uniqueFunction.writeLogIntoFile("File send to API", logFileName, JSON.stringify(files[start-1]), logFilePath, 'green')
            masterStart++;
            return getListObjectFromS3Bucket(clients, masterStart, masterEnd, res)
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "*********** " + "Start : " + start, logFilePath, 'red')
        console.log(e)
        start++
        return getFileObject(files, start, end, masterStart, masterEnd, res)
    }
}

async function sendToCNSScript(file) 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let interuptProcess = await db.getInteruptProcess(clientID);
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false)
            }
            const fileName = file.file['originalFilename']
            fs.writeFileSync("cron/"+fileName,file.file.Body)
            const stats = fs.statSync("cron/"+fileName); 
            const mimetype = mime.getType("cron/"+fileName);
            let params = {
                uploadFSAFile : {
                    fieldname: 'upload',
                    originalFilename: fileName,
                    filepath: "cron/"+fileName,
                    size: stats.size,
                    newFilename: path.basename("cron/"+fileName),
                    mimetype: mimetype
                  },
                client : {"uuid": file?.clientUuid, id : clientID},
                inputFolderPath : file.task.Key,
                encriptionKey : file.encriptionKey,
                encriptionIV : file.encriptionIV
            }
            let processFile = await processForm16SummaryLocal.getFileList(params.uploadFSAFile, params.inputFolderPath, params.encriptionIV, params.encriptionKey, params.client)
            uniqueFunction.removeFileFromDirectory("cron/"+fileName)
            return resolve(true)
        }
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, file?.task.Key, logFilePath, 'red')
            console.log(e)
            return resolve(true)
        }
    })
}

module.exports = getForm16Summary
