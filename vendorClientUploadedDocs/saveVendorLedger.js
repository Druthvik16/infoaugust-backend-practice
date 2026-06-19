let db = require('./dbQueryClientUploadedDocs')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let formidable = require('formidable');
let path = require('path')
const fs = require('fs');
let apiName = ''
// const folderName = 'vendorModule/client/vendor/'
const folderName = uniqueFunction.vendorModule + 'client/vendor/' // 'vendorModule/client/vendor/'

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
                        uniqueFunction.removeFileFromDirectory(files?.ledgerFile?.filepath)
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": error?.stack,
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    req.body = fields
                    console.log(req.body)

                    if (!req.body.vendor || !JSON.parse(req.body.vendor)?.uuid || !req.body.monthPeriod || !req.body.description) {
                        uniqueFunction.removeFileFromDirectory(files?.ledgerFile?.filepath)
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "Provide all values",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let vendorUuid = JSON.parse(req.body.vendor)?.uuid
                    let billNoOrRefNo = ''
                    let invoiceNumber = ''
                    let postingDate = new Date()
                    let narration = uniqueFunction.manageSpecialCharacter(req.body.description[0])
                    let creditAmount = 0
                    let filePath = null
                    let encryptionKey = null
                    let encryptionIV = null

                    let documentDate = ''
                    let documentCategoryId = 3
                    let documentId = 4
                    let monthPeriod = req.body.monthPeriod[0]
                    let debitAmount = 0
                    let period = null
                    let financialYear = null
                    let documentAttachmentId = 1 /////// based on file type
                    let openingBalance = req.body.openingBalance[0]
                    let closingBalance = req.body.closingBalance[0]
                    let createdOn = new Date()
                    let documentNewFolderPath = 'Uploaded_Ledger_Raw_Sap_dump'

                    let vendorData = await db.getPartner(vendorUuid)
                    if (vendorData?.length == 0) {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "Vendor not found",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let clientId = vendorData[0].clientId
                    let clientUuid = vendorData[0].clientUuid

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

                    let vendorId = userId

                    documentAttachmentId =( path.extname(files.ledgerFile.originalFilename)?.toLowerCase() == '.xlsx' || path.extname(files.ledgerFile.originalFilename)?.toLowerCase() == '.csv') ? 1 : (path.extname(files.ledgerFile.originalFilename)?.toLowerCase() == '.pdf') ? 2 : null

                    if (!documentAttachmentId) {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "File type not matched",
                            "status_name": getCode.getStatus(400)
                        })
                    }

                    let saveVendorUploadedDocMaster = await db.saveVendorUploadedDocMaster(documentDate, invoiceNumber, documentCategoryId, documentId, vendorUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, createdOn, openingBalance, closingBalance, period, financialYear)

                    if (saveVendorUploadedDocMaster.affectedRows > 0) {
                        let s3FilePath = ""
                        let fileName = ""
                        let encriptionKey = ""
                        let encriptionIV = ""
                        // let saveVendorUploadedDocDetail = await db.saveVendorUploadedDocDetail(fileName, s3FilePath, saveVendorUploadedDocMaster.insertId, documentAttachmentId, createdOn, encriptionKey, encriptionIV)/

                        let encryptedData = await uniqueFunction.encryptFileBuffer(files.ledgerFile.filepath, files.ledgerFile.originalFilename, null, null, 'file')
                        if (encryptedData?.result) {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, files.ledgerFile.originalFilename, clientUuid, documentNewFolderPath, 'vendor')
                            if (uploadFileToS3Bucket && uploadFileToS3Bucket?.result) {
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', files.ledgerFile?.size, apiName, 'S3', new Date(), clientUuid, files.ledgerFile?.originalFilename)

                                // let savePdfFile = await db.saveCreditNotePdfFile(files.ledgerFile.originalFilename, uploadFileToS3Bucket.s3FilePath, saveVendorUploadedDocMaster.insertId, 2, new Date(), encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                                
                                let saveVendorUploadedDocDetail = await db.saveVendorUploadedDocDetail(files.ledgerFile.originalFilename, uploadFileToS3Bucket.s3FilePath, saveVendorUploadedDocMaster.insertId, documentAttachmentId, createdOn, encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                                
                                let sql = `UPDATE client_vendor_upload_doc_log_master SET status = 'Completed', completed_on = ? WHERE UPPER(file_name) = UPPER('${files.ledgerFile.originalFilename}')`
                                uniqueFunction.removeFileFromDirectory(files.ledgerFile.filepath)

                                db.updateUploadDocLogMaster(sql, [new Date()]).then(async (updateLog) => {
                                    res.status(200)
                                    return res.json({
                                        "status_code": 200,
                                        "message": "success",
                                        "status_name": getCode.getStatus(200)
                                    })
                                })
                            }
                            else {
                                uniqueFunction.removeFileFromDirectory(files.ledgerFile.filepath)
                                res.status(500)
                                return res.json({
                                    "status_code": 500,
                                    "message": "Ledger pdf file not uploaded",
                                    "status_name": getCode.getStatus(500)
                                })
                            }
                        }
                        else {
                            uniqueFunction.removeFileFromDirectory(files.ledgerFile.filepath)
                            res.status(500)
                            return res.json({
                                "status_code": 500,
                                "message": "File not encrypted",
                                "status_name": getCode.getStatus(500)
                            })
                        }
                    }
                    else {
                        res.status(500)
                        return res.json({
                            "status_code": 500,
                            "message": "Summary Data Not Saved",
                            "status_name": getCode.getStatus(500)
                        })
                    }

                }
                catch (e) {
                    console.log(e)
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": "Ledger not saved",
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
            "message": "Ledger not saved",
            "status_name": getCode.getStatus(500),
            "error": e?.stack
        })
    }
})