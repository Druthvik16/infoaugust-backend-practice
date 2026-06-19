let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let formidable = require('formidable');
let fs = require('fs')
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
let inputFolderPath = 'Input_Pdfs';
const bucketName = process.env.Bucket_Name;
// const folderName = 'vendorModule/client/'
const folderName =  uniqueFunction.vendorModule + 'client/'
const vendorModuleClientPath = '/' + uniqueFunction.vendorModule + 'client'
const documentFolderPathBCL = 'Uploaded_Balance_Confirmation_Letter_Pdfs'
const documentFolderPathNDC = 'Uploaded_No_Dues_Certificate_Pdfs'

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let documentAttachmentId;
        let documentNewFolderPath = ''
        let attachmentType = 'Pdf';
        let apiName = ''
        let fileObject = {};
        let clientUploadedDocsMasterId;
        let originalFileName;
        apiName = req.baseUrl
        let options = {
            filename: (name, ext, part, form) => {
                return part.originalFilename
            }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) {
            if (error) {
                console.log(error);
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": error?.stack,
                    "status_name": getCode.getStatus(500)
                })
            }
            
            let userId = req.body?.userId
            let getVendor = await db.getVendor(userId)
            req.body = fields
            if (!req.body?.clientUuid || !req.body.action || !req.body.clientDocMasterId) {
                uniqueFunction.removeFileFromDirectory(fileObject['uploadBCLorNDC']?.filepath)
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": "Provide all values",
                    "status_name": getCode.getStatus(400)
                })
            }
            clientUuid = req.body?.clientUuid[0]
            let action = req.body?.action[0]
            if (Object.keys(file).length > 0) {
                if (Array.isArray(file['uploadBCLorNDC']) == true) {
                    fileObject['uploadBCLorNDC'] = file['uploadBCLorNDC'][0]
                }
                else {
                    fileObject = file
                }
                console.log("fileObject", fileObject)
                const [year, month, day] =  new Date().toISOString().slice(0, 10).replace('T', ' ').split('-')
                let curDate = `${day}-${month}-${year}`

                let newFileName = getVendor[0].vendorCode + '_' + curDate + '_' + action + '.pdf'
            
                fs.copyFileSync(fileObject.uploadBCLorNDC.filepath, 'tempFiles/'+newFileName)
                uniqueFunction.removeFileFromDirectory(fileObject.uploadBCLorNDC.filepath) 
                fileObject.uploadBCLorNDC.filepath = 'tempFiles/'+newFileName
                fileObject.uploadBCLorNDC.originalFilename = newFileName
            }
            else {
                uniqueFunction.removeFileFromDirectory(fileObject['uploadBCLorNDC']?.filepath)
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": "File Not Found",
                    "status_name": getCode.getStatus(400)
                })
            }
            if(getVendor?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Vendor not found",
                    "status_name": getCode.getStatus(500)
                })
            }
            clientUploadedDocsMasterId = req.body?.clientDocMasterId[0]
            documentNewFolderPath = action == 'BCL' ? documentFolderPathBCL : documentFolderPathNDC
            documentAttachmentId = await db.getDocumentAttachmentId(attachmentType);
            documentAttachmentId = documentAttachmentId[0]?.id
            let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject['uploadBCLorNDC'].filepath, fileObject['uploadBCLorNDC'].originalFilename, null, null, 'file')
            if (encryptedData?.result) {
                let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, fileObject['uploadBCLorNDC'].originalFilename, clientUuid, documentNewFolderPath)
                if (uploadFileToS3Bucket && uploadFileToS3Bucket?.result) {
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', userId, '', fileObject['uploadBCLorNDC']?.size, apiName, 'S3', new Date(), clientUuid, fileObject['uploadBCLorNDC']?.originalFilename)

                    let savePdfFile = await db.savePdfFile(fileObject['uploadBCLorNDC'].originalFilename, uploadFileToS3Bucket.s3FilePath, clientUploadedDocsMasterId, documentAttachmentId, new Date(), encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                    let s3SourceFilePathListObject = folderName + clientUuid + "/" + inputFolderPath + "/" + originalFileName
                    let fileP = getPath.getName('documentFolders') + vendorModuleClientPath + '/' + clientUuid + "/" + inputFolderPath + "/" + fileObject['uploadBCLorNDC'].originalFilename
                    res.status(200)
                    return res.json({
                        "status_code": 200,
                        "message": "success",
                        "status_name": getCode.getStatus(200)
                    })
                }
                else {
                    uniqueFunction.removeFileFromDirectory(fileObject['uploadBCLorNDC'].filepath)
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": "Pdf file not uploaded",
                        "status_name": getCode.getStatus(500)
                    })
                }
            }
            else {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "File not encrypted",
                    "status_name": getCode.getStatus(500)
                })
            }
        })
    }
    catch (e) {
        uniqueFunction.removeFileFromDirectory(fileObject['uploadBCLorNDC'].filepath)
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "Pdf not uploaded",
            "status_name": getCode.getStatus(500),
            "error": e?.stack
        })
    }
})
