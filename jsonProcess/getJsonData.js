const express = require('express');
const getJsonData = express.Router();
const fs = require('fs');
const path = require('path');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction.js');
const db = require('./dbJsonProcess.js');
const s3 = require('../awsS3BucketConfig/s3BucketConnection.js');
getJsonData.get('/', async (req, res) => {
    const environment = "qa";

    if(environment == "local")
    {
        let filePath = path.join(__dirname, '../ledger.jsondecrypted.json');
        let json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(json);
    }
    else
    {
        const { financialYear, clientUuid } = req.query;
        console.log("environment", environment);
        let bucketName = process.env.Bucket_Name;
        console.log("bucketName", bucketName);
        let result = await db.getS3FileDetails(financialYear, clientUuid);
        console.log("result", result);
        let {file_name,file_path, encryption_key, encryption_iv} = result[0];
        console.log("file_name", file_name);
        console.log("encryption_key", encryption_key);
        console.log("encryption_iv", encryption_iv);
        let filePath = path.join(bucketName, file_path);
        console.log("filePath", filePath);
        s3.getObject({Bucket: bucketName, Key: file_path},async function(err, data) 
        {
            if (err) 
            {
                console.error('Error list:', err);
                res.status(500)
            }
            else
            {
                let decryptedData = uniqueFunction.decryptFileBuffer(data?.Body, file_name, encryption_key, encryption_iv);
                decryptedData = await decryptedData;
                console.log("decryptedData", decryptedData);
                let json = JSON.parse(decryptedData?.file.toString('utf8'));
                res.json(json);
            }
        });
    }
});

module.exports = getJsonData;