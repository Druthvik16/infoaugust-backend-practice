let db = require('../databaseConnection/createconnection')
let db1 = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode();
const formidable = require('formidable');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')

// Helper function to validate numeric/decimal strings
// const isNumericOrDecimal = (value) => {
//     return !isNaN(value) && /^\d+(\.\d+)?$/.test(value);
// };


const isNumericOrDecimal = (value) => {
    return !isNaN(value) && /^-?\d+(\.\d+)?$/.test(value);
};

// Batch size for database updates
const BATCH_SIZE = 1000;

const codeHeaderName = 'Code';
const openingBalanceHeaderName = 'Opening Balance';
const FYHeaderName = 'Financial Year';

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        const createdById = req.body.userId || 0;
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
                    
        const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null

        let fileObject = {};
        let options = {
            filename: (name, ext, part, form) => {
                return part.originalFilename;
            }
        };

        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) {
            if (error) {
                console.log(error);
                res.status(500);
                return res.json({
                    "status_code": 500,
                    "message": error?.stack,
                    "status_name": getCode.getStatus(500)
                });
            }

            if (Object.keys(file).length > 0) {
                if (Array.isArray(file['uploadFile'])) {
                    fileObject['uploadFile'] = file['uploadFile'][0];
                } else {
                    fileObject = file;
                }
            } else {
                res.status(400);
                return res.json({
                    "status_code": 400,
                    "message": `File Not Found`,
                    "status_name": getCode.getStatus(400)
                });
            }
            if(path.extname(fileObject.uploadFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadFile.originalFilename)?.toLowerCase() != '.csv')
            {
                res.status(400);
                return res.json({
                    "status_code": 400,
                    "message": `Invalid File Type`,
                    "status_name": getCode.getStatus(400)
                });
            }

            const workbook = xlsx.readFile(fileObject.uploadFile.filepath, { cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

            if (!data.length) {
                return res.status(400).json({
                    "message": "Uploaded file is empty",
                    "status_code": 400,
                    "status_name": getCode.getStatus(400)
                });
            }

            const headers = Object.keys(data[0]);
            const missingColumns = [];
            if (!headers.includes(codeHeaderName)) missingColumns.push(codeHeaderName);
            if (!headers.includes(openingBalanceHeaderName)) missingColumns.push(openingBalanceHeaderName);
            if (!headers.includes(FYHeaderName)) missingColumns.push(FYHeaderName);

            if (missingColumns.length > 0) {
                return res.status(400).json({
                    message: `Missing required columns: ${missingColumns.join(', ')}`,
                });
            }

            const remarks = {};
            const codesInFile = new Set();
            const validRows = [];
            const invalidRows = [];
            const financialYears = await db1.getFinancialYears()
            data.forEach((row, index) => {
                const rowNumber = index + 2;
                const {
                    [codeHeaderName]: code,
                    [openingBalanceHeaderName]: opening_balance,
                    [FYHeaderName] : fy_name

                } = row;

                let remarksArray = [];

                if (!code) remarksArray.push(`${codeHeaderName} cannot be null or empty.`);

                if (opening_balance == null || opening_balance?.toString().length == 0 || opening_balance == undefined) remarksArray.push(`${openingBalanceHeaderName} cannot be null or empty.`);
                else if (!isNumericOrDecimal(opening_balance)) {
                    remarksArray.push(`Invalid ${openingBalanceHeaderName} `);
                }

                if (fy_name == null || fy_name?.toString().length == 0 || fy_name == undefined) remarksArray.push(`${FYHeaderName} cannot be null or empty.`);
                // if (!opening_balance) remarksArray.push(`${openingBalanceHeaderName} cannot be null or empty.`);



                const matchingFY = financialYears.find(fy => fy.name.trim() === String(fy_name).trim());

                if (!matchingFY) {
                    remarksArray.push(`${FYHeaderName} '${fy_name}' not valid.`);
                }
                else
                {                 

                    row['FYId'] = matchingFY.id;
                }

                // const financial_year_id = matchingFY.id;



                if (codesInFile.has(code)) {
                    remarksArray.push(`Duplicate ${codeHeaderName} in the file.`);
                } else {
                    codesInFile.add(code);
                }

                if (remarksArray.length > 0) {
                    row.Remark = remarksArray.join('; '); // Combine remarks into a single string
                    invalidRows.push(row);
                    remarks[rowNumber] = remarksArray.join('; ');
                } else {
                    validRows.push(row);
                }                
            });

            const updatePromises = [];
            for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
                const batch = validRows.slice(i, i + BATCH_SIZE);
                const codes = batch.map((row) => `'${row[codeHeaderName]}'`).join(',');
                const query = `
                  SELECT partner_location_code, opening_balance, financial_year_id  
                  FROM customer_opening_balance_master 
                  WHERE partner_location_code IN (${codes});
                `;

                updatePromises.push(
                    new Promise((resolve) => {
                        db.query(query, (err, results) => {
                            if (err) {
                                console.log(err);
                                batch.forEach((row) => {
                                    row.Remark = `Database query error.`;
                                    invalidRows.push(row);
                                });
                                return resolve();
                            }

                            // const resultMap = new Map(
                            //     results.map((r) => [r.partner_location_code, r.opening_balance])
                            // );

                            const resultMap = new Map(
                                 results.map((r) => [
                                    `${r.partner_location_code}_${r.financial_year_id}`, 
                                    r.opening_balance
                                ])
                            );

                            console.log(resultMap);

                            const updates = [];
                            batch.forEach((row) => {                         
                                const dbBalance = resultMap.get(row[codeHeaderName]?.toString() + '_' + row['FYId']?.toString());
                                console.log(dbBalance)
                                if (dbBalance == undefined) {
                                    row.Remark = `${codeHeaderName} not found in the database.`;
                                    invalidRows.push(row);
                                } else if (dbBalance != 0) {
                                    row.Remark = `${openingBalanceHeaderName} already set in database for ${codeHeaderName} and ${FYHeaderName}.`;
                                    invalidRows.push(row);
                                } else {
                                    updates.push({
                                        code: row[codeHeaderName],
                                        opening_balance: parseFloat(row[openingBalanceHeaderName]),
                                        financial_year_id : row['FYId'],
                                        FY : row[FYHeaderName]
                                    });
                                }
                            });

                            // const updateQuery = `
                            //     UPDATE customer_opening_balance_master 
                            //     SET opening_balance = CASE partner_location_code
                            //     ${updates
                            //         .map(
                            //             (u) => `WHEN '${u.code}' THEN ${u.opening_balance}`
                            //         )
                            //         .join(' ')}
                            //     END
                            //     WHERE partner_location_code IN (${updates
                            //         .map((u) => `'${u.code}'`)
                            //         .join(',')});
                            // `;

                            const updateQuery = `
                                                    UPDATE customer_opening_balance_master
                                                    SET opening_balance = CASE
                                                        ${updates
                                                        .map(u =>
                                                            `WHEN partner_location_code = '${u.code}' AND financial_year_id = ${u.financial_year_id} THEN ${u.opening_balance}`
                                                        )
                                                        .join('\n    ')}
                                                        ELSE opening_balance
                                                    END
                                                    WHERE (partner_location_code, financial_year_id) IN (
                                                        ${updates
                                                        .map(u => `('${u.code}', ${u.financial_year_id})`)
                                                        .join(', ')}
                                                    );
                                                    `;

                            

                            // const currentDataQuery = ` SELECT * FROM customer_opening_balance_master WHERE partner_location_code IN (${updates
                            //         .map((u) => `'${u.code}'`)
                            //         .join(',')})` 

                            if(updates?.length > 0)
                            {
                            const currentDataQuery = ` SELECT * FROM customer_opening_balance_master WHERE (partner_location_code, financial_year_id) IN (
                                                        ${updates
                                                        .map(u => `('${u.code}', ${u.financial_year_id})`)
                                                        .join(', ')}
                                                    );` 

                                            
                
                            db.query(currentDataQuery, (logErr, openingBalances) => {
                                if (logErr) {
                                    console.error(`Failed to get opening balance`, logErr);
                                }
                                else
                                {                  
                                    if (updates.length > 0) {

                                        db.query(updateQuery, (updateErr) => {
                                            if (updateErr) {
                                                updates.forEach((u) => {
                                                    invalidRows.push({
                                                        code: u.code,
                                                        FY : u.FY,
                                                        Remark: `Failed to update opening balance.`
                                                    });
                                                });
                                            }
                                            else
                                            {              
                                                updates.forEach((u) => {
                                                    const {id, opening_balance} = openingBalances.find(a => a.partner_location_code == u.code && a.financial_year_id == u.financial_year_id)
                                                    const activityLogQuery = `
                                                        INSERT INTO infoaugust_activity_log (
                                                            created_by_id, user_type, user_type_table,  activity_tag, activity_text, object_id, object_table, additional_info, status
                                                        ) VALUES (
                                                            ${db.escape(createdById)}, 
                                                            ${db.escape(loggedUserType)}, 
                                                            ${db.escape(loggedUserTable)}, 
                                                            'Opening Balance Master Updated', 
                                                            '${uniqueFunction.manageSpecialCharacter(`Partner Location Code : ${u.code}, Opening Balance : ${opening_balance} => ${u.opening_balance} for FY => ${u.financial_year_id}`)}', 
                                                            ${id}, 
                                                            'customer_opening_balance_master', 
                                                        NULL,
                                                        'success'
                                                        );
                                                    `;
                        
                                                    db.query(activityLogQuery, (logErr) => {
                                                        if (logErr) {
                                                            console.error(`Failed to insert activity log for code: ${u.code}`, logErr);
                                                        }
                                                    });
                                                });
                                            }
                                            resolve();
                                        });
                                    } else {
                                        resolve();
                                    }                                    
                                }
                            });

                            }
                            else
                            {
                                resolve()
                            }
                        });
                    })
                );
            }

            await Promise.all(updatePromises);

            // Write remarks back into the uploaded file
            data.forEach((row) => {
                if (!row.Remark) {
                    const invalidRow = invalidRows.find((r) => r[codeHeaderName] === row[codeHeaderName]);
                    if (invalidRow) {
                        row.Remark = invalidRow.Remark;
                    }
                }
            });

            const updatedSheet = xlsx.utils.json_to_sheet(data);
            workbook.Sheets[sheetName] = updatedSheet;
            xlsx.writeFile(workbook, fileObject.uploadFile.filepath);

            res.setHeader('Content-Disposition', `attachment; filename=${fileObject.uploadFile.originalFilename}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            res.sendFile(fileObject.uploadFile.filepath, (err) => {
                if (err) {
                    console.log(err);
                }
                fs.unlinkSync(fileObject.uploadFile.filepath);
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500);
        return res.json({
            "status_code": 500,
            "message": `Failed file not uploaded`,
            "status_name": getCode.getStatus(500),
            "error": e?.stack
        });
    }
});
