let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
const alasql = require('alasql')
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
module.exports = require('express').Router().get('/:spsnUuid/:action/:id/:partnerLocationUuids?/:fromDate?/:toDate?/:monthPeriod?', async (req, res) => {
    try {
        const id = req.params.id || null;
        const partnerLocationUuids = req.query.partnerLocationUuids || null;
        const monthPeriod = req.query.monthPeriod || null;
        const spsnUuid = req.params.spsnUuid || null;
        const action = req.params.action || null;
        const apiName = req.baseUrl
        const userId = req.body.userId;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;

        if (!id || !action) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            });
        }

        const spsn = await db.getSpsnData(spsnUuid);
        if(spsn?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Spsn not found",
                "status_name": getCode.getStatus(400)
            });
        }
        // const partnerLocation = await db.getPartnerlocationUuidCode(partnerLocationUuids);
        // const partnerLocationCodes = partnerLocation?.map(item => item.code)?.join(',')?.replace(/,/g, "','") || null;
        const spsnCode = spsn[0].code
        const spsnId = spsn[0].id
        const partnerLocation = await db.getPartnerlocationUuidCode(partnerLocationUuids);
        let partnerLocationCodes = partnerLocationUuids ? partnerLocation.map(item => item.code).join(',')?.replace(/,/g, "','") || null : null
        if (partnerLocationUuids && partnerLocationCodes?.length == 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Partner location not found",
                "status_name": getCode.getStatus(400)
            });
        }
        /// For all spsn location
        if (!partnerLocationCodes) {
            const spsnPartnerLocations = await db.getPartnerlocationCodeOfSpsn(spsnId)
            partnerLocationCodes = spsnPartnerLocations.map(item => item.code).join(',')?.replace(/,/g, "','") || null
        }

        if(partnerLocationCodes?.length == 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "No active partner location for SPSN",
                "status_name": getCode.getStatus(400)
            })
        }

        const getClientUploadedSpsnDocuments = await db.getClientUploadedSpsnDocuments(id)
        if (getClientUploadedSpsnDocuments.length == 0) {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "Provide valid Data",
                "status_name": getCode.getStatus(500)
            });
        }
        else {
            const params = {
                Bucket: bucketName,
                Key: getClientUploadedSpsnDocuments[0].filePath
            };
            const fileName = getClientUploadedSpsnDocuments[0].fileName
            const encryptionKey = getClientUploadedSpsnDocuments[0].encryptionKey
            const encryptionIV = getClientUploadedSpsnDocuments[0].encryptionIV
            const clientUuid = getClientUploadedSpsnDocuments[0].clientUuid
            // const spsnCode = getClientUploadedSpsnDocuments[0].spsnCode
            // const jsonDataArray = [];
            const data = await s3.getObject(params).promise();
            let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', userId, 0, data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
            const decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName, encryptionKey, encryptionIV)
            // jsonDataArray.push(...JSON.parse(decryptedData.file.toString('utf-8')));
            const jsonDataArray = JSON.parse(decryptedData?.file.toString('utf-8'))
            // console.log(jsonDataArray)

            let sql = `SELECT *  
                        FROM ? 
                        WHERE `
// \`SPSN\`='${spsnCode}'

            if (action == 'OS') {
                if (partnerLocationCodes) sql += ` Customer IN ('${partnerLocationCodes}') `
                if (fromDate) sql += ` AND DATE(\`Posting Date\`) >= DATE('${fromDate}')  `;
                if (toDate) sql += ` AND DATE(\`Posting Date\`) <= DATE('${toDate}')  `;
            }
            else {
                if (partnerLocationCodes) sql += ` \`Customer Number\` IN ('${partnerLocationCodes}') `
                if (monthPeriod) sql += ` AND MONTH(DATE(\`Clearing Doc Date\`)) = MONTH(DATE('${monthPeriod}')) `;
                if (fromDate) sql += ` AND DATE(\`Clearing Doc Date\`) >= DATE('${fromDate}') `;
                if (toDate) sql += ` AND DATE(\`Clearing Doc Date\`) <= DATE('${toDate}') `;
            }


            let jsonData = alasql(sql, [jsonDataArray], (data, err) => {
                console.log(err)
            })
            // console.log(jsonData)

            const finalJsonData = jsonData.map(item => {
                item.SPSN = spsnCode; // Update the SPSN value
                return item;
              });

            const worksheet = XLSX.utils.json_to_sheet(finalJsonData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            // Set headers for file download
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Send the buffer as the response
            res.send(buffer);
            res.end();
        }
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