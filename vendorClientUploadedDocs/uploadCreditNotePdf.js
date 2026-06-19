let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let fs = require('fs')
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
let inputFolderPath = 'Input_Pdfs';
const bucketName = process.env.Bucket_Name;
// const folderName = 'vendorModule/client/'
const folderName = uniqueFunction.vendorModule + 'client/' 
const vendorModuleClientPath = '/' + uniqueFunction.vendorModule + 'client'
const logFilePath = getPath.getName('vendor/script/creditNote/pdf')

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let clientUuid;
        let documentAttachmentId;
        let documentNewFolderPath = 'Uploaded_Pdfs'
        let attachmentType = 'Pdf';
        let logFileName = "creditNotePdfLogFile-"
        let apiName = ''
        
        let botName = 'creditNotePdfBot'
        let fileObject = {};
        let creditNoteNumber;
        let clientUploadedDocsMasterId;
        let originalFileName;
        logFileName = "creditNotePdfLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10)
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
            if(error) 
            {
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fields.originalFilename, logFilePath, 'red')
                console.log(error);
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : error?.stack,
                    "status_name" : getCode.getStatus(200)
                })
            }
            if(Object.keys(file).length > 0)
            {
                if(Array.isArray(file['']) == true)
                {
                    fileObject[''] = file[''][0]
                }
                else
                {
                    fileObject = file
                }
                console.log("fileObject",fileObject)
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("File Not Found", logFileName, fields.originalFilename, logFilePath, 'red')
                uniqueFunction.removeFileFromDirectory(fileObject['']?.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            req.body = fields
            if(!req.body?.clientUuid || !req.body.originalFilename)
            {
                await uniqueFunction.writeLogIntoFile("Provide all values", logFileName, fields.originalFilename, logFilePath, 'red')
                uniqueFunction.removeFileFromDirectory(fileObject['']?.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Provide all values",
                    "status_name" : getCode.getStatus(400)
                })
            }
            clientUuid = req.body?.clientUuid[0]
            originalFileName = req.body?.originalFilename[0]
            let codes = (fileObject[''].originalFilename).split('.')[0]
            creditNoteNumber = codes.split('-')[0]
            let vendorCode = codes.split('-')[1]
            documentAttachmentId = await db.getDocumentAttachmentId(attachmentType);
            documentAttachmentId = documentAttachmentId[0]?.id
            clientUploadedDocsMasterId = await db.getClientUploadedDocsMasterIdForCreditNote(creditNoteNumber, vendorCode)
            if(!clientUploadedDocsMasterId[0].id)
            {
                await uniqueFunction.writeLogIntoFile("Credit Note No. Not Found", logFileName, fileObject[''].originalFilename, logFilePath, 'red')
                uniqueFunction.removeFileFromDirectory(fileObject[''].filepath)
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "Credit Note Not Found",
                    "status_name" : getCode.getStatus(200)
                })  
            }
            else if(clientUploadedDocsMasterId[0].isPdfExist > 0)
            {
                await uniqueFunction.writeLogIntoFile("Credit Note No. File Already Exist", logFileName, fileObject[''].originalFilename, logFilePath, 'red')
                let fileP = getPath.getName('documentFolders') + vendorModuleClientPath + '/' + clientUuid + "/" + inputFolderPath + "/" + originalFileName
                uniqueFunction.removeFileFromDirectory(fileP)
                uniqueFunction.removeFileFromDirectory(fileObject[''].filepath)
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "Credit Note Not Found",
                    "status_name" : getCode.getStatus(200)
                })  
            }
            clientUploadedDocsMasterId = clientUploadedDocsMasterId[0].id
            let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject[''].filepath, fileObject[''].originalFilename,null, null, 'file')
            if(encryptedData?.result)
            {
                let updatePdfBotLogLastActive = await db.updatePdfBotLogLastActive(new Date(), botName)
                let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, fileObject[''].originalFilename, clientUuid, documentNewFolderPath)
                if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
                {
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject['']?.size, apiName, 'S3', new Date(), clientUuid, fileObject['']?.originalFilename)

                    let savePdfFile = await db.savePdfFile(fileObject[''].originalFilename,uploadFileToS3Bucket.s3FilePath,clientUploadedDocsMasterId,documentAttachmentId,new Date(),encryptedData?.encriptionKey,encryptedData?.encriptionIV)
                    let s3SourceFilePathListObject = folderName + clientUuid + "/" + inputFolderPath + "/" + originalFileName
                    await uniqueFunction.writeLogIntoFile("Credit Note File Uploaded", logFileName, fileObject[''].originalFilename, logFilePath, 'green')
                        let fileP = getPath.getName('documentFolders')  + vendorModuleClientPath + '/' + clientUuid + "/" + inputFolderPath + "/" + originalFileName
                        uniqueFunction.removeFileFromDirectory(fileP)
                        let sql = `UPDATE client_vendor_upload_doc_log_master SET status = 'Completed', completed_on = ? WHERE UPPER(file_name) = UPPER('${originalFileName}')`
                        
                        db.updateUploadDocLogMaster(sql, [new Date()]).then(async(updateLog) => 
                        {
                            await uniqueFunction.writeLogIntoFile("Credit Note Uploaded", logFileName, fileObject[''].originalFilename, logFilePath, 'green')
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        })
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Credit Note pdf file not uploaded", logFileName, fileObject[''].originalFilename, logFilePath, 'red')
                    uniqueFunction.removeFileFromDirectory(fileObject[''].filepath)
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "Credit Note pdf file not uploaded",
                        "status_name" : getCode.getStatus(500)
                    }) 
                } 
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("File not encrypted", logFileName, fileObject[''].originalFilename, logFilePath, 'red')
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
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileObject[''].originalFilename, logFilePath, 'red')
        uniqueFunction.removeFileFromDirectory(fileObject[''].filepath)
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Credit Note pdf not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
})
