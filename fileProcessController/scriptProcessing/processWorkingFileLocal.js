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
let documentNewFolderPath = "Uploaded_Working_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Working_Raw_Sap_dump";
let logFileName = "creditNoteWorkingLogFile-"
let apiName = '/api/fileProcessController/processWorkingFileLocal'

let processWorkingFileLocal = {}

processWorkingFileLocal.getFileList = (fileObject, inputFolderPath, encriptionIV, encriptionKey, client) => 
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
            let clientId;
            let clientUuid;
            logFileName = "creditNoteWorkingLogFile-"
            logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
            console.log(new Date())
            fileObject['uploadWorkingFile'] = fileObject
            clientUuid = client?.uuid
            clientId = client?.id
            
            
            fs.copyFileSync(fileObject.uploadWorkingFile.filepath, 'tempFiles/'+fileObject.uploadWorkingFile.originalFilename)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
            fileObject.uploadWorkingFile.filepath = 'tempFiles/'+fileObject.uploadWorkingFile.originalFilename
            let sql = `UPDATE upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
            
            
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            let dailyActivityLogId = getDailyActivityLog?.[0]?.id;

            if (!dailyActivityLogId) {
              const { insertId } = await db.saveDailyActivityLog(new Date());
              dailyActivityLogId = insertId;
            }

            if(path.extname(fileObject.uploadWorkingFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadWorkingFile.originalFilename)?.toLowerCase() != '.csv')
            {
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date())
                uniqueFunction.removeFileFromDirectory(inputFolderPath)
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, clientUuid, documentFailedFolderPath)

                            
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadWorkingFile.originalFilename)

                    //log
                    let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                    await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                    
                    return resolve(true) 
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, getPath.getName('script/creditNote/working'), 'red')
                    console.error('File Not Uploaded');
                    return resolve(true) 
                }
            }
            else
            {
                let documentAttachments = await db.getDocumentAttachments()
                let docAttachment = documentAttachments.find(attachs => attachs.name == 'Working File')
                let creditNoteNumber = await db.getCreditNoteNumberForWorkingFile(docAttachment?.id)
                creditNoteNumber?.forEach(num => {
                    delete num?.document_attachment_ids
                    delete num?.attach
                    delete num?.docId
                })
                creditNoteNumber = creditNoteNumber?.length > 0 ? creditNoteNumber : []
                fs.writeFileSync("clientUploadedDocs/billNoCNW.txt",creditNoteNumber.join(","))
                // console.log(creditNoteNumber)
                let fileNamePrefix = fileObject.uploadWorkingFile.originalFilename?.split('_')[0]
                console.log(fileNamePrefix)
                if(fileNamePrefix == 'PCNW')
                {
                    return resolve(await readPythonScriptPromo(documentAttachments, clientId, clientUuid, fileObject, '', "clientUploadedDocs/billNoCNW.txt", dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath))
                }
                else if(fileNamePrefix == 'GVCNW')
                {
                    return resolve(await readPythonScriptGV(documentAttachments, clientId, clientUuid, fileObject, '', "clientUploadedDocs/billNoCNW.txt", dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath))
                }
                else if(fileNamePrefix == 'ICNW')
                {
                    return resolve(await readPythonScriptIncentive(documentAttachments, clientId, clientUuid, fileObject, '', "clientUploadedDocs/billNoCNW.txt", dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath))
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile('File name ${fileNamePrefix} prefix not allowed.(allowed prefix - PCNW, GVCNW, ICNW)', logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                    let sql = `UPDATE upload_doc_log_master SET remark = 'File name ${fileNamePrefix} prefix not allowed.(allowed prefix - PCNW, GVCNW, ICNW)' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                    db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                        return resolve(false) 
                    })
                }
            }
        } 
        catch(e)
        {
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date())
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "***************", getPath.getName('script/creditNote/working'), 'red')
            console.log(e)
            return resolve(false) 
        }
    })
}

async function readPythonScriptGV(documentAttachments, clientId, clientUuid, fileObject, res, creditNoteNumber, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
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
            let scriptPath = path.join(__dirname,'../../',getPath.getName('script'))
            let options = {
                mode: 'json',
                pythonOptions: ['-u'],
                scriptPath : scriptPath,
                args: [JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadWorkingFile.filepath,documentNewFolderPath,documentFailedFolderPath, creditNoteNumber, api.baseUrl]
            };
        
            let pyshellGV = new PythonShell('CreditNoteWorkingFile.py',options);
        
            pyshellGV.on('message', async function (message) {
                // console.log("message:   =========", message);
                await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'blue')
                if(message.hasOwnProperty('code'))
                {
                    if(message?.data?.length > 0  && message?.code == 'ERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        console.log("message:   =========", message);
                        let sql = `UPDATE upload_doc_log_master SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                        db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(false);
                        })
                    }
                    else if(message?.code == 'CMPLT')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'File Process Completed', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, clientUuid, documentNewFolderPath)

                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadWorkingFile.originalFilename)

                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Completed" : 'Failed')
                            let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                            // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                            let sql = `UPDATE upload_doc_log_master SET status = '${status}', ${dates} = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                            db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then((updateLog) => 
                            {
                                return resolve(true);
                            }) 
                        }
                        else
                        {
                            console.error('File Not Uploaded');
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(true);
                        }  
                    }
                    else if(message?.code == 'FILEERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, clientUuid, documentFailedFolderPath)

                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadWorkingFile.originalFilename)
                            //log
                            let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                            await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(true);
                        }
                        else
                        {
                            console.error('File Not Uploaded');
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(true);
                        } 
                    }
                }
            });
        
            pyshellGV.on('close', async function (close) {
                console.log("close:   =========", close);
                await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellGV.on('stderr',async function (stderr) {
                console.log("stderr:   =========", stderr);
                await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellGV.on('pythonError', async function (pythonError) {
                console.log("pythonError:   =========", pythonError);
                await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
        
            pyshellGV.on('error', async function (error) {
                console.log("error:   =========", error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellGV.end(async function (err,code,signal) 
            {
                if (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                }
                await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'black')  
                console.log('The exit code was: ' + code);
                console.log('The exit signal was: ' + signal);
                console.log('finished');
            });
        }
        catch (e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), getPath.getName('script/creditNote/working'), 'red')
            console.log(e) 
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
            return resolve(false);
        }
    })
}

async function readPythonScriptPromo(documentAttachments, clientId, clientUuid, fileObject, res, creditNoteNumber, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
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
            let scriptPath = path.join(__dirname,'../../',getPath.getName('script'))
            let options = {
                mode: 'json',
                pythonOptions: ['-u'],
                scriptPath : scriptPath,
                args: [JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadWorkingFile.filepath,documentNewFolderPath,documentFailedFolderPath, creditNoteNumber, api.baseUrl]
            };
        
            let pyshellPromo = new PythonShell('CreditNoteWorkingFilePromo.py',options);
        
        
            pyshellPromo.on('message', async function (message) {
                // console.log("message:   =========", message);
                await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'blue')
                if(message.hasOwnProperty('code'))
                {
                    if(message?.data?.length > 0  && message?.code == 'ERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        console.log("message:   =========", message)
                        let sql = `UPDATE upload_doc_log_master SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                        db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(false);
                        })
                    }
                    else if(message?.code == 'CMPLT')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'File Process Completed', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, clientUuid, documentNewFolderPath)

                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadWorkingFile.originalFilename)

                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Completed" : 'Failed')
                            let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                            // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                            let sql = `UPDATE upload_doc_log_master SET status = '${status}', ${dates} = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                            db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then((updateLog) => 
                            {
                                return resolve(true);
                            }) 
                        }
                        else
                        {
                            console.error('File Not Uploaded');
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(true);
                        }  
                    }
                    else if(message?.code == 'FILEERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, clientUuid, documentFailedFolderPath)

                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadWorkingFile.originalFilename)
                            //log
                            let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                            await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(true);
                        }
                        else
                        {
                            console.error('File Not Uploaded');
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(true);
                        }
                    }
                }
            });
        
            pyshellPromo.on('close', async function (close) {
                console.log("close:   =========", close);
                await uniqueFunction.writeLogIntoFile(close, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellPromo.on('stderr',async function (stderr) {
                console.log("stderr:   =========", stderr);
                await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellPromo.on('pythonError', async function (pythonError) {
                console.log("pythonError:   =========", pythonError);
                await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
        
            pyshellPromo.on('error', async function (error) {
                console.log("error:   =========", error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellPromo.end(async function (err,code,signal) 
            {
                if (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                }
                await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'black') 
                console.log('The exit code was: ' + code);
                console.log('The exit signal was: ' + signal);
                console.log('finished');
            });
        }
        catch (e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), getPath.getName('script/creditNote/working'), 'red')
            console.log(e) 
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
            return resolve(false);
        }
    })
}

async function readPythonScriptIncentive(documentAttachments, clientId, clientUuid, fileObject, res, creditNoteNumber, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
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
            let scriptPath = path.join(__dirname,'../../',getPath.getName('script'))
            let options = {
                mode: 'json',
                pythonOptions: ['-u'],
                scriptPath : scriptPath,
                args: [JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadWorkingFile.filepath,documentNewFolderPath,documentFailedFolderPath, creditNoteNumber,api.baseUrl]
            };
        
            let pyshellIncentive = new PythonShell('CreditNoteWorkingFileIncentive.py',options);
        
            pyshellIncentive.on('message', async function (message) {
                // console.log("message:   =========", message);
                await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'blue')
                if(message.hasOwnProperty('code'))
                {
                    if(message?.data?.length > 0  && message?.code == 'ERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        console.log("message:   =========", message)
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath) 
                        let sql = `UPDATE upload_doc_log_master SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                        db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(false);
                        })
                    }
                    else if(message?.code == 'CMPLT')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'File Process Completed', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, clientUuid, documentNewFolderPath)

                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadWorkingFile.originalFilename)

                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Completed" : 'Failed')
                            let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                            // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                            let sql = `UPDATE upload_doc_log_master SET status = '${status}', ${dates} = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                            db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then((updateLog) => 
                            {
                                return resolve(true);
                            }) 
                        }
                        else
                        {
                            console.error('File Not Uploaded');
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(true);
                        }  
                    }
                    else if(message?.code == 'FILEERROR')
                    {
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, clientUuid, documentFailedFolderPath)

                                
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadWorkingFile.originalFilename)
                            //log
                            let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                            await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')

                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath) 
                            return resolve(true);
                        }
                        else
                        {
                            console.error('File Not Uploaded');
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath) 
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                            return resolve(true);
                        }
                    }
                }
            });
        
            pyshellIncentive.on('close', async function (close) {
                console.log("close:   =========", close);
                await uniqueFunction.writeLogIntoFile(close, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellIncentive.on('stderr',async function (stderr) {
                console.log("stderr:   =========", stderr);
                await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellIncentive.on('pythonError', async function (pythonError) {
                console.log("pythonError:   =========", pythonError);
                await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
        
            pyshellIncentive.on('error', async function (error) {
                console.log("error:   =========", error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            });
            
            pyshellIncentive.end(async function (err,code,signal) 
            {
                if (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                }
                await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'black')
                // uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)   
                console.log('The exit code was: ' + code);
                console.log('The exit signal was: ' + signal);
                console.log('finished');
            });
        }
        catch (e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), getPath.getName('script/creditNote/working'), 'red')
            console.log(e)
            
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
            return resolve(false);
        }
    })
}

module.exports = processWorkingFileLocal