let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const mime = require('mime')
const bucketName = process.env.Bucket_Name;
module.exports = require('express').Router().get('/:id',async(req,res) => 
{
    try
    {
        const apiName = req.baseUrl        
        const id = req.params.id
        const userTypeCode = req.body.roleCode || null
        const getFilePath = await db.getUploadedFilePath(id)
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
            const fileName = getFilePath[0].fileName           
            const encryptionKey = getFilePath[0].encryptionKey
            const encryptionIV = getFilePath[0].encryptionIV
            const clientUuid = getFilePath[0].clientUuid
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
                    let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', 0, 0, data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
                    let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName,encryptionKey, encryptionIV)
                    if(decryptedData?.result)
                    {
                        let base64data = "data:" + mime.getType(fileName) + ";base64," + decryptedData?.file.toString('base64');
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