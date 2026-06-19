let db = require('./dbQueryCronTab')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const Client = require('ssh2-sftp-client');
const sftp = new Client();
const randomKey = require('../authenticate/tokenGenerate')
const baseFolder =  process.env.baseFolder
const getSftpConfig = require('../common/sftpConfig');
const config = getSftpConfig();
let sourceFolder = ['CreditNoteWorking/Promo','CreditNoteWorking/CashDiscount','CreditNoteWorking/GiftVoucher','CreditNoteWorking/Incentive']
let destinationFolder = 'Input_Working_Raw_Sap_dump'
let clientId;
let clientUuid;
let documentAttachments;
let documentCategories;
let documentAttachmentId;
let documentCategoryId;
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "creditNoteWorkingLogFile-"
let apiName = ''
const { getDiskSpaceStatus } = require('../diskSpaceChecker/diskSpaceChecker.js');

module.exports = require('express').Router().get('/',async(req,res) => 
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
        logFileName = "creditNoteWorkingLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        let clients = await db.getClientUuid()
        if(clients?.length == 0)
        {            
            await uniqueFunction.writeLogIntoFile("Client List is empty", logFileName, "**************", getPath.getName('sftp/creditNote/working'), 'red')
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Client Not Exists",
                "status_name" : getCode.getStatus(500)
            });
        }
        clientUuid = clients[0].uuid
        clientId = clients[0].id  

        documentAttachments = await db.getDocumentAttachemnts();
        documentCategories = await db.getDocumentCategories();

        documentAttachmentId = documentAttachments.find(attach => attach.name == 'Working File')
        documentAttachmentId = documentAttachmentId?.id

        documentCategoryId = documentCategories.find(category => category.name == 'Credit Note')
        documentCategoryId = documentCategoryId?.id

        apiName = req.baseUrl

        let getDailyActivityLog = await db.getDailyActivityLog(new Date())
        if(getDailyActivityLog?.length == 0)
        {
            let saveDailyActivityLog = await db.saveDailyActivityLog(new Date())
        }

        await sftp.connect(config).then(async(res1) => 
        { 
            if(sftp.sftp)
            {
                await uniqueFunction.writeLogIntoFile("Sftp connection created", logFileName, "*******************", getPath.getName('sftp/creditNote/working'), 'green')
                getFolderName(sourceFolder, 0, sourceFolder?.length, res)
                // let folderName = sourceFolder
                // let dir = baseFolder + folderName 
                // try
                // {
                //     await sftp.list(dir).then(list => 
                //     {
                //         console.log("list*****************", list?.length, folderName)
                //         let files = []
                //         list.forEach(async(file, index) => 
                //         {
                //             let fileEnd = (file?.name.split('_').pop())?.split('.')[0]
                //             if(file && file?.type == '-' && fileEnd != 'read' && documentAttachments?.length > 0 && documentCategories?.length > 0)
                //             {  
                //                 files.push({"file":file, "fileName" : file?.name, "clientUuid" : clientUuid, "destinationFolder" : destinationFolder, "folderName" : folderName, "sftpPath" : dir + '/', "clientId" : clientId, "documentAttachmentId" : documentAttachmentId, "documentCategoryId" : documentCategoryId, "status" : 'Pending'})
                //             }
                //         })    
                //         if(files?.length > 0)
                //         {
                //             getFileObject(files, 0, files.length)
                //         }   
                //         res?.end()     
                //     }).catch(err => console.log("list Error: ", err)).finally(()=>{
                //         console.log("list Read", folderName)
                //         res?.end()
                //         await sftp?.end()
                //     })
                // }
                // catch (err)
                // {
                //     console.log("12")
                //     console.log("checkFolders list error", err)
                //     res?.end()
                //     await sftp?.end()
                // }
            } 
            else
            {
                console.log("SFTP Connection not created")
                await uniqueFunction.writeLogIntoFile("SFTP Connection not created", logFileName, "*******************", getPath.getName('sftp/creditNote/working'), 'red')
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "SFTP Connection not created",
                    "status_name" : getCode.getStatus(500)
                });
            }              
        })
        .catch(async (err) => {
            await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "*******************", getPath.getName('sftp/creditNote/working'), 'red')
            await sftp?.end()
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "SFTP Connection not created",
                "status_name" : getCode.getStatus(500)
            });
        })
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "*******************", getPath.getName('sftp/creditNote/working'), 'red')
        await sftp?.end()
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500)
        });
    }
})


async function getFolderName(sourceFolders, start, end, res)
{
    try
    {
        if(start < end)
        {
            if(sftp.sftp)
            {
                let folderName = sourceFolders[start]
                let dir = baseFolder + folderName 
                try
                {
                    await sftp.list(dir).then(async(list) => 
                    {
                        console.log("list*****************", list?.length, folderName)
                        let files = []
                        list.forEach(async(file, index) => 
                        {
                            let fileEnd = (file?.name.split('_').pop())?.split('.')[0]
                            if(file && file?.type == '-' && fileEnd != 'read' && documentAttachments?.length > 0 && documentCategories?.length > 0 && file?.size > 0)
                            {  
                                files.push({"file":file, "fileName" : file?.name, "clientUuid" : clientUuid, "destinationFolder" : destinationFolder, "folderName" : folderName, "sftpPath" : dir + '/', "clientId" : clientId, "documentAttachmentId" : documentAttachmentId, "documentCategoryId" : documentCategoryId, "status" : 'Pending'})
                            }
                            else if(file?.type == '-' && fileEnd != 'read' && file?.size == 0)
                            {  
                                await renameFile({"file":file, "fileName" : file?.name, "clientUuid" : clientUuid, "destinationFolder" : destinationFolder, "folderName" : folderName, "sftpPath" : dir + '/', "clientId" : clientId, "documentAttachmentId" : documentAttachmentId, "documentCategoryId" : documentCategoryId, "status" : 'Pending'})
                                
                                await uniqueFunction.writeLogIntoFile("Received Credit Note working from Sftp server with size 0 " + "  *****************   " + JSON.stringify(file) , logFileName, file?.name, getPath.getName('sftp/creditNote/working'), 'red')
                            }
                            // if(file?.name.includes('_read'))
                            // {
                            //     let nameArray = file?.name.split('_read')
                            //     let newFileName = nameArray[0] + nameArray[1]
                            //     await sftp.rename(dir +'/' + file?.name,dir  +'/' + newFileName)
                            // }
                        })   
                        // res.status(200)
                        // return res.json({
                        //     "status_code" : 200,
                        //     "message"     : "success",
                        //     "status_name" : getCode.getStatus(200)
                        // }); 
                        if(files?.length > 0)
                        {
                            await uniqueFunction.writeLogIntoFile("Received Credit Note working Sftp server folder Length is " + files?.length , logFileName, folderName, getPath.getName('sftp/creditNote/working'), 'green')

                            let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('SFTP Sync To Local', 'Credit Note Working ' + folderName, 'File syncing started, No. of files available :' + files.length, '', new Date())

                            getFileObject(files, 0, files.length, start, end, res)
                        } 
                        else
                        {
                            await uniqueFunction.writeLogIntoFile(`Credit Note Working Sftp server folder ${folderName} is empty, List Length : ` + list?.length, logFileName, "*******************", getPath.getName('sftp/creditNote/working'), 'grren')

                            let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('SFTP Sync To Local', 'Credit Note Working ' + folderName, 'File syncing started, No. of files available :' + files.length, '', new Date())

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('SFTP Sync To Local', 'Credit Note Working ' + folderName, 'File Syncing completed', new Date())
                            start++;
                            getFolderName(sourceFolders, start, end, res);                            
                        }      
                    })
                    .catch(async (err) => 
                    {
                        await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "Folder-Name :" + sourceFolders[start] , getPath.getName('sftp/creditNote/working'), 'red')
                        console.log("list Error: ", err)                        
                        start++;
                        getFolderName(sourceFolders, start, end, res);
                    })
                }
                catch (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "Folder-Name :" + sourceFolders[start] , getPath.getName('sftp/creditNote/working'), 'red')
                    console.log("list Error: ", err)  
                    console.log("12")
                    console.log("checkFolders list error", err)
                    start++;
                    getFolderName(sourceFolders, start, end, res);
                }
            } 
            else
            {
                await uniqueFunction.writeLogIntoFile("Sftp connection lost", logFileName, "Folder-Name :" + sourceFolders[start] , getPath.getName('sftp/creditNote/working'), 'red')
                console.log("Sftp connection lost")
                start++;
                getFolderName(sourceFolders, start, end, res);
            }
        }
        else
        {
            await uniqueFunction.writeLogIntoFile("Get Working File Process Completed", logFileName, "**********" , getPath.getName('sftp/creditNote/working'), 'red')
            console.log("Get Working File Process Completed")  
            await sftp?.end();
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(err)
    {
        await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "Folder-Name :" + sourceFolders[start], getPath.getName('sftp/creditNote/working'), 'red')
        console.log(err)
        start++
        getFolderName(sourceFolders, start, end, res)
    }
}


async function getFileObject(files, start, end, masterStart, masterEnd, res)
{
    try
    {
        if(start < end)
        {
            console.log("Coping process started for credit note working files of " + sourceFolder[masterStart] + " folder,  file " + start + " from " + end)
            let file = files[start]
            let identifierName = 'upload_doc_log_master'            
            let id = 0
            await uniqueFunction.writeLogIntoFile("Coping process started for credit note working file " + (start + 1) + " from " + end, logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'Purple') 
            let uniqueCheckName = await uniqueFunction.unquieName(identifierName, ['file_name'],{  "file_name" : file.fileName }, id, 0)
            // if(uniqueCheckName != 0)
            // {
            //     console.log("File already exists")
            //     await uniqueFunction.writeLogIntoFile("File name alrady exist in database", logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'red')
            //     let rename = await renameFile(file)
            //     console.log("rename 1", rename)
            //     if(rename)
            //     {
            //         start++
            //         getFileObject(files, start, end, masterStart, masterEnd, res)
            //     }
            // }
            // else
            // {   
                try
                {
                    if(uniqueCheckName != 0)
                    {
                        file['oldFileName'] = file.fileName                                    
                        let nameArray = file.fileName.split('.')
                        let newFileName = nameArray[0] + '_' + randomKey(5) + '.' + nameArray[1]
                        file['newFileName'] = newFileName
                        await uniqueFunction.writeLogIntoFile(`The file name already exists. Therefore, this file is being renamed to '${newFileName}'.`, logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'Tomato') 
                    }
                    if(!sftp.sftp)
                    { 
                        await sftp.connect(config).then(async(res1) => 
                        {                   
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
                                    await uniqueFunction.writeLogIntoFile("File uploaded and database log updatd", logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'green')
                                    let rename = await renameFile(file)
                                    console.log("rename 1", rename)
                                    if(rename)
                                    {
                                        start++
                                        getFileObject(files, start, end, masterStart, masterEnd, res)
                                    }
                                }
                                else
                                {
                                    console.log("File Not Uploaded")
                                    await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'red')
                                    start++
                                    getFileObject(files, start, end, masterStart, masterEnd, res)
                                }
                            }
                            else
                            {
                                console.log("file encryption error")
                                await uniqueFunction.writeLogIntoFile("File not encrypted error : " + JSON.stringify(encryptedData?.error), logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'red')
                                start++
                                getFileObject(files, start, end, masterStart, masterEnd, res)
                                
                            }                                         
                        })
                        .catch(async (err) => {
                            await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'red')
                            start++
                            getFileObject(files, start, end, masterStart, masterEnd, res)
                        })
                    }
                    else
                    {
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
                                await uniqueFunction.writeLogIntoFile("File uploaded and database log updatd", logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'green')
                                let rename = await renameFile(file)
                                console.log("rename 1", rename)
                                if(rename)
                                {
                                    start++
                                    getFileObject(files, start, end, masterStart, masterEnd, res)
                                }
                            }
                            else
                            {
                                await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'red')
                                start++
                                getFileObject(files, start, end, masterStart, masterEnd, res)
                            } 
                        }
                        else
                        {
                            console.log("file encryption error")
                            await uniqueFunction.writeLogIntoFile("File encryption error : " + JSON.stringify(encryptedData?.error), logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'red')
                            start++
                            getFileObject(files, start, end, masterStart, masterEnd, res)
                        } 
                    }
                }
                catch(sftpError)
                {
                    await uniqueFunction.writeLogIntoFile(sftpError?.stack, logFileName, files[start].fileName, getPath.getName('sftp/creditNote/working'), 'red')
                    console.log("sftpError",sftpError)
                    start++
                    getFileObject(files, start, end, masterStart, masterEnd, res)
                }
            // } 
        }
        else
        {       
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('SFTP Sync To Local', 'Credit Note Working ' + sourceFolder[masterStart], 'File Syncing completed', new Date())     
            masterStart++;
            getFolderName(sourceFolder, start, end, res);  
        }
    }
    catch(e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, files[start].fileName, getPath.getName('sftp/creditNote/working'), 'red')
        start++
        getFileObject(files, start, end, masterStart, masterEnd, res)
    }
}

async function renameFile(file)
{
    return new Promise(async(resolve, reject) => 
    {
        if(file.fileName.includes('_read'))
        {
            return resolve(true)
        }
        if(sftp?.sftp)
        {
            let nameArray = file.fileName.split('.')
            let newFileName = nameArray[0] + '_read.' + nameArray[1]
            try
            {
                let rename = await sftp.rename(file.sftpPath + file.fileName,file.sftpPath + newFileName)
                await uniqueFunction.writeLogIntoFile(`*************File Renamed (${file.fileName} to ${newFileName}) *******`, logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'green')
                return resolve(true)
            }
            catch(rnameErr)
            {
                await uniqueFunction.writeLogIntoFile(rnameErr?.stack, logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'red')
                console.log("Error renaming",rnameErr)
                return resolve(true)
            }
        }
        else
        {
            await uniqueFunction.writeLogIntoFile("Sftp connection lost file rename failed", logFileName, file.fileName, getPath.getName('sftp/creditNote/working'), 'red')
            return resolve(true)
        }
    })
}
