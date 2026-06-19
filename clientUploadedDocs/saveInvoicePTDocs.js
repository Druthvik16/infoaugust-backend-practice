let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let path = require('path')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let createdOn;
        let documentCategoryId;
        let documentId;
        let partnerLocationDetailUuid;
        let clientUuid;
        let documentAttachmentId;
        let documentNewFolderPath;
        let toDate;
        let fileObject = {};
        let apiName = ''
        let invoiceNumber;
        apiName = req.baseUrl
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            console.log(part)
                            return part?.originalFilename
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
            console.log(req.body)
            if(!req.body.client || !JSON.parse(req.body.client[0])?.uuid || !req.body.invoiceNumber)
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
            partnerLocationDetailUuid = req.body.partnerLocationDetail?.length > 0 ? JSON.parse(req.body.partnerLocationDetail[0])?.uuid : '';
            clientUuid = JSON.parse(req.body.client[0])?.uuid
            documentAttachmentId = req.body.documentAttachment?.length > 0 ? JSON.parse(req.body.documentAttachment[0])?.id : null;
            documentNewFolderPath = req.body.documentNewFolderPath[0]
            invoiceNumber = req.body.invoiceNumber[0]
            createdOn =  new Date()

            let getInvoiceForPartnerLocation = await db.getInvoiceForPartnerLocation(partnerLocationDetailUuid, invoiceNumber, clientUuid)
            if(getInvoiceForPartnerLocation?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Invoice number or partner location not found",
                    "status_name" : getCode.getStatus(500)
                })                            
            } 
            else
            {
                let s3FilePath = ""
                let fileName = ""
                let encriptionKey = ""
                let encriptionIV = ""

                if(Object.keys(file).length > 0)
                {
                    fileName = fileObject.uploadFile?.originalFilename
                    let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileName,null, null, 'file')
                    if(encryptedData?.result)
                    {
                        encriptionIV = encryptedData.encriptionIV
                        encriptionKey = encryptedData.encriptionKey
                        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileName, clientUuid, documentNewFolderPath)   
                        s3FilePath = uploadFileToS3Bucket?.s3FilePath                        
                        let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadFile.originalFilename)
                    }
                    else
                    {
                        console.log("file not uploaded",encryptedData)
                    }
                }

                // let updateClientUploadedDocDetail = await db.updateClientUploadedDocDetail(fileName, s3FilePath, documentAttachmentId, createdOn, encriptionKey, encriptionIV, getInvoiceForPartnerLocation[0].detailId) 
                let saveClientUploadedDocDetail = await db.saveClientUploadedDocDetail(fileName, s3FilePath, getInvoiceForPartnerLocation[0].id, documentAttachmentId, createdOn, encriptionKey, encriptionIV) 
                
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : getCode.getStatus(200)
                })     
            } 
        })
    } 
    catch(e)
    {
        uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Invoice PT File Not Saved",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})
