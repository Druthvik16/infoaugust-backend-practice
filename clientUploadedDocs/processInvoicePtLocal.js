let formidable = require('formidable');
let db = require('./dbQueryClientUploadedDocs')
let path = require('path')
let fs = require('fs')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let apiUrl = require('../apiUrl')
let api = new apiUrl()
const { PythonShell } = require('python-shell');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const bucketName = process.env.Bucket_Name;
let documentNewFolderPath = "Uploaded_Invoice_Pt_File_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Invoice_Pt_File_Raw_Sap_dump";
let logFileName = "invoicePtLogFile-"
let apiName = ''
let attachmentType = 'PT File'

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        let fileObject = {};
        let clientId;
        let clientUuid;
        let encriptionIV;
        let encriptionKey;
        let inputFolderPath;
        logFileName = "invoicePtLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        apiName = req.baseUrl
        console.log(new Date())
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part.originalFilename
                        }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) 
        {
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            let dailyActivityLogId = getDailyActivityLog?.[0]?.id;

            if (!dailyActivityLogId) {
              const { insertId } = await db.saveDailyActivityLog(new Date());
              dailyActivityLogId = insertId;
            }
            
            if(error) 
            {
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice PT', 'Error', JSON.parse(fields.client)?.uuid, new Date())
                console.log(error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, JSON.stringify(file), getPath.getName('script/invoice/pt'), 'red')
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Error",
                    "error" : error?.stack,
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            if(Object.keys(file).length > 0)
            {
                if(Array.isArray(file['uploadInvoicePtFile']) == true)
                {
                    fileObject['uploadInvoicePtFile'] = file['uploadInvoicePtFile'][0]
                }
                else
                {
                    fileObject = file
                }
                fs.copyFileSync(fileObject.uploadInvoicePtFile.filepath, 'tempFiles/'+fileObject.uploadInvoicePtFile.originalFilename)
                uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
                fileObject.uploadInvoicePtFile.filepath = 'tempFiles/'+fileObject.uploadInvoicePtFile.originalFilename
                let sql = `UPDATE upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileObject.uploadInvoicePtFile.originalFilename?.toUpperCase()}'`
                let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
            }
            else
            {
                await uniqueFunction.writeLogIntoFile('File Not Found', logFileName, JSON.stringify(file), getPath.getName('script/invoice/pt'), 'red')
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice PT', 'Error', JSON.parse(fields.client)?.uuid, new Date())
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            req.body = fields
            inputFolderPath = req.body.inputFolderPath[0]
            if(path.extname(fileObject.uploadInvoicePtFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadInvoicePtFile.originalFilename)?.toLowerCase() != '.csv')
            {
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice PT', 'Error', JSON.parse(fields.client)?.uuid, new Date())
                uniqueFunction.removeFileFromDirectory(inputFolderPath)
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadInvoicePtFile.filepath, fileObject.uploadInvoicePtFile.originalFilename,req.body.encriptionKey[0], req.body.encriptionIV[0], 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadInvoicePtFile.originalFilename, JSON.parse(fields.client)?.uuid, documentFailedFolderPath)

                            
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadInvoicePtFile.size, apiName, 'S3', new Date(), JSON.parse(fields.client)?.uuid, fileObject.uploadInvoicePtFile.originalFilename)

                    //log
                    let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadInvoicePtFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
                    await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "status_name" : getCode.getStatus(200)
                    })
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, getPath.getName('script/invoice/pt'), 'red')
                    console.log("Failed File Not Uploaded (Encryption error)")
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "status_name" : getCode.getStatus(200)
                    })
                }
            }
            else
            {
                clientUuid = JSON.parse(req.body.client)?.uuid
                clientId = JSON.parse(req.body.client)?.id           
                encriptionKey = req.body.encriptionKey[0]
                encriptionIV = req.body.encriptionIV[0]
                console.log(inputFolderPath,clientUuid)
                let document = await db.getDocuments()
                let documentCategories = await db.getDocumentCategories()
                let partnerLocations = await db.getPartnerLocationDatas()
                fs.writeFileSync("clientUploadedDocs/partnerLocationPt.txt",JSON.stringify(partnerLocations))
                let documentAttachments = await db.getDocumentAttachments()
                let documentAttachment = documentAttachments.find(doc => doc.name == attachmentType)
                let billNos = await db.getInvoiceNumberForPdf(documentAttachment.id)
                let clientDocsBillOrRefNo = billNos.map((billno) => billno.invoiceNumber)
                clientDocsBillOrRefNo = clientDocsBillOrRefNo?.length > 0 ? clientDocsBillOrRefNo : []
                console.log(clientDocsBillOrRefNo)
                fs.writeFileSync("clientUploadedDocs/billNoPt.txt",clientDocsBillOrRefNo.join(","))
                console.log("Pt file script called")
                readPythonScript(document, documentCategories, "clientUploadedDocs/partnerLocationPt.txt", documentAttachments, clientId, clientUuid, fileObject, res, "clientUploadedDocs/billNoPt.txt", dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
            }
        })    
    } 
    catch(e)
    {
        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice PT', 'Error', clientUuid, new Date())
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", getPath.getName('script/invoice/pt'), 'red')
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Partner Upload Failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

async function readPythonScript(document, documentCategories, partnerLocations, documentAttachments, clientId, clientUuid, fileObject, res, clientDocsBillOrRefNo, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
{
    console.log("script Called", clientDocsBillOrRefNo)
    await uniqueFunction.writeLogIntoFile(JSON.stringify(clientDocsBillOrRefNo), logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'blue')
    try
    {
        let scriptPath = path.join(__dirname,'../',getPath.getName('script'))
        let options = {
            mode: 'json',
            pythonOptions: ['-u'],
            scriptPath : scriptPath,
            args: [JSON.stringify(document), JSON.stringify(documentCategories), partnerLocations, JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadInvoicePtFile.filepath,documentNewFolderPath,documentFailedFolderPath, clientDocsBillOrRefNo,api.baseUrl]
        };
    
        let pyshell = new PythonShell('ptFile.py',options);
    
        pyshell.on('message', async function (message) {
            // console.log("message:   =========", message);
            // await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'blue')
            if(message.hasOwnProperty('code'))
            {
                if(message?.data?.length > 0  && message?.code == 'ERROR')
                {
                    await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Invoice PT', 'Error', clientUuid, new Date(), dailyActivityLogId)
                    console.log("message:   =========", message)
                    let sql = `UPDATE upload_doc_log_master SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadInvoicePtFile.originalFilename?.toUpperCase()}'`
                    db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message" : message?.data,
                            "status_name" : getCode.getStatus(500)
                        })
                    })
                }
                else if(message?.code == 'CMPLT')
                {
                    await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'green')
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Invoice PT', 'File Processing completed', clientUuid, new Date(), dailyActivityLogId)
                    uniqueFunction.removeFileFromDirectory(inputFolderPath)
                    uniqueFunction.encryptFileBuffer(fileObject.uploadInvoicePtFile.filepath, fileObject.uploadInvoicePtFile.originalFilename,encriptionKey, encriptionIV, 'file').then(async(encryptedData) => 
                    {
                        if(encryptedData?.result)
                        {
                            uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadInvoicePtFile.originalFilename, clientUuid, documentNewFolderPath).then(async(uploadFileToS3Bucket) => 
                            {
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadInvoicePtFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadInvoicePtFile.originalFilename)
                                let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Completed" : 'Failed')
                                let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                                // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                                let sql = `UPDATE upload_doc_log_master SET status = '${status}', processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', ${dates} = ?, completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadInvoicePtFile.originalFilename?.toUpperCase()}'`
                                await uniqueFunction.writeLogIntoFile("Completed File Uploaded", logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'green')
                                uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
                                db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then((updateLog) => 
                                {
                                    res.status(200)
                                    return res.json({
                                        "status_code" : 200,
                                        "message" : "success",
                                        "status_name" : getCode.getStatus(200)
                                    })
                                })
                            })
                        }
                        else
                        {
                            await uniqueFunction.writeLogIntoFile("Completed File Not Uploaded (Encryption error)", logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
                            console.log("file not uploaded")
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        }
                    }) 
                }
                else if(message?.code == 'FILEERROR')
                {
                    await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Invoice PT', 'Error', clientUuid, new Date(), dailyActivityLogId)
                    uniqueFunction.removeFileFromDirectory(inputFolderPath)
                    let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadInvoicePtFile.filepath, fileObject.uploadInvoicePtFile.originalFilename,encriptionKey, encriptionIV, 'file')

                    if(encryptedData?.result)
                    {
                        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadInvoicePtFile.originalFilename, clientUuid, documentFailedFolderPath)
                            
                        let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadInvoicePtFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadInvoicePtFile.originalFilename)

                        //log
                        let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadInvoicePtFile.originalFilename?.toUpperCase()}'`
                        
                        await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
                        let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])

                        uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        console.log("File Not Uploaded")
                        await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }  
                }
                else
                {                    
                    await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'blue')
                }
            }
        });
    
        pyshell.on('close', async function (close) {
            console.log("close:   =========", close);
            await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
        });
          
        pyshell.on('stderr',async function (stderr) {
            console.log("stderr:   =========", stderr);
            await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
        });
          
        pyshell.on('pythonError',async function (pythonError) {
            console.log("pythonError:   =========", pythonError);
            await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
        });
    
        pyshell.on('error',async function (error) {
            console.log("error:   =========", error);
            await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
        });
          
        pyshell.end(async function (err,code,signal) 
        {
            if (err)
            {
                await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'red')
            }
            await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadInvoicePtFile.originalFilename, getPath.getName('script/invoice/pt'), 'black')
            // uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
            console.log('The exit code was: ' + code);
            console.log('The exit signal was: ' + signal);
            console.log('finished');
        });
    }
    catch (e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), getPath.getName('script/invoice/pt'), 'red')
        console.log(e) 
        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Invoice PT', 'Error', clientUuid, new Date(), dailyActivityLogId)
        uniqueFunction.removeFileFromDirectory(fileObject.uploadInvoicePtFile.filepath)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack,
            "status_name" : getCode.getStatus(500)
        })
    }
}