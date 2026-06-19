let errorCode = require('../common/error/errorCode')
let db = require('./dbQueryClientUploadedDocs')
let fs = require('fs')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "invoicePdfLogFile-"
let fileStoreTo = process.env.fileStoreTo


module.exports = require('express').Router().post('/',async(req,res) => 
{
    try 
    { 
        let filePath;
        logFileName = "invoicePdfLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        console.log(req.body)
        if(!req.body.filePath)
        {
            await uniqueFunction.writeLogIntoFile("Provide all values : FilePath Missing", logFileName, "Get Invoice Pdf File", getPath.getName('s3/invoice/pdf'), 'red')
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        filePath = req.body.filePath
        if(fileStoreTo == 'S3BUCKET')
        {
            getFileFromS3bucket(filePath, res)
        }
        else
        {
            getFileFromLocal(filePath, res)
        }
        // const params = {
        //     Bucket: bucketName,
        //     Key : filePath
        // };
        // s3.getObject(params,async(err, fileObj) =>
        // {
        //     if (err) 
        //     {
        //         await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "Get Invoice Pdf File : " + filePath, getPath.getName('s3/invoice/pdf'), 'red')
        //         console.error('Error list:', err);
        //         res.status(500)
        //         return res.json({
        //             "status_code" : 500,
        //             "message" : "Error",
        //             "status_name" : getCode.getStatus(500),
        //             "error"     :      err?.stack
        //         }) 
        //     } 
        //     else 
        //     {   
        //         const fileName = filePath.split('/').pop();
        //         let encryptKey = await db.getEncryptionData(fileName)
        //         if(encryptKey?.length == 0)
        //         {
        //             await uniqueFunction.writeLogIntoFile("Encription key not found for file", logFileName, "Get Invoice Pdf File : " + fileName, getPath.getName('s3/invoice/pdf'), 'red')
        //             res.status(500)
        //             return res.json({
        //                 "status_code" : 500,
        //                 "message" : "Encription key not found for file",
        //                 "status_name" : getCode.getStatus(500)
        //             })
        //         }
        //         else
        //         {
        //             encriptionKey = encryptKey[0].encryption_key
        //             encriptionIV = encryptKey[0].encryption_iv
        //             let decryptedData = await uniqueFunction.decryptFileBuffer(fileObj?.Body, fileName,encriptionKey, encriptionIV)
        //             if(decryptedData?.result)
        //             {
        //                 let sql = `UPDATE upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileName?.toUpperCase()}'`
        //                 let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                        
        //                 fs.writeFileSync("clientUploadedDocs/"+fileName,decryptedData?.file)
        //                 fileObj['originalFilename'] = fileName;
        //                 await uniqueFunction.writeLogIntoFile("File Downloaded by Bot Process", logFileName, "Get Invoice Pdf File : " + fileName, getPath.getName('s3/invoice/pdf'), 'green')
        //                 res.sendFile(__dirname+"/"+fileName)
        //             }
        //             else
        //             {
        //                 await uniqueFunction.writeLogIntoFile("File Not Decrypted", logFileName, "Get Invoice Pdf File : " + fileName, getPath.getName('s3/invoice/pdf'), 'red')
        //                 res.status(500)
        //                 return res.json({
        //                     "status_code" : 500,
        //                     "message"     : "File Not Decrypted",
        //                     "status_name" : getCode.getStatus(500)
        //                 });  
        //             }
        //         }
        //     }   
        // }) 
    }
    catch(e)
    {
        console.log("e************", e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Invoice Pdf File Catch", getPath.getName('s3/invoice/pdf'), 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack
        });
    } 
})

async function getFileFromS3bucket(filePath, res)
{
    try
    {
        const params = {
            Bucket: bucketName,
            Key : filePath
        };
        s3.getObject(params,async(err, fileObj) =>
        {
            if (err) 
            {
                await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "Get Invoice Pdf File : " + filePath, getPath.getName('s3/invoice/pdf'), 'red')
                console.error('Error list:', err);
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Error",
                    "status_name" : getCode.getStatus(500),
                    "error"     :      err?.stack
                }) 
            } 
            else 
            {   
                sendFile(filePath, fileObj, res)
            }   
        })
    }
    catch(e)
    {
        console.log("e************", e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Invoice Pdf File Catch", getPath.getName('s3/invoice/pdf'), 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack
        });
    } 
}

async function getFileFromLocal(filePath, res)
{
    try
    {
        let file = fs.readFileSync(filePath)
        sendFile(filePath, {"Body" : file}, res)
    }
    catch(e)
    {
        console.log("e************", e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Invoice Pdf File Catch", getPath.getName('s3/invoice/pdf'), 'red')
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
            await uniqueFunction.writeLogIntoFile("Encription key not found for file", logFileName, "Get Invoice Pdf File : " + fileName, getPath.getName('s3/invoice/pdf'), 'red')
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Encription key not found for file",
                "status_name" : getCode.getStatus(500)
            })
        }
        else
        {
            let encriptionKey = encryptKey[0].encryption_key
            let encriptionIV = encryptKey[0].encryption_iv
            let decryptedData = await uniqueFunction.decryptFileBuffer(fileObj?.Body, fileName,encriptionKey, encriptionIV)
            if(decryptedData?.result)
            {
                let sql = `UPDATE upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileName?.toUpperCase()}'`
                let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                
                fs.writeFileSync("clientUploadedDocs/"+fileName,decryptedData?.file)
                fileObj['originalFilename'] = fileName;
                await uniqueFunction.writeLogIntoFile("File Downloaded by Bot Process", logFileName, "Get Invoice Pdf File : " + fileName, getPath.getName('s3/invoice/pdf'), 'green')
                // res.sendFile(__dirname+"/"+fileName)
                const fileStream = fs.createReadStream(__dirname+"/"+fileName);
                fileStream.pipe(res);
                res.on('finish', () => {
                    uniqueFunction.removeFileFromDirectory(__dirname+"/"+fileName)
                });
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("File Not Decrypted", logFileName, "Get Invoice Pdf File : " + fileName, getPath.getName('s3/invoice/pdf'), 'red')
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "File Not Decrypted",
                    "status_name" : getCode.getStatus(500)
                });  
            }
        }
    }
    catch(e)
    {
        console.log("e************", e)
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Invoice Pdf File Catch", getPath.getName('s3/invoice/pdf'), 'red')
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error" : e?.stack
        });
    } 

}
