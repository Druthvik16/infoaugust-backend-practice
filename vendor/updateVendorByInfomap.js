let db = require('./dbQueryVendor')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let formidable = require('formidable');
let path = require('path')
let fs = require('fs')
let vendorCommonFunction = require('./vendorCommonFunction')
let apiName = ''
let s3BucketInputPath = 'Document_Timelines'
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let userId = req.body.userId;
        apiName = req.baseUrl
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
                    for(let key in fields)
                    {
                        fields[key] = fields[key][0]

                        if(key == 'vendor' || key == 'documentTimeline'  || key == 'bankName' || key == 'vendorDocuments' || key == 'city'  || key == 'state'  || key == 'country' )
                        {
                            console.log(key)
                            fields[key] = JSON.parse(fields[key])
                        }
                    }  
                    req.body = fields           
                    if(!req.body.vendor || !req.body.vendor?.uuid || !req.body.vendorDocuments || req.body.vendorDocuments?.length == 0 || !req.body.documentTimeline || !req.body.documentTimeline?.id)
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message" : "Provide all values",
                            "status_name" : getCode.getStatus(400)
                        })
                    }
                    let remark = ''
                    let partnerUuid = req.body.vendor?.uuid
                    let vendorDocuments = req.body.vendorDocuments
                    let documentTimelineId = req.body.documentTimeline?.id

        //////////////////////////////////////////////////////////////////////////////////////////////
                    
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
                    let partnerId = vendor[0].id     
                    let vendorDocState = vendor[0].docState;
                    if(vendorDocState?.toString()?.length == 0)
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : "Vendor documents submission are pending",
                            "status_name" : getCode.getStatus(400)
                        });
                    }
                    let documentTimeline = await db.getDocumentTimeline(documentTimelineId);
                    if(documentTimeline?.length == 0)
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : "Document timeline not found",
                            "status_name" : getCode.getStatus(400)
                        });
                    }
                    
                    if(documentTimeline[0].vendorId != partnerId)
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : "Provide correct document timeline",
                            "status_name" : getCode.getStatus(400)
                        });
                    }
                    let vendorStatusId = vendor[0].vendorStatusId;
                    let vendorStatusName = vendor[0].vendorStatusName;
                    if(vendorStatusName == 'Registration-Initiated')
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : "Vendor registration process is incomplete",
                            "status_name" : getCode.getStatus(400)
                        });
                    }
                    else  if(vendorStatusName == 'Document-Validated')
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : "Vendor documents validation already completed.",
                            "status_name" : getCode.getStatus(400)
                        });
                    }
                    else  if(vendorStatusName == 'On-Boarded')
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : "Vendor is already on-boarded.",
                            "status_name" : getCode.getStatus(400)
                        });
                    }        
                    else  if(vendorStatusName == 'Document-Submitted')
                    { 
                        let isUpdateFileForm = false
                        if(vendor[0]?.isFormValidated == 0) 
                        {  
                            let getVendorRegistrationForm = await db.getVendorRegistrationForm(partnerId)                
                            const {result, errors} = await saveRegistrationForm(partnerUuid, partnerId, req.body, userId)
    
                            if(!result)
                            {
                                res.status(500)
                                return res.json({
                                    "status_code" : 500,
                                    "message"     : errors[0].message,
                                    "status_name" : getCode.getStatus(500)
                                }); 
                            }
                            let getVendorRegistrationForm1 = await db.getVendorRegistrationForm(partnerId)
                            isUpdateFileForm = JSON.stringify(getVendorRegistrationForm) !== JSON.stringify(getVendorRegistrationForm1);  
                        }
                        if(isUpdateFileForm)
                        {
                            remark = remark?.length > 0 ? `${remark}, Vendor form updated ` : ` Vendor form updated `;
                        }
                        let getVendorDocuments = await db.getVendorUploadDocuments(partnerId);
                        if(getVendorDocuments.length == 0) 
                        {
                            res.status(500)
                            return res.json({
                                "status_code" : 500,
                                "message"     : "Uploaded vendor document",
                                "status_name" : getCode.getStatus(500)
                            });            
                        }

                        let error = []
                        let fileCount = 0;

                        // getVendorDocuments.forEach((element) => 
                        // {
                        //     if(element.fileName?.toString()?.length > 0 && element.isRequired == 1)
                        //     {
                        //         fileCount++;
                        //     }
                        //     else if(element.fileName?.toString()?.length > 0)
                        //     if(element.fileName?.toString()?.length > 0 && element.isInfomapVerified == 1)
                        //     {
                        //         error.push({ field: element.clientVendorAttachmentName, message : `File already validated for ${element.clientVendorAttachmentName}`})
                        //     }
                        // })

                        // if(error.length == fileCount &&  vendor[0]?.isFormValidated == 1) 
                        // {
                        //     res.status(500)
                        //     return res.json({
                        //         "status_code" : 500,
                        //         "message"     : "Vendor form and document validation already completed",
                        //         "status_name" : getCode.getStatus(500)
                        //     });            
                        // }

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

                        let response = await saveVendorDocuments(getVendorDocuments, 0, getVendorDocuments?.length, files, partnerId, partnerUuid, [], [], [], vendorDocuments, '')      
                        // if(response.fileArray?.length > 0)
                        // {    
                        //     let uploadDocuments = await uniqueFunction.multiFileUpload(response.fileArray, getPath.getName('vendor'), partnerUuid + '/' + getPath.getName('vendor/uploadDocuments'), 'vendorDocuments')
                        //     console.log(uploadDocuments)
                        // } 

                        remark = remark.length > 0 ? `${remark}, ${response.remark}` : ` ${response.remark}`
                        let fileStat = fs.statSync(documentTimeline[0].localFilePath) 
                        let uploadFileToS3Bucket = await vendorCommonFunction.uploadFileToS3Bucket(documentTimeline[0].localFilePath,'file',documentTimeline[0].fileName, '', '',s3BucketInputPath,apiName,partnerUuid,documentTimeline[0].localFilePath, fileStat?.size)

                        if(!uploadFileToS3Bucket.result)
                        {
                            res.status(500)
                            return res.json({
                                "status_code" : 500,
                                "message" : uploadFileToS3Bucket.error,
                                "status_name" : getCode.getStatus(500)
                            })
                        }
                        else
                        {
                            let status = 'Fixed'
                            let encriptionIV = uploadFileToS3Bucket?.encryptedData?.encriptionIV
                            let encriptionKey = uploadFileToS3Bucket?.encryptedData?.encriptionKey
                            let s3FilePath = uploadFileToS3Bucket?.path 

                            let updateDocumentTimeline = await db.updateDocumentTimeline(documentTimelineId, new Date(), status, userId, encriptionIV, encriptionKey, s3FilePath, remark)

                            let updateVendorDocumentValidation = await db.updateVendorDocumentValidation(partnerId, new Date(), 'Infomap-Modified', userId)
                            if(updateVendorDocumentValidation.affectedRows > 0)
                            {
                                if(response.rejectedFiles.length > 0)
                                {
                                    res.status(500)
                                    return res.json({
                                        "status_code" : 500,
                                        "message" : response?.rejectedFiles[0].error,
                                        "status_name" : getCode.getStatus(500)
                                    }) 
                                }
                                else
                                {
                                    res.status(200)
                                    return res.json({
                                        "status_code" : 200,
                                        "message"     : "success",
                                        "status_name" : getCode.getStatus(200),
                                    });
                                }
                            }
                            else
                            {
                                res.status(500)
                                return res.json({
                                    "status_code" : 500,
                                    "message" : "Vendor document state not changed",
                                    "status_name" : getCode.getStatus(500)
                                })
                            }
                        }                         
                    }
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

async function saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark) 
{
    try {
        if (start < end) 
        {
            let element = getVendorDocuments[start];
            let clientId = element.clientId

            let vendorDocument = vendorDocuments.find(document => document.id == element.id) || {};

            let documentName = "document" + element.id;
            let file = files[documentName] || false;

            
            if(!file)
            {
                start++;
                return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            }

            if(element.isInfomapVerified == 1 && file)
            {
                rejectedFiles.push({ field: element.clientVendorAttachmentName, error: `Document already validated for ${element.clientVendorAttachmentName}` });
                start++;
                return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            }
            // else if (Object.keys(vendorDocument).length == 0 && parseInt(element?.isRequired) == 1 && (!element?.fileName || element.fileName?.toString().length == 0)) 
            // {
            //     console.log("req1", element)
            //     rejectedFiles.push({ field: element.clientVendorAttachmentName, error: `File upload required for ${element.clientVendorAttachmentName}` });
            //     start++;
            //     return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            // }

            // if ((!vendorDocument?.fileName || vendorDocument?.fileName.length == 0) && (!element?.fileName || element?.fileName.length == 0) && (parseInt(element?.isRequired) == 1)) 
            // {
            //     console.log("req2")
            //     rejectedFiles.push({ field: element.clientVendorAttachmentName, error: `File upload required for ${element.clientVendorAttachmentName}` });
            //     start++;
            //     return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            // }

            // if (!file && (!element?.fileName || element?.fileName.length == 0) && parseInt(element?.isRequired) == 1) 
            // {
            //     console.log("req3")
            //     rejectedFiles.push({ field: element.clientVendorAttachmentName, error: `File upload required for ${element.clientVendorAttachmentName}` });
            //     start++;
            //     return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            // }

            if ((element?.fileName?.length > 0 && file)) 
            {
                // await uniqueFunction.deleteUploadedFile(getPath.getName('vendor'), element?.fileName, partnerUuid + '/' + getPath.getName('vendor/uploadDocuments'), '');
                let deleteFile = await deleteFileFromS3VendorModule(element.filePath)
            } 
            else if ((!element?.fileName || element?.fileName?.length == 0) && !file && vendorDocument?.fileName?.length > 0 && parseInt(element?.isRequired) == 1) 
            {
                rejectedFiles.push({ fileName: vendorDocument?.fileName, error: `File not found ${vendorDocument?.fileName}` });
                start++;
                return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            }

            const allowedExtensions = ['.png', '.jpeg', '.jpg', '.pdf'];
            const fileExtension = file ? path.extname(file?.originalFilename).toLowerCase() : null;
            if (file && !allowedExtensions.includes(fileExtension)) 
            {
                rejectedFiles.push({ fileName: file?.originalFilename, error: 'Invalid file type' });
                start++;
                return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            }

            if (file && docFileNames.includes(file.originalFilename))
            {
                rejectedFiles.push({ fileName: file.originalFilename, error: 'File name duplicate' });
                start++;
                return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            }

            if (file && file.originalFilename.toLowerCase() != vendorDocument?.fileName?.toLowerCase()) 
            {
                rejectedFiles.push({ fileName: file.originalFilename || vendorDocument?.fileName, error: `Uploaded document file name ${file?.originalFilename} not matched with file name attached with document ${vendorDocument?.fileName}` });
                start++;
                return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
            }
            let id = element?.id || 0;
            console.log(id, vendorDocument, element, file?.originalFilename)

            let uniqueFileName = await uniqueFunction.unquieName('vendor_document', ['file_name', 'partner_id'], { 'file_name': vendorDocument?.fileName, 'partner_id': partnerId }, id, '');
            if (uniqueFileName == 0) 
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
                    let fileType = `.${element.fileName.split(".").pop()}`;
                    let updatedFileName = fileName1 + fileType
                    fileName = updatedFileName
                    filePath = element.filePath
                    encryptionKey = element.encryptionKey
                    encryptionIV = element.encryptionIV
                    // fileName = element.fileName 
                }
                remark = remark?.length > 0 ? `${remark}, ${element.clientVendorAttachmentName} updated ` : ` ${element.clientVendorAttachmentName} updated `
                await db.updateVendorDocument(element.id, fileName, new Date(), partnerId, filePath, encryptionKey, encryptionIV);
            } 
            else 
            {
                if(element?.isRequired == 1 && vendorDocument?.fileName && vendorDocument?.fileName?.length > 0)
                {
                    rejectedFiles.push({ fileName:  vendorDocument?.fileName, error: `Duplicate file name ${ vendorDocument?.fileName} for vendor document.` });
                }
            }
            start++;
            return saveVendorDocuments(getVendorDocuments, start, end, files, partnerId, partnerUuid, rejectedFiles, documentArray, docFileNames, vendorDocuments, remark);
        } 
        else 
        {
            return { result: true, fileArray: documentArray, rejectedFiles: rejectedFiles, remark : remark };
        }
    } 
    catch (e) 
    {
        console.log(e);
        rejectedFiles.push({ 'Catch': '', error: e.stack || e.message || e });
        return { result: false, fileArray: documentArray, rejectedFiles: rejectedFiles, remark : remark };
    }
}


async function saveRegistrationForm(partnerUuid, partnerId, body, userId)
{    
    const {errors:validationErrors, validBody: vendorData} = await vendorCommonFunction.validateRequestBody(body);

    if(validationErrors.length > 0) 
    {
        return {result:false, errors:validationErrors}
    }
    else
    {
        if(Object.keys(vendorData).length > 0)
        {
            let partnerAdditionalInfo = await db.getPartnerAdditionalInfo(partnerId)
            let partnerAdditionalInfoId = partnerAdditionalInfo[0].id

            if(vendorData.email2)
            {
                let uniqueCheckEmailAddress = await vendorCommonFunction.uniqueCheckEmail(vendorData.email2, partnerAdditionalInfoId)
                if(!uniqueCheckEmailAddress.result)
                {
                    validationErrors.push({ field: 'Email', message: uniqueCheckEmailAddress.error});
                    delete vendorData.email2
                }              
            }

            if(vendorData.bankAccountNumber)
            {   
                let uniqueCheckBank = await vendorCommonFunction.uniqueCheckBankAccountNo(vendorData.bankAccountNumber, partnerAdditionalInfoId)
                if(!uniqueCheckBank.result)
                {
                    validationErrors.push({ field: 'Bank account number', message: uniqueCheckBank.error});
                    delete vendorData.bankAccountNumber
                }  
            }

            if(vendorData.gstin)
            {   
                let uniqueCheckGstIn = await vendorCommonFunction.uniqueCheckGstNo(vendorData.gstin, partnerAdditionalInfoId)
                if(!uniqueCheckGstIn.result)
                {
                    validationErrors.push({ field: 'GSTIN', message: uniqueCheckGstIn.error});
                    delete vendorData.gstin
                }
            }

            if(vendorData.cin)
            {   
                let uniqueCheckcin = await vendorCommonFunction.uniqueCheckCINNo(vendorData.cin, partnerAdditionalInfoId)
                if(!uniqueCheckcin.result)
                {
                    validationErrors.push({ field: 'cin', message: uniqueCheckcin.error});
                    delete vendorData.cin
                }
            }
            
            if(vendorData.pan)
            {
                let uniqueCheckPanNo = await vendorCommonFunction.uniqueCheckPan(vendorData.pan, partnerId)
                if(!uniqueCheckPanNo.result)
                {
                    validationErrors.push({ field: 'Pan', message: uniqueCheckPanNo.error});
                    delete vendorData.pan
                }
                else
                {
                    let updatePartner = await db.updatePan(partnerId, vendorData.pan)
                }
            }

            if(validationErrors.length > 0) 
            {
                return {result:false, errors:validationErrors}
            }
            
            vendorData.isSubmitted = 2;
            vendorData.modifiedById = partnerId;
            vendorData.modifiedOn = new Date();

            let response = await generateSqlQuery(vendorData, partnerAdditionalInfoId)
            if(response.result)
            {
                return {result:true, errors:validationErrors}
            }
            else
            {
                validationErrors.push({fields: 'sqlQueryError', errors:response.error})
                return {result:false, errors:validationErrors}
            }
        }
        else
        {
            return {result:true, errors:validationErrors}
        }
    }
}

async function generateSqlQuery(data, partnerAdditionalInfoId)
{ 
    try
    {
        const columnMapping = 
        {
            bankAccountNumber: 'bank_account_number',
            branchName : 'branch_name',
            // pan: 'pan',
            email2: 'email2',
            landlineNo: 'landline_no',
            bankName: 'bank_id',
            bankAddress: 'bank_address',
            ifscCode: 'ifsc_code',
            address1: 'address1',
            address2: 'address2',
            city: 'city_id', 
            state: 'state_id', 
            country: 'country_id',
            postalCode: 'pincode',
            gstin: 'gstin',
            cin: 'cin',
            name2: 'name2',
            modifiedOn: 'modified_on',
            modifiedById: 'modified_by_id',
            isSubmitted: 'is_submitted'
        }; 
    
        let setClauses = [];
        let values = [];
        let index = 1;
    
        for (const key in columnMapping) 
        {
            if (data[key] !== undefined) 
            {
                if(data[key] == '')
                {
                    data[key] = null;
                }
                if (key === 'bankName') 
                {
                    setClauses.push(`${columnMapping[key]} = (SELECT id FROM bank_master WHERE id = ?)`);
                    values.push(data[key].id);
                } 
                else  if (key === 'country' || key === 'state' || key === 'city') 
                {
                    setClauses.push(`${columnMapping[key]} = (SELECT id FROM ${key} WHERE id = ?)`);
                    values.push(data[key].id);
                }
                else 
                {
                    setClauses.push(`${columnMapping[key]} = ?`);
                    values.push(data[key]);
                }
                index++;
            }
        }
        const setQuery = setClauses.join(', ');
        const sql = `UPDATE partner_additional_info SET ${setQuery} WHERE id = ?`;
        values.push(partnerAdditionalInfoId);
        console.log(sql, values);
        let update = await db.updatePartnerAdditionalInfo(sql, values)
        if(update.affectedRows > 0)
        {
            return { result : true}  
        }
        else
        {
            return { result : false, error : 'Something went wrong'}  
        }
    }
    catch (e)
    {
        console.log(e)
        return { error : e?.stack || e.message || e, result : false};
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