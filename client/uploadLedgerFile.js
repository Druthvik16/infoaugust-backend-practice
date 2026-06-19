let formidable = require('formidable');
let db = require('./dbQueryClient')
let path = require('path')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
const randomKey = require('../authenticate/tokenGenerate')
let fileObject = {};
let clientId;
let clientUuid;
let documentAttachmentId;
let attachmentSheetName = 'Summary'
let status;
let userId;
let loggedUserUuid;
let s3Folder = 'Input_Ledger_Raw_Sap_dump'
let categoryName = 'Ledger';
let documentCategoryId;
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let fileStoreTo = process.env.fileStoreTo
let apiName = ''

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        console.log(new Date())
        userId = req.body.userId
        apiName = req.baseUrl
        loggedUserUuid = req.body.loggedUserUuid
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part.originalFilename
                        }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, files) 
        {
            if(error) 
            {
                console.log(error);
                throw error;
            }
            if(Object.keys(files).length > 0)
            {
                fileObject = files
            }
            else
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            createdOn = new Date()
            status = 'Pending'
            documentAttachmentId = await db.getDocumentAttachmentId(attachmentSheetName)
            if(documentAttachmentId?.length == 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Document attachment type not found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            documentAttachmentId = documentAttachmentId[0]?.id
            documentCategoryId = await db.getDocumentCategoryId(categoryName)
            if(documentCategoryId?.length == 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Document Category not found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            documentCategoryId = documentCategoryId[0]?.id
            req.body = fields
            if(!req.body.clientUuid)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Provide all values",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            clientUuid = req.body.clientUuid[0]
            let clientData = await db.getClientId(clientUuid)      
            clientId = clientData[0]?.id
            fileObject.LedgerFile.forEach(file => {
                if(path.extname(file.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(file.originalFilename)?.toLowerCase() != '.csv')
                {
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "File Type Not Matched",
                        "status_name" : getCode.getStatus(400)
                    }) 
                }
            })        
            if(fileStoreTo == 'S3BUCKET')
            {
                uploadFileOnS3Bucket(fileObject.LedgerFile, 0, fileObject.LedgerFile?.length, clientUuid, 0, res, clientId, documentAttachmentId, status, documentCategoryId, [])
            }
            else
            {
                uploadFileOnLocal(fileObject.LedgerFile, 0, fileObject.LedgerFile?.length, clientUuid, 0, res, clientId, documentAttachmentId, status, documentCategoryId, [])
            }
        })  
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Ledger Upload Failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

function uploadFileOnS3Bucket(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status, documentCategoryId, rejectedFiles)
{
    try
    {
        if(start < end)
        {
            let file = fileObject[start]
            let identifierName = 'upload_doc_log_master'
            let id = 0
            uniqueFunction.unquieName(identifierName, ['file_name'],{  "file_name" : file.originalFilename }, id, 0).then(uniqueCheckName => {
                // if(uniqueCheckName != 0)
                // {
                //     rejectedFiles.push({ "fileName" : file.originalFilename, "remark" : "File name already exists" });
                //     start++
                //     uploadFileOnS3Bucket(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                // }
                // else
                // { 
                    if(uniqueCheckName != 0)
                    {
                        file['oldFileName'] = file.originalFilename                                    
                        let nameArray = file.originalFilename.split('.')
                        let newFileName = nameArray[0] + '_' + randomKey(5) + '.' + nameArray[1]
                        file['originalFilename'] = newFileName
                    }
                    uniqueFunction.encryptFileBuffer(file.filepath, file.originalFilename, null,null, 'file').then(encryptedData => {
                        if(encryptedData?.result)
                        {                            
                            uniqueFunction.uploadFiles(encryptedData?.file, file.originalFilename, clientUuid, s3Folder).then(async(uploadFiles) => 
                            {
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', '', '', file?.size, apiName, 'S3', new Date(), clientId, file.originalFilename)
                                console.log(uploadFiles)
                                if(uploadFiles && uploadFiles.result == true)
                                {
                                    db.saveUploadDocLogMaster(file.originalFilename, clientId, documentAttachmentId, status, new Date(), uploadFiles.s3FilePath, documentCategoryId, encryptedData?.encriptionKey, encryptedData?.encriptionIV).then(saveDetail => {
                                        start++
                                        uploadFileOnS3Bucket(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status, documentCategoryId, rejectedFiles)
                                    })
                                }
                                else
                                {
                                    start++
                                    uploadFileOnS3Bucket(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status, documentCategoryId, rejectedFiles)
                                }
                            })   
                        }
                        else
                        {
                            rejectedFiles.push({ "fileName" : file.originalFilename, "remark" : "File encrypting error" });
                            start++
                            uploadFileOnS3Bucket(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                        }
                    })
                // }
            })
        }
        else
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : { "rejectedFiles" : rejectedFiles},
                "status_name" : getCode.getStatus(200)
            }) 
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Ledger Upload Failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
}

function uploadFileOnLocal(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status, documentCategoryId, rejectedFiles)
{
    try
    {
        if(start < end)
        {
            let file = fileObject[start]
            let identifierName = 'upload_doc_log_master'
            let id = 0
            uniqueFunction.unquieName(identifierName, ['file_name'],{  "file_name" : file.originalFilename }, id, 0).then(uniqueCheckName => {
                // if(uniqueCheckName != 0)
                // {
                //     rejectedFiles.push({ "fileName" : file.originalFilename, "remark" : "File name already exists" });
                //     start++
                //     uploadFileOnLocal(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                // }
                // else
                // { 
                    if(uniqueCheckName != 0)
                    {
                        file['oldFileName'] = file.originalFilename                                    
                        let nameArray = file.originalFilename.split('.')
                        let newFileName = nameArray[0] + '_' + randomKey(5) + '.' + nameArray[1]
                        file['originalFilename'] = newFileName
                    }
                    uniqueFunction.encryptFileBuffer(file.filepath, file.originalFilename, null, null, 'file').then(encryptedData => {
                        if(encryptedData?.result)
                        {
                            uniqueFunction.singleFileUpload(encryptedData?.file, getPath.getName('documentFolders'), file.originalFilename, (clientUuid + '/' + s3Folder)).then(async(uploadFiles) => 
                            {
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', '', '', file?.size, apiName, 'LOC', new Date(), clientId, file.originalFilename)
                                if(uploadFiles && uploadFiles.result == true)
                                {
                                    db.saveUploadDocLogMasterLocal(file.originalFilename, clientId, documentAttachmentId, status, new Date(), uploadFiles.localFilePath,documentCategoryId, encryptedData?.encriptionKey, encryptedData?.encriptionIV).then(saveDetail => {
                                        start++
                                        uploadFileOnLocal(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                                    })
                                }
                                else
                                {
                                    start++
                                    uploadFileOnLocal(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                                }
                            })   
                        }
                        else
                        {
                            rejectedFiles.push({ "fileName" : file.originalFilename, "remark" : "File encrypting error" });
                            start++
                            uploadFileOnLocal(fileObject, start, end, clientUuid, masterId, res, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                        }
                    })
                // }
            })
        }
        else
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : { "rejectedFiles" : rejectedFiles},
                "status_name" : getCode.getStatus(200)
            }) 
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Ledger Upload Failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
}