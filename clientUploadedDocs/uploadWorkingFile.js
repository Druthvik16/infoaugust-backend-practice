let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let fs = require('fs')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
const  logFileName = "creditNoteWorkingLogFile-" + new Date().toISOString().slice(0, 10).replace('T', ' ')
const logFilePath = getPath.getName('script/creditNote/working');
let inputFolderPath = 'Input_Working_Raw_Sap_dump'

module.exports = require('express').Router().post('/',async(req,res) => 
{
    let fileObject = {};
    try
    {
        let clientUuid;
        let documentNewFolderPath;
        let creditNoteNumber;
        let clientUploadedDocsMasterId;
        let documentAttachmentId;
        let apiName = ''
        apiName = req.baseUrl
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part.originalFilename
                        }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) 
        {
            console.log("fields:",fields, "\n file:", file)
            if(error) 
            {
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, file.uploadFile.originalFilename, logFilePath, 'red')
                console.log(error);
                uniqueFunction.removeFileFromDirectory(file.uploadFile.filepath)
                // throw error;res.status(400)
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : error?.stack,
                    "status_name" : getCode.getStatus(500)
                }) 
            }
            if(Object.keys(file).length > 0)
            {
                if(Array.isArray(file['uploadFile']) == true)
                {
                    fileObject['uploadFile'] = file['uploadFile'][0]
                }
                else
                {
                    fileObject = file
                }
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("File Not Found", logFileName, file.uploadFile.originalFilename, logFilePath, 'red')
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            req.body = fields
            if(!req.body.client || !JSON.parse(req.body.client[0])?.uuid)
            {
                await uniqueFunction.writeLogIntoFile("Provide all values", logFileName, file.uploadFile.originalFilename, logFilePath, 'red')
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Provide all values",
                    "status_name" : getCode.getStatus(400)
                })
            }
            clientUuid = JSON.parse(req.body.client[0])?.uuid
            documentNewFolderPath = req.body.documentNewFolderPath[0]
            creditNoteNumber  = req.body.creditNoteNumber[0]
            const partnerLocationCode  = req.body.partnerLocationCode[0]
            const postingDate  = req.body.postingDate[0]
            documentAttachmentId = req.body.documentAttachment?.length > 0 ? JSON.parse(req.body.documentAttachment[0])?.id : null;
            clientUploadedDocsMasterId = req.body.clientDocMasterId?.length > 0 ? JSON.parse(req.body.clientDocMasterId[0])?.id : null;
            console.log(clientUuid, documentNewFolderPath, clientUploadedDocsMasterId)
            
            const clientUploadedDocsMaster = await db.getClientUploadedDocsMasterIdForCreditNoteWorking(creditNoteNumber, partnerLocationCode, postingDate)
            if(!clientUploadedDocsMaster[0].id)
            {
                await uniqueFunction.writeLogIntoFile("Credit Note No. Not Found", logFileName, fileObject.uploadFile.originalFilename, logFilePath, 'red')
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Credit Note Not Found",
                    "status_name" : getCode.getStatus(500)
                })  
            } 
            else if(clientUploadedDocsMaster[0].isWorkingExist > 0)
            {
                await uniqueFunction.writeLogIntoFile("Credit Note No. Working File Already Exist", logFileName, fileObject.uploadFile.originalFilename, logFilePath, 'red')
                let fileP = getPath.getName('documentFolders') + '/' + clientUuid + "/" + inputFolderPath + "/" + originalFileName
                uniqueFunction.removeFileFromDirectory(fileP)
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : getCode.getStatus(200)
                })  
            }
            let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileObject.uploadFile.originalFilename,null, null, 'file')
            if(encryptedData?.result)
            {
                let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadFile.originalFilename, clientUuid, documentNewFolderPath)
                if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
                {
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadFile.originalFilename)

                    let saveWorkingFile = await db.saveWorkingFile(fileObject.uploadFile.originalFilename,uploadFileToS3Bucket.s3FilePath,clientUploadedDocsMasterId,documentAttachmentId,new Date(), encryptedData?.encriptionKey, encryptedData?.encriptionIV)

                    await uniqueFunction.writeLogIntoFile("Credit Note File Uploaded", logFileName, fileObject.uploadFile.originalFilename, logFilePath, 'green')
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "status_name" : getCode.getStatus(200)
                    })  
                }
                else
                {
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "Working file not uploaded",
                        "status_name" : getCode.getStatus(500)
                    }) 
                } 
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("File not encrypted", logFileName, fileObject?.uploadFile?.originalFilename, logFilePath, 'red')
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "File not encrypted",
                    "status_name" : getCode.getStatus(500)
                }) 
            }
        })
    } 
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileObject?.uploadFile?.originalFilename, logFilePath, 'red')
        if(fileObject?.uploadFile?.filepath?.length > 0)
        {
            uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
        }
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Working file not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
})
