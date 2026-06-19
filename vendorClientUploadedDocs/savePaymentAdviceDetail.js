let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let path = require('path')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let createdOn;
        let documentCategoryId;
        let documentId;
        let vendorUuid;
        let clientUuid;
        let documentAttachmentId;
        let documentNewFolderPath;
        let clientUploadedDocsMasterId;
        let fileObject = {};
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
            if(error) 
            {
                console.log(error);
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : error?.stack,
                    "status_name" : getCode.getStatus(400)
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
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Provide all values",
                    "status_name" : getCode.getStatus(400)
                })
            }
            documentCategoryId = req.body.documentCategory?.length > 0 ? JSON.parse(req.body.documentCategory[0])?.id : null;
            documentId = req.body.document?.length > 0 ? JSON.parse(req.body.document[0])?.id : null;
            vendorUuid = req.body.vendor?.length > 0 ? JSON.parse(req.body.vendor[0])?.uuid : '';
            clientUploadedDocsMasterId = req.body.clientUploadedDocsMaster?.length > 0 ? JSON.parse(req.body.clientUploadedDocsMaster[0])?.id : '';
            clientUuid = JSON.parse(req.body.client[0])?.uuid
            documentAttachmentId = req.body.documentAttachment?.length > 0 ? JSON.parse(req.body.documentAttachment[0])?.id : null;
            documentNewFolderPath = req.body.documentNewFolderPath[0]
            createdOn =  new Date()
            let s3FilePath = ""
            let fileName = ""            
            let encriptionKey = ""
            let encriptionIV = ""
            fileName = fileObject.uploadFile.originalFilename
            let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileObject.uploadFile.originalFilename,null, null, 'file')
            if(encryptedData?.result)
            {
                encriptionIV = encryptedData.encriptionIV
                encriptionKey = encryptedData.encriptionKey
                let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, fileObject.uploadFile.originalFilename, clientUuid, documentNewFolderPath)            
                s3FilePath = uploadFileToS3Bucket?.s3FilePath                      
                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadFile.originalFilename)
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Payment Advice Detail Encryption Error",
                    "status_name" : getCode.getStatus(500)
                }) 
            }          

            let saveClientUploadedDocDetail = await db.saveClientUploadedDocDetail(fileName, s3FilePath, clientUploadedDocsMasterId, documentAttachmentId, createdOn, encriptionKey, encriptionIV) 
            
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : getCode.getStatus(200)
            })        
        })
    } 
    catch(e)
    {
        uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Payment Advice Detail Data Not Saved",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})
