let db = require('../dbQueryProcessController')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
let apiUrl = require('../../apiUrl')
let api = new apiUrl()
const fs = require('fs');
const path = require('path');
const mime = require('mime');
let axios = require('axios')
const uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction');
let sourceFolder = 'Input_Working_Raw_Sap_dump'
let clients;
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "creditNoteWorkingLogFile-"
let apiName = '/api/fileProcessController/getCreditNoteWorkingFileFromInputFolderLocal'

let processWorkingFileLocal = require('../scriptProcessing/processWorkingFileLocal')

let getCreditNoteWorking = {}

getCreditNoteWorking.getFileList = () => 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let interuptProcess = await db.getInteruptProcess();
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false);
            }
            logFileName = "creditNoteWorkingLogFile-"
            logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
            clients = await db.getClientsUuid()
            clients = clients.map(client => client.uuid)
            if(clients?.length == 0)
            {
                await uniqueFunction.writeLogIntoFile("Client List is empty", logFileName, "**************", getPath.getName('s3/creditNote/working'), 'red')
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
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", getPath.getName('s3/creditNote/working'), 'red')
            console.log(e)
            return resolve(false)
        }
    })
}

async function getListObjectFromS3Bucket(clientUuids, start, end, res)
{
    try
    {
        let interuptProcess = await db.getInteruptProcess();
        if(interuptProcess[0].isWorking == 0)
        {
            return false;
        }
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
                
                let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Credit Note Working', 'File processing started, No. of files available :' + files.length, clientUuid, new Date())
                return getFileObject(files, 0, files.length, start, end, res)
            }    
            else
            {
                let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Credit Note Working', 'File processing started, No. of files available :' + files.length, clientUuid, new Date())
                

                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailForClient('Process Local File', 'Credit Note Working', 'File Process completed', clientUuid, new Date())
                await uniqueFunction.writeLogIntoFile("Credit Note working local folder is empty", logFileName, "*******************", getPath.getName('s3/creditNote/working'), 'green')
                start++;
                return getListObjectFromS3Bucket(clientUuids, start, end, res)
            } 
        }
        else
        {
            await uniqueFunction.writeLogIntoFile("All clients files passed to process api", logFileName, " ClientUUID : " + clientUuids[start-1], getPath.getName('s3/creditNote/working'), 'green')
           console.log("Process completed successfully")
           return true
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, " ClientUUID : " + clientUuids[start], getPath.getName('s3/creditNote/working'), 'red')
        console.log(e)
        start++;
        return getListObjectFromS3Bucket(clientUuids, start, end, res)
    }
}

async function getFileObject(files, start, end, masterStart, masterEnd, res)
{
    try
    {
        let interuptProcess = await db.getInteruptProcess();
        if(interuptProcess[0].isWorking == 0)
        {
            return false;
        }
        if(start < end)
        { 
            let file = files[start];
            try
            {
                console.log("Getting credit note working file for processing , file :" + (start + 1) + " from " + end)
                await uniqueFunction.writeLogIntoFile("Getting credit note working file for processing , file :" + (start + 1) + " from " + end, logFileName, file.task.Key.split('/').pop(), getPath.getName('sftp/creditNote/working'), 'Purple') 
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
                    await uniqueFunction.writeLogIntoFile("Encryption key not present", logFileName, file?.task.Key, getPath.getName('s3/creditNote/working'), 'red')
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
                        await uniqueFunction.writeLogIntoFile("file decrypted, Calling credit note working script", logFileName, file?.task.Key, getPath.getName('s3/creditNote/working'), 'green')
                        file.file['Body'] = decryptedData?.file
                        console.log("Calling credit note working script", file.task.Key)
                        let isFileSaved = await sendToCNWScript(file)
                        if(isFileSaved)
                        {
                            start++;
                            return getFileObject(files, start, end, masterStart, masterEnd, res);
                        }
                    }
                    else
                    {
                        await uniqueFunction.writeLogIntoFile("file not decrypted", logFileName, file?.task.Key, getPath.getName('s3/creditNote/working'), 'red')
                        start++;
                        return getFileObject(files, start, end, masterStart, masterEnd, res);
                    }                    
                }
            }  
            catch(fileError)
            {
                await uniqueFunction.writeLogIntoFile(fileError?.stack, logFileName, file['task']['Key'], getPath.getName('s3/creditNote/working'), 'red')
                console.error('Error list:', fileError);
                start++;
                return getFileObject(files, start, end, masterStart, masterEnd, res);
            }
        }
        else
        {     
            await uniqueFunction.writeLogIntoFile("File send to API", logFileName, files[start-1]?.task.Key, getPath.getName('s3/creditNote/working'), 'green')
            masterStart++;
            return getListObjectFromS3Bucket(clients, masterStart, masterEnd, res)
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, files[start]?.task.Key, getPath.getName('s3/creditNote/working'), 'red')
        console.log(e)
        start++
        return getFileObject(files, start, end, masterStart, masterEnd, res)
    }
}

async function sendToCNWScript(file) 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let interuptProcess = await db.getInteruptProcess();
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false);
            }
            const fileName = file.file['originalFilename']
            fs.writeFileSync("cron/"+fileName,file.file.Body)
            const stats = fs.statSync("cron/"+fileName); 
            const mimetype = mime.getType("cron/"+fileName);
            let params = {
                uploadWorkingFile : {
                    fieldname: 'upload',
                    originalFilename: fileName,
                    filepath: "cron/"+fileName,
                    size: stats.size,
                    newFilename: path.basename("cron/"+fileName),
                    mimetype: mimetype
                  },
                client : {"uuid": file?.clientUuid},
                inputFolderPath : file.task.Key,
                encriptionKey : file.encriptionKey,
                encriptionIV : file.encriptionIV
            }
            let processFile = await processWorkingFileLocal.getFileList(params.uploadWorkingFile, params.inputFolderPath, params.encriptionIV, params.encriptionKey, params.client)
            uniqueFunction.removeFileFromDirectory("cron/"+fileName)
            return resolve(true)
        }
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, file?.task.Key, getPath.getName('s3/creditNote/working'), 'red')
            console.log(e)
            return resolve(true)
        }
    })
}

module.exports = getCreditNoteWorking
