let db = require('../dbQueryVendor')
let uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let formidable = require('formidable');
let path = require('path')
const fs = require('fs');
const xlsx = require('xlsx');
let mime = require('mime')
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let userId = req.body.userId;
        let vendorStatus = 'On-Boarded'
        fileObject = {}
        let options = {
            filename: (name, ext, part, form) => {
                return part.originalFilename
            }
        }

        if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {

            let form = new formidable.IncomingForm(options);

            form.parse(req, async function (error, fields, files) {
                try {
                    if (error) {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": error?.stack,
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    req.body = fields
                    // console.log(req.body, files)       
                    if (!req.body.client || !JSON.parse(req.body.client)?.uuid) {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "Provide all values",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let clientUuid = JSON.parse(req.body.client)?.uuid

                    let vendorCode = await db.getVendorData(vendorStatus)
                    let poNumbers = await db.getPOData(vendorStatus)

                    let mappedPONumbers = poNumbers.map(poNumber => poNumber.poNumber)
                    let mappedVendorCodes = vendorCode.map(code => code.sapCode)

                    if (Object.keys(files).length > 0) {
                        for (let file in files) {
                            if (Array.isArray(files[file]) == true) {
                                files[file] = files[file][0]
                            }
                        }
                    }

                    const workbook = xlsx.readFile(files.poFile.filepath);
                    const sheet_name = workbook.SheetNames[0];
                    const worksheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name]);
                    const worksheet1 = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name], { header: 1 }); // only for headers 


                     // Define required headers , { header: 1 }
                    const requiredHeaders = ['Purchase Order No', 'Vendor Code', 'Purchase Order Date', 'Description', 'Value'];

                    // Extract headers from the first row
                    const headers = worksheet1[0];

                    // Check if required headers are present
                    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
                    if (missingHeaders.length > 0) {
                        res.status(400);
                        return res.json({
                            "status_code": 400,
                            "message": `Missing required headers: ${missingHeaders.join(', ')}`,
                            "status_name": getCode.getStatus(400)
                        });
                    }

                    let uniqueOrders = new Set();
                    worksheet.forEach((row) => {
                        if (mappedPONumbers.includes(row['Purchase Order No']?.toString()?.trim())) {
                            row['Remark'] = row['Remark'] ? row['Remark'] + ', Duplicate Purchase Order No' : 'Duplicate Purchase Order No';
                        }
                        if (uniqueOrders.has(row['Purchase Order No']?.toString()?.trim())) {
                            row['Remark'] = row['Remark'] ? row['Remark'] + ', Duplicate Purchase Order No' : 'Duplicate Purchase Order No';
                        } else {
                            uniqueOrders.add(row['Purchase Order No']?.toString()?.trim());
                            // row['Remark'] = '';
                        }
                        if (!mappedVendorCodes.includes(row['Vendor Code']?.toString()?.trim())) {
                            row['Remark'] = row['Remark'] ? row['Remark'] + ', Vendor not exist or vendor onboarding pending' : 'Vendor not exist or vendor onboarding pending';
                        }
                    });



                    // Insert into database
                    let dataToInsert = []
                    worksheet.forEach((row) => {
                        if (!row['Remark']) {
                            // let data1 = row['Purchase Order Date']?.toString()?.split('-')
                            // console.log(data1, row['Purchase Order Date'], new Date(row['Purchase Order Date']))
                            // let date1 = data1[2] + '-' + data1[1] + '-' + data1[0]
                            // console.log(date1)
                            // let date2 = new Date(date1)
                            const jsDate = new Date(Math.round((row['Purchase Order Date'] - 25569) * 86400 * 1000));
                            jsDate.setMinutes(jsDate.getMinutes() + 330);
                            let date2 =  jsDate.toISOString(); // Convert to YYYY-MM-DD format
                            console.log(date2, row['Purchase Order Date'])

                            dataToInsert.push(
                                {
                                    vendorCode: row['Vendor Code'],
                                    vendorId : vendorCode.find(vendor => vendor.sapCode == row['Vendor Code'])?.id,
                                    poNumber: row['Purchase Order No'],
                                    poDate: date2,
                                    description: row['Description'],
                                    value: row['Value'],
                                    createdOn: new Date(),
                                    createdById: userId
                                }
                            )
                        }
                    });

                    let response = await savePOs(dataToInsert, 0, dataToInsert?.length, [])

                    // console.log(response, partnerId, partnerUuid, files)

                    if (response?.rejected?.length > 0) {

                        response?.rejected?.forEach(row => {
                            worksheet.find(data => row.vendorCode == data['Vendor Code'] && row.poNumber ==  data['Purchase Order No'] && row.description == data['Description'] && row.value == data['Value'])['remark'] = row.remark
                        })
                    }

                    
                    // deleteSheet(workbook, 'CopiedSheet');
                    xlsx.writeFile(workbook, files?.poFile?.filepath);
                    // xlsx.writeFile(workbook, outputFilePath);
                    const newWorkbook = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(newWorkbook, xlsx.utils.json_to_sheet(worksheet), sheet_name);
                    xlsx.writeFile(newWorkbook, files?.poFile?.filepath);
                    
                    let xlsxFile = fs.readFileSync(files?.poFile?.filepath, 'base64')
                    
                    xlsxFile = `data:${mime.getType(files?.poFile?.filepath)};base64,${xlsxFile}`
                    
                    // Log MIME type and binary data for debugging
                    console.log('MIME type:', mime.getType(files?.poFile?.filepath));
                    
                    // Step 6: Write the Base64 string to a text file
                    // const base64FilePath = './base64Data.txt';
                    // console.log(`Writing Base64 data to: ${base64FilePath}`);
                    // fs.writeFileSync(base64FilePath, xlsxFile);
                   
                    
                    uniqueFunction.removeFileFromDirectory(files?.poFile?.filepath)
                   
                    res.status(200)
                    return res.json({
                        "status_code": 200,
                        "message": "success",
                        "data" : {"file" : xlsxFile},
                        "status_name": getCode.getStatus(200)
                    })
                }
                catch (e) {
                    console.log(e)
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": "PO not uploaded",
                        "status_name": getCode.getStatus(500),
                        "error": e?.stack || e.message
                    })
                }
            })

            form.on('error', (err) => {
                console.log(err)
            })

            form.on('fileBegin', (name, file) => {
                console.log(`Starting file upload for ${name}`);
            });

            form.on('progress', (bytesReceived, bytesExpected) => {
                console.log(`Progress: ${(bytesReceived / bytesExpected * 100).toFixed(2)}%`);
            });

            form.on('end', () => {
                console.log('File upload complete');
            });
        }
        else {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "Missing form-data",
                "status_name": getCode.getStatus(500)
            })
        }
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "PO not uploaded",
            "status_name": getCode.getStatus(500),
            "error": e?.stack || e.message
        })
    }
})

async function savePOs(data, start, end, rejected) {
    try {
        if (start < end) {
            let element = data[start];
            let save = await db.savePO(element)

            if(save?.result)
            {
                element['remark'] = save.error
                rejected.push(element)
            }

            start++;
            return savePOs(data, start, end, rejected);
        }
        else 
        {
            return { result: true, rejected: rejected};
        }
    }
    catch (e) {
        console.log(e);        
        data[start]['remark'] = e.stack || e.message || e 
        rejected.push(data[start])
        start++;
        return savePOs(data, start, end, rejected);
    }
}
