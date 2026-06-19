let axios = require('axios')
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
let db = require('./dbQuerySpsn')
let fs = require('fs');
const xlsx = require('xlsx');
const alasql = require('alasql');
let mime = require('mime')
let path = require('path')
let apiUrl = require('../apiUrl')
let api = new apiUrl()
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');
const bucketName = process.env.Bucket_Name;
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const { console } = require('inspector');
const sourceFolder = 'Uploaded_Ledger_Download_File'
// const spsnModule = 'spsnModule-dev/' //'spsnModule/'
const spsnModule = uniqueFunction.spsnModule //'spsnModule/'


async function startProcessing(data) {
    try {
        data['outputFileName'] = `ledger_${data.task.id}_${new Date().toISOString().slice(0, 10).replace('T', ' ')}.xlsx`;

        let sql = `UPDATE ledger_download_queue SET status = 'in_progress', started_on = ? WHERE id IN (${data.task.id})`
        let update = await db.updateLedgerDownloadQueueStatus(sql, new Date())
        const clientUuid = data.task.clientUuid
        const fromDate = data.task?.fromDate ? new Date(data.task.fromDate).toISOString().slice(0, 10).replace('T', ' ') : null;
        const toDate = data.task?.toDate ? new Date(data.task.toDate).toISOString().slice(0, 10).replace('T', ' ') : null;
        const clientId = data.task.clientId
        const financialYearId = data.task.financialYearId
        let getLedgerMaster = await db.getLedgerMaster(clientId, financialYearId)
        if(getLedgerMaster?.length == 0)
        {
            let sql = `UPDATE ledger_download_queue SET status = 'failed', remark = 'Ledger master file not found' WHERE id IN (${data.task.id})`
            let update = await db.updateLedgerDownloadQueueStatus(sql, new Date())
            parentPort.postMessage({ action: "terminate" })
        }

        createLedgerDocumentXlsx(data, getLedgerMaster)
    }
    catch (e) {
        console.log(e)
        let sql = `UPDATE ledger_download_queue SET status = 'pending' WHERE id IN (${data.task.id})`
        let update = await db.updateLedgerDownloadQueueStatus(sql, new Date())
        parentPort.postMessage({ action: "terminate" })
    }
}
async function createLedgerDocumentXlsx(masterEntry, getLedgerMaster)
{
    try
    { 
        const outputFileName = masterEntry?.outputFileName
        const id = masterEntry?.task.id
        const clientUuid = masterEntry.task.clientUuid
        const fromDate = masterEntry.task?.fromDate ? new Date(masterEntry.task.fromDate).toISOString().slice(0, 10).replace('T', ' ') : null;
        const toDate = masterEntry.task?.toDate ? new Date(masterEntry.task.toDate).toISOString().slice(0, 10).replace('T', ' ') : null;
        const clientId = masterEntry.task.clientId
        const financialYearId = masterEntry.task.financialYearId
        let customerCodes = masterEntry.task.partnerLocationCodes || null;
        const ledgerJSONFileMaster = getLedgerMaster
        const ledgerMasterId = ledgerJSONFileMaster[0]?.id
        const fileName = ledgerJSONFileMaster[0]?.fileName
        const filePath = ledgerJSONFileMaster[0]?.filePath
        const encryptionKey = ledgerJSONFileMaster[0]?.encryptionKey
        const encryptionIV = ledgerJSONFileMaster[0]?.encryptionIV

        const params = {
            Bucket: bucketName,
            Key: filePath
        };

        const data = await s3.getObject(params).promise()    
        let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName, encryptionKey, encryptionIV)

        const file = decryptedData?.file

        if (customerCodes) {
            const ids = customerCodes
                .replace(/,/g, "','")
            customerCodes = ids
        }
        const customerOpeningBalances = await db.getOpeningBalance(customerCodes, financialYearId) 
        const jsonData = JSON.parse(file.toString('utf-8'));

        // let sqlToSelectOpeningBalance = `
        //                                 SELECT 
        //                                     Customer,            
        //                                     SUM(COALESCE(\`Debit Amount\`, 0)) AS total_debit,
        //                                     SUM(COALESCE(\`Credit Amount\`, 0)) AS total_credit,
        //                                     (SUM(COALESCE(\`Debit Amount\`, 0)) + SUM(COALESCE(\`Credit Amount\`, 0)) +  SUM(COALESCE(CAST(\`Openning Balance\` AS FLOAT), 0))) AS opening_balance                  
        //                                 FROM ? 
        //                                 WHERE 
        //                                     DATE(\`Posting Date\`) < DATE('${fromDate}') 
        //                                 AND    
        //                                     (\`Posting Date\` IS NOT NULL OR \`Posting Date\` != '' OR \`Posting Date\` != '**-**-****' OR \`Posting Date\` != undefined)
        //                             `;



        ////////////////////////////// from here///////////////////
        
    //     let sqlToSelectOpeningBalance = `
    //     SELECT 
    //         jd.Customer,         
    //         SUM(COALESCE(jd.\`Debit Amount\`, 0)) AS total_debit,
    //         SUM(COALESCE(jd.\`Credit Amount\`, 0)) AS total_credit,
    //         (SUM(COALESCE(jd.\`Debit Amount\`, 0)) + SUM(COALESCE(jd.\`Credit Amount\`, 0)) + ROUND(AVG(CAST(COALESCE(ojd.openingBalance,0) AS FLOAT)),2)) AS opening_balance                  
    //     FROM ? jd
    //     LEFT JOIN ? AS ojd ON ojd.customerCode = jd.Customer 
    //     WHERE 
    //         DATE(jd.\`Posting Date\`) < DATE('${fromDate}') 
    //     AND    
    //         (jd.\`Posting Date\` IS NOT NULL OR jd.\`Posting Date\` != '' OR jd.\`Posting Date\` != '**-**-****' OR jd.\`Posting Date\` != undefined)
    // `;

    //     if (customerCodes) sqlToSelectOpeningBalance += ` AND jd.Customer IN ('${customerCodes}') `;
    //     sqlToSelectOpeningBalance += ` GROUP BY jd.Customer, ojd.\`Openning Balance\` `;

    //     let sql = `SELECT * FROM ? WHERE Customer IS NOT NULL `;
    //     if (fromDate) sql += ` AND DATE(\`Posting Date\`) >= DATE('${fromDate}') `;
    //     if (toDate) sql += ` AND DATE(\`Posting Date\`) <= DATE('${toDate}') `;
    //     if (customerCodes) sql += ` AND Customer IN ('${customerCodes}') `;

    //     const filteredData = alasql(sql, [jsonData]);
    //     const openingBalances = alasql(sqlToSelectOpeningBalance, [jsonData, customerOpeningBalances]);


    /////////////////// to here ///////////////////////

    
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
    
                        // let sqlToSelectOpeningBalance = `
                        //                                 SELECT 
                        //                                     jd.Customer,          
                        //                                     SUM(COALESCE(jd.\`Debit Amount\`, 0)) AS total_debit,
                        //                                     SUM(COALESCE(jd.\`Credit Amount\`, 0)) AS total_credit,
                        //                                     (SUM(COALESCE(jd.\`Debit Amount\`, 0)) + SUM(COALESCE(jd.\`Credit Amount\`, 0)) + ROUND(AVG(CAST(COALESCE(ojd.openingBalance,0) AS FLOAT)),2)) AS opening_balance                  
                        //                                 FROM ? jd
                        //                                 LEFT JOIN ? AS ojd ON ojd.customerCode = jd.Customer 
                        //                                 WHERE 
                        //                                     DATE(jd.\`Posting Date\`) < DATE('${fromDate}') 
                        //                                 AND    
                        //                                     (jd.\`Posting Date\` IS NOT NULL OR jd.\`Posting Date\` != '' OR jd.\`Posting Date\` != '**-**-****' OR jd.\`Posting Date\` != undefined)
                        //                             `;
    
    
                        // if (customerCodes) sqlToSelectOpeningBalance += ` AND jd.Customer IN ('${customerCodes}') `;
                        // sqlToSelectOpeningBalance += ` GROUP BY jd.Customer, ojd.\`Openning Balance\``;
    
                        let sql = `SELECT * FROM ? WHERE Customer IS NOT NULL `;
                        if (fromDate) sql += ` AND DATE(\`Posting Date\`) >= DATE('${fromDate}') `;
                        if (toDate) sql += ` AND DATE(\`Posting Date\`) <= DATE('${toDate}') `;
                        if (customerCodes) sql += ` AND Customer IN ('${customerCodes}') `;

                        sql += ` ORDER BY Customer, \`Posting Date\``;
    
                        //   console.log(sqlToSelectOpeningBalance, sql);
    
                            const filteredData = alasql(sql, [jsonData]);
                            const unionOpeningBalances = alasql(sqlToSelectOpeningBalance, [jsonData, customerOpeningBalances]);
                        // console.log("filteredData")
    
                        
                        let sqlSelectOpeningBalance = `
                        SELECT ojd.Customer, SUM(COALESCE(ojd.opening_balance, 0))   opening_balance                                   
                        FROM ? ojd 
                        GROUP BY ojd.Customer       
                    `;
    
                       const openingBalances = alasql(sqlSelectOpeningBalance, [unionOpeningBalances]);
    
                       

        fs.writeFileSync('./ledger.json', JSON.stringify(jsonData, null, 2));

        console.log(openingBalances)

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
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const encryptedData = await uniqueFunction.encryptFileBuffer(buffer, outputFileName, null, null, 'Buffer')        
        const newFilePath = spsnModule + 'client/' + clientUuid + "/" + sourceFolder + "/" + outputFileName
        const uploadParams = {
            Bucket: bucketName,
            Key: newFilePath,
            Body: encryptedData?.file,
            ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        console.log("uploadParams1 ",uploadParams);
        await s3.upload(uploadParams).promise();
        let updateMaster = await db.updateLedgerQueue(id, 'completed', outputFileName, newFilePath, encryptedData?.encriptionKey, encryptedData?.encriptionIV, null, new Date(), new Date(), '')
        parentPort.postMessage({ action: "terminate" })
    }
    catch (err) 
    {
        console.log(err)
        let sql = `UPDATE ledger_download_queue SET status = 'failed', remark = '${err?.stack}' WHERE id IN (${masterEntry.task.id})`
        let update = await db.updateLedgerDownloadQueueStatus(sql, new Date())
        parentPort.postMessage({ action: "terminate" })    
    }
}


parentPort.on('message', (message) => {
    console.log(isMainThread)
    let results = startProcessing(message)
    console.log("response ", results)
    if (results) {
        console.log("ssssss")
        //    parentPort.postMessage(true)
    }
})
parentPort.on('close', (message) => {
    console.log("port close", message)
    parentPort.postMessage("close")
})
parentPort.on('messageerror', (message) => {
    console.log("port messageerror", message)
})