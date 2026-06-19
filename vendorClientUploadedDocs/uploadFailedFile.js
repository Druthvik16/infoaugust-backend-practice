let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let clientUuid;
        let documentFailedFolderPath;
        let fileObject = {};
        let encriptionIV;
        let encriptionKey;
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
                console.log(error);
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
            clientUuid = JSON.parse(req.body.client[0])?.uuid
            documentFailedFolderPath = req.body.documentFailedFolderPath[0]
            let encryptKey = await db.getEncryptionData(fileObject.uploadFile.originalFilename)
            if(encryptKey?.length == 0)
            {
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Encription key not found",
                    "data" : JSON.stringify(fileObject),
                    "status_name" : getCode.getStatus(500)
                })
            }
            else
            {
                encriptionKey = encryptKey[0].encryption_key
                encriptionIV = encryptKey[0].encryption_iv
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileObject.uploadFile.originalFilename,encriptionKey, encriptionIV, 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, fileObject.uploadFile.originalFilename, clientUuid, documentFailedFolderPath)
                    if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
                    {
                        let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadFile?.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadFile.originalFilename)

                        let sql = `UPDATE client_vendor_upload_doc_log_master SET failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadFile.originalFilename?.toUpperCase()}'`
                        let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
        
                        // let saveClientUploadedDocDetail = await db.saveClientUploadedDocDetail(fileObject.uploadFile.originalFilename, s3FilePath, saveClientUploadedDocMaster.insertId, documentAttachmentId, createdOn) 
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
                            "message" : "Failed file not uploaded",
                            "status_name" : getCode.getStatus(500)
                        }) 
                    } 
                }
                else
                {
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "File not encrypted",
                        "status_name" : getCode.getStatus(500)
                    })  
                }
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
            "message" : "Failed file not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
})
