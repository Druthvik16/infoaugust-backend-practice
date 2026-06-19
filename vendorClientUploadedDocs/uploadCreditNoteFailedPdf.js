let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let fs = require('fs')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let clientUuid;
let documentFailedFolderPath = 'Rejected_Pdfs'
let inputFolderPath = 'Input_Pdfs';
let fileName;
let encriptionIV;
let encriptionKey;
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "creditNotePdfLogFile-"
let s3SourceFilePathListObject = ''
let apiName = ''
let botName = 'creditNotePdfBot'
const logFilePath = getPath.getName('vendor/script/creditNote/pdf')
const vendorModuleClientPath = '/' + uniqueFunction.vendorModule + 'client'

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        logFileName = "creditNotePdfLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10)
        apiName = req.baseUrl
        if(!req.body?.clientUuid || !req.body.fileName)
        {
            await uniqueFunction.writeLogIntoFile("Provide all values", logFileName, req.body.fileName, logFilePath, 'red')
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
            await uniqueFunction.writeLogIntoFile("Encription key not found" + "________________" + JSON.stringify(encryptKey), logFileName, fileName, logFilePath, 'red')
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
            let fileP = getPath.getName('documentFolders') + vendorModuleClientPath + '/' + clientUuid + "/" + inputFolderPath + "/" + fileName
            getFileFromLocal(fileP, fileName, clientUuid, res)            
        }
    } 
    catch(e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileName, logFilePath, 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Credit Note failed pdf not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
})

async function getFileFromLocal(s3SourceFilePathListObject, fileName, clientUuid, res)
{
    try
    {
        let data = fs.readFileSync(s3SourceFilePathListObject)               
        await uniqueFunction.writeLogIntoFile("Successfully get object for delete failed files : " + s3SourceFilePathListObject, logFileName, fileName, logFilePath, 'green')
        console.log("Successfully get failed object");        
        let updatePdfBotLogLastActive = await db.updatePdfBotLogLastActive(new Date(), botName)
        let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(data,fileName,clientUuid, documentFailedFolderPath )
        if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
        {
            
        // let uploadFileToS3Bucket = {s3FilePath : ""}


            let stat = fs.statSync(s3SourceFilePathListObject)
            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',stat?.size, apiName, 'S3', new Date(), clientUuid, fileName)
            uniqueFunction.removeFileFromDirectory(s3SourceFilePathListObject)
            let sql = `UPDATE client_vendor_upload_doc_log_master SET status = 'Failed', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = UPPER('${fileName}')`;
            db.updateUploadDocLogMaster(sql, [new Date()]).then(async (updateLog) => 
            {
                await uniqueFunction.writeLogIntoFile("Failed Pdf File Moved To : " + uploadFileToS3Bucket?.s3FilePath, logFileName, fileName, logFilePath, 'blue')
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
            await uniqueFunction.writeLogIntoFile("Credit Note failed pdf not uploaded ", logFileName, fileName, logFilePath, 'red')
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Credit Note failed pdf not uploaded",
                "status_name" : getCode.getStatus(500)
            }) 
        }
    }
    catch (e)
    {
        console.log(e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileName, logFilePath, 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Credit Note failed pdf not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
}