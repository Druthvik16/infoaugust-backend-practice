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
let fileObject = {};
let documentNewFolderPath = "Uploaded_Ledger_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Ledger_Raw_Sap_dump";
let logFileName = "ledgerSummaryLogFile-"
let apiName = '/api/vendorFileProcessController/processLedgerSummaryLocal'
const logFilePath = getPath.getName('vendor/script/ledger')

let processLedgerSummary = {}

processLedgerSummary.getFileList = (fileObject, inputFolderPath, encriptionIV, encriptionKey, client) => 
{
    let clientId;
    let clientUuid;
    logFileName = "ledgerSummaryLogFile-"
    logFileName = logFileName + new Date().toISOString().slice(0, 10)
    console.log(new Date())
    fileObject['uploadLedgerFile'] = fileObject
    clientUuid = client?.uuid
    clientId = client?.id
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let interuptProcess = await db.getInteruptProcess(clientId);
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false)
            }
            
            fs.copyFileSync(fileObject.uploadLedgerFile.filepath, 'tempFiles/'+fileObject.uploadLedgerFile.originalFilename)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)
            fileObject.uploadLedgerFile.filepath = 'tempFiles/'+fileObject.uploadLedgerFile.originalFilename
            let sql = `UPDATE client_vendor_upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileObject.uploadLedgerFile.originalFilename?.toUpperCase()}'`
            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
            
           
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            let dailyActivityLogId = getDailyActivityLog?.[0]?.id;

            if (!dailyActivityLogId) {
              const { insertId } = await db.saveDailyActivityLog(new Date());
              dailyActivityLogId = insertId;
            }
            
            if(path.extname(fileObject.uploadLedgerFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadLedgerFile.originalFilename)?.toLowerCase() != '.csv')
            {
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Ledger', 'Error', clientUuid, new Date())
                uniqueFunction.removeFileFromDirectory(inputFolderPath)
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadLedgerFile.filepath, fileObject.uploadLedgerFile.originalFilename,encriptionKey, encriptionIV, 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, fileObject.uploadLedgerFile.originalFilename, clientUuid, documentFailedFolderPath)

                            
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadLedgerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadLedgerFile.originalFilename)
                    
                    //log
                    let sql = `UPDATE client_vendor_upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadLedgerFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)
                    await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
                    return resolve(true)
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, logFilePath, 'red')
                    console.log("Failed File Not Uploaded (Encryption error)")

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note', 'File Process completed with error',  clientUuid, new Date())
                    return resolve(true)
                }
            }
            else
            {
                let document = await db.getDocuments()
                let documentCategories = await db.getDocumentCategories()
                let vendors = await db.getPartnerDatas()
                fs.writeFileSync("vendorBotProcessController/vendorsDataLDGR.txt",JSON.stringify(vendors))
                let documentAttachments = await db.getDocumentAttachments()
                let clientUploadedLedgerDocsPostingDate = await db.getClientDocsPostingDates()
                fs.writeFileSync("vendorBotProcessController/clientUploadedLedgerDocsPostingDate.txt",JSON.stringify(clientUploadedLedgerDocsPostingDate))
                return resolve(await readPythonScript(document, documentCategories, "vendorBotProcessController/vendorsDataLDGR.txt", documentAttachments, clientId, clientUuid, fileObject, '', "vendorBotProcessController/clientUploadedLedgerDocsPostingDate.txt", dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath))
            }
        } 
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", logFilePath, 'red')
            console.log(e)

            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Ledger', 'Error', clientUuid, new Date())
            return resolve(false)
        }
    })
}

async function readPythonScript(document, documentCategories, vendors, documentAttachments, clientId, clientUuid, fileObject, res, clientUploadedLedgerDocsPostingDate, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
{
    return new Promise(async(resolve, reject) => 
    {            
        try
        {
            let interuptProcess = await db.getInteruptProcess(clientId);
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false)
            }
            let scriptPath = path.join(__dirname,'../../',getPath.getName('script'))
            let options = {
                mode: 'json',
                pythonOptions: ['-u'],
                scriptPath : scriptPath,
                args: [JSON.stringify(document), JSON.stringify(documentCategories), vendors, JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadLedgerFile.filepath,documentNewFolderPath,documentFailedFolderPath, clientUploadedLedgerDocsPostingDate, api.baseUrl]
            };

            let pyshell = new PythonShell('VendorLedger.py',options);

            pyshell.on('message',async function (message) {
                // console.log("message:   =========", message);
                await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'blue')
                if(message.hasOwnProperty('code'))
                {
                    if(message?.data?.length > 0  && message?.code == 'ERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Ledger', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        console.log("message:   =========", message)
                        let sql = `UPDATE client_vendor_upload_doc_log_master SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadLedgerFile.originalFilename?.toUpperCase()}'`
                        db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)
                            return resolve(false);
                        })
                    }
                    else if(message?.code == 'CMPLT')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Ledger', 'File Process completed', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadLedgerFile.filepath, fileObject.uploadLedgerFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, fileObject.uploadLedgerFile.originalFilename, clientUuid, documentNewFolderPath)

                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadLedgerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadLedgerFile.originalFilename)

                            uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)
                            let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Completed" : 'Failed')
                            let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                            // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                            let sql = `UPDATE client_vendor_upload_doc_log_master SET status = '${status}', ${dates} = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadLedgerFile.originalFilename?.toUpperCase()}'`
                            db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then((updateLog) => 
                            {
                                return resolve(true);
                            }) 
                        }
                        else
                        {
                            console.error('File Not Uploaded');
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)
                            return resolve(true);
                        }
                    }
                    else if(message?.code == 'FILEERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Ledger', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadLedgerFile.filepath, fileObject.uploadLedgerFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadVendorFiles(encryptedData?.file, fileObject.uploadLedgerFile.originalFilename, clientUuid, documentFailedFolderPath)

                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadLedgerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadLedgerFile.originalFilename)

                            //log
                            let sql = `UPDATE client_vendor_upload_doc_log_master SET status = 'Failed', remark = '${message?.data}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadLedgerFile.originalFilename?.toUpperCase()}'` 
                            await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
                            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)

                            return resolve(true);
                        }
                        else
                        {
                            console.error('File Not Uploaded');
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)
                            return resolve(true);
                        }  
                    }
                }
            });

            pyshell.on('close', async function (close) {
                console.log("close:   =========", close);
                await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
            });
            
            pyshell.on('stderr', async function (stderr) {
                console.log("stderr:   =========", stderr);
                await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
            });
            
            pyshell.on('pythonError', async function (pythonError) {
                console.log("pythonError:   =========", pythonError);
                await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
            });

            pyshell.on('error', async function (error) {
                console.log("error:   =========", error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
            });
            
            pyshell.end(async function (err,code,signal) 
            {
                if (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'red')
                }
                await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadLedgerFile.originalFilename, logFilePath, 'black')
                // uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)  
                console.log('The exit code was: ' + code);
                console.log('The exit signal was: ' + signal);
                console.log('finished');
            });
        }
        catch (e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), logFilePath, 'red')
            console.log(e) 
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Ledger', 'Error', clientUuid, new Date(), dailyActivityLogId)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadLedgerFile.filepath)
            return resolve(false)
        }
    })
}

module.exports = processLedgerSummary