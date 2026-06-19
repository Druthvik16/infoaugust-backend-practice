let db = require('./dbQueryCronTab')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const Client = require('ssh2-sftp-client');
let fs = require('fs');
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let axios = require('axios')
const sftp = new Client();
const randomKey = require('../authenticate/tokenGenerate')
let baseFolder =  process.env.baseFolder
const getSftpConfig = require('../common/sftpConfig');
const config = getSftpConfig();
let sourceFolder = 'CreditNoteSummary'
let destinationFolder = 'Input_Summary_Raw_Sap_dump'
let clientId;
let clientUuid;
let documentAttachments;
let documentCategories;
let documentAttachmentId;
let documentCategoryId;
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "creditNoteSummaryLogFile-"
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
        logFileName = "creditNoteSummaryLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        let clients = await db.getClientUuid()
        if(clients?.length == 0)
        {
            await uniqueFunction.writeLogIntoFile("Client List is empty", logFileName, "**************", getPath.getName('sftp/creditNote/summary'), 'red')
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

        documentAttachmentId = documentAttachments.find(attach => attach.name == 'Summary')
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
                let folderName = sourceFolder
                let dir = baseFolder + folderName 
                console.log(dir)
                try
                {
                    await sftp.list(dir).then(async(list) => 
                    {
                        console.log("list*****************", list?.length, folderName, list)
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
                                
                                await uniqueFunction.writeLogIntoFile("Received Credit Note summary from Sftp server with size 0 " + "  *****************   " + JSON.stringify(file) , logFileName, file?.name, getPath.getName('sftp/creditNote/summary'), 'red')
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
                            await uniqueFunction.writeLogIntoFile("Received Credit Note summary Sftp server folder Length is " + files?.length , logFileName, folderName, getPath.getName('sftp/creditNote/summary'), 'green')

                            
                            let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('SFTP Sync To Local', 'Credit Note Summary', 'File syncing started, No. of files available :' + files.length, '', new Date())

                            getFileObject(files, 0, files.length, res)
                        }
                        else
                        {
                            await uniqueFunction.writeLogIntoFile("Credit Note Summary Sftp server folder is empty, List Length : " + list?.length, logFileName, folderName, getPath.getName('sftp/creditNote/summary'), 'green')
                            let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('SFTP Sync To Local', 'Credit Note Summary', 'File syncing started, No. of files available :' + files.length, '', new Date())

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('SFTP Sync To Local', 'Credit Note Summary', 'File Syncing completed', new Date())
                            await sftp?.end()
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message"     : "success",
                                "status_name" : getCode.getStatus(200)
                            });
                        }       
                    })
                    .catch(async(err) => 
                    {
                        console.log("list Error: ", err)
                    
                        await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, folderName, getPath.getName('sftp/creditNote/summary'), 'red')
                        await sftp?.end()
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message"     : "List Error",
                            "status_name" : getCode.getStatus(500)
                        });
                    })
                }
                catch (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, folderName, getPath.getName('sftp/creditNote/summary'), 'red')
                    console.log("checkFolders list error", err)
                    await sftp?.end()
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message"     : "Sftp connection not created",
                        "status_name" : getCode.getStatus(500)
                    });
                }
            } 
            else
            {
                await uniqueFunction.writeLogIntoFile("Sftp connection not created", logFileName, "*******************", getPath.getName('sftp/creditNote/summary'), 'red')
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Sftp connection not created",
                    "status_name" : getCode.getStatus(500)
                });
            }              
        }).catch(async (err) => {
            await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "*******************", getPath.getName('sftp/creditNote/summary'), 'red')
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Error",
                "status_name" : getCode.getStatus(500)
            });
        })
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "*******************", getPath.getName('sftp/creditNote/summary'), 'red')
        console.log(e)
        await sftp?.end()
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500)
        });
    }
})


async function getFileObject(files, start, end, res)
{
    try
    {
        if(start < end)
        {
            console.log("Coping process started for credit note summary file " + (start + 1) + " from " + end)
            let file = files[start]
            let identifierName = 'upload_doc_log_master'            
            let id = 0
            await uniqueFunction.writeLogIntoFile("Coping process started for credit note summary file " + (start + 1) + " from " + end, logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'Purple') 
            let uniqueCheckName = await uniqueFunction.unquieName(identifierName, ['file_name'],{  "file_name" : file.fileName }, id, 0)
            console.log(uniqueCheckName, file)
            // if(uniqueCheckName != 0)
            // {
            //     console.log("File already exists")
            //     await uniqueFunction.writeLogIntoFile("File name alrady exist in database", logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
            //     let rename = await renameFile(file)
            //     if(rename)
            //     {
            //         start++
            //         getFileObject(files, start, end, res)
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
                        await uniqueFunction.writeLogIntoFile(`The file name already exists. Therefore, this file is being renamed to '${newFileName}'.`, logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'Tomato') 
                    }
                    if(!sftp?.sftp)
                    { 
                        console.log("called false")
                        await sftp.connect(config).then(async(res1) => 
                        {    
                            console.log("called then")               
                            let sourceFileContents = await sftp.get(file.sftpPath + file.fileName)
                            if(uniqueCheckName != 0)
                            {
                                file.fileName = file['newFileName']
                            }
                            console.log("mail called")
                            let mailFile = await mailFiles(file, sourceFileContents)
                            console.log("mail res", mailFile)
                            let saveDataTransactLog = await db.saveDataTransactLog('DN', 'SU', '', '', file?.file.size, apiName, 'SFTP', new Date(), file.clientUuid, file?.fileName)
                            let rename = await renameFile(file)
                        console.log("rename 3", rename)
                            if(rename)
                            {
                                start++
                                getFileObject(files, start, end, res)
                            }
                            
                            // // fs.writeFileSync('cron/'+ file.fileName, sourceFileContents)
                            // let encryptedData = await uniqueFunction.encryptFileBuffer(sourceFileContents, file.fileName, null,null, 'buffer')
                            // if(encryptedData?.result)
                            // {
                            //     sourceFileContents = encryptedData?.file
                            //     let uploadFiles = await uniqueFunction.singleFileUpload(sourceFileContents, getPath.getName('documentFolders'), file.fileName, (file.clientUuid + '/' + file.destinationFolder))
                            //     let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', file?.file.size, apiName, 'LOC', new Date(), file.clientUuid, file?.fileName)
                            //     if(uploadFiles && uploadFiles.result == true)
                            //     {
                            //         let saveLog = await db.saveUploadDocLogMasterLocal(file.fileName, file.clientId, file.documentAttachmentId, file.status, new Date(), uploadFiles.localFilePath,file.documentCategoryId, encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                            //         await uniqueFunction.writeLogIntoFile("File uploaded and database log updatd", logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'green')
                            //         let rename = await renameFile(file)
                            //     console.log("rename 3", rename)
                            //         if(rename)
                            //         {
                            //             start++
                            //             getFileObject(files, start, end, res)
                            //         }
                            //     }
                            //     else
                            //     {
                            //         console.log("File Not Uploaded")
                            //         await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                            //         start++
                            //         getFileObject(files, start, end, res)
                            //     }
                            // }
                            // else
                            // {
                            //     console.log("file encryption error")
                            //     await uniqueFunction.writeLogIntoFile("File not encrypted error : " + JSON.stringify(encryptedData?.error), logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                            //     start++
                            //     getFileObject(files, start, end, res)
                            // }                                         
                        })
                        .catch(async (err) => {
                            console.log(err?.stack, err?.toString())
                            await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                            start++
                            getFileObject(files, start, end, res)
                        })
                    }
                    else
                    {
                        // console.log("File ", !sftp?.sftp)
                        // console.log("true Called", file)
                        let sourceFileContents = await sftp.get(file.sftpPath + file.fileName)
                        if(uniqueCheckName != 0)
                        {
                            file.fileName = file['newFileName']
                        }
                        console.log("mail called2")
                        let mailFile = await mailFiles(file, sourceFileContents)
                        console.log("mail res2", mailFile)
                        let saveDataTransactLog = await db.saveDataTransactLog('DN', 'SU', '', '', file?.file.size, apiName, 'SFTP', new Date(), file.clientUuid, file?.fileName)
                        console.log("sourceFileContents", sourceFileContents)
                        let rename = await renameFile(file)
                    console.log("rename 3", rename)
                        if(rename)
                        {
                            start++
                            getFileObject(files, start, end, res)
                        }
                        // // fs.writeFileSync('cron/'+ file.fileName, sourceFileContents)
                        // let encryptedData = await uniqueFunction.encryptFileBuffer(sourceFileContents, file.fileName, null,null, 'buffer')
                        // console.log("encryptedData",encryptedData)
                        // if(encryptedData?.result)
                        // {
                        //     sourceFileContents = encryptedData?.file
                        //     let uploadFiles = await uniqueFunction.singleFileUpload(sourceFileContents, getPath.getName('documentFolders'), file.fileName, (file.clientUuid + '/' + file.destinationFolder))
                        //     let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', file?.file.size, apiName, 'LOC', new Date(), file.clientUuid, file?.fileName)
                        //     console.log("File uploaded :", uploadFiles)         
                        //     if(uploadFiles && uploadFiles.result == true)
                        //     {
                        //         let saveLog = await db.saveUploadDocLogMasterLocal(file.fileName, file.clientId, file.documentAttachmentId, file.status, new Date(), uploadFiles.localFilePath,file.documentCategoryId, encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                        //         await uniqueFunction.writeLogIntoFile("File uploaded and database log updatd", logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'green')
                        //         console.log(file)
                        //         let rename = await renameFile(file)
                        //         console.log("rename 1", rename)
                        //         if(rename)
                        //         {
                        //             start++
                        //             getFileObject(files, start, end, res)
                        //         }
                        //     }
                        //     else
                        //     {
                        //         await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                        //         start++
                        //         getFileObject(files, start, end, res)
                        //     } 
                        // }
                        // else
                        // {
                        //     console.log("file encryption error")
                        //     await uniqueFunction.writeLogIntoFile("File encryption error : " + JSON.stringify(encryptedData?.error) + "___________________________________________________" + JSON.stringify(sourceFileContents), logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                        //     start++
                        //     getFileObject(files, start, end, res)
                        // } 
                    }
                }
                catch(sftpError)
                {
                    console.log("sftpError :", sftpError)
                    await uniqueFunction.writeLogIntoFile(sftpError?.stack, logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                    console.log("sftpError",sftpError)
                    start++
                    getFileObject(files, start, end, res)
                }
            // } 
        }
        else
        {
            console.log("Credit Note Summary File Copied")
            await uniqueFunction.writeLogIntoFile("Credit Note Summary File Copied", logFileName, files[start-1].fileName, getPath.getName('sftp/creditNote/summary'), 'green')
            console.log("Credit Note Summary Process Completed")

            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('SFTP Sync To Local', 'Credit Note Summary', 'File Syncing completed', new Date())
            await sftp?.end()
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
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, files[start].fileName, getPath.getName('sftp/creditNote/summary'), 'red')
        start++
        getFileObject(files, start, end, res)
    }
}

async function renameFile(file)
{
    return new Promise(async(resolve, reject) => {
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
                console.log(file.sftpPath + file.fileName,file.sftpPath + newFileName)
                let rename = await sftp.rename(file.sftpPath + file.fileName,file.sftpPath + newFileName)
                await uniqueFunction.writeLogIntoFile(`*************File Renamed (${file.fileName} to ${newFileName}) *******`, logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'green')
                return resolve(true)
            }
            catch(rnameErr)
            {
                await uniqueFunction.writeLogIntoFile(rnameErr?.stack, logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                console.log("Error renaming",rnameErr)
                return resolve(true)
            }
        }
        else
        {
            await uniqueFunction.writeLogIntoFile("Sftp connection lost file rename failed", logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
            return resolve(true)
        }
    })
}


async function mailFiles(file, fileData)
{
    return  new Promise(async(resolve, reject) => 
    {
        let fileExtension = file.fileName.split('.')[1]
        let mimeType = await db.getMimeType(fileExtension)
        let attachment = [{
            content : fileData.toString('base64'),
            type : mimeType[0].mime,
            name : file.fileName
        }]

        let dataToSend = {
            "to":[{"email" : process.env.rawFileMailId, "name": "Infoaugust", "type" : "to"}],
            "subject": "Credit Note Summary Raw File",
            "text": "<div>Hello,</div><br/><br/><div>Please find attachment of Credit Note Summary</div>",
            "rawFiles" : attachment
        }
        console.log(dataToSend)
        axios.post( api.serviceApi + api.common + api.sendMail, dataToSend).then((sendMail) =>
        {
            if(sendMail?.data) 
            {               
                console.log("mail sent")     
                return resolve(true)
            }
            else
            {
                console.log("mail sent failed")  
                return resolve(false)
            }
        })
        .catch(err => {
            console.log("mail sent failed")
            console.log(err.data)
            return resolve(false)
        })
    })
}
