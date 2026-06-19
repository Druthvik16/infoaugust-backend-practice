let db = require('./dbQueryVendor')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let formidable = require('formidable');
let path = require('path')
let apiName = ''

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        apiName = req.baseUrl;
        let partnerId = req.body.userId;
        fileObject = {}
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part.originalFilename
                        }
        }

        if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data'))
        {
            let form = new formidable.IncomingForm(options);
            form.parse(req, async function (error, fields, files) 
            {
                try
                {
                    if(error) 
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message" : error?.stack,
                            "status_name" : getCode.getStatus(400)
                        })
                    }    
                    req.body = fields         
                    if(!req.body.vendor || !JSON.parse(req.body.vendor)?.uuid || !req.body.vendorDocuments)
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message" : "Provide all values",
                            "status_name" : getCode.getStatus(400)
                        })
                    }
                    let partnerUuid = JSON.parse(req.body.vendor)?.uuid
                    let vendorDocuments = JSON.parse(req.body.vendorDocuments)
        
                    let vendor = await db.getPartner(partnerUuid)
                    if(vendor?.length == 0)
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : "Vendor not found",
                            "status_name" : getCode.getStatus(400)
                        });
                    }
            
                    if(vendor?.isSubmitted == 2)
                    {
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message"     : "Vendor document already submitted",
                            "status_name" : getCode.getStatus(500)
                        });
                    }
    
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
                    let response = await saveVendorDocuments(vendorDocuments, 0, vendorDocuments?.length, files, partnerId, partnerUuid, [], [], [])      
                    // if(response.fileArray?.length > 0)
                    // {
                    //     let uploadDocuments = await uniqueFunction.multiFileUpload(response.fileArray, getPath.getName('vendor'), partnerUuid + '/' + getPath.getName('vendor/uploadDocuments'), 'vendorDocuments')
                    // }      
                                    
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "error" : response?.error,
                        "rejected": response?.rejectedFiles,
                        "status_name" : getCode.getStatus(200)
                    }) 
                }
                catch(e)
                {
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "Vendor file not uploaded",
                        "status_name" : getCode.getStatus(500),
                        "error" : e?.stack || e.message
                    }) 
                }
            }) 
    
            form.on('error', (err)=>{
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
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Missing form-data",
                "status_name" : getCode.getStatus(500)
            })
        }
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Vendor file not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

async function saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)
{
    try
    {
        if (start < end)
        {
            let vendorDocument = vendorDocuments[start];
            let vendorDocumentDetail = await db.getVendorDocument(vendorDocument.id, partnerId)
            if(vendorDocumentDetail.length > 0)
            {
                let element = vendorDocumentDetail[0]
                let clientId = element.clientId
                let documentName = "document" + element?.id;
                let file = files[documentName] || false     
                if((element?.fileName?.length > 0 && file))
                {
                    // let deleteFile = await uniqueFunction.deleteUploadedFile(getPath.getName('vendor'), element.fileName, partnerUuid + '/' +  getPath.getName('vendor/uploadDocuments'), '')
                    let deleteFile = await deleteFileFromS3VendorModule(element.filePath)
                }
                else if((element?.fileName?.length > 0 && !file && vendorDocument?.fileName?.length == 0))
                {
                    // let deleteFile = await uniqueFunction.deleteUploadedFile(getPath.getName('vendor'), element.fileName, partnerUuid + '/' +  getPath.getName('vendor/uploadDocuments'), '')
                    let deleteFile = await deleteFileFromS3VendorModule(element.filePath)
                    vendorDocument.fileName = null;                        
                    let updateFileName = await db.updateVendorDocument(element.id,null, new Date(), partnerId, null, null, null)
                    start++;
                    return saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)
                }
                else if(((!element?.fileName || element?.fileName?.length == 0) && !file && vendorDocument.fileName.length > 0) && parseInt(element?.isRequired) == 1)
                {
                    rejectedFiles.push({ fileName: vendorDocument.fileName, error : 'File not found'})
                    start++;
                    return saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)
                }
                if(file && path.extname(file.originalFilename)?.toLowerCase() != '.png' && path.extname(file.originalFilename)?.toLowerCase() != '.jpeg' && path.extname(file.originalFilename)?.toLowerCase() != '.jpg' && path.extname(file.originalFilename)?.toLowerCase() != '.pdf')
                {
                    rejectedFiles.push({ fileName: file.originalFilename, error : 'Invalid file type'})
                    start++;
                    return saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)
                }
                else if(docFileNames.includes(file?.originalFilename))
                { 
                    rejectedFiles.push({ fileName: file.originalFilename, error : 'File name duplicate'})
                    start++;
                    return saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)
                }
                else if(vendorDocument?.fileName?.length > 0 && file && file?.originalFilename?.toLowerCase() != vendorDocument?.fileName?.toLowerCase())
                {
                    rejectedFiles.push({ fileName: file.originalFilename, error : `Uploaded document file name ${file?.originalFilename} not matched with file name attached with document ${vendorDocument?.fileName}`})
                    start++;
                    return saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)                              
                }
                else
                {
                    let id = vendorDocument.id
                    let uniqueFileName = await uniqueFunction.unquieName('vendor_document', ['file_name', 'partner_id'], {'file_name': vendorDocument.fileName, 'partner_id': partnerId}, id, '')
                    if(uniqueFileName == 0)
                    {
                        let fileName = '';
                        let filePath = null;
                        let encryptionKey = null;
                        let encryptionIV = null;
                        
                        if (file) 
                        {    
                            let originalFilename = file.originalFilename       
                            let fileName1 = element.clientVendorAttachmentName.split(' ').join('_')
                            fileName1 = fileName1.split('/').join('_')
                            let fileType = `.${originalFilename.split(".").pop()}`;
                            let updatedFileName = fileName1 + fileType
                            fileName = updatedFileName
                            file.newFileName = updatedFileName
                            docFileNames.push(originalFilename); 
                            documentArray.push(file);
                            file.originalFilename = updatedFileName
                            let uploadFileToS3 = await uploadFileToS3VendorModule(file, partnerUuid, clientId, partnerId)
                            if(uploadFileToS3.result)
                            {
                                filePath = uploadFileToS3.filePath
                                encryptionKey = uploadFileToS3.encryptionKey
                                encryptionIV = uploadFileToS3.encryptionIV
                            }
                            else
                            {
                                rejectedFiles.push({ fileName: originalFilename, error: `Error in uploading file` });
                                fileName = null
                            }
                        }
                        else if (!vendorDocument?.fileName || vendorDocument?.fileName?.length == 0) 
                        {
                            fileName = null;
                        }
                        else
                        {        
                            let fileName1 = element.clientVendorAttachmentName.split(' ').join('-')
                            let fileType = `.${vendorDocument.fileName.split(".").pop()}`;
                            let updatedFileName = fileName1 + fileType
                            fileName = updatedFileName
                            filePath = element.filePath
                            encryptionKey = element.encryptionKey
                            encryptionIV = element.encryptionIV
                            // fileName = vendorDocument.fileName 
                        }
                        let updateFileName = await db.updateVendorDocument(element.id,fileName, new Date(), partnerId, filePath, encryptionKey, encryptionIV)
                    }
                    else
                    {
                        rejectedFiles.push({ fileName: vendorDocument?.fileName, error: `Duplicate file name ${vendorDocument?.fileName} for vendor document ${element.clientVendorAttachmentName}.` });
                    }
                    start++;
                    return saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)  
                }
            }
            else
            {
                start++;
                return saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)
            }
        }
        else
        {
            return {result : true, fileArray : documentArray, rejectedFiles : rejectedFiles}
        }
    }
    catch (e)
    {
        console.log(e)
        rejectedFiles.push({ 'Catch': '', error : e?.stack || e.message || e})
        start++;
        return saveVendorDocuments(vendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames)
    }
}

async function uploadFileToS3VendorModule(file, vendorUuid, clientId, vendorId)
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

async function deleteFileFromS3VendorModule(inputFolderPath)
{
    try
    {
        let deleteFile = await uniqueFunction.deleteVendorModuleFile(inputFolderPath)
       return true;
    }
    catch (e)
    {
        console.log(e)
        return true;
    }
}