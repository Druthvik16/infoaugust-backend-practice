let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const randomKey = require('../authenticate/tokenGenerate')
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');
let formidable = require('formidable');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion');
const attachmentType = 'Pdf';

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        const createdOn = new Date()
        const createdById = req.body.userId      
        let fileObject = {};
        const apiName = req.baseUrl
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part.originalFilename
                        }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) 
        {
            if(error) 
            {
                console.log(error);
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : error?.stack,
                    "status_name" : getCode.getStatus(500)
                })
            }
            if(Object.keys(file).length > 0)
            {
                if(Array.isArray(file['']) == true)
                {
                    fileObject.uploadFile = file[''][0]
                }
                else
                {
                    // fileObject = file
                    fileObject['uploadFile'] = file.uploadFile[0]
                }
                console.log("fileObject",fileObject)
            }
            else
            {
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile?.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            req.body = fields
            if(!req.body?.clientUuid || !req.body.documentCategoryId || !req.body.summaryId)
            {
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile?.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Provide all values",
                    "status_name" : getCode.getStatus(400)
                })
            }  
            const clientUuid = req.body?.clientUuid[0]
            const documentCategoryId = req.body?.documentCategoryId[0]
            const summaryId = req.body?.summaryId[0]
            const documentCategories = await db.getDocumentCategories();
            const documentCategory = documentCategories.find(doc => doc.id == documentCategoryId)?.name || null;
            console.log(documentCategory, documentCategoryId)
            if(!documentCategory)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Document category not found",
                    "status_name" : getCode.getStatus(500)
                });
            }

            const client = await commonDb.getIdByUUId('client', clientUuid)
            const clientId = client[0]?.id || null;
            if(!clientId)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Client not found",
                    "status_name" : getCode.getStatus(500)
                });
            }

            const documentNewFolderPath = documentCategory == 'Credit Note' ? 'Uploaded_Pdfs' : 'Uploaded_Invoice_Pdfs_Raw_Sap_dump';  
            
            let documentAttachmentId = await db.getDocumentAttachmentId(attachmentType);
            documentAttachmentId = documentAttachmentId[0]?.id

            const summaryData = await db.getPendingPdfClientUploadedDocMaster(summaryId)

            if(!summaryData[0].id)
            {
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Summary Not Found",
                    "status_name" : getCode.getStatus(400)
                })  
            }
            else if(summaryData[0].isPdfExist > 0)
            {
                uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Pdf already uploaded for summary",
                    "status_name" : getCode.getStatus(400)
                })  
            }

            const identifierName = 'upload_doc_log_master'
            const id = 0
            const uniqueCheckName = await uniqueFunction.unquieName(identifierName, ['file_name'],{  "file_name" : fileObject.uploadFile.originalFilename }, id, 0)
        
            if(uniqueCheckName != 0)
            {
                fileObject.uploadFile['oldFileName'] = fileObject.uploadFile.originalFilename                                    
                let nameArray = fileObject.uploadFile.originalFilename.split('.')
                let newFileName = nameArray[0] + '_' + randomKey(5) + '.' + nameArray[1]
                fileObject.uploadFile['originalFilename'] = newFileName
            }

            const initialFileName = documentCategory == 'Credit Note' ? summaryData[0].document_number + '-' + summaryData[0].code + '-' + format(summaryData[0].posting_date, 'yyyy-MM-dd', { locale: enIN }) : summaryData[0].bill_no_or_ref_no;  

            console.log(summaryData, initialFileName, fileObject)

            const fileName = initialFileName + '.pdf'

            let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadFile.filepath, fileObject.uploadFile.originalFilename,null, null, 'file')

            if(encryptedData?.result)
            {
                const uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileName, clientUuid, documentNewFolderPath)
                if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
                {
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', '', '',fileObject.uploadFile.size, apiName, 'S3', new Date(), clientUuid, fileName)

                    let savePdfFile = await db.savePdfFile(fileName, uploadFileToS3Bucket.s3FilePath,summaryId,documentAttachmentId,new Date(),encryptedData?.encriptionKey,encryptedData?.encriptionIV, createdById)

                    const status = 'Completed'

                    // let sql1 = `UPDATE upload_doc_log_master SET status = 'Completed', processed_file_path = '${uploadFileToS3Bucket.s3FilePath}', encryption_key = '${encryptedData?.encriptionKey}',  encryption_iv = '${encryptedData?.encriptionIV}' , completed_on = ? WHERE UPPER(file_name) = UPPER('${originalFileName}')`

                    const sql = `INSERT INTO upload_doc_log_master (file_name, client_id, document_attachment_id, status, processed_file_path, uploaded_on, completed_on, document_category_id,encryption_key,encryption_iv, created_on, created_by_id) VALUES ('${fileObject.uploadFile.originalFilename}', '${clientId}', '${documentAttachmentId}', '${status}', '${uploadFileToS3Bucket.s3FilePath}', ?, ?, '${documentCategoryId}', '${encryptedData?.encriptionKey}', '${encryptedData?.encriptionIV}', ? , '${createdById}')`

                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date(), new Date(), createdOn]);
                            
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "status_name" : getCode.getStatus(200)
                    })
                }
                else
                {
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "Summary pdf file not uploaded",
                        "status_name" : getCode.getStatus(500)
                    }) 
                } 
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "File not encrypted",
                    "status_name" : getCode.getStatus(500)
                })    
            }
        })
    } 
    catch(e)
    {
        uniqueFunction.removeFileFromDirectory(fileObject.uploadFile.filepath)
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Pdf not uploaded",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
})
