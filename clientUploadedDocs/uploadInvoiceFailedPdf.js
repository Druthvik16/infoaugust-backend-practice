let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let fs = require('fs')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let clientUuid;
let documentFailedFolderPath = 'Rejected_Invoice_Pdfs_Raw_Sap_dump'
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
let inputFolderPath = 'Input_Invoice_Pdfs_Raw_Sap_dump';
const bucketName = process.env.Bucket_Name;
const folderName = process.env.currentFolder
let fileObject = {};
let fileName;
let encriptionIV;
let encriptionKey;
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "invoicePdfLogFile-"
let fileStoreTo = process.env.fileStoreTo
let s3SourceFilePathListObject = ''
let apiName = ''
let botName = 'invoicePdfBot'

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        logFileName = "invoicePdfLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        apiName = req.baseUrl
        if(!req.body?.clientUuid || !req.body.fileName)
        {
            await uniqueFunction.writeLogIntoFile("Provide all values", logFileName, req.body.fileName, getPath.getName('script/invoice/pdf'), 'red')
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        clientUuid = req.body?.clientUuid
        fileName = req.body?.fileName
        let encryptKey = await db.getEncryptionData(fileName)
        if(encryptKey?.length == 0)
        {
            await uniqueFunction.writeLogIntoFile("Encription key not found" + "________________" + JSON.stringify(encryptKey), logFileName, fileName, getPath.getName('script/invoice/pdf'), 'red')
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Encription key not found",
                "status_name" : getCode.getStatus(500)
            })
        }
        else
        {
            encriptionKey = encryptKey[0].encryption_key
            encriptionIV = encryptKey[0].encryption_iv
            s3SourceFilePathListObject = folderName + clientUuid + "/" + inputFolderPath + "/" + fileName            
            if(fileStoreTo == 'S3BUCKET')
            {
                getFileFromS3bucket(s3SourceFilePathListObject, fileName, clientUuid, res)
            }
            else
            {
                
                let fileP = getPath.getName('documentFolders') + '/' + clientUuid + "/" + inputFolderPath + "/" + fileName
                getFileFromLocal(fileP, fileName, clientUuid, res)
            }
        }
    } 
    catch(e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileName, getPath.getName('script/invoice/pdf'), 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Invoice failed pdf not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
})

async function getFileFromS3bucket(s3SourceFilePathListObject, fileName, clientUuid, res)
{
    try
    {
        const params = 
        {
            Bucket: bucketName,
            Key: s3SourceFilePathListObject
        };
        // Copy the object to the new location
        s3.getObject(params, async function(err, data) 
        {
            if (err) 
            {
                console.error("Error copying object: ", err);
                await uniqueFunction.writeLogIntoFile("Error copying object: " + JSON.stringify(err?.stack), logFileName, fileName, getPath.getName('script/invoice/pdf'), 'red')
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : err?.stack,
                    "status_name" : getCode.getStatus(500)
                }) 
            } 
            else
            {   
                let saveDataTransactLog = await db.saveDataTransactLog('DN', 'SU', '', '',data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)                 
                await uniqueFunction.writeLogIntoFile("Successfully get object for delete failed files : " + s3SourceFilePathListObject, logFileName, fileName, getPath.getName('script/invoice/pdf'), 'green')
                console.log("Successfully get failed object");
                let updatePdfBotLogLastActive = await db.updatePdfBotLogLastActive(new Date(), botName)
                let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(data?.Body,fileName,clientUuid, documentFailedFolderPath )
                if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
                {                            
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
                    const deleteParams = {
                        Bucket: bucketName,
                        Key : s3SourceFilePathListObject
                    };
                    
                    // let uploadFileToS3Bucket = {s3FilePath : ""} 

                    s3.deleteObject(deleteParams, async function(err, data) 
                    {
                        if (err) 
                        {
                            console.error("Error deleting object: ", err);
                            await uniqueFunction.writeLogIntoFile("Error deleting object: " + JSON.stringify(err?.stack), logFileName, fileName, getPath.getName('script/invoice/pdf'), 'red')
                            res.status(500)
                            return res.json({
                                "status_code" : 500,
                                "message" : err?.stack,
                                "status_name" : getCode.getStatus(500)
                            }) 
                        } 
                        else 
                        {
                            let sql = `UPDATE upload_doc_log_master SET status = 'Failed', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = UPPER('${fileName}')`
                            
                            db.updateUploadDocLogMaster(sql, [new Date()]).then(async (updateLog) => 
                            {
                                await uniqueFunction.writeLogIntoFile("Failed Pdf File Moved To : " + uploadFileToS3Bucket?.s3FilePath, logFileName, fileName, getPath.getName('script/invoice/pdf'), 'blue')
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
                    await uniqueFunction.writeLogIntoFile("Invoice failed pdf not uploaded ", logFileName, fileName, getPath.getName('script/invoice/pdf'), 'red')
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "Invoice failed pdf not uploaded",
                        "status_name" : getCode.getStatus(500)
                    }) 
                }
            }
        });
    }
    catch (e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileName, getPath.getName('script/invoice/pdf'), 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Invoice failed pdf not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
}

async function getFileFromLocal(s3SourceFilePathListObject, fileName, clientUuid, res)
{
    try
    {
        let data = fs.readFileSync(s3SourceFilePathListObject)               
        await uniqueFunction.writeLogIntoFile("Successfully get object for delete failed files : " + s3SourceFilePathListObject, logFileName, fileName, getPath.getName('script/invoice/pdf'), 'green')
        console.log("Successfully get failed object");
        let updatePdfBotLogLastActive = await db.updatePdfBotLogLastActive(new Date(), botName)
        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(data,fileName,clientUuid, documentFailedFolderPath )
        if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
        {
            // let uploadFileToS3Bucket = {s3FilePath : ""}
            let stat = fs.statSync(s3SourceFilePathListObject)
            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',stat?.size, apiName, 'S3', new Date(), clientUuid, fileName)
            uniqueFunction.removeFileFromDirectory(s3SourceFilePathListObject)
            let sql = `UPDATE upload_doc_log_master SET status = 'Failed', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = UPPER('${fileName}')`;
            db.updateUploadDocLogMaster(sql, [new Date()]).then(async (updateLog) => 
            {
                await uniqueFunction.writeLogIntoFile("Failed Pdf File Moved To : " + uploadFileToS3Bucket?.s3FilePath, logFileName, fileName, getPath.getName('script/invoice/pdf'), 'blue')
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
            await uniqueFunction.writeLogIntoFile("Invoice failed pdf not uploaded ", logFileName, fileName, getPath.getName('script/invoice/pdf'), 'red')
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Invoice failed pdf not uploaded",
                "status_name" : getCode.getStatus(500)
            }) 
        }
    }
    catch (e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileName, getPath.getName('script/invoice/pdf'), 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Invoice failed pdf not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
}