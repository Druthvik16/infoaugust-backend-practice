let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let vendorCommonFunction = require('./vendorCommonFunction')


const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;


module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        if(!req.body.vendor || !req.body.vendor?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let partnerUuid = req.body.vendor?.uuid
        let vendor = await db.getPartner(partnerUuid)
        if(vendor?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor not found",
                "status_name" : getCode.getStatus(400)
            });
        }
        let docState = vendor[0].docState;
        // if(docState != 'Vendor-Submitted')
        // {
        //     res.status(400)
        //     return res.json({
        //         "status_code" : 400,
        //         "message"     : "Vendor documents submission are pending",
        //         "status_name" : getCode.getStatus(400)
        //     });
        // }
        let vendorStatusId = vendor[0].vendorStatusId;
        let vendorStatusName = vendor[0].vendorStatusName;
        if(vendorStatusName == 'Registration-Initiated')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor registration process is incomplete",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'Document-Submitted')
        {
            let userId = req.body.userId;
            let partnerId = vendor[0].id
            let getVendorRegistrationForm = await db.getVendorRegistrationForm(partnerId)
            if(getVendorRegistrationForm?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Fill vendor registration form",
                    "status_name" : getCode.getStatus(500)
                });
            }
            let getVendorDocuments = await db.getVendorUploadDocuments(partnerId);
            if(getVendorDocuments.length == 0) 
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Upload vendor document",
                    "status_name" : getCode.getStatus(500)
                });            
            }
            // let response = await getAttachmentList(getVendorDocuments, 0, getVendorDocuments.length, [], partnerUuid)
            // console.log(response)
            // if(!response.results)
            // {
            //     res.status(500)
            //     return res.json({
            //         "status_code" : 500,
            //         "message"     : response.error,
            //         "status_name" : getCode.getStatus(500)
            //     });
            // }
            // let attachmentList = response.attachmentList
            let attachmentList = getVendorDocuments.map(data => ({
                id: data.id,
                filepath: data.filePath,
                attachmentName: data.clientVendorAttachmentName,
                encryptionKey : data.encryptionKey,
                encryptionIV : data.encryptionIV,
                fileName : data.fileName,
                apiName : req.baseUrl,
                vendorId : partnerId,
                clientId : data.clientId,
                clientUuid : data?.filePath?.split('/')[2],
                userType : 'SU'
            }));
            let dataToPass = getVendorRegistrationForm[0]
            dataToPass['temporaryCode'] = dataToPass.tempId
            delete dataToPass.uuid
            delete dataToPass.bankId
            delete dataToPass.countryId
            delete dataToPass.stateId
            delete dataToPass.cityId
            delete dataToPass.isSubmitted
            delete dataToPass.isFormValidated
            delete dataToPass.formMode
            delete dataToPass.tempId
            delete dataToPass.vendorStatusName
            delete dataToPass.vendorStatusId
            let pdf = await vendorCommonFunction.createPdfFormWithDummyValues(dataToPass, attachmentList, '', '')
            console.log(pdf)
            if(!pdf.result)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : pdf?.error,
                    "status_name" : getCode.getStatus(500)
                });
            }
            else
            {
                // let documentTimelineUploadToLocal
                let pdfBytes = pdf.fileBytes
                let fileName = pdf.fileName
                let documentTimelineUpload = await vendorCommonFunction.documentTimelineUploadToLocal(pdfBytes, getPath.getName('vendor'), partnerUuid + '/' + getPath.getName('vendor/documentTimeline'), fileName)
                if(!documentTimelineUpload.result)
                {
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message"     : documentTimelineUpload?.error,
                        "status_name" : getCode.getStatus(500)
                    });
                }
                else
                {
                    let filePath = documentTimelineUpload.filePath
                    let status = 'temp'
                    let saveDocument = await db.saveDocumentTimeline(fileName, partnerId, status, new Date(), userId, filePath)
                    if(saveDocument?.affectedRows > 0)
                    {
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message"     : "success",
                            "data" : { "id" : saveDocument.insertId},
                            "status_name" : getCode.getStatus(200)
                        });
    
                    }
                    else
                    {
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message"     : "Document timeline not saved",
                            "status_name" : getCode.getStatus(500)
                        });
                    }
                }
            }
        }
        else  if(vendorStatusName == 'Document-Validated')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor documents validation already completed.",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'On-Boarded')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor is already on-boarded.",
                "status_name" : getCode.getStatus(400)
            });
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : e?.stack || e?.message || e,
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
})

async function getAttachmentList(documents, start, end, attachmentList, partnerUuid)
{
    try
    {
        if(start < end)
        {
            let doc = documents[start];

            if(doc.fileName)
            {
                let filepath = await vendorCommonFunction.getFilePath(getPath.getName('vendor'), doc.fileName, partnerUuid + '/' + getPath.getName('vendor/uploadDocuments'), '' )
    
                attachmentList.push({id : doc.id, filepath : filepath, attachmentName : doc.clientVendorAttachmentName})
            }
            start++
            return getAttachmentList(documents, start, end, attachmentList, partnerUuid)
        }
        else
        {
            return {results: true, "attachmentList": attachmentList}
        }
    }
    catch (e)
    {
        console.log(e)
        return {results: false, error: e?.stack || e?.message || e}
    }
}



async function getFileTFromS3VendorModule(file, vendorUuid, clientId, vendorId)
{
    try
    {
        let encryptedData = await uniqueFunction.encryptFileBuffer(file.filepath, file.originalFilename,null, null, 'file')
        if(encryptedData?.result)
        {
            let s3Folder = 'vendor/' + vendorUuid + '/registrationDocs'
            let uploadFiles = await uniqueFunction.uploadVendorModulesFiles(encryptedData?.file, file.originalFilename, s3Folder)
            
            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', vendorId, '', file?.size, apiName, 'S3', new Date(), clientId, file.originalFilename)
            if(uploadFiles && uploadFiles.result == true)
            {
                return {"result" : true, "filePath" : uploadFiles.s3FilePath, "encryptionKey" : encryptedData?.encriptionKey,  "encryptionIV" : encryptedData?.encriptionIV}
            }
            else
            {
                return {"result" : false}
            }
        }
        else
        {
            return {"result" : false}
        }
    }
    catch (e)
    {
        console.log(e)
        return {"result" : false}
    }
}


async function getfunc()
{
    try
    {
        let getFilePath;
        let id;
        let encriptionKey;
        let encriptionIV;
        let apiName = ''

        id = req.params.id
        apiName = req.baseUrl
        getFilePath = await db.getUploadedFilePath(id)
        if(getFilePath.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Provide valid Data",
                "status_name" : getCode.getStatus(500)
            });
        }
        else
        {
            const params = {
                Bucket: bucketName,
                Key: getFilePath[0].filePath
            };
            let fileName = getFilePath[0].fileName
            let fileExtension = fileName.split('.')[1]
            let mimeType = await db.getMimeType(fileExtension)
            let encryptKey = getFilePath
            if(encryptKey?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Encription key not found for file",
                    "status_name" : getCode.getStatus(500)
                })
            }
            else
            {
                encriptionKey = encryptKey[0].encryption_key
                encriptionIV = encryptKey[0].encryption_iv
            }
            s3.getObject(params,async function(err, data) 
            {
                if (err) 
                {
                    console.error('Error list:', err);
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message"     : "File Not Found",
                        "status_name" : getCode.getStatus(500)
                    });
                } 
                else 
                {
                    let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', getFilePath[0]?.partnerId, getFilePath[0]?.locationId, data?.ContentLength, apiName, 'S3', new Date(), getFilePath[0].filePath.split('/')[1], fileName)
                    let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName,encriptionKey, encriptionIV)
                    if(decryptedData?.result)
                    {
                        let base64data = "data:" + mimeType[0].mime + ";base64," + decryptedData?.file.toString('base64');
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message"     : "success",
                            "data"        : {"file" : base64data},
                            "status_name" : getCode.getStatus(200)
                        });
                    }
                    else
                    {
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message"     : "File Not Decrypted",
                            "status_name" : getCode.getStatus(500)
                        });
                    }
                }
            })
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
}