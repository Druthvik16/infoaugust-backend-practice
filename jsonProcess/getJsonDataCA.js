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
        let filePath = path.join(__dirname, '../bucket/ca.json');
        let json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(json);
    }
    else
    {
        const { financialYear, clientUuid } = req.query;

        let bucketName = process.env.Bucket_Name;
        let result = await db.getS3FileDetailsCA(financialYear, clientUuid);
        if(result.length == 0){
            return res.status(400).json({
                "status_code" : 400,
                "message" : "No data found",
                "error"     : "No data found"
            })
        }
        let {file_name,file_path, encryption_key, encryption_iv} = result[0] || {};
        s3.getObject({Bucket: bucketName, Key: file_path},async function(err, data) 
        {
            if (err) 
            {
                console.error('Error list:', err);
                res.status(500)
            }
            else
            {
                let decryptedData = uniqueFunction.decryptFileBuffer(data.Body, file_name, encryption_key, encryption_iv);
                decryptedData = await decryptedData;
                if (!decryptedData?.file) {
                    return res.status(500).send({ error: 'Decryption failed' });
                }
                try {
                    const jsonData = JSON.parse(decryptedData.file.toString('utf8'));
                    res.json(jsonData);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    res.status(500).send({ error: 'Failed to parse decrypted data' });
                }
            }
        });
    }
});

module.exports = getJsonData;