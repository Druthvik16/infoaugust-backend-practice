let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
let apiName = ''
module.exports = require('express').Router().get('/:id',async(req,res) => 
{
    try
    {
        let id = req.params.id
        apiName = req.baseUrl
        let getFilePath;
        let encriptionKey;
        let encriptionIV;
        getFilePath = await db.getDocumentTimeline(id)
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
                Key: getFilePath[0].uploadedFilePath
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
                encriptionKey = encryptKey[0].encryptionKey
                encriptionIV = encryptKey[0].encryptionIV
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
                    let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', getFilePath[0]?.vendorId, '', data?.ContentLength, apiName, 'S3', new Date(), getFilePath[0].uploadedFilePath.split('/')[1], fileName)
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
})