let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
let fs = require('fs')
// let getFilePath;
// let id;
// let action;
// let apiName = ''
module.exports = require('express').Router().get('/:id/:action',async(req,res) => 
{
    try
    {
        let encriptionKey;
        let encriptionIV;
        let id = req.params.id
        let action = req.params.action
        let apiName = req.baseUrl
        let getFilePath = await db.getFilePath(id)
        console.log(action, getFilePath)
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
            let folderPath = ''
            folderPath = action == 'failed' ? getFilePath[0].failedFilePath : action == 'uploaded' ? getFilePath[0].processedFilePath : getFilePath[0].localFilePath
            const params = {
                Bucket: bucketName,
                Key: folderPath
            };
            let fileName = getFilePath[0].fileName
            let fileExtension = fileName.split('.')[1]
            let mimeType = await db.getMimeType(fileExtension)
            let encryptKey = await db.getEncryptionData(fileName)
            console.log(encryptKey)
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
            if(action == 'synced')
            {
                let fileContent = fs.readFileSync(folderPath)
                let decryptedData = await uniqueFunction.decryptFileBuffer(fileContent, fileName,encriptionKey, encriptionIV)
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
            else
            {
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
                        let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', null, null, data?.ContentLength, apiName, 'S3', new Date(), folderPath.split('/')[2], fileName)
                        console.log(data?.Body, fileName,encriptionKey, encriptionIV)
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
})