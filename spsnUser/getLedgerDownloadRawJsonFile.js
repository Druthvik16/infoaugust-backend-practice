let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const bucketName = process.env.Bucket_Name;
module.exports = require('express').Router().get('/:clientUuid?/:fromDate?/:toDate?/:customerCodes?', async (req, res) => {
    try {
        const clientUuid = req.query.clientUuid || null;
        
        const client = await db.getClient(clientUuid);
        if (client?.length == 0) {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "Client Not Found",
                "status_name": getCode.getStatus(500)
            });
        }
        const clientId = client[0]?.id
        const ledgerJSONFileMaster = await db.getLedgerJsonFileMaster(clientId);
        if (ledgerJSONFileMaster?.length == 0) {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "Ledger json file not found",
                "status_name": getCode.getStatus(500)
            });
        }

            const ledgerMasterId = ledgerJSONFileMaster[0]?.id
            const fileName = ledgerJSONFileMaster[0]?.fileName
            const filePath = ledgerJSONFileMaster[0]?.filePath
            const encryptionKey = ledgerJSONFileMaster[0]?.encryptionKey
            const encryptionIV = ledgerJSONFileMaster[0]?.encryptionIv


            const params = {
                Bucket: bucketName,
                Key: filePath
            };

            s3.getObject(params, async function (err, data) {
                if (err) {
                    console.error('Error list:', err);
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": err?.stack,
                        "status_name": getCode.getStatus(500)
                    });
                }
                else {
                    let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName, encryptionKey, encryptionIV)

                    const file = decryptedData?.file

                  
                }
            })
        
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "No Data Found",
            "status_name": getCode.getStatus(500),
            "error": e?.stack
        });
    }
})