let formidable = require('formidable');
let db = require('./dbQueryScriptProcessing')
let path = require('path')
let fs = require('fs')
let errorCode = require('../../common/error/errorCode');
let getCode = new errorCode()
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let apiUrl = require('../../apiUrl')
let api = new apiUrl()
const { PythonShell } = require('python-shell');
const uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction');
const bucketName = process.env.Bucket_Name;

let fileObject = {};
let documentNewFolderPath = "Uploaded_Invoice_Summary_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Invoice_Summary_Raw_Sap_dump";
let logFileName = "invoiceSummaryLogFile-"
let apiName = '/api/fileProcessController/processInvoiceSummaryLocal'

let processInvoiceSummary = {}

processInvoiceSummary.getFileList = (fileObject, inputFolderPath, encriptionIV, encriptionKey, client) => 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {   
            let interuptProcess = await db.getInteruptProcess();
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false);
            }
            console.log(fileObject, inputFolderPath, encriptionIV, encriptionKey, client)
            let clientId;
            let clientUuid;
            logFileName = "invoiceSummaryLogFile-"
            logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
            console.log(new Date())
            fileObject['uploadISFile'] = fileObject
            clientUuid = client?.uuid
            clientId = client?.id
            
            fs.copyFileSync(fileObject.uploadISFile.filepath, 'tempFiles/'+fileObject.uploadISFile.originalFilename)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
            fileObject.uploadISFile.filepath = 'tempFiles/'+fileObject.uploadISFile.originalFilename
            let sql = `UPDATE upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileObject.uploadISFile.originalFilename?.toUpperCase()}'`
            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
            
            
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            let dailyActivityLogId = getDailyActivityLog?.[0]?.id;

            if (!dailyActivityLogId) {
              const { insertId } = await db.saveDailyActivityLog(new Date());
              dailyActivityLogId = insertId;
            }
            
            
            if(path.extname(fileObject.uploadISFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadISFile.originalFilename)?.toLowerCase() != '.csv')
            {
                uniqueFunction.removeFileFromDirectory(inputFolderPath)
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadISFile.filepath, fileObject.uploadISFile.originalFilename,encriptionKey, encriptionIV, 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadISFile.originalFilename,  clientUuid, documentFailedFolderPath)

                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadISFile.size, apiName, 'S3', new Date(),  clientUuid, fileObject.uploadISFile.originalFilename)
                    //log
                    let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadISFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
                    await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice Summary', 'File Process completed',  clientUuid, new Date())
                    return resolve(true)
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, getPath.getName('script/invoice/summary'), 'red')
                    console.log("Failed File Not Uploaded (Encryption error)")

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice Summary', 'File Process completed with error',  clientUuid, new Date())
                    return resolve(true)
                }
            }
            else
            {
                let document = await db.getDocuments()
                let documentCategories = await db.getDocumentCategories()
                let partnerLocations = await db.getPartnerLocationDatas()
                fs.writeFileSync("clientUploadedDocs/partnerLocationIS.txt",JSON.stringify(partnerLocations))
                let documentAttachments = await db.getDocumentAttachments()
                let billNos = await db.getClientDocsBillOrRefNoForInvoiceSummary()
                let clientDocsBillOrRefNo = billNos.map((billno) => billno.billNoOrRefNo)
                clientDocsBillOrRefNo = clientDocsBillOrRefNo?.length > 0 ? clientDocsBillOrRefNo : []
                // console.log(clientDocsBillOrRefNo)
                fs.writeFileSync("clientUploadedDocs/billNo.txt",clientDocsBillOrRefNo.join(","))
                console.log("file Write")
                return resolve(await readPythonScript(document, documentCategories, "clientUploadedDocs/partnerLocationIS.txt", documentAttachments, clientId, clientUuid, fileObject, '', "clientUploadedDocs/billNo.txt", dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath))
            }  
        } 
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", getPath.getName('script/invoice/summary'), 'red')
            console.log(e)

            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice Summary', 'Error', clientUuid, new Date())
            return resolve(false)
        }
    })
}

async function readPythonScript(document, documentCategories, partnerLocations, documentAttachments, clientId, clientUuid, fileObject, res, clientDocsBillOrRefNo, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
{
    // console.log("script Called", clientDocsBillOrRefNo)
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let interuptProcess = await db.getInteruptProcess();
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false);
            }
            let scriptPath = path.join(__dirname,'../../',getPath.getName('script'))
            let options = {
                mode: 'json',
                pythonOptions: ['-u'],
                scriptPath : scriptPath,
                args: [JSON.stringify(document), JSON.stringify(documentCategories), partnerLocations, JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadISFile.filepath,documentNewFolderPath,documentFailedFolderPath, clientDocsBillOrRefNo,api.baseUrl]
            };
        
            let pyshell = new PythonShell('InvoiceSummary.py',options);
        
            pyshell.on('message', async function (message) {
                // console.log("message:   =========", message);
                await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'blue')
                if(message.hasOwnProperty('code'))
                {
                    if(message?.data?.length > 0  && message?.code == 'ERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Invoice Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        console.log("message:   =========", message)
                        let sql = `UPDATE upload_doc_log_master SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadISFile.originalFilename?.toUpperCase()}'`
                        db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
                            return resolve(false);
                        })
                    }
                    else if(message?.code == 'CMPLT')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Invoice Summary', 'File Processing completed', clientUuid, new Date(), dailyActivityLogId)
                        console.log("removed file called*********1 : ", inputFolderPath, encriptionKey, encriptionIV)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        uniqueFunction.encryptFileBuffer(fileObject.uploadISFile.filepath, fileObject.uploadISFile.originalFilename,encriptionKey, encriptionIV, 'file').then(async(encryptedData) => 
                        {
                            if(encryptedData?.result)
                            {
                                uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadISFile.originalFilename, clientUuid, documentNewFolderPath).then(async(uploadFileToS3Bucket) => 
                                {
    
                                
                                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadISFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadISFile.originalFilename)
                                    let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Completed" : 'Failed')
                                    let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                                    // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                                    let sql = `UPDATE upload_doc_log_master SET status = '${status}', processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', ${dates} = ?, completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadISFile.originalFilename?.toUpperCase()}'`
                                    await uniqueFunction.writeLogIntoFile("Completed File Uploaded", logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'green')
                                    await uniqueFunction.writeLogIntoFile(JSON.stringify(encryptedData), logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'green')
                                    uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
                                    db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then((updateLog) => 
                                    {
                                        return resolve(true);
                                    })
                                })
                            }
                            else
                            {
                                await uniqueFunction.writeLogIntoFile("Completed File Not Uploaded (Encryption error)", logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')
                                console.log("file not uploaded")
                                uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
                                return resolve(true);
                            }
                        }) 
                    }
                    else if(message?.code == 'FILEERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Invoice Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadISFile.filepath, fileObject.uploadISFile.originalFilename,encriptionKey, encriptionIV, 'file')
    
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadISFile.originalFilename, clientUuid, documentFailedFolderPath)
    
                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadISFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadISFile.originalFilename)
    
                            //log
                            let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadISFile.originalFilename?.toUpperCase()}'`
                            
                            await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')
                            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
    
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
                            return resolve(true);
                        }
                        else
                        {
                            console.log("File Not Uploaded")
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
                            return resolve(true);
                        }  
                    }
                }
            });
        
            pyshell.on('close', async function (close) {
                console.log("close:   =========", close);
                await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')
            });
              
            pyshell.on('stderr',async function (stderr) {
                console.log("stderr:   =========", stderr);
                await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')
            });
              
            pyshell.on('pythonError',async function (pythonError) {
                console.log("pythonError:   =========", pythonError);
                await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')
            });
        
            pyshell.on('error',async function (error) {
                console.log("error:   =========", error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')
            });
              
            pyshell.end(async function (err,code,signal) 
            {
                if (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'red')
                }
                await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadISFile.originalFilename, getPath.getName('script/invoice/summary'), 'black')
                // uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
                console.log('The exit code was: ' + code);
                console.log('The exit signal was: ' + signal);
                console.log('finished');
            });
        }
        catch (e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), getPath.getName('script/invoice/summary'), 'red')
            console.log(e) 
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Invoice Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadISFile.filepath)
            return resolve(false);
        }
    })
}

module.exports = processInvoiceSummary