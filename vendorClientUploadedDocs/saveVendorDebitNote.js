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
                        uniqueFunction.removeFileFromDirectory(files?.debitNoteFile?.filepath)
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": error?.stack,
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    req.body = fields
                    console.log(req.body)

                    if (!req.body.vendor || !JSON.parse(req.body.vendor)?.uuid || !req.body.invoiceNumber || !req.body.debitNoteNumber || !req.body.amount || !req.body.debitNoteDate || !req.body.description) {
                        uniqueFunction.removeFileFromDirectory(files?.debitNoteFile?.filepath)
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "Provide all values",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let vendorUuid = JSON.parse(req.body.vendor)?.uuid
                    let billNoOrRefNo = req.body.debitNoteNumber[0]
                    let invoiceNumber = req.body.invoiceNumber[0]
                    let postingDate = req.body.debitNoteDate[0]
                    let narration = uniqueFunction.manageSpecialCharacter(req.body.description[0])
                    let creditAmount = 0
                    let filePath = null
                    let encryptionKey = null
                    let encryptionIV = null

                    let documentDate = ''
                    let documentCategoryId = 1
                    let documentId = 2
                    let monthPeriod = 0
                    let debitAmount = req.body.amount[0]
                    let period = null
                    let financialYear = null
                    let documentAttachmentId = 1
                    let openingBalance = ''
                    let closingBalance = ''
                    let createdOn = new Date()
                    let documentNewFolderPath = 'Uploaded_Pdfs'

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



                    let saveVendorUploadedDocMaster = await db.saveVendorUploadedDocMaster(documentDate, invoiceNumber, documentCategoryId, documentId, vendorUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, createdOn, openingBalance, closingBalance, period, financialYear)

                    if (saveVendorUploadedDocMaster.affectedRows > 0) {
                        let s3FilePath = ""
                        let fileName = ""
                        let encriptionKey = ""
                        let encriptionIV = ""
                        let saveVendorUploadedDocDetail = await db.saveVendorUploadedDocDetail(fileName, s3FilePath, saveVendorUploadedDocMaster.insertId, documentAttachmentId, createdOn, encriptionKey, encriptionIV)

                        let encryptedData = await uniqueFunction.encryptFileBuffer(files.debitNoteFile.filepath, files.debitNoteFile.originalFilename, null, null, 'file')
                        if (encryptedData?.result) {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, files.debitNoteFile.originalFilename, clientUuid, documentNewFolderPath, 'vendor')
                            if (uploadFileToS3Bucket && uploadFileToS3Bucket?.result) {
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', files.debitNoteFile?.size, apiName, 'S3', new Date(), clientUuid, files.debitNoteFile?.originalFilename)

                                let savePdfFile = await db.saveCreditNotePdfFile(files.debitNoteFile.originalFilename, uploadFileToS3Bucket.s3FilePath, saveVendorUploadedDocMaster.insertId, 2, new Date(), encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                                
                                let sql = `UPDATE client_vendor_upload_doc_log_master SET status = 'Completed', completed_on = ? WHERE UPPER(file_name) = UPPER('${files.debitNoteFile.originalFilename}')`
                                uniqueFunction.removeFileFromDirectory(files.debitNoteFile.filepath)

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
                                uniqueFunction.removeFileFromDirectory(files.debitNoteFile.filepath)
                                res.status(500)
                                return res.json({
                                    "status_code": 500,
                                    "message": "Debit Note pdf file not uploaded",
                                    "status_name": getCode.getStatus(500)
                                })
                            }
                        }
                        else {
                            uniqueFunction.removeFileFromDirectory(files.debitNoteFile.filepath)
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
                        "message": "Debit note not saved",
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
            "message": "Debit note not saved",
            "status_name": getCode.getStatus(500),
            "error": e?.stack
        })
    }
})