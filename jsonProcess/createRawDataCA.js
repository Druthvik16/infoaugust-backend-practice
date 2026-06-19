const express = require('express');
const createRawData = express.Router();
const s3 = require('../awsS3BucketConfig/s3BucketConnection.js');
const db = require('./dbJsonProcess.js');
const bodyParser = require('body-parser');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction.js');

createRawData.post('/', async (req, res) => {
    try {
        const {data, financialYear, clientUuid} = req.body;
        const bucketName = process.env.Bucket_Name;
        const result = await db.getS3FileDetailsCA(financialYear, clientUuid);
        if (!result || !result.length) {
            return res.status(500).send({ error: 'No S3 file details found in the database.' });
        }
        const { file_path, file_name, encryption_key, encryption_iv } = result[0];

        const prefix = file_path.split('/').slice(0, -1).join('/');
        const fileName = file_path.split('/').pop().replace('.json', '');
        // Step 1: List files in the directory
        const listedObjects = await s3.listObjectsV2({
            Bucket: bucketName,
            Prefix: prefix
        }).promise();

        const caFiles = listedObjects.Contents

        // Step 2: Rename previous ledger.json if it exists
        const oldFileKey = file_path;
        const newFileKey = `${prefix}/${fileName}_${caFiles.length}.json`;

        const fileExists = caFiles.some(obj => obj.Key === oldFileKey);
        // Ensure data is properly formatted JSON string
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        // Create buffer from the JSON string
        const dataBuffer = Buffer.from(dataString);
        let encryptedData = uniqueFunction.encryptFileBuffer(dataBuffer, file_name, encryption_key, encryption_iv);
        encryptedData = await encryptedData;
        let fileData = encryptedData?.file;
        if (!fileData) {
            return res.status(500).send({ error: 'Encryption failed' });
        }
        if (fileExists) {
            // Copy old file to new name
            await s3.copyObject({
                Bucket: bucketName,
                CopySource: encodeURIComponent(`${bucketName}/${oldFileKey}`),
                Key: newFileKey
            }).promise();

            // Delete the old file
            await s3.deleteObject({
                Bucket: bucketName,
                Key: oldFileKey
            }).promise();
        }

        // Step 3: Upload new ca.json
        await s3.putObject({
            Bucket: bucketName,
            Key: oldFileKey,
            Body: fileData,
            ContentType: 'application/octet-stream'
        }).promise();

        res.status(200).send({
            message: 'ca.json created and old file (if any) renamed successfully.',
            newBackupFile: newFileKey
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to create or rename ca file.' });
    }
});

module.exports = createRawData;