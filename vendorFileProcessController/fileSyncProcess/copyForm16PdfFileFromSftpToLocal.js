let db = require('../dbQueryProcessController')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
const uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction');
const Client = require('ssh2-sftp-client');
const sftp = new Client();
const randomKey = require('../../authenticate/tokenGenerate')
const baseFolder =  process.env.baseFolder
let config = ''
let sourceFolder = 'vendorDocs/Form16APDF'
let destinationFolder = 'Input_form16_Pdfs_Raw_Sap_dump'
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "form16PdfLogFile-"
let apiName = '/api/vendorFileProcessController/copyForm16PdfFileFromSftpToLocal'
const logFilePath = getPath.getName('vendor/sftp/form16/pdf')
const vendorModuleClientPath = '/' + uniqueFunction.vendorModule + 'client'
let clientID;

let copyForm16Pdf = {}

copyForm16Pdf.getFileList = (readType, client) => 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            logFileName = "form16PdfLogFile-"
            logFileName = logFileName + new Date().toISOString().slice(0, 10)
            const clientUuid = client.uuid
            const clientId = client.id  
            let interuptProcess = await db.getInteruptProcess(clientId);
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false)
            }

            config = {
                host: client.host,
                port: client.port,
                username: client.username,
                password: client.password,
                algorithms: JSON.parse(client.algorithms)
            };
            
            const baseFolder =  client.baseFolder
    
            const documentAttachments = await db.getDocumentAttachemnts();
            const documentCategories = await db.getDocumentCategories();
    
            let documentAttachmentId = documentAttachments.find(attach => attach.name == 'Pdf')
            documentAttachmentId = documentAttachmentId?.id
    
            let documentCategoryId = documentCategories.find(category => category.name == 'Form16A')
            documentCategoryId = documentCategoryId?.id
    
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            if(getDailyActivityLog?.length == 0)
            {
                let saveDailyActivityLog = await db.saveDailyActivityLog(new Date())
            }
            let result = await connectSFTP(1)
            if(!result)
            {
                await uniqueFunction.writeLogIntoFile("Sftp connection not created", logFileName, "*******************", logFilePath, 'red')
                return resolve(false);
            }   
            let folderName = sourceFolder
            let dir = baseFolder + folderName 
            try
            {
                let list = await sftp.list(dir)
                console.log("list*****************", list?.length, folderName)
                let files = []
                list.forEach(async(file, index) => 
                {
                    if(readType == 0)
                    {
                        let fileEnd = (file?.name.split('_').pop())?.split('.')[0]
                        if(file && file?.type == '-' && fileEnd != 'read' && documentAttachments?.length > 0 && documentCategories?.length > 0 && file?.size > 0)
                        {  
                            files.push({"file":file, "fileName" : file?.name, "clientUuid" : clientUuid, "destinationFolder" : destinationFolder, "folderName" : folderName, "sftpPath" : dir + '/', "clientId" : clientId, "documentAttachmentId" : documentAttachmentId, "documentCategoryId" : documentCategoryId, "status" : 'Pending'})
                        }
                        else if(file?.type == '-' && fileEnd != 'read' && file?.size == 0)
                        {  
                            await renameFile({"file":file, "fileName" : file?.name, "clientUuid" : clientUuid, "destinationFolder" : destinationFolder, "folderName" : folderName, "sftpPath" : dir + '/', "clientId" : clientId, "documentAttachmentId" : documentAttachmentId, "documentCategoryId" : documentCategoryId, "status" : 'Pending'})
                            
                            await uniqueFunction.writeLogIntoFile("Received Form16A Pdf from Sftp server with size 0 " + "  *****************   " + JSON.stringify(file) , logFileName, file?.name, logFilePath, 'red')
                        }
                    }
                    else
                    {
                        let fileEnd = (file?.name.split('_').pop())?.split('.')[0]
                        if(file && file?.type == '-' && documentAttachments?.length > 0 && documentCategories?.length > 0 && file?.size > 0)
                        {  
                            files.push({"file":file, "fileName" : file?.name, "clientUuid" : clientUuid, "destinationFolder" : destinationFolder, "folderName" : folderName, "sftpPath" : dir + '/', "clientId" : clientId, "documentAttachmentId" : documentAttachmentId, "documentCategoryId" : documentCategoryId, "status" : 'Pending'})
                        }
                        else if(file?.type == '-' && file?.size == 0)
                        {  
                            await renameFile({"file":file, "fileName" : file?.name, "clientUuid" : clientUuid, "destinationFolder" : destinationFolder, "folderName" : folderName, "sftpPath" : dir + '/', "clientId" : clientId, "documentAttachmentId" : documentAttachmentId, "documentCategoryId" : documentCategoryId, "status" : 'Pending'})
                            
                            await uniqueFunction.writeLogIntoFile("Received Form16A Pdf from Sftp server with size 0 " + "  *****************   " + JSON.stringify(file) , logFileName, file?.name, logFilePath, 'red')
                        }
                    }
                })  
                if(files?.length > 0)
                {
                    await uniqueFunction.writeLogIntoFile("Received Form16A Pdf Sftp server folder Length is " + files?.length , logFileName, folderName, logFilePath, 'green')

                    let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('SFTP Sync To Local', 'Form16A PDF', 'File syncing started, No. of files available :' + files.length, '', new Date())
                    
                    return resolve(getFileObject(files, 0, files.length, ''))
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Form16A Pdf Sftp server folder is empty, List Length : " + list?.length, logFileName, folderName, logFilePath, 'green')


                    let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('SFTP Sync To Local', 'Form16A PDF', 'File syncing started, No. of files available :' + files.length, '', new Date())                  
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('SFTP Sync To Local', 'Form16A PDF', 'File Syncing completed', new Date())
                    await sftp?.end()
                    return resolve(true)
                }   
            }
            catch (err)
            {
                await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, folderName, logFilePath, 'red')
                console.log("checkFolders list error", err)
                await sftp?.end()
                return resolve(false)
            }
        }
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "*******************", logFilePath, 'red')
            console.log(e)
            await sftp?.end()
            return resolve(false)
        }
    })
}

async function getFileObject(files, start, end, res)
{
    try
    {
        
        let interuptProcess = await db.getInteruptProcess(clientID);
        if(interuptProcess[0].isWorking == 0)
        {
            await sftp?.end()
            return false;
        }
        if(start < end)
        {
            console.log("Coping process started for from 16 pdf file " + start + " from " + end)
            let file = files[start]
            await uniqueFunction.writeLogIntoFile("Coping process started for from 16 pdf file " + (start + 1) + " from " + end, logFileName, file.fileName, logFilePath, 'Purple')
            let identifierName = 'client_vendor_upload_doc_log_master'            
            let id = 0
            let uniqueCheckName = await uniqueFunction.unquieName(identifierName, ['file_name'],{  "file_name" : file.fileName }, id, 0)
                try
                {
                    if(uniqueCheckName != 0)
                    {
                        file['oldFileName'] = file.fileName                                    
                        let nameArray = file.fileName.split('.')
                        file['randomKey'] = randomKey(5)
                        let newFileName = nameArray[0] + '_' + file['randomKey'] + '.' + nameArray[1]
                        file['newFileName'] = newFileName
                        await uniqueFunction.writeLogIntoFile(`The file name already exists. Therefore, this file is being renamed to '${newFileName}'.`, logFileName, file.fileName, logFilePath, 'Tomato') 
                    }
                    let fileSaved = await getFileFromSftp(file, start, end, res, uniqueCheckName)
                    if(!fileSaved)
                    {
                        return false;
                    }
                    console.log("fileSaved", fileSaved)
                    start++
                    return  getFileObject(files, start, end, res)
                }
                catch(sftpError)
                {
                    console.log("sftpError :", sftpError)
                    await uniqueFunction.writeLogIntoFile(sftpError?.stack, logFileName, file.fileName, logFilePath, 'red')
                    console.log("sftpError",sftpError)
                    start++
                    return  getFileObject(files, start, end, res)
                }
        }
        else
        {
            console.log("Form16A Pdf File Copied")
            await uniqueFunction.writeLogIntoFile("Form16A Pdf File Copied", logFileName, files[start-1].fileName, logFilePath, 'green')
            console.log("Form16A Pdf Process Completed")
            await sftp?.end()            
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('SFTP Sync To Local', 'Form16A PDF', 'File Syncing completed', new Date())
            await sftp?.end()
            return true;
        }
    }
    catch(e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, files[start].fileName, logFilePath, 'red')
        start++
        return  getFileObject(files, start, end, res)
    }
}

async function getFileFromSftp(file, start, end, res, uniqueCheckName)
{
    try
    {
        
        let interuptProcess = await db.getInteruptProcess(clientID);
        if(interuptProcess[0].isWorking == 0)
        {
            await sftp?.end()
            return false;
        }
        let sourceFileContents = await sftp.get(file.sftpPath + file.fileName) 
        if(uniqueCheckName != 0)
        {
            file.fileName = file['newFileName']
        }
        let saveDataTransactLog = await db.saveDataTransactLog('DN', 'SU', '', '', file?.file.size, apiName, 'SFTP', new Date(), file.clientUuid, file?.fileName)
        let encryptedData = await uniqueFunction.encryptFileBuffer(sourceFileContents, file.fileName, null,null, 'buffer')
        if(encryptedData?.result)
        {
            sourceFileContents = encryptedData?.file
            let uploadFiles = await uniqueFunction.singleFileUpload(sourceFileContents, getPath.getName('documentFolders') + vendorModuleClientPath, file.fileName, (file.clientUuid + '/' + file.destinationFolder))
            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', file?.file.size, apiName, 'LOC', new Date(), file.clientUuid, file?.fileName)
            console.log("File uploaded :", uploadFiles)         
            if(uploadFiles && uploadFiles.result == true)
            {
                let saveLog = await db.saveUploadDocLogMasterLocal(file.fileName, file.clientId, file.documentAttachmentId, file.status, new Date(), uploadFiles.localFilePath,file.documentCategoryId, encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                await uniqueFunction.writeLogIntoFile("File uploaded and database log updatd", logFileName, file.fileName, logFilePath, 'green')
                console.log("remane1")
                let rename = await renameFile(file)
                if(rename)
                {
                    return  true;
                }
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, file.fileName, logFilePath, 'red')
                return  true;
            } 
        }
        else
        {
            console.log("file encryption error")
            await uniqueFunction.writeLogIntoFile("File encryption error : " + JSON.stringify(encryptedData?.error), logFileName, file.fileName, logFilePath, 'red')
            return  true;
        } 
    }
    catch(e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, file.fileName, logFilePath, 'red')
        let result = await connectSFTP(1)
        if(!result)
        {
            return false;
        }
        return getFileFromSftp(file, start, end, res, uniqueCheckName)
    }
}

const connectSFTP = async (count) => 
{
    try 
    {
        if (!sftp.sftp) 
        {
            await sftp.connect(config);
            return true;
        }
        else
        {
            return true;
        }
    } 
    catch (error) 
    {
        count++;
        if(count >= 10)
        {
            return false;
        }
        else
        {
            await sftp?.end()
        
            let interuptProcess = await db.getInteruptProcess(clientID);
            if(interuptProcess[0].isWorking == 0)
            {
                return false;
            }
            await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, "*********", logFilePath, 'red')
            await sleep(10000);  // Sleep for 10 second
            return connectSFTP(count)
        }
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function renameFile(file)
{
    return new Promise(async(resolve, reject) => 
    {     
        if(file?.fileName && file?.fileName?.includes('_read'))
        {
            return resolve(true)
        }
        else if(file?.oldFileName && file?.oldFileName?.includes('_read'))
        {
            return resolve(true)
        }
        else if(file?.newFileName)
        {
            file.fileName = file?.oldFileName
        }
        if(sftp?.sftp)
        {
            let nameArray = file.fileName.split('.')
            let newFileName = ''
            if(file?.newFileName)
            {
                newFileName = nameArray[0] + '_' + file?.randomKey + '_read.' + nameArray[1]
            }
            else
            {
                newFileName = nameArray[0] + '_read.' + nameArray[1]
            }
            try
            {
               let rename = await sftp.rename(file.sftpPath + file.fileName,file.sftpPath + newFileName)
               await uniqueFunction.writeLogIntoFile(`*************File Renamed (${file.fileName} to ${newFileName}) *******`, logFileName, file.fileName, logFilePath, 'green')
               return resolve(true)
            }
            catch(rnameErr)
            {
                await uniqueFunction.writeLogIntoFile(rnameErr?.stack, logFileName, file.fileName, logFilePath, 'red')
                console.log("Error renaming",rnameErr)
                return resolve(true)
            }
        }
        else
        {
            await uniqueFunction.writeLogIntoFile("Sftp connection lost file rename failed", logFileName, file.fileName, logFilePath, 'red')
            return resolve(true)
        }
    })
}

module.exports = copyForm16Pdf