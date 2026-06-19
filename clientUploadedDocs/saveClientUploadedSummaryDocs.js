let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let path = require('path')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const spsnLedgerDownload = require('../spsnUser/uploadLedgerJsonFile') ////////  To create ledger json file this code is added
const bucketName = process.env.Bucket_Name;
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
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
            let documentDate = req.body.documentDate[0];
            let documentNumber = req.body.documentNumber[0];
            let documentCategoryId = req.body.documentCategory?.length > 0 ? JSON.parse(req.body.documentCategory[0])?.id : null;
            let documentId = req.body.document?.length > 0 ? JSON.parse(req.body.document[0])?.id : null;
            let partnerLocationDetailUuid = req.body.partnerLocationDetail?.length > 0 ? JSON.parse(req.body.partnerLocationDetail[0])?.uuid : '';
            let clientUuid = JSON.parse(req.body.client[0])?.uuid
            let narration = uniqueFunction.manageSpecialCharacter(req.body.narration[0])
            let monthPeriod = req.body.monthPeriod[0]
            let postingDate = req.body.postingDate[0]
            let debitAmount = req.body.debitAmount[0]
            let creditAmount = req.body.creditAmount[0]
            let billNoOrRefNo = req.body.billNoOrRefNo[0]
            let documentAttachmentId = req.body.documentAttachment?.length > 0 ? JSON.parse(req.body.documentAttachment[0])?.id : null;
            let documentNewFolderPath = req.body.documentNewFolderPath[0]
            let openingBalance = req.body.openingBalance[0]
            let closingBalance = req.body.closingBalance[0]
            let inputFileName = req.body.fileName[0]
            let createdOn =  new Date()

            const getClientUploadedDocMaster = await db.getClientUploadedDocMaster(partnerLocationDetailUuid, postingDate, documentCategoryId);

            console.log(getClientUploadedDocMaster, getClientUploadedDocMaster.length)

            const uploadedDoc = await db.getEncryptionData(inputFileName)

            console.log(uploadedDoc)

            if (uploadedDoc?.length == 0) {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : `File master entry not found`,
                    "status_name" : getCode.getStatus(400)
                }) 
            }

            const financialYears = await db.getFinancialYears();

            const postDate = format(new Date(postingDate), 'yyyy-MM-dd', { locale: enIN });

            const matchingFY = financialYears.find(fy => {
                const start = format(new Date(fy.startDate), 'yyyy-MM-dd', { locale: enIN }) ;
                const end = format(new Date(fy.endDate), 'yyyy-MM-dd', { locale: enIN }) ;
                return postDate >= start && postDate <= end;
            });

            if (!matchingFY) {
                // throw new Error(`No matching financial year found for posting date: ${postingDate}`);
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : `Financial year not found for posting date: ${postingDate}`,
                    "status_name" : getCode.getStatus(400)
                }) 
            }

            const FYId = matchingFY.id;

            

            if(getClientUploadedDocMaster.length == 0)
            {
                console.log("Insert****************************")
                let saveClientUploadedDocMaster = await db.saveClientUploadedDocMaster(documentDate, documentNumber, documentCategoryId, documentId, partnerLocationDetailUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, createdOn, openingBalance, closingBalance)
    
                if(saveClientUploadedDocMaster.affectedRows > 0)
                {
                    let s3FilePath = ""
                    let fileName = ""
                    let encriptionKey = ""
                    let encriptionIV = ""
    
                    if(Object.keys(file).length > 0)
                    {
                        //////// start ---- To create ledger json file this code is added
                        if(documentNewFolderPath == 'Uploaded_Ledger_Raw_Sap_dump')
                        {
                            await spsnLedgerDownload.uploadFile(fileObject.uploadFile, clientUuid, 'insert', FYId, saveClientUploadedDocMaster.insertId, uploadedDoc[0]?.id, matchingFY.name)
                        }
                        //////////////// over
    
                        fileName = fileObject.uploadFile.originalFilename
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileObject.uploadFile.originalFilename,null, null, 'file')
                        if(encryptedData?.result)
                        {
                            encriptionIV = encryptedData.encriptionIV
                            encriptionKey = encryptedData.encriptionKey
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadFile.originalFilename, clientUuid, documentNewFolderPath)            
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
            }
            else
            {
                console.log("Update****************************")
                
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Ledger already exists",
                    "status_name" : getCode.getStatus(500)
                }) 
                // let filePath = getClientUploadedDocMaster[0].filePath;
                // let encryptionKey = getClientUploadedDocMaster[0].encryptionKey;
                // let encryptionIV = getClientUploadedDocMaster[0].encryptionIV;
                // const masterId = getClientUploadedDocMaster[0].id;
                // const detailId = getClientUploadedDocMaster[0].detailId;
                
                // const params = {
                //     Bucket: bucketName,
                //     Key : filePath
                // };
                
                // let deleteObject = await s3.deleteObject(params).promise();

                
                // let updateClientUploadedDocMasterLedger = await db.updateClientUploadedDocMasterLedger(masterId,postingDate,openingBalance, closingBalance)
    
                // if(updateClientUploadedDocMasterLedger.affectedRows > 0)
                // {
                //     let s3FilePath = ""
                //     let fileName = ""
    
                //     if(Object.keys(file).length > 0)
                //     {
                //         //////// start ---- To create ledger json file this code is added
                //         if(documentNewFolderPath == 'Uploaded_Ledger_Raw_Sap_dump')
                //         {
                //             await spsnLedgerDownload.uploadFile(fileObject.uploadFile, clientUuid, 'update')
                //         }
                //         //////////////// over
    
                //         fileName = fileObject.uploadFile.originalFilename
                //         let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileObject.uploadFile.originalFilename,encryptionKey, encryptionIV, 'file')
                //         if(encryptedData?.result)
                //         {
                //             encryptionIV = encryptedData.encriptionIV
                //             encryptionKey = encryptedData.encriptionKey
                //             let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadFile.originalFilename, clientUuid, documentNewFolderPath)            
                //             s3FilePath = uploadFileToS3Bucket?.s3FilePath                      
                //             let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadFile.originalFilename)
                //         }
                //         else
                //         {
                //             console.log("file not uploaded",encryptedData)
                //         }
                //     }
    
                //     let updateClientUploadedDocDetail = await db.updateClientUploadedDocDetail(fileName, s3FilePath, documentAttachmentId, createdOn, encryptionKey, encryptionIV, detailId) 
                    
                //     res.status(200)
                //     return res.json({
                //         "status_code" : 200,
                //         "message" : "success",
                //         "status_name" : getCode.getStatus(200)
                //     })            
                // }
                // else
                // {
                //     uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                //     res.status(500)
                //     return res.json({
                //         "status_code" : 500,
                //         "message" : "Summary Data Not Saved",
                //         "status_name" : getCode.getStatus(500)
                //     }) 
                // } 
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
