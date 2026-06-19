let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const alasql = require('alasql')
const xlsx = require('xlsx')
const fs = require('fs')
const bucketName = process.env.Bucket_Name;
module.exports = require('express').Router().get('/:financialYearId?/:clientUuid?/:spsnUuid?/:fromDate?/:toDate?/:customerCodes?/:selectedSpsnUuid?', async (req, res) => {
    try {
        const apiName = req.baseUrl
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const clientUuid = req.query.clientUuid || null;
        const financialYearId = req.query.financialYearId || null;
        const spsnUuid = req.query.spsnUuid || null;
        const userId = req.body.userId || null;
        const loggedUserType = req.body.loggedUserType;
        const userType = req.body.roleCode ? req.body.roleCode : loggedUserType;
        let customerCodes = req.query.customerCodes || null;
        const selectedSpsnUuid = req.query.selectedSpsnUuid || ''
        // console.log(req.query)

        
        const userDesignation = req.body.loggedUserType || null;

        if (!fromDate || !toDate || !clientUuid || !spsnUuid || !financialYearId) 
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            }) 
        }
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

        let spsn = null;
        let userFoundType = ''

        if (['ASM', 'RSM', 'NSM'].includes(userDesignation))
        {
            spsn = await db.getExtendedUser(spsnUuid);
            userFoundType = userDesignation;
        }
        else
        {
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

        
        if(!customerCodes || customerCodes?.length == 0)
        {
            const spsnPartnerLocations = ['ASM', 'RSM', 'NSM'].includes(userDesignation) ? await db.getPartnerlocationCodeOfExtendedUser(spsnId, selectedSpsnUuid) : await db.getPartnerlocationCodeOfSpsn(spsnId)
            customerCodes = spsnPartnerLocations.map(item => item.code).join(',')
        }

        if(customerCodes?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "SPSN Partner location not found",
                "status_name": getCode.getStatus(400)
            })
        }

        let monthDiff = await getMonthDifference(new Date(fromDate), new Date(toDate));
        if (monthDiff >= 3) {
            const status = 'pending';
            const saveLedgerQueue = await db.saveLedgerQueue(fromDate, toDate, clientId, new Date(), userId, status, customerCodes, userType, financialYearId)
            if (saveLedgerQueue?.affectedRows > 0) {
                res.status(200)
                return res.json({
                    "status_code": 200,
                    "message": "Date range exceeds 3 months. Your request is queued, and the file will be available soon.",
                    "status_name": getCode.getStatus(200)
                });
            }
            else {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Ledger queue not created",
                    "status_name": getCode.getStatus(500)
                });
            }

        }
        else {
            const ledgerJSONFileMaster = await db.getLedgerJsonFileMaster(clientId, financialYearId);
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
                    
                    let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', 0, 0, data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
                    let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName, encryptionKey, encryptionIV)

                    const file = decryptedData?.file

                    if (customerCodes) {
                        const ids = customerCodes.replace(/,/g, "','")
                        customerCodes = ids
                    }

                    const customerOpeningBalances = await db.getOpeningBalance(customerCodes, financialYearId) 
                    // const file = fs.readFileSync('./ledger.json');
                    const jsonData = JSON.parse(file.toString('utf-8'));

                    let sqlToSelectOpeningBalance = `
                    SELECT Customer, opening_balance FROM (SELECT 
                        jd.Customer,          
                        (SUM(COALESCE(jd.\`Debit Amount\`, 0)) + SUM(COALESCE(jd.\`Credit Amount\`, 0))) AS opening_balance                  
                    FROM ? jd 
                    WHERE 
                        DATE(jd.\`Posting Date\`) < DATE('${fromDate}') 
                    AND    
                        (jd.\`Posting Date\` IS NOT NULL OR jd.\`Posting Date\` != '' OR jd.\`Posting Date\` != '**-**-****' OR jd.\`Posting Date\` != undefined)
                    AND jd.Customer IN ('${customerCodes}') 
                    GROUP BY jd.Customer
                    UNION
                    SELECT 
                        ojd.customerCode AS Customer,          
                        ROUND(AVG(CAST(COALESCE(ojd.openingBalance,0) AS FLOAT)),2) AS opening_balance                  
                    FROM ? ojd       
                    WHERE ojd.customerCode IN ('${customerCodes}')    
                    GROUP BY ojd.customerCode)         
                `;

                    let sql = `SELECT * FROM ? WHERE Customer IS NOT NULL `;
                    if (fromDate) sql += ` AND DATE(\`Posting Date\`) >= DATE('${fromDate}') `;
                    if (toDate) sql += ` AND DATE(\`Posting Date\`) <= DATE('${toDate}') `;
                    if (customerCodes) sql += ` AND Customer IN ('${customerCodes}') `;
                    
                    sql += ` ORDER BY Customer, \`Posting Date\``;

                      console.log(sql);

                        const filteredData = alasql(sql, [jsonData]);
                        const unionOpeningBalances = alasql(sqlToSelectOpeningBalance, [jsonData, customerOpeningBalances]);
                    // console.log("filteredData")

                    
                    let sqlSelectOpeningBalance = `
                    SELECT ojd.Customer, SUM(COALESCE(ojd.opening_balance, 0))   opening_balance                                   
                    FROM ? ojd 
                    GROUP BY ojd.Customer       
                `;

                   const openingBalances = alasql(sqlSelectOpeningBalance, [unionOpeningBalances]);

                    // console.log(openingBalances);
                    console.log(filteredData);

                    const openingBalanceMap = {};
                    openingBalances.forEach(balance => {
                        openingBalanceMap[balance.Customer] = balance.opening_balance;
                    });

                    const formattedData = [];
                    const columns = [
                        "Customer", "Customer Name", "Posting Date", "Doc. No.", "Document Type",
                        "Document Type. Descr", "Assignment No.", "Debit Amount", "Credit Amount",
                        "Balance", "Openning Balance", "Text", "Bill No./Ref. No.",
                        "Reference Number", "Doc./Inv Date", "Speical G/L"
                    ];

                    const uniqueCustomers = [...new Set(filteredData.map(row => row.Customer))];
                    uniqueCustomers.forEach(customer => {
                        // const customerData = filteredData.filter(row => row.Customer === customer);

                        const customerData = filteredData.filter(row => {
                            delete row?.financialYearId
                            delete row?.uploadedDocId
                            delete row?.clientUploadedMasterId
                            delete row?.createdOn
                            return row.Customer === customer
                        });

                        if (customerData.length > 0) {
                            const separatorRow = {};
                            columns.forEach(col => col == "Document Type. Descr" ? separatorRow[col] = 'Opennig Balance' : separatorRow[col] = '********');
                            if (openingBalanceMap[customer] && openingBalanceMap[customer] > 0) {
                                separatorRow['Debit Amount'] = openingBalanceMap[customer] || '0';
                            }
                            else {
                                separatorRow['Credit Amount'] = openingBalanceMap[customer] || '0';
                            }
                            separatorRow['Balance'] = openingBalanceMap[customer] || '0';
                            formattedData.push(separatorRow);
                            formattedData.push(...customerData);
                        }
                    });

                    const ws = xlsx.utils.json_to_sheet(formattedData, { header: columns });
                    const wb = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(wb, ws, 'LedgerData');

                    // const outputFileName = './tempFiles/ledger_output.xlsx';
                    // xlsx.writeFile(wb, outputFileName);

                    // res.download(outputFileName, 'ledger_output_temp.xlsx', (err) => {
                    //     if (err) {
                    //         console.error('Error downloading file:', err);
                    //         res.status(500).send('Error generating file');
                    //     }
                    // });

                    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

                    // Set headers for file download
                    res.setHeader('Content-Disposition', 'attachment; filename="ledger_output.xlsx"');
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                
                    // Send the buffer as the response
                    res.send(buffer);
                    res.end();
                }
            })
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

async function getMonthDifference(startDate, endDate) {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();

    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endDay = endDate.getDate();
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
    const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();

    const dayFraction = (endDay - startDay) / daysInStartMonth;
    return (totalMonths + dayFraction).toFixed(1);
}