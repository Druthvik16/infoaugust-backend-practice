const express = require('express');
const formidable = require('formidable');
const xlsx = require('xlsx');
const db = require('./dbQueryClientUploadedDocs');
const errorCode = require('../common/error/errorCode');
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const getCode = new errorCode();
const axios = require('axios');
let formatDate = require('date-fns')
let mime = require('mime')
let path = require('path')
let fs = require('fs')
const apiUrl = require('../apiUrl');
const api = new apiUrl();
const documentCategoryCode = 'NDC';
const documentCategoryLedgerCode = 'LGR';
const documentAttachmentName = 'Summary';
const documentTypeCode = 'NDC';
const statusFailed = 'Failed';
const statusSuccess = 'Success';
const epochDate = new Date(1900, 0, 1);

module.exports = express.Router().post('/', async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ status_code: 500, message: "File parsing error", error: err.message });
        }

        console.log(files, fields)
        
        if(Object.keys(files).length > 0)
        {
            for(let file in files)
            {
                if(Array.isArray(files[file]) == true)
                {
                    files[file] = files[file][0]
                }
            }
        }
        else
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "File Not Found",
                "status_name" : getCode.getStatus(400)
            }) 
        }

        
        if(path.extname(files?.uploadedFile?.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(files?.uploadedFile?.originalFilename)?.toLowerCase() != '.csv')
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Type Not Matched",
                    "status_name" : getCode.getStatus(400)
                }) 
            }

        // Retrieve fields from form data
        // const vendorUuids = fields.vendorUuids ? fields.vendorUuids[0] : '';
        const clientUuid = fields.clientUuid[0];
        const userId = req.body.userId; // client user id

        if (!clientUuid) {
            return res.status(400).json({
                status_code: 400,
                message: "Provide all values",
                status_name: getCode.getStatus(400),
            });
        }

        // Check if file is provided
        if (!files.uploadedFile) {
            return res.status(400).json({
                status_code: 400,
                message: "File is required",
                status_name: getCode.getStatus(400),
            });
        }

        // Process the Excel file
        const workbook = xlsx.readFile(files.uploadedFile.filepath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let vendorsLedger = xlsx.utils.sheet_to_json(worksheet);

        let vendors = await db.getVendors(clientUuid);  // assume this fetches all vendors
        console.log(vendors)
        console.log(vendorsLedger)
        let ledgers = []
        let validatedVendorsLedger = vendorsLedger.map((ledger) => {
            let remark = '';

            // Validate columns are not empty
            if (!ledger['Vendor Name']) remark += 'Missing Vendor Name;  ';
            // if (!ledger['No dues date']) remark += 'Missing No dues date;  ';
            // if (!ledger['Amount']) remark += 'Missing Amount; ';
            // if (parseFloat(ledger['Amount']) > 0 || parseFloat(ledger['Amount']) < 0) remark += 'Amount should be zero; ';
            if (isNaN(Number(ledger['Amount'])) || Number(ledger['Amount']) < 0 || Number(ledger['Amount']) > 0) remark += 'Amount should be zero; ';

            const currentDate = new Date();
            let balanceConfirmationDate;

            if (!ledger['No dues date']) {
                remark += 'Missing No dues date; ';
            } else {
                if (typeof ledger['No dues date'] === 'number') {
                    // Convert Excel serial date to JavaScript date
                    balanceConfirmationDate = new Date((ledger['No dues date'] - 25569) * 86400 * 1000);
                } else {
                    // Parse the date as a string
                    balanceConfirmationDate = new Date(ledger['No dues date']);
                }

                // Check if the date is invalid or in the future
                if (isNaN(balanceConfirmationDate.getTime())) {
                    remark += 'Invalid No dues date; ';
                } else if (balanceConfirmationDate > currentDate) {
                    remark += `No dues date cannot be greater than today's date; `;
                }
            }
            // Check if vendor code exists in vendors list
            const vendor = vendors.find(v => v.code == ledger['Vendor Code']);
            if (!vendor) {
                remark += 'Vendor code not found; ';
            }
            ledgers.push({ ...ledger, remark})
            return { ...ledger, remark, ...vendor }
        });

        console.log(validatedVendorsLedger)

        // Filter out vendors with remarks for further processing
        const vendorsWithoutRemarks = validatedVendorsLedger.filter(vendor => !vendor.remark);
        worksheet['E1'] = { v: 'Process Remark' };
        // Update Excel sheet with remarks
        ledgers.forEach((row, index) => {
            const cellAddress = `E${index + 2}`; // Assuming remarks column at 'E'
            worksheet[cellAddress] = { v: row.remark || '' };
        });
        
        // Write the updated data back to the worksheet
        xlsx.utils.sheet_add_json(worksheet, ledgers, { origin: 'A2', skipHeader: true })
        xlsx.writeFile(workbook, files.uploadedFile.filepath);  // Save updated file with remarks

                      
        let xlsxFile = fs.readFileSync(files?.uploadedFile?.filepath, 'base64')
        
        // console.log(mime.lookup(files?.uploadedFile?.filepath))
                    
        // xlsxFile = `data:${mime.getType(files?.uploadedFile?.filepath)};base64,${xlsxFile}`
        xlsxFile = `data:${path.extname(files?.uploadedFile?.originalFilename)?.toLowerCase() == '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'};base64,${xlsxFile}`
        uniqueFunction.removeFileFromDirectory(files?.uploadedFile?.filepath)

        if (vendorsWithoutRemarks.length === 0) {
            return res.status(400).json({
                status_code: 400,
                message: "No valid vendors to process",
                status_name: getCode.getStatus(400),
                data: { file : xlsxFile, fileName : files.uploadedFile.originalFilename
                }
            });
        }

        // Retrieve required IDs
        const documentCategory = await db.getDocumentCategories();
        const documentCategoryId = documentCategory.find(item => item.code === documentCategoryCode)?.id;
        const documentCategoryLedgerId = documentCategory.find(item => item.code === documentCategoryLedgerCode)?.id;
        const documentAttachment = await db.getDocumentAttachments();
        const documentAttachmentId = documentAttachment.find(item => item.name === documentAttachmentName)?.id;
        const documentType = await db.getDocuments();
        const documentId = documentType.find(item => item.code === documentTypeCode)?.id;
        const client = await db.getClient(clientUuid);

        // Process only vendors without remarks
        const response = await processVendor(vendorsWithoutRemarks, 0, vendorsWithoutRemarks.length, documentCategoryId, client[0], documentId, documentAttachmentId, [], []);

      
        if (response) {
            return res.status(200).json({
                status_code: 200,
                message: "success",
                data: { file : xlsxFile, fileName : files.uploadedFile.originalFilename
                 },
                status_name: getCode.getStatus(200),
            });
            // result: response.vendorResult,
        } else {
            return res.status(500).json({
                status_code: 500,
                message: "No dues not generated",
                status_name: getCode.getStatus(500),
            });
        }
    });
});

async function processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail) {
    try {
        if (start < end) {
            let vendorLedger = vendorLedgers[start];
            let vendorId = vendorLedger.id;
            let amount = 0;
            let uploadedOn = new Date()
            
            let balanceConfirmationDate = vendorLedger['No dues date'];
            const actualDate = formatDate.addDays(epochDate, balanceConfirmationDate - 2);
            let postingDate = formatDate.format(actualDate, 'yyyy-MM-dd');

            let saveBalanceConfirmationAndNoDueLog = await db.saveBalanceConfirmationAndNoDueLog(postingDate, documentCategoryId, vendorId, new Date())
            if (saveBalanceConfirmationAndNoDueLog?.affectedRows > 0) {
                let saveClientUploadedDocMaster = await db.saveClientUploadedDocMasterBDLNDC(documentCategoryId, documentId, vendorId, client.id, uploadedOn, amount, postingDate)
                if (saveClientUploadedDocMaster.affectedRows > 0) {
                    let s3FilePath = ""
                    let fileName = ""
                    let encriptionKey = ""
                    let encriptionIV = ""
                    let saveClientUploadedDocDetail = await db.saveClientUploadedDocDetailPAM(fileName, s3FilePath, saveClientUploadedDocMaster.insertId, documentAttachmentId, new Date(), encriptionKey, encriptionIV)
                    if (saveClientUploadedDocDetail.affectedRows > 0) {
                        vendorResult.push(perparedResult(vendorLedger, statusSuccess, ''));
                        vendorToMail.push(vendorLedger)
                        await balanceConfirmationInitiatedTemplate([vendorLedger], client.name)
                        start++
                        return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail)
                    }
                    else {
                        vendorResult.push(perparedResult(vendorLedger, statusFailed, 'No dues not generated'));
                        start++
                        return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail)
                    }
                }
                else {
                    vendorResult.push(perparedResult(vendorLedger, statusFailed, 'No dues not generated'));
                    start++
                    return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail)
                }
            }
            else {
                vendorResult.push(perparedResult(vendorLedger, statusFailed, 'No dues not generated'));
                start++
                return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail)
            }
        }
        else {
            // balanceConfirmationInitiatedTemplate(vendorToMail, client.name)
            return { result: true, vendorResult }
        }
    }
    catch (e) {
        console.log(e);
        vendorResult.push(perparedResult(vendorLedgers?.[start], statusFailed, e?.stack));
        start++
        return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail)
    }
}
async function balanceConfirmationInitiatedTemplate(vendors, clientName) {
    try {
        let mailTo = vendors.map(vendor => { return { "email": vendor.email, "name": vendor.name, "type": "to" } })
        const [year, month, day] = new Date().toISOString().slice(0, 10).replace('T', ' ').split('-')
        
        let balanceConfirmationDate = vendors[0]['No dues date'];
        const actualDate = formatDate.addDays(epochDate, balanceConfirmationDate - 2);
        console.log(actualDate, vendors[0]['No dues date'],  vendors)
        let cutOffDate = formatDate.format(actualDate, 'dd-MM-yyyy');
        let dataToSend =
        { 
            "to": mailTo,
            "subject": "No Dues Certificate as on " + cutOffDate,
            "text": `<p>Dear ${vendors[0]?.name},</p>
                    <p>We have initiated a request for No Dues Certificate as on ${cutOffDate}</p>
                    <p>Request you download the request letter and affix your signature and offical seal and upload the request letter.</p>

                    <p>Regards,<br>${clientName}</p>`,
            "rawFiles": ""
        }
        axios.post(api.serviceApi + api.common + api.sendMail, dataToSend).then((sendMail) => {
            console.log("mail sent")
            return { result: true, data: dataToSend }
        })
    }
    catch (e) {
        console.log(e);
        return { result: false, error: e?.stack || e?.message || e }
    }
}


function perparedResult(vendor, status, remark) {
    return { uuid: vendor?.uuid, code: vendor.code, name: vendor.name, status: status, remark: remark }
}