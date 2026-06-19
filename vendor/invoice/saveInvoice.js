let db = require('../dbQueryVendor')
let uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let formidable = require('formidable');
let path = require('path')
const fs = require('fs');
let apiName = ''

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let userId = req.body.userId;
        apiName = req.baseUrl
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
                        uniqueFunction.removeFileFromDirectory(files?.invoiceFile?.filepath)
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": error?.stack,
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    req.body = fields
                    console.log(req.body)
                    
                    if (!req.body.vendor || !JSON.parse(req.body.vendor)?.uuid || !req.body.invoiceNumber || !req.body.poNumber || !req.body.amount || !req.body.invoiceDate || !req.body.description) {
                        uniqueFunction.removeFileFromDirectory(files?.invoiceFile?.filepath)
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "Provide all values",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let vendorUuid = JSON.parse(req.body.vendor)?.uuid
                    let poNumber = req.body.poNumber[0]
                    let invoiceNumber = req.body.invoiceNumber[0]
                    let invoiceDate = req.body.invoiceDate[0]
                    let description = uniqueFunction.manageSpecialCharacter(req.body.description[0])
                    let amount = req.body.amount[0]
                    let poNumbers = await db.getPODataForInvoice(poNumber)
                    let filePath = null
                    let encryptionKey = null
                    let encryptionIV = null
                    if(poNumbers.length == 0)
                    {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "PO Number not found",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let vendorData = await db.getPartner(vendorUuid)
                    if(vendorData?.length == 0)
                    {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "Vendor not found",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let clientId = vendorData[0].clientId
                    let clientUuid = vendorData[0].clientUuid
                    let mappedPONumbers = poNumbers.map(poNumber => poNumber.poNumber)
                    let invoiceNumbers = await db.getInvoiceData()
                    let mappedInvoiceNumbers = invoiceNumbers.map(invoiceNumber => invoiceNumber.invoiceNumber)

                    if (Object.keys(files).length > 0) {
                        for (let file in files) {
                            if (Array.isArray(files[file]) == true) {
                                files[file] = files[file][0]
                            }
                        }
                    }
                    else {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "File not found",
                            "status_name": getCode.getStatus(400)
                        })
                    }

                    if (mappedInvoiceNumbers.includes(invoiceNumber)) {
                        // res.status(400)
                        // return res.json({
                        //     "status_code": 400,
                        //     "message": "File not found",
                        //     "status_name": getCode.getStatus(400)
                        // })
                    }

                    if (!mappedPONumbers.includes(poNumber)) {
                        // uniqueFunction.removeFileFromDirectory(files?.invoiceFile?.filepath)
                        // res.status(400)
                        // return res.json({
                        //     "status_code": 400,
                        //     "message": "PO number not found or file already exists for PO number",
                        //     "status_name": getCode.getStatus(400)
                        // })
                    }

                    
                // let path1 = 'uploads/vendor/invoice/pdf/' + files.invoiceFile.originalFilename;
                // let fileCopy = fs.copyFileSync(files.invoiceFile.filepath, path1)

                let vendorId = userId

                let uploadFileToS3 = await uploadFileToS3VendorModule(files.invoiceFile, vendorUuid, clientId, vendorId, vendorData[0].vendorCode)
                console.log(uploadFileToS3)
                if(uploadFileToS3.result)
                {
                    filePath = uploadFileToS3.filePath
                    encryptionKey = uploadFileToS3.encryptionKey
                    encryptionIV = uploadFileToS3.encryptionIV
                    let save = await db.saveInvoice(vendorUuid, poNumbers[0].id, invoiceNumber, invoiceDate, amount, new Date(), userId, filePath, encryptionKey, encryptionIV, description);
                    console.log(save)
                    if(save.affectedRows > 0) {
                        uniqueFunction.removeFileFromDirectory(files?.invoiceFile?.filepath)
                        res.status(200)
                        return res.json({
                            "status_code": 200,
                            "message": "success",
                            "status_name": getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        uniqueFunction.removeFileFromDirectory(files?.invoiceFile?.filepath)
                        res.status(500)
                        return res.json({
                            "status_code": 500,
                            "message": "Invoice not saved",
                            "status_name": getCode.getStatus(500)
                        })
                    }
                }
                else
                {
                    uniqueFunction.removeFileFromDirectory(files?.invoiceFile?.filepath)
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": "Invoice not saved",
                        "status_name": getCode.getStatus(500)
                    })
                }
                }
                catch (e) {
                    console.log(e)
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": "Invoice not saved",
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
            "message": "Invoice not saved",
            "status_name": getCode.getStatus(500),
            "error": e?.stack
        })
    }
})

async function uploadFileToS3VendorModule(file, vendorUuid, clientId, vendorId, vendorCode)
{
    try
    {
        let client = await db.getClientUuid(clientId)
        let clientUuid = client[0]?.uuid
        if(!clientUuid)
        {
            return {"result" : false}
        }

        let encryptedData = await uniqueFunction.encryptFileBuffer(file.filepath, file.originalFilename,null, null, 'file')
        if(encryptedData?.result)
        {
            let s3Folder = 'client/' + clientUuid +  '/vendor/' + vendorUuid + '/registrationDocs'
            let uploadFiles = await uniqueFunction.uploadVendorModulesFiles(encryptedData?.file, file.originalFilename, s3Folder)

            console.log("uploadFiles",uploadFiles)
            
            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', vendorId, '', file?.size, apiName, 'S3', new Date(), clientId, file.originalFilename)
            if(uploadFiles && uploadFiles.result == true)
            {
                return {"result" : true, "filePath" : uploadFiles.s3FilePath, "encryptionKey" : encryptedData?.encriptionKey,  "encryptionIV" : encryptedData?.encriptionIV}
            }
            else
            {
                return {"result" : false}
            }
        }
        else
        {
            console.log("Error", encryptedData)
            return {"result" : false}
        }
    }
    catch (e)
    {
        console.log(e)
        return {"result" : false}
    }
}
