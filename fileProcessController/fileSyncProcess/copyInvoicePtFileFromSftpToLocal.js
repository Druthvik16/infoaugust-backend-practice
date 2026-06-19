let db = require('../dbQueryProcessController')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
const uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction');
const Client = require('ssh2-sftp-client');
const sftp = new Client();
let fs = require('fs');
let apiUrl = require('../../apiUrl')
let api = new apiUrl()
let axios = require('axios')
const randomKey = require('../../authenticate/tokenGenerate')
const baseFolder =  process.env.baseFolder
const getSftpConfig = require('../../common/sftpConfig');
const config = getSftpConfig();
//const config = {
  //  host: process.env.sftpHost,
 //   port: process.env.sftpPort,
 //   username: process.env.sftpUserName,
  //  password: process.env.sftpPassword,
  //  algorithms: JSON.parse(process.env.sftpAlgorithms)
//};

/////// for qa and dev
// const config = {
//     host: process.env.sftpHost,
//     port: process.env.sftpPort,
//     username: 'ubuntu',
//    privateKey: fs.readFileSync('./infomap-tgbl-new-qa.pem')
// };
let sourceFolder = 'PTFile'
let destinationFolder = 'Input_Invoice_Pt_File_Raw_Sap_dump'
let clientId;
let clientUuid;
let documentAttachments;
let documentCategories;
let documentAttachmentId;
let documentCategoryId;
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "invoicePtLogFile-"
let apiName = '/api/fileProcessController/copyInvoicePtFileFromSftpToLocal'

let copyInvoicePT = {}

copyInvoicePT.getFileList = (readType) => 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let interuptProcess = await db.getInteruptProcess();
            if(interuptProcess[0].isWorking == 0)
            {
                await sftp?.end()
                return resolve(false);
            }
            logFileName = "invoicePtLogFile-"
            logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
            let clients = await db.getClientUuid()
            if(clients?.length == 0)
            {
                await uniqueFunction.writeLogIntoFile("Client List is empty", logFileName, "**************", getPath.getName('sftp/invoice/pt'), 'red')
                return resolve(false)
            }
            clientUuid = clients[0].uuid
            clientId = clients[0].id  
    
            documentAttachments = await db.getDocumentAttachemnts();
            documentCategories = await db.getDocumentCategories();
    
            documentAttachmentId = documentAttachments.find(attach => attach.name == 'PT File')
            documentAttachmentId = documentAttachmentId?.id
    
            documentCategoryId = documentCategories.find(category => category.name == 'Invoice')
            documentCategoryId = documentCategoryId?.id
    
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            if(getDailyActivityLog?.length == 0)
            {
                let saveDailyActivityLog = await db.saveDailyActivityLog(new Date())
            }
    
            await sftp.connect(config).then(async(res1) => 
            { 
                if(sftp.sftp)
                {
                    let folderName = sourceFolder
                    let dir = baseFolder + folderName 
                    try
                    {
                        await sftp.list(dir).then(async(list) => 
                        {
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
                                        
                                        await uniqueFunction.writeLogIntoFile("Received Invoice PT from Sftp server with size 0 " + "  ***************** dir :  " + JSON.stringify(file) , logFileName, file?.name, getPath.getName('sftp/invoice/pt'), 'red')
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
                                        
                                        await uniqueFunction.writeLogIntoFile("Received Invoice PT from Sftp server with size 0 " + "  ***************** dir :  " + JSON.stringify(file) , logFileName, file?.name, getPath.getName('sftp/invoice/pt'), 'red')
                                    }
                                }
                            })    
                            if(files?.length > 0)
                            {
                                await uniqueFunction.writeLogIntoFile("Received Invoice PT from Sftp server folder, Length is " + files?.length , logFileName, folderName, getPath.getName('sftp/invoice/pt'), 'green')
    
                                let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('SFTP Sync To Local', 'Invoice PT', 'File syncing started, No. of files available :' + files.length, '', new Date())
    
                                return resolve(getFileObject(files, 0, files.length, ''))
                            }
                            else
                            {
                                await uniqueFunction.writeLogIntoFile("Invoice PT Sftp server folder is empty, List Length : " + list?.length, logFileName, folderName, getPath.getName('sftp/invoice/pt'), 'green')
                                await sftp?.end()
    
                                let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('SFTP Sync To Local', 'Invoice PT', 'File syncing started, No. of files available :' + files.length, '', new Date())
    
                                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('SFTP Sync To Local', 'Invoice PT', 'File Syncing completed', new Date())
                                return resolve(true)
                            }        
                        })
                        .catch(async(err) => 
                        {
                            console.log("list Error: ", err)
                        
                            await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, folderName, getPath.getName('sftp/invoice/pt'), 'red')
                            await sftp?.end()
                            return resolve(false)
                        })
                    }
                    catch (err)
                    {
                        await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, folderName, getPath.getName('sftp/invoice/pt'), 'red')
                        console.log("checkFolders list error", err)
                        await sftp?.end()
                        return resolve(false)
                    }
                } 
                else
                {
                    await uniqueFunction.writeLogIntoFile("Sftp connection not created", logFileName, "*******************", getPath.getName('sftp/invoice/pt'), 'red')
                    return resolve(false)
                }              
            }).catch(async (err) => {
                await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "*******************", getPath.getName('sftp/invoice/pt'), 'red')
                let result = await connectSFTP(1)
                if(!result)
                {
                    return resolve(false);
                }
                return copyInvoicePT.getFileList(readType)
            })
        }
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "*******************", getPath.getName('sftp/invoice/pt'), 'red')
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
        let interuptProcess = await db.getInteruptProcess();
        if(interuptProcess[0].isWorking == 0)
        {
            await sftp?.end()
            return false;
        }
        if(start < end)
        {
            console.log("Coping process started for Invoice PT file " + start + " from " + end)
            let file = files[start]
            await uniqueFunction.writeLogIntoFile("Coping process started for invoice pt file " + (start + 1) + " from " + end, logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'Purple')
            let identifierName = 'upload_doc_log_master'            
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
                        await uniqueFunction.writeLogIntoFile(`The file name already exists. Therefore, this file is being renamed to '${newFileName}'.`, logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'Tomato') 
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
                    await uniqueFunction.writeLogIntoFile(sftpError?.stack, logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'red')
                    console.log("sftpError",sftpError)
                    start++
                    return  getFileObject(files, start, end, res)
                }
        }
        else
        {
            console.log("Invoice PT File Copied")
            await uniqueFunction.writeLogIntoFile("Invoice PT File Copied", logFileName, files[start-1].fileName, getPath.getName('sftp/invoice/pt'), 'green')
            // await sftp?.end()
            console.log("Invoice PT Process Completed")
            await sftp?.end()

            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('SFTP Sync To Local', 'Invoice PT', 'File Syncing completed', new Date())
            return true
        }
    }
    catch(e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, files[start].fileName, getPath.getName('sftp/invoice/pt'), 'red')
        start++
        return  getFileObject(files, start, end, res)
    }
}


async function getFileFromSftp(file, start, end, res, uniqueCheckName)
{
    try
    {
        let interuptProcess = await db.getInteruptProcess();
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
            let uploadFiles = await uniqueFunction.singleFileUpload(sourceFileContents, getPath.getName('documentFolders'), file.fileName, (file.clientUuid + '/' + file.destinationFolder))
            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', file?.file.size, apiName, 'LOC', new Date(), file.clientUuid, file?.fileName)
            console.log("File uploaded :", uploadFiles)         
            if(uploadFiles && uploadFiles.result == true)
            {
                let saveLog = await db.saveUploadDocLogMasterLocal(file.fileName, file.clientId, file.documentAttachmentId, file.status, new Date(), uploadFiles.localFilePath,file.documentCategoryId, encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                await uniqueFunction.writeLogIntoFile("File uploaded and database log updatd", logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'green')
                console.log("remane1")
                let rename = await renameFile(file)
                if(rename)
                {
                    return  true;
                }
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'red')
                return  true;
            } 
        }
        else
        {
            console.log("file encryption error")
            await uniqueFunction.writeLogIntoFile("File encryption error : " + JSON.stringify(encryptedData?.error), logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'red')
            return  true;
        } 
    }
    catch(e)
    {
        let interuptProcess = await db.getInteruptProcess();
        if(interuptProcess[0].isWorking == 0)
        {
            await sftp?.end()
            return false;
        }
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'red')
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
            let interuptProcess = await db.getInteruptProcess();
            if(interuptProcess[0].isWorking == 0)
            {
                return false;
            }
            console.log(`SFTP Connection Error: ${error?.message}`);
            await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, "*********", getPath.getName('sftp/invoice/pt'), 'red')
            await sleep(10000);  // Sleep for 10 second
            return connectSFTP(count)
        }
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function renameFile(file)
{
    return  new Promise(async(resolve, reject) => 
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
                await uniqueFunction.writeLogIntoFile(`*************File Renamed (${file.fileName} to ${newFileName}) *******`, logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'green')
                return resolve(true)
            }
            catch(rnameErr)
            {
                await uniqueFunction.writeLogIntoFile(rnameErr?.stack, logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'red')
                console.log("Error renaming",rnameErr)
                return resolve(true)
            }
        }
        else
        {
            await uniqueFunction.writeLogIntoFile("Sftp connection lost file rename failed", logFileName, file.fileName, getPath.getName('sftp/invoice/pt'), 'red')
            return resolve(true)
        }
    })
}


module.exports = copyInvoicePT

