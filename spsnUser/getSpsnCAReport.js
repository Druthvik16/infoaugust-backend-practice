let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode();
let fs = require('fs');
let alasql = require('alasql');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const bucketName = process.env.Bucket_Name;
const keysToRemove = ['filePath', 'encryptionKey', 'encryptionIV', 'monthPeriodToMatch']
let apiName = ''

module.exports = require('express').Router().get('/:financialYearId?/:clientUuid?/:spsnUuid?/:partnerLocationUuids?/:fromDate?/:toDate?/:selectedSpsnUuid?', async (req, res) => {
    try {
        const financialYearId = req.query.financialYearId || null;
        const clientUuid = req.query.clientUuid || null;
        const spsnUuid = req.query.spsnUuid || null;
        const partnerLocationUuids = req.query.partnerLocationUuids || null;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        apiName = req.baseUrl
        const documentCategoryCode = 'CA'
        const userTypeCode = req.body.roleCode || null
        const selectedSpsnUuid = req.query.selectedSpsnUuid;


        const userDesignation = req.body.loggedUserType || null;

        // if(fromDate && toDate)
        // {
        //     let fromMonth = new Date(fromDate).getMonth()
        //     let toMonth = new Date(toDate).getMonth()
        //     console.log(fromMonth, toMonth);
        //     if(fromMonth != toMonth)
        //     {
        //         res.status(400)
        //         return res.json({
        //             "status_code" : 400,
        //             "message" : "From Date and To Date should be the same month",
        //             "status_name" : getCode.getStatus(400)
        //         }) 
        //     }
        // }

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
        // console.log(partnerLocationCodes)
        let uploadedOn = ''
        const getSpsnCAReport = await db.getSpsnOSAndCAReport(financialYearId, clientUuid, fromDate, toDate, spsnUuid, uploadedOn, documentCategoryCode)

        // console.log(getSpsnCAReport)

        if (getSpsnCAReport.length == 0) {
            res.status(200)
            return res.json({
                "status_code": 200,
                "message": "success",
                "data": { "adjustmentReports": [] },
                "status_name": getCode.getStatus(200)
            });
        }
        else {
            // const encryptKey = getSpsnCAReport[0]?.encryptionKey
            // const encryptIV = getSpsnCAReport[0]?.encryptionIV
            // let fileName = getSpsnCAReport[0].fileName
            // const params = {
            //     Bucket: bucketName,
            //     Key: getSpsnCAReport[0].filePath
            // };

            // if(!encryptKey || encryptKey?.length == 0)
            // {
            //     res.status(500)
            //     return res.json({
            //         "status_code" : 500,
            //         "message" : "Encryption key not found for file",
            //         "status_name" : getCode.getStatus(500)
            //     })
            // }

            // const data = await s3.getObject(params).promise()
            // let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', getSpsnCAReport[0]?.financialYearId, 0,  data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
            // let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName,encryptKey, encryptIV)
            // delete getSpsnCAReport[0].encryptionKey;
            // delete getSpsnCAReport[0].encryptionIV;
            // delete getSpsnCAReport[0].filePath

            // if(decryptedData?.result)
            // {
            //     let jsonData =  JSON.parse(decryptedData?.file.toString());

            // //     let sql = `SELECT *
            // //    FROM ? 
            // //    WHERE \`SPSN\`='${spsnCode}' LIMIT 1;`

            // //    const spsnExist = alasql(sql, [jsonData], (data, err) => {
            // //     console.log(err)
            // //     })

            // //     if(spsnExist.length == 0)
            // //     {
            // //         res.status(200)
            // //         return res.json({
            // //             "status_code" : 200,
            // //             "message"     : "success",
            // //             "data"        : {"adjustmentReports" : []},
            // //             "status_name" : getCode.getStatus(200)
            // //         });
            // //     }

            //     // fs.writeFileSync('./tempCAReport.json', JSON.stringify(jsonData, null, 2));


            //                                 // SUM(CAST(\`Adjusted Amount\` AS FLOAT)) AS adjustedAmount 


            //     let sqlToSelectAmount = `SELECT     
            //                              CONCAT(MONTH(DATE(\`Clearing Doc Date\`)),'-',YEAR(DATE(\`Clearing Doc Date\`))) AS monthPeriod,   
            //                                 COALESCE(SUM(CAST(\`Adjusted Amount\` AS FLOAT)), 0) AS adjustedAmount
            //                             FROM ? 
            //                             WHERE \`SPSN\`='${spsnCode}' `

            //                             // AND \`Clearing Doc Date\` IS NOT NULL AND \`Clearing Doc Date\` != '' AND \`Clearing Doc Date\` != undefined 

            //     if(partnerLocationCodes?.length > 0)
            //     {
            //         let codes = partnerLocationCodes.replace(/,/g, "','")  
            //         partnerLocationCodes = codes
            //         sqlToSelectAmount = sqlToSelectAmount + ` AND \`Customer Number\` IN ('${partnerLocationCodes}')`
            //     }


            //     if (fromDate) sqlToSelectAmount += ` AND DATE(\`Clearing Doc Date\`) >= DATE('${fromDate}') `;
            //     if (toDate) sqlToSelectAmount += ` AND DATE(\`Clearing Doc Date\`) <= DATE('${toDate}') `;

            //     sqlToSelectAmount += ` GROUP BY CONCAT(MONTH(DATE(\`Clearing Doc Date\`)),'-',YEAR(DATE(\`Clearing Doc Date\`)))  `;


            //     console.log(sqlToSelectAmount);

            //     let adjustedAmounts = alasql(sqlToSelectAmount, [jsonData], (data, err) => {
            //         console.log(err)
            //     })


            //     console.log("adjustedAmounts", adjustedAmounts)

            //     const lookup = new Map();
            //     adjustedAmounts.forEach(item => {
            //       lookup.set(item.monthPeriod, item);
            //     });

            //     let adjustmentReport = getSpsnCAReport.map(item1 => {
            //       const matchingItem = lookup.get(item1.monthPeriodToMatch) || {"adjustedAmount" : 0};
            //       delete matchingItem?.monthPeriod
            //       const newJson =  {
            //         ...item1,
            //         ...matchingItem, 
            //       };
            //       return newJson
            //     });


            //     // adjustedAmounts.forEach(item2 => {
            //     //   if (!lookup.has(item2.monthPeriod)) {
            //     //     delete item2?.monthPeriod
            //     //     adjustmentReport.push(item2);
            //     //   }
            //     // });

            //     const cleanedData = adjustmentReport.map(item => {
            //         const newItem = { ...item };
            //         keysToRemove.forEach(key => delete newItem[key]);
            //         return newItem;
            //     });


            // if (!partnerLocationCodes || partnerLocationCodes?.length == 0) {
            //     const codes = await db.getPartnerlocationCodeOfSpsn(spsnId)
            //     let locationCodes = codes.map((location) => location.code)
            //     locationCodes = locationCodes?.length > 0 ? locationCodes : []
            //     partnerLocationCodes = locationCodes.join(",")
            // }


            if (partnerLocationCodes?.length == 0) {
                res.status(200)
                return res.json({
                    "status_code": 200,
                    "remark": "No active partner location for SPSN",
                    "message": "success",
                    "data": { "adjustmentReports": [], "lastUploadedOn": uploadedOn },
                    "status_name": getCode.getStatus(200)
                })
            }
            let result = await getFilesFromS3(getSpsnCAReport, 0, getSpsnCAReport.length, clientUuid, [], spsnCode, partnerLocationCodes, fromDate, toDate)

            if (result?.result) {
                res.status(200)
                return res.json({
                    "status_code": 200,
                    "message": "success",
                    "data": { "adjustmentReports": result.finalResponse, "lastUploadedOn": uploadedOn },
                    "status_name": getCode.getStatus(200)
                });
            }
            else {
                res.status(200)
                return res.json({
                    "status_code": 200,
                    "message": "success",
                    "data": { "adjustmentReports": [], "lastUploadedOn": uploadedOn },
                    "status_name": getCode.getStatus(200)
                });
            }
            // }
            // else
            // {
            //     res.status(500)
            //     return res.json({
            //         "status_code" : 500,
            //         "message"     : "File Not Decrypted",
            //         "status_name" : getCode.getStatus(500)
            //     });
            // }
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


async function getFilesFromS3(getSpsnCAReport, start, end, clientUuid, finalResponse, spsnCode, partnerLocationCodes, fromDate, toDate) {
    try {
        if (start < end) {
            let file = getSpsnCAReport[start]
            const encryptKey = file?.encryptionKey
            const encryptIV = file?.encryptionIV
            let fileName = file.fileName
            const params = {
                Bucket: bucketName,
                Key: file.filePath
            };

            if (!encryptKey || encryptKey?.length == 0) {
                start++
                return (getFilesFromS3(getSpsnCAReport, start, end, clientUuid, finalResponse, spsnCode, partnerLocationCodes, fromDate, toDate))
            }

            const data = await s3.getObject(params).promise()
            let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', file?.financialYearId, 0, data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
            let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName, encryptKey, encryptIV)
            delete file.encryptionKey;
            delete file.encryptionIV;
            delete file.filePath

            if (decryptedData?.result) {
                let jsonData = JSON.parse(decryptedData?.file.toString());

                // fs.writeFileSync('./tempCAReport.json', JSON.stringify(jsonData, null, 2));
                //  CONCAT(MONTH(DATE(\`Clearing Doc Date\`)),'-',YEAR(DATE(\`Clearing Doc Date\`))) AS monthPeriod,  
                let sqlToSelectAmount = `SELECT  CONCAT(MONTH(DATE(\`Clearing Doc Date\`)),'-',YEAR(DATE(\`Clearing Doc Date\`))) AS monthPeriod,   
                                         
                                            COALESCE(SUM(CAST(\`Adjusted Amount\` AS FLOAT)), 0) AS adjustedAmount
                                        FROM ? 
                                        WHERE `

                // \`SPSN\`='${spsnCode}' 
                if (partnerLocationCodes?.length > 0) {
                    let codes = partnerLocationCodes.replace(/,/g, "','")
                    partnerLocationCodes = codes
                    sqlToSelectAmount = sqlToSelectAmount + `  \`Customer Number\` IN ('${partnerLocationCodes}')`
                }
                let fromMonth = null;
                let fromYear = null;
                let toMonth = null;
                let toYear = null;

                if (fromDate) {
                    fromMonth = new Date(fromDate)?.getMonth() + 1
                    fromYear = new Date(fromDate)?.getFullYear()
                    console.log(fromMonth, fromYear)
                    fromYear = '2024'
                }

                // if (fromDate) sqlToSelectAmount += ` AND MONTH(DATE(\`Clearing Doc Date\`)) = MONTH(DATE('${fromDate}')) AND YEAR(DATE(\`Clearing Doc Date\`)) = YEAR(DATE('${fromDate}'))`;
                if (fromDate) sqlToSelectAmount += ` AND MONTH(DATE(\`Clearing Doc Date\`)) = ${fromMonth} `;

                // AND YEAR(DATE(\`Clearing Doc Date\`)) = ${fromYear}

                // if (toDate) sqlToSelectAmount += ` AND MONTH(DATE(\`Clearing Doc Date\`)) <= MONTH(DATE('${toDate}')) `;

                sqlToSelectAmount += ` GROUP BY CONCAT(MONTH(DATE(\`Clearing Doc Date\`)),'-',YEAR(DATE(\`Clearing Doc Date\`)))  `;


                console.log(sqlToSelectAmount);

                let adjustedAmounts = alasql(sqlToSelectAmount, [jsonData], (data, err) => {
                    console.log(err)
                })
                const monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ];

                // Optimized transformation for large datasets
                for (let i = 0; i < adjustedAmounts.length; i++) {
                    const [month, year] = adjustedAmounts[i].monthPeriod.split('-');
                    adjustedAmounts[i].monthPeriod = `${monthNames[month - 1]}-${year}`;
                    adjustedAmounts[i].monthDate = `${year}-${month < 10 ? '0' + month : month}-01`;
                }

                console.log("adjustedAmounts", adjustedAmounts)

                // const lookup = new Map();
                // adjustedAmounts.forEach(item => {
                //     lookup.set(item.monthPeriod, item);
                // });

                // let adjustmentReport = [file].map(item1 => {
                //     const matchingItem = lookup.get(item1.monthPeriodToMatch) || { "adjustedAmount": 0 };
                //     delete matchingItem?.monthPeriod
                //     const newJson = {
                //         ...item1,
                //         ...matchingItem,
                //     };
                //     return newJson
                // });

                let adjustmentReport = adjustedAmounts.map(item => {
                    return { ...item, ...file }
                })

                const cleanedData = adjustmentReport.map(item => {
                    const newItem = { ...item };
                    keysToRemove.forEach(key => delete newItem[key]);
                    return newItem;
                });

                finalResponse = [...finalResponse, ...cleanedData]
                return (getFilesFromS3(getSpsnCAReport, start, end, clientUuid, finalResponse, spsnCode, partnerLocationCodes, fromDate, toDate))

            }
            else {
                start++
                return (getFilesFromS3(getSpsnCAReport, start, end, clientUuid, finalResponse, spsnCode, partnerLocationCodes, fromDate, toDate))
            }
        }
        else {
            return { result: true, finalResponse }
        }
    }
    catch (e) {
        console.log(e)
        return (getFilesFromS3(getSpsnCAReport, start, end, clientUuid, finalResponse, spsnCode, partnerLocationCodes, fromDate, toDate))
    }
}