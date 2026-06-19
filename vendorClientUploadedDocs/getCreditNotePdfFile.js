let errorCode = require('../common/error/errorCode')
let db = require('./dbQueryClientUploadedDocs')
let fs = require('fs')
let getCode = new errorCode()

const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "creditNotePdfLogFile-"
let fileStoreTo = process.env.fileStoreTo
let logFilePath = getPath.getName('vendor/s3/creditNote/pdf')

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try 
    { 
        let filePath;
        logFileName = "creditNotePdfLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        console.log(req.body)
        if(!req.body.filePath)
        {
            await uniqueFunction.writeLogIntoFile("Provide all values : FilePath Missing", logFileName, "Get Credit Note Pdf File", logFilePath, 'red')
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        filePath = req.body.filePath
        getFileFromLocal(filePath, res) 
    }
    catch(e)
    {
        console.log("e************", e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Credit Note Pdf File Catch", logFilePath, 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack
        });
    } 
})

async function getFileFromLocal(filePath, res)
{
    try
    {
        let file = fs.readFileSync(filePath)
        sendFile(filePath, {"Body" : file}, res)
    }
    catch (e)
    {
        console.log("e************", e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Credit Note Pdf File Catch (local)", logFilePath, 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack
        });

    }
}


async function sendFile(filePath, fileObj, res)
{
    try
    { 
        const fileName = filePath.split('/').pop();
        let encryptKey = await db.getEncryptionData(fileName)
        if(encryptKey?.length == 0)
        {
            await uniqueFunction.writeLogIntoFile("Encryption key not found for file", logFileName, "Get Credit Note Pdf File : " + fileName, logFilePath, 'red')
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Encryption key not found for file",
                "status_name" : getCode.getStatus(500)
            })
        }
        else
        {
            let encryptionKey = encryptKey[0].encryption_key
            let encryptionIV = encryptKey[0].encryption_iv
            let decryptedData = await uniqueFunction.decryptFileBuffer(fileObj?.Body, fileName,encryptionKey, encryptionIV)
            if(decryptedData?.result)
            {
                let sql = `UPDATE client_vendor_upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileName.toUpperCase()}'`
                let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])                
                fs.writeFileSync("vendorClientUploadedDocs/"+fileName,decryptedData?.file)
                fileObj['originalFilename'] = fileName;
                await uniqueFunction.writeLogIntoFile("File Downloaded by Bot Process", logFileName, "Get Credit Note Pdf File : " + fileName, logFilePath, 'green')
                // res.sendFile(__dirname+"/"+fileName)
                const fileStream = fs.createReadStream(__dirname+"/"+fileName);
                fileStream.pipe(res);
                res.on('finish', () => {
                    uniqueFunction.removeFileFromDirectory(__dirname+"/"+fileName)
                });
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("File Not Decrypted", logFileName, "Get Credit Note Pdf File : " + fileName, logFilePath, 'red')
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "File Not Decrypted",
                    "status_name" : getCode.getStatus(500)
                });  
            }
        }
    }
    catch (e)
    {
        console.log("e************", e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Credit Note Pdf File Catch", logFilePath, 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack
        });
    }

}