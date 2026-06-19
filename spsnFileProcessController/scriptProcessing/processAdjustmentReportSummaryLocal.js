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
let documentNewFolderPath = "Uploaded_Adjustment_Report_Summary_Sap_Dump";
let documentFailedFolderPath = "Rejected_Adjustment_Report_Summary_Sap_dump";
let logFileName = "adjustmentReportSummaryLogFile-"
let apiName = '/api/spsnFileProcessController/processAdjustmentReportLocal'
const logFilePath = getPath.getName('spsn/script/adjustmentReport/summary')

let processAdjustmentReport = {}

processAdjustmentReport.getFileList = (fileObject, inputFolderPath, encryptionIV, encryptionKey, client) => 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let clientId;
            let clientUuid;
            logFileName = "adjustmentReportSummaryLogFile-"
            logFileName = logFileName + new Date().toISOString().slice(0, 10)
            console.log(new Date())
            fileObject['uploadCAFile'] = fileObject
            clientUuid = client?.uuid
            clientId = client?.id
            let interuptProcess = await db.getInteruptProcess(clientId);
            if(interuptProcess[0].isWorking == 0)
            {
                return resolve(false)
            }
            
            fs.copyFileSync(fileObject.uploadCAFile.filepath, 'tempFiles/'+fileObject.uploadCAFile.originalFilename)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadCAFile.filepath)
            fileObject.uploadCAFile.filepath = 'tempFiles/'+fileObject.uploadCAFile.originalFilename
            let sql = `UPDATE client_spsn_upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileObject.uploadCAFile.originalFilename?.toUpperCase()}'`
            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
            
           
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            let dailyActivityLogId = getDailyActivityLog?.[0]?.id;

            if (!dailyActivityLogId) {
              const { insertId } = await db.saveDailyActivityLog(new Date());
              dailyActivityLogId = insertId;
            }
            
            if(path.extname(fileObject.uploadCAFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadCAFile.originalFilename)?.toLowerCase() != '.csv')
            {
                uniqueFunction.removeFileFromDirectory(inputFolderPath)
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadCAFile.filepath, fileObject.uploadCAFile.originalFilename,encryptionKey, encryptionIV, 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadSpsnFiles(encryptedData?.file, fileObject.uploadCAFile.originalFilename,  clientUuid, documentFailedFolderPath)

                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadCAFile.size, apiName, 'S3', new Date(),  clientUuid, fileObject.uploadCAFile.originalFilename)
                    //log
                    let sql = `UPDATE client_spsn_upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadCAFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadCAFile.filepath)
                    await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Adjustment Report Summary', 'File Process completed',  clientUuid, new Date())
                    return resolve(true)
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, logFilePath, 'red')
                    console.log("Failed File Not Uploaded (Encryption error)")

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Adjustment Report Summary', 'File Process completed with error',  clientUuid, new Date())
                    return resolve(true)
                }
            }
            else
            {
                let document = await db.getDocuments()
                let documentCategories = await db.getDocumentCategories()
                let spsns = await db.getSpsnDatas(clientId);
                let spsnDataFilePath = 'spsnFileProcessController/spsnsDataCA_' + clientUuid +  '.txt'
                fs.writeFileSync(spsnDataFilePath,JSON.stringify(spsns))
                let partnerLocations = await db.getPartnerLocationDatas(clientId);
                let partnerLocationsDataFilePath = 'spsnFileProcessController/partnerLocationsCA_' + clientUuid +  '.txt'
                fs.writeFileSync(partnerLocationsDataFilePath,JSON.stringify(partnerLocations))
                let documentAttachments = await db.getDocumentAttachments()

                // let financialYear = await db.getFinancialYear();
                let fileDateFromName = fileObject.uploadCAFile.originalFilename.split('_')[1].split('-');
                let year = fileDateFromName[2]?.split('.')[0];
                let month = fileDateFromName[1];
                let day = fileDateFromName[0];
                let financialYear = await db.getFinancialYearData(new Date(year + '-' + month + '-' + day));
                console.log(financialYear, new Date(year + '-' + month + '-' + day), year, month, day)
                return resolve(await readPythonScript(document, documentCategories, spsnDataFilePath, documentAttachments, clientId, clientUuid, fileObject, partnerLocationsDataFilePath, dailyActivityLogId, encryptionKey, encryptionIV, inputFolderPath, financialYear))
            }  
        } 
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", logFilePath, 'red')
            console.log(e)

            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Adjustment Report Summary', 'Error', client?.uuid, new Date())
            return resolve(false)
        }
    })
}

async function readPythonScript(document, documentCategories, spsns, documentAttachments, clientId, clientUuid, fileObject, partnerLocations, dailyActivityLogId, encryptionKey, encryptionIV, inputFolderPath, financialYear)
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
                args: [JSON.stringify(document), JSON.stringify(documentCategories), spsns, JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadCAFile.filepath,documentNewFolderPath,documentFailedFolderPath, partnerLocations,api.baseUrl, financialYear[0]?.id, financialYear[0]?.name]
            };
        
            let pyshell = new PythonShell('AdjustmentReport.py',options);
        
            pyshell.on('message', async function (message) {
                await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'blue')
                if(message.hasOwnProperty('code'))
                {
                    if(message?.data?.length > 0  && message?.code == 'ERROR')
                    {
                        console.log("message:   =========", message)
                        let sql = `UPDATE client_spsn_upload_doc_log_master SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadCAFile.originalFilename?.toUpperCase()}'`
                        db.updateUploadDocLogMaster(sql, [new Date()]).then(async(updateDetail)=>{
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadCAFile.filepath)

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Adjustment Report Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
                            return resolve(false);
                        })
                    }
                    else if(message?.code == 'CMPLT')
                    {
                        console.log("message:   =========", message)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        uniqueFunction.encryptFileBuffer(fileObject.uploadCAFile.filepath, fileObject.uploadCAFile.originalFilename,encryptionKey, encryptionIV, 'file').then(async(encryptedData) => 
                        {
                            if(encryptedData?.result)
                            {
                                uniqueFunction.uploadSpsnFiles(encryptedData?.file, fileObject.uploadCAFile.originalFilename, clientUuid, documentNewFolderPath).then(async(uploadFileToS3Bucket) => 
                                {

                                
                                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadCAFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadCAFile.originalFilename)
                                    let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Completed" : 'Failed')
                                    let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                                    // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                                    let sql = `UPDATE client_spsn_upload_doc_log_master SET status = '${status}', processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', ${dates} = ?, completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadCAFile.originalFilename?.toUpperCase()}'`
                                    await uniqueFunction.writeLogIntoFile("Completed File Uploaded", logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'green')
                                    db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then(async(updateLog) => 
                                    {
                                        uniqueFunction.removeFileFromDirectory(fileObject.uploadCAFile.filepath)

                                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Adjustment Report Summary', 'File Process completed', clientUuid, new Date(), dailyActivityLogId)
                                        return resolve(true);
                                    })
                                })
                            }
                            else
                            {
                                await uniqueFunction.writeLogIntoFile("Completed File Not Uploaded (Encryption error)", logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')
                                console.log("Completed File Not Uploaded (Encryption error)")
                                uniqueFunction.removeFileFromDirectory(fileObject.uploadCAFile.filepath)

                                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Adjustment Report Summary', 'File Process completed', clientUuid, new Date(), dailyActivityLogId)
                                return resolve(true);
                            }
                        }) 
                    }
                    else if(message?.code == 'FILEERROR')
                    {
                        console.log("message:   =========", message)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadCAFile.filepath, fileObject.uploadCAFile.originalFilename,encryptionKey, encryptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadSpsnFiles(encryptedData?.file, fileObject.uploadCAFile.originalFilename, clientUuid, documentFailedFolderPath)

                                
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadCAFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadCAFile.originalFilename)

                            //log
                            let sql = `UPDATE client_spsn_upload_doc_log_master SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'  WHERE UPPER(file_name) = '${fileObject.uploadCAFile.originalFilename?.toUpperCase()}'`
                            
                            await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')
                            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadCAFile.filepath)

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Adjustment Report Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)

                            return resolve(true);
                        }
                        else
                        {
                            console.log("Failed (complete) File Not Uploaded (Encryption error)")
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadCAFile.filepath)

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Adjustment Report Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
                            return resolve(true);
                        } 
                    }
                }
            });
        
            pyshell.on('close', async function (close) {
                console.log("close:   =========", close);            
                await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')
            });
            
            pyshell.on('stderr', async function (stderr) {
                console.log("stderr:   =========", stderr);
                await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')
            });
            
            pyshell.on('pythonError', async function (pythonError) {
                console.log("pythonError:   =========", pythonError);
                await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')
            });
        
            pyshell.on('error', async function (error) {
                console.log("error:   =========", error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')
            });
            
            pyshell.end(async function (err,code,signal) 
            {
                if (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'red')
                }
                await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadCAFile.originalFilename, logFilePath, 'black')
                console.log('The exit code was: ' + code);
                console.log('The exit signal was: ' + signal);
                console.log('finished');
            });
        }
        catch (e)
        {
            
            console.log(e)   
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), logFilePath, 'red')      
            uniqueFunction.removeFileFromDirectory(fileObject.uploadCAFile.filepath)

            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Adjustment Report Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
            return resolve(false)
        }
    })
}

module.exports = processAdjustmentReport