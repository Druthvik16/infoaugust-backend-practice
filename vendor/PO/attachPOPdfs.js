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
let apiName = ''


module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let userId = req.body.userId;
        apiName = req.baseUrl;
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
                    console.log(files)
                    if (error) {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": error?.stack,
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    req.body = fields
                    if (!req.body.client || !JSON.parse(req.body.client)?.uuid) {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "Provide all values",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let clientUuid = JSON.parse(req.body.client)?.uuid
                    let poData = await db.getPODataForPdf(clientUuid)

                    let mappedPONumbers = poData.map(poNumber => poNumber.poNumber)
                    console.log(mappedPONumbers)
                    if (Object.keys(files).length > 0) 
                    {
                        let response = await savePOs(files?.pdfFile, 0, files?.pdfFile?.length, [], mappedPONumbers, userId, poData)
                        if(response.rejected?.length > 0)
                        {
                            res.status(200)
                            return res.json({
                                "status_code": 200,
                                "message": "success",
                                "data" : {"files" : response.rejected},
                                "status_name": getCode.getStatus(200)
                            })
                        }
                        else
                        {                            
                            res.status(200)
                            return res.json({
                                "status_code": 200,
                                "message": "success",
                                "status_name": getCode.getStatus(200)
                            })
                        }
                    }
                    else
                    {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "File not found",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                }
                catch (e) {
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": "PO pdf not uploaded",
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
            "message": "PO pdf not uploaded",
            "status_name": getCode.getStatus(500),
            "error": e
        })
    }
})

async function savePOs(data, start, end, rejected, mappedPONumbers, userId, poData) {
    try {
        if (start < end) 
        {
            let file = data[start];
            let poNumber = file?.originalFilename?.split('_')[0]
            console.log(poNumber, mappedPONumbers.includes(poNumber))
            let po = poData.find((doc) => {return doc.poNumber?.toString() == poNumber?.toString();});
            if(!mappedPONumbers.includes(poNumber) || !po)
            {
                rejected.push(file)
            }
            else
            {
                let clientUuid = po.clientUuid
                let clientId = po.clientId
                let vendorId = po.vendorId
                let vendorUuid = po.vendorUuid
                // console.log(file.filepath)
                let filePath = null
                let encryptionKey = null
                let encryptionIV = null
                // let path1 = 'uploads/vendor/po/pdf/' + file.originalFilename;
                // let fileCopy = fs.copyFileSync(file.filepath, path1)
                let uploadFileToS3 = await uploadFileToS3VendorModule(file, vendorUuid, clientId, vendorId, clientUuid, po.vendorCode)
                if(uploadFileToS3.result)
                {
                    filePath = uploadFileToS3.filePath
                    encryptionKey = uploadFileToS3.encryptionKey
                    encryptionIV = uploadFileToS3.encryptionIV
                    let updatePo = await db.updatePOpdf(poNumber, filePath, new Date(), userId, encryptionKey, encryptionIV)            
                    let posToRemoveFile = mappedPONumbers.map((doc) => {return doc;}).indexOf(poNumber);
                    if (posToRemoveFile > -1) mappedPONumbers.splice(posToRemoveFile, 1);
                }
                else
                {
                    rejected.push(file)
                }

                // let uploadFile = await  uniqueFunction.singleFileUpload(file.filepath, getPath.getName('vendor'), file.originalFilename, (getPath.getName('vendor/po/pdf')))
                // let 
                // if(uploadFile && uploadFile.result == true)
                // {
                //     let updatePo = await db.updatePOpdf(poNumber, uploadFile.localFilePath, new Date(), userId)            
                //     let posToRemoveFile = mappedPONumbers.map((doc) => {return doc;}).indexOf(poNumber);
                //     if (posToRemoveFile > -1) mappedPONumbers.splice(posToRemoveFile, 1);
                // }
                // else
                // {
                //     rejected.push(file)
                // }
            }    
            uniqueFunction.removeFileFromDirectory(file?.filepath)
            start++;
            return savePOs(data, start, end, rejected, mappedPONumbers, userId, poData);
        }
        else 
        {
            return { result: true, rejected: rejected};
        }
    }
    catch (e) 
    {
        console.log(e);        
        data[start]['remark'] = e.stack || e.message || e 
        rejected.push(data[start])
        uniqueFunction.removeFileFromDirectory(data[start]?.filepath)
        start++;
        return savePOs(data, start, end, rejected, mappedPONumbers, userId, poData);
    }
}

async function uploadFileToS3VendorModule(file, vendorUuid, clientId, vendorId, clientUuid, vendorCode)
{
    try
    {
        let clientData = await db.getClientUuid(clientId)
        
        console.log("upload", __dirname)
        let encryptedData = await uniqueFunction.encryptFileBuffer(file.filepath, file.originalFilename,null, null, 'file')
        if(encryptedData?.result)
        {
            let s3Folder = 'client/' + clientUuid +  '/vendor/' + vendorUuid + '/poDocs'
            let uploadFiles = await uniqueFunction.uploadVendorModulesFiles(encryptedData?.file, file.originalFilename, s3Folder)
            
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
            return {"result" : false}
        }
    }
    catch (e)
    {
        console.log(e)
        return {"result" : false}
    }
}
