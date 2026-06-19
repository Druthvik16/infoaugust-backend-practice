let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let fs = require('fs')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
let inputFolderPath = 'Input_Pdfs';
const bucketName = process.env.Bucket_Name;
const folderName = process.env.currentFolder

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let clientUuid;
        let documentAttachmentId;
        let documentNewFolderPath = 'Uploaded_Pdfs'
        let attachmentType = 'Pdf';
        let docPath = require('../DOC_FOLDER_PATH/docPath')
        let getPath = new docPath()
        let logFileName = "creditNotePdfLogFile-"
        let fileStoreTo = process.env.fileStoreTo
        let apiName = ''
        
        let botName = 'creditNotePdfBot'
        let fileObject = {};
        let creditNoteNumber;
        let clientUploadedDocsMasterId;
        let originalFileName;
        logFileName = "creditNotePdfLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
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
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fields.originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
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
                await uniqueFunction.writeLogIntoFile("File Not Found", logFileName, fields.originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
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
                await uniqueFunction.writeLogIntoFile("Provide all values", logFileName, fields.originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
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
            let partnerLocationCode = codes.split('-')[1]
            let postingDate = codes.split('-')[2]

            const fileName = codes.split('_')[0]

            console.log(codes, partnerLocationCode, postingDate, creditNoteNumber)

            documentAttachmentId = await db.getDocumentAttachmentId(attachmentType);
            documentAttachmentId = documentAttachmentId[0]?.id
            clientUploadedDocsMasterId = await db.getClientUploadedDocsMasterIdForCreditNote(creditNoteNumber, partnerLocationCode, postingDate, fileName)
            console.log(clientUploadedDocsMasterId)
            if(!clientUploadedDocsMasterId[0].id)
            {
                await uniqueFunction.writeLogIntoFile("Credit Note No. Not Found", logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
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
                await uniqueFunction.writeLogIntoFile("Credit Note No. File Already Exist", logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
                let fileP = getPath.getName('documentFolders') + '/' + clientUuid + "/" + inputFolderPath + "/" + originalFileName
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
                let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject[''].originalFilename, clientUuid, documentNewFolderPath)
                if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
                {
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject['']?.size, apiName, 'S3', new Date(), clientUuid, fileObject['']?.originalFilename)

                    let savePdfFile = await db.savePdfFile(fileObject[''].originalFilename,uploadFileToS3Bucket.s3FilePath,clientUploadedDocsMasterId,documentAttachmentId,new Date(),encryptedData?.encriptionKey,encryptedData?.encriptionIV)
                    let s3SourceFilePathListObject = folderName + clientUuid + "/" + inputFolderPath + "/" + originalFileName
                    await uniqueFunction.writeLogIntoFile("Credit Note File Uploaded", logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'green')
                    if(fileStoreTo == 'S3BUCKET')
                    {
                        const deleteParams = {
                            Bucket: bucketName,
                            Key : s3SourceFilePathListObject
                        };
                        s3.deleteObject(deleteParams, async function(err, data) 
                        {
                            if (err) 
                            {
                                await uniqueFunction.writeLogIntoFile("Error deleting object: " + s3SourceFilePathListObject + "______________________" + JSON.stringify(err?.stack), logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
                                console.error("Error deleting object: ", err);                     res.status(200)
                                return res.json({
                                    "status_code" : 200,
                                    "message" : err?.stack,
                                    "status_name" : getCode.getStatus(200)
                                })
                            } 
                            else 
                            {
                                let sql = `UPDATE upload_doc_log_master SET status = 'Completed', processed_file_path = '${uploadFileToS3Bucket.s3FilePath}', encryption_key = '${encryptedData?.encriptionKey}', encryption_iv = '${encryptedData?.encriptionIV}' , completed_on = ? WHERE UPPER(file_name) = UPPER('${originalFileName}')`
                                
                                db.updateUploadDocLogMaster(sql, [new Date()]).then(async(updateLog) => 
                                {
                                    await uniqueFunction.writeLogIntoFile("Credit Note Uploaded", logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'green')
                                    res.status(200)
                                    return res.json({
                                        "status_code" : 200,
                                        "message" : "success",
                                        "status_name" : getCode.getStatus(200)
                                    })
                                })
                            }
                        });
                    }
                    else
                    {
                        let fileP = getPath.getName('documentFolders') + '/' + clientUuid + "/" + inputFolderPath + "/" + originalFileName
                        uniqueFunction.removeFileFromDirectory(fileP)
                        let sql = `UPDATE upload_doc_log_master SET status = 'Completed', processed_file_path = '${uploadFileToS3Bucket.s3FilePath}', encryption_key = '${encryptedData?.encriptionKey}',  encryption_iv = '${encryptedData?.encriptionIV}' , completed_on = ? WHERE UPPER(file_name) = UPPER('${originalFileName}')`
                        
                        db.updateUploadDocLogMaster(sql, [new Date()]).then(async(updateLog) => 
                        {
                            await uniqueFunction.writeLogIntoFile("Credit Note Uploaded", logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'green')
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        })
                    }
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Credit Note pdf file not uploaded", logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
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
                await uniqueFunction.writeLogIntoFile("File not encrypted", logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
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
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileObject[''].originalFilename, getPath.getName('script/creditNote/pdf'), 'red')
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
