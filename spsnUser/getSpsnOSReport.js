let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let fs = require('fs');
let alasql = require('alasql');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const bucketName = process.env.Bucket_Name;
const keysToRemove = ['filePath', 'encryptionKey', 'encryptionIV', 'monthPeriod', 'monthPeriodToMatch']

module.exports = require('express').Router().get('/:financialYearId?/:clientUuid?/:spsnUuid?/:partnerLocationUuids?/:fromDate?/:toDate?/:selectedSpsnUuid?', async (req, res) => {
    try {
        const financialYearId = req.query.financialYearId || null;
        const clientUuid = req.query.clientUuid || null;
        const spsnUuid = req.query.spsnUuid || null;
        const partnerLocationUuids = req.query.partnerLocationUuids || null;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const apiName = req.baseUrl
        const documentCategoryCode = 'OS'
        const userTypeCode = req.body.roleCode || null
        const selectedSpsnUuid = req.query.selectedSpsnUuid || ''


        const userDesignation = req.body.loggedUserType || null;

        if (!financialYearId || !clientUuid || !spsnUuid) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide required data",
                "status_name": getCode.getStatus(400)
            })
        }

        let spsn = null;
        let userFoundType = ''

        if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {
            spsn = await db.getExtendedUser(spsnUuid);
            userFoundType = userDesignation;
        }
        else {
            spsn = await db.getSpsnData(spsnUuid);
            userFoundType = 'SPSN';
        }

        if (spsn?.length == 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `${userFoundType} not found`,
                "status_name": getCode.getStatus(400)
            })
        }


        const spsnCode = spsn[0].code
        const spsnId = spsn[0].id
        const partnerLocation = await db.getPartnerlocationUuidCode(partnerLocationUuids);
        let partnerLocationCodes = partnerLocationUuids ? partnerLocation.map(item => item.code).join(',') : null
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
            // const spsnPartnerLocations = await db.getPartnerlocationCodeOfSpsn(spsnId)

            const spsnPartnerLocations = ['ASM', 'RSM', 'NSM'].includes(userDesignation) ? await db.getPartnerlocationCodeOfExtendedUser(spsnId, selectedSpsnUuid) : await db.getPartnerlocationCodeOfSpsn(spsnId)
            partnerLocationCodes = spsnPartnerLocations.map(item => item.code).join(',')
        }

        // if(partnerLocationCodes?.length == 0) {
        //     res.status(400)
        //     return res.json({
        //         "status_code": 400,
        //         "message": "No active partner location for SPSN",
        //         "status_name": getCode.getStatus(400)
        //     })
        // }
        if (partnerLocationCodes?.length == 0) {
            res.status(200)
            return res.json({
                "status_code": 200,
                "remark": "No active partner location for SPSN",
                "message": "success",
                "data": { "outstandingReport": [] },
                "status_name": getCode.getStatus(200)
            })
        }


        let uploadedOn = ''
        const getSpsnOSReport = await db.getSpsnOSAndCAReport(financialYearId, clientUuid, fromDate, toDate, spsnUuid, uploadedOn, documentCategoryCode)

        if (getSpsnOSReport.length == 0) {
            res.status(200)
            return res.json({
                "status_code": 200,
                "message": "success",
                "data": { "outstandingReport": [] },
                "status_name": getCode.getStatus(200)
            });
        }
        else {

            // if (!partnerLocationCodes || partnerLocationCodes?.length == 0) {
            //     const codes = await db.getPartnerLocationCodes()
            //     let locationCodes = codes.map((location) => location.code)
            //     locationCodes = locationCodes?.length > 0 ? locationCodes : []
            //     partnerLocationCodes = locationCodes.join(",")
            // }
            const encryptKey = getSpsnOSReport[0]?.encryptionKey
            const encryptIV = getSpsnOSReport[0]?.encryptionIV
            let fileName = getSpsnOSReport[0].fileName
            const params = {
                Bucket: bucketName,
                Key: getSpsnOSReport[0].filePath
            };

            if (!encryptKey || encryptKey?.length == 0) {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Encryption key not found for file",
                    "status_name": getCode.getStatus(500)
                })
            }
            const data = await s3.getObject(params).promise()
            let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', getSpsnOSReport[0]?.financialYearId, 0, data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
            let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName, encryptKey, encryptIV)
            delete getSpsnOSReport[0].encryptionKey;
            delete getSpsnOSReport[0].encryptionIV;
            delete getSpsnOSReport[0].filePath

            if (decryptedData?.result) {
                let jsonData = JSON.parse(decryptedData?.file.toString());

                //     let sql = `SELECT *
                //    FROM ? 
                //    WHERE \`SPSN\`='${spsnCode}' LIMIT 1;`

                //    const spsnExist = alasql(sql, [jsonData], (data, err) => {
                //     console.log(err)
                //     })

                //     if(spsnExist.length == 0)
                //     {
                //         res.status(200)
                //         return res.json({
                //             "status_code" : 200,
                //             "message"     : "success",
                //             "data"        : {"outstandingReport" : []},
                //             "status_name" : getCode.getStatus(200)
                //         });
                //     }

                let sqlToSelectAmount = `SELECT 
                                            COALESCE(SUM(CAST(\`Pending Amount\` AS FLOAT)),0) AS pendingAmount 
                                        FROM ? 
                                        WHERE `
                // \`SPSN\`='${spsnCode}'
                if (partnerLocationCodes?.length > 0) {
                    let codes = partnerLocationCodes.replace(/,/g, "','")
                    partnerLocationCodes = codes
                    sqlToSelectAmount = sqlToSelectAmount + ` Customer IN ('${partnerLocationCodes}') `
                }

                if (fromDate) sqlToSelectAmount += ` AND DATE(\`Posting Date\`) >= DATE('${fromDate}')  `;
                if (toDate) sqlToSelectAmount += ` AND DATE(\`Posting Date\`) <= DATE('${toDate}')  `;

                console.log(sqlToSelectAmount)

                let jsonQuery = alasql(sqlToSelectAmount, [jsonData], (data, err) => {
                    console.log(err)
                })
                console.log(jsonQuery)

                const cleanedData = getSpsnOSReport.map(item => {
                    const newItem = { ...item };
                    keysToRemove.forEach(key => delete newItem[key]);
                    return newItem;
                });

                let tempAmount = jsonQuery.length == 0 ? [{ "pendingAmount": 0 }] : jsonQuery
                console.log(tempAmount, jsonQuery)

                res.status(200)
                return res.json({
                    "status_code": 200,
                    "message": "success",
                    "data": { "outstandingReport": [{ ...cleanedData[0], ...tempAmount[0] }], "lastUploadedOn": uploadedOn },
                    "status_name": getCode.getStatus(200)
                });
            }
            else {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "File Not Decrypted",
                    "status_name": getCode.getStatus(500)
                });
            }
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