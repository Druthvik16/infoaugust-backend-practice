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
        let documentDate;
        let documentNumber;
        let documentCategoryId;
        let documentId;
        let vendorUuid;
        let clientUuid;
        let narration;
        let monthPeriod;
        let postingDate;
        let debitAmount;
        let creditAmount;
        let billNoOrRefNo;
        let documentAttachmentId;
        let documentNewFolderPath;
        let openingBalance;
        let closingBalance;
        let financialYear;
        let period;
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
                if(fields.documentNewFolderPath[0] == 'Uploaded_Ledger_Raw_Sap_dump')
                {
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "File Not Found",
                        "status_name" : getCode.getStatus(400)
                    }) 
                }
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
            documentDate = req.body.documentDate[0];
            documentNumber = req.body.documentNumber[0];
            documentCategoryId = req.body.documentCategory?.length > 0 ? JSON.parse(req.body.documentCategory[0])?.id : null;
            documentId = req.body.document?.length > 0 ? JSON.parse(req.body.document[0])?.id : null;
            vendorUuid = req.body.vendor?.length > 0 ? JSON.parse(req.body.vendor[0])?.uuid : '';
            clientUuid = JSON.parse(req.body.client[0])?.uuid
            narration = uniqueFunction.manageSpecialCharacter(req.body.narration[0])
            monthPeriod = req.body.monthPeriod[0]
            postingDate = req.body.postingDate[0]
            debitAmount = req.body.debitAmount[0]
            creditAmount = req.body.creditAmount[0]
            billNoOrRefNo = req.body.billNoOrRefNo[0]
            documentAttachmentId = req.body.documentAttachment?.length > 0 ? JSON.parse(req.body.documentAttachment[0])?.id : null;
            documentNewFolderPath = req.body.documentNewFolderPath[0]
            openingBalance = req.body.openingBalance[0]
            closingBalance = req.body.closingBalance[0]
            period = null
            financialYear = null
            createdOn =  new Date()

            let saveClientUploadedDocMaster = await db.saveClientUploadedDocMaster(documentDate, documentNumber, documentCategoryId, documentId, vendorUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, createdOn, openingBalance, closingBalance, period, financialYear)

            if(saveClientUploadedDocMaster.affectedRows > 0)
            {
                let s3FilePath = ""
                let fileName = ""            
                let encriptionKey = ""
                let encriptionIV = ""

                if(Object.keys(file).length > 0)
                {
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
                        console.log("file not uploaded",encryptedData)
                    }
                }

                let saveClientUploadedDocDetail = await db.saveClientUploadedDocDetail(fileName, s3FilePath, saveClientUploadedDocMaster.insertId, documentAttachmentId, createdOn, encriptionKey, encriptionIV) 
                
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
                    "message" : "Summary Data Not Saved",
                    "status_name" : getCode.getStatus(500)
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
            "message" : "Summary Data Not Saved",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})
