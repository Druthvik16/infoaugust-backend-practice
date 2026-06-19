let db = require('./dbQuerySpsnUser');
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode();
let formidable = require('formidable');
let path = require('path');
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const fs = require('fs');
const bucketName = process.env.Bucket_Name;

// Helper function to delete an object from S3
async function deleteS3Object(bucketName, key) {
    try {
        const params = { Bucket: bucketName, Key: key };
        await s3.deleteObject(params).promise();
    } catch (err) {
        throw new Error(`Error deleting S3 object: ${err.message}`);
    }
}

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let createdOn;
        let uploadedOn;
        let monthPeriod;
        let documentCategoryId;
        let documentId;
        let financialYearId;
        let spsnUuid;
        let clientUuid;
        let documentAttachmentId;
        let documentNewFolderPath;
        let fileObject = {};
        let apiName = '';
        apiName = req.baseUrl;
        let options = {
            filename: (name, ext, part, form) => {
                console.log(part);
                return part?.originalFilename;
            }
        };
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) {
            if (error) {
                console.log(error);
                res.status(400);
                return res.json({
                    "status_code": 400,
                    "message": error?.stack,
                    "status_name": getCode.getStatus(400)
                });
            }
            if (Object.keys(file).length > 0) {
                if (Array.isArray(file['uploadFile']) == true) {
                    fileObject['uploadFile'] = file['uploadFile'][0];
                } else {
                    fileObject = file;
                }
            } else {
                res.status(400);
                return res.json({
                    "status_code": 400,
                    "message": "File Not Found",
                    "status_name": getCode.getStatus(400)
                });
            }
            req.body = fields;
            if (!req.body.financialYear || !JSON.parse(req.body.financialYear[0])?.id || !req.body.client || !JSON.parse(req.body.client[0])?.uuid) {
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath);
                res.status(400);
                return res.json({
                    "status_code": 400,
                    "message": "Provide all values",
                    "status_name": getCode.getStatus(400)
                });
            }

            documentCategoryId = req.body.documentCategory?.length > 0 ? JSON.parse(req.body.documentCategory[0])?.id : null;
            documentId = req.body.document?.length > 0 ? JSON.parse(req.body.document[0])?.id : null;
            spsnUuid = req.body.spsn?.length > 0 ? JSON.parse(req.body.spsn[0])?.uuid : '';
            clientUuid = req.body.client?.length > 0 ? JSON.parse(req.body.client[0])?.uuid : '';
            financialYearId = req.body.financialYear?.length > 0 ? JSON.parse(req.body.financialYear[0])?.id : '';
            documentAttachmentId = req.body.documentAttachment?.length > 0 ? JSON.parse(req.body.documentAttachment[0])?.id : null;
            documentNewFolderPath = req.body.documentNewFolderPath[0];
            createdOn = new Date();
            uploadedOn = req.body.uploadedOn;
            let documentCategory = await db.getSpsnDocumentCategories();
            let documentCategoryCode = documentCategory.find(item => item.id == documentCategoryId)?.code;

            monthPeriod = null;
            if (documentCategoryCode == 'CA') {
                monthPeriod = format(new Date(uploadedOn), 'MMM-yyyy', { locale: enIN });
            }
            else
            {
                financialYearId = 1; ////// Hardcoded for OS
            }

            let getReportForFinancialYearId = await db.getReportForFinancialYear(spsnUuid, financialYearId, documentCategoryId, monthPeriod);
            if (getReportForFinancialYearId?.length == 0) {
                let s3FilePath = "";
                let fileName = "";
                let encriptionKey = "";
                let encriptionIV = "";
                fileName = fileObject.uploadFile?.originalFilename;
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileObject.uploadFile?.originalFilename, null, null, 'file');
                if (encryptedData?.result) {
                    encriptionIV = encryptedData.encriptionIV;
                    encriptionKey = encryptedData.encriptionKey;
                    let inputPath = documentNewFolderPath;
                    let uploadFileToS3Bucket = await uniqueFunction.uploadSpsnFiles(encryptedData?.file, fileObject.uploadFile?.originalFilename, clientUuid, inputPath, 'spsn');
                    s3FilePath = uploadFileToS3Bucket?.s3FilePath;
                    await db.saveDataTransactLog('UP', 'SU', 0, 0, fileObject.uploadFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadFile.originalFilename);

                    await db.saveSpsnOSAndCAReport(documentCategoryId, documentId, documentAttachmentId, financialYearId, spsnUuid, clientUuid, uploadedOn, createdOn, fileName, s3FilePath, encriptionKey, encriptionIV, monthPeriod);

                    res.status(200);
                    return res.json({
                        "status_code": 200,
                        "message": "success",
                        "status_name": getCode.getStatus(200)
                    });
                } else {
                    console.log("file not uploaded", encryptedData);
                    res.status(400);
                    return res.json({
                        "status_code": 400,
                        "message": "File not uploaded",
                        "status_name": getCode.getStatus(400)
                    });
                }
            } else {
                if (documentCategoryCode === 'CA') {
                    const params = {
                        Bucket: bucketName,
                        Key: getReportForFinancialYearId[0].document_file_path
                    };
                    let fileName = "";
                    let encryptionKey = getReportForFinancialYearId[0].encryption_key;
                    let encryptionIV = getReportForFinancialYearId[0].encryption_iv;
                    fileName = fileObject.uploadFile?.originalFilename;
                    const s3FileData = await s3.getObject(params).promise();
                    const decryptedData = await uniqueFunction.decryptFileBuffer(s3FileData.Body, fileName, encryptionKey, encryptionIV);

                    if(!decryptedData.result)
                    {
                        throw new Error(`File decryption error`);
                    }

                    const fileDataJson = JSON.parse(decryptedData?.file);
                    const uploadedMonthYear = format(new Date(uploadedOn), 'MMM-yyyy', { locale: enIN });
                    console.log(uploadedMonthYear)
                    const filteredData = fileDataJson.filter(item => format(new Date(item['Clearing Doc Date']), 'MMM-yyyy', { locale: enIN }) != uploadedMonthYear);

                    filteredData.push(...JSON.parse(fs.readFileSync(fileObject.uploadFile.filepath)));

                    const updatedFileData = JSON.stringify(filteredData);
                    fs.writeFileSync(fileObject.uploadFile.filepath, updatedFileData)
                    const updatedEncryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileObject.uploadFile?.originalFilename, encryptionKey, encryptionIV, 'file')

                    if (updatedEncryptedData?.result) {
                        await deleteS3Object(bucketName, params.Key);

                        const uploadFileToS3Bucket = await uniqueFunction.uploadSpsnFiles(updatedEncryptedData?.file, fileObject.uploadFile?.originalFilename, clientUuid, documentNewFolderPath, 'spsn');

                        await db.updateSpsnOSAndCAReport(fileObject.uploadFile?.originalFilename, uploadFileToS3Bucket?.s3FilePath, uploadedOn, updatedEncryptedData.encriptionKey, updatedEncryptedData.encriptionIV, getReportForFinancialYearId[0]?.id, monthPeriod);

                        res.status(200);
                        return res.json({
                            "status_code": 200,
                            "message": "success",
                            "status_name": getCode.getStatus(200)
                        });
                    } else {
                        console.log("file not uploaded", updatedEncryptedData);
                        res.status(400);
                        return res.json({
                            "status_code": 400,
                            "message": "File not uploaded",
                            "status_name": getCode.getStatus(400)
                        });
                    }
                } else {
                    try {
                        await deleteS3Object(bucketName, getReportForFinancialYearId[0].document_file_path);

                        let s3FilePath = "";
                        let fileName = "";
                        let encriptionKey = "";
                        let encriptionIV = "";
                        fileName = fileObject.uploadFile?.originalFilename;
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileName, null, null, 'file');
                        if (encryptedData?.result) {
                            encriptionIV = encryptedData.encriptionIV;
                            encriptionKey = encryptedData.encriptionKey;
                            let inputPath = documentNewFolderPath;
                            let uploadFileToS3Bucket = await uniqueFunction.uploadSpsnFiles(encryptedData?.file, fileName, clientUuid, inputPath, 'spsn');
                            await db.updateSpsnOSAndCAReport(fileName, uploadFileToS3Bucket?.s3FilePath, uploadedOn, encriptionKey, encriptionIV, getReportForFinancialYearId[0]?.id, monthPeriod);

                            res.status(200);
                            return res.json({
                                "status_code": 200,
                                "message": "success",
                                "status_name": getCode.getStatus(200)
                            });
                        } else {
                            console.log("file not uploaded", encryptedData);
                            res.status(400);
                            return res.json({
                                "status_code": 400,
                                "message": "File not uploaded",
                                "status_name": getCode.getStatus(400)
                            });
                        }
                    } catch (err) {
                        console.error('Error:', err);
                        res.status(500);
                        return res.json({
                            "status_code": 500,
                            "message": err?.stack,
                            "status_name": getCode.getStatus(500)
                        });
                    }
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500);
        return res.json({
            "status_code": 500,
            "message": err?.stack,
            "status_name": getCode.getStatus(500)
        });
    }
});
