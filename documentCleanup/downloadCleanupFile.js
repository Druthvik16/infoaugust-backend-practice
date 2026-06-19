const express = require('express');
const db = require('./dbQueryDocumentCleanup');
const router = express.Router();
const documentCleanupFileFolderPath = 'Document_Cleanup_Files';
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
const folderName = process.env.currentFolder;
const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';


module.exports = router.get('/:id',async(req,res) => 
{
    try
    {        
        const id = req.params.id
        const apiName = req.baseUrl
        const getFilePath = await db.getDocumentCleanupJob(id)

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
            const fileName = getFilePath.file_name
            const clientUuid = getFilePath.client_uuid
            const s3FilePath = folderName + clientUuid + "/" + documentCleanupFileFolderPath + "/" + fileName;

            const params = {
                Bucket: bucketName,
                Key: s3FilePath
            };
            const data = await s3.getObject(params).promise()
        
            let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', null, null, data?.ContentLength, apiName, 'S3', new Date(), s3FilePath.split('/')[1], fileName)
           
            let base64data = "data:" + mimeType + ";base64," + data?.Body?.toString('base64');
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"file" : base64data},
                "status_name" : getCode.getStatus(200)
            });                           
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
