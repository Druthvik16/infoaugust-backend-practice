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
let axios = require('axios')
const { PythonShell } = require('python-shell');
const uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction');
let fileObject = {};
let documentNewFolderPath = "Uploaded_Partner_Master_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Partner_Master_Raw_Sap_dump";
let logFileName = "partnerLogFile-"
let apiName = '/api/fileProcessController/processPartnerListLocal'
let accessToken  = ''

let processPartnerList = {}

processPartnerList.getFileList = (fileObject, inputFolderPath, encriptionIV, encriptionKey, client) => 
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
            logFileName = "partnerLogFile-"
            logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
            console.log(new Date())
            fileObject['uploadPartnerFile'] = fileObject
            clientUuid = client?.uuid
            clientId = client?.id
            
            fs.copyFileSync(fileObject.uploadPartnerFile.filepath, 'tempFiles/'+fileObject.uploadPartnerFile.originalFilename)
            uniqueFunction.removeFileFromDirectory(fileObject.uploadPartnerFile.filepath)
            fileObject.uploadPartnerFile.filepath = 'tempFiles/'+fileObject.uploadPartnerFile.originalFilename
            let sql = `UPDATE partner_onboarding_log SET started_on = ? WHERE UPPER(file_name) = '${fileObject.uploadPartnerFile.originalFilename?.toUpperCase()}'`
            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
            
           
            let getDailyActivityLog = await db.getDailyActivityLog(new Date())
            let dailyActivityLogId = getDailyActivityLog?.[0]?.id;

            if (!dailyActivityLogId) {
              const { insertId } = await db.saveDailyActivityLog(new Date());
              dailyActivityLogId = insertId;
            }
            
            if(path.extname(fileObject.uploadPartnerFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadPartnerFile.originalFilename)?.toLowerCase() != '.csv')
            {
                let mailFile = await mailFiles(fileObject.partnerFile, fs.readFileSync(fileObject.partnerFile.filepath), ' <p>File type not matched</p>', false)
                uniqueFunction.removeFileFromDirectory(inputFolderPath)
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadPartnerFile.filepath, fileObject.uploadPartnerFile.originalFilename,encriptionKey, encriptionIV, 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadPartnerFile.originalFilename,  clientUuid, documentFailedFolderPath)

                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadPartnerFile.size, apiName, 'S3', new Date(),  clientUuid, fileObject.uploadPartnerFile.originalFilename)
                    //log
                    let sql = `UPDATE partner_onboarding_log SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadPartnerFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadPartnerFile.filepath)
                    await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'File Process completed',  clientUuid, new Date())
                    return resolve(true)
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, getPath.getName('script/partner'), 'red')
                    console.log("Failed File Not Uploaded (Encryption error)")

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'File Process completed with error',  clientUuid, new Date())
                    return resolve(true)
                }
            }
            else
            {
               // let partners = await db.getPartnersData()
               let partners = ''
               let partnerCategories = await db.getPartnerCategories()
               // let partnerLocations = await db.getPartnerLocationDatas()
               let partnerLocations = ''
               // let partnerClientMapping = await db.getPartnerClientMappings()
               let partnerClientMapping = ''
               // let partnerStatewiseGstMaster = await db.getPartnerStatewiseMaster()
               let partnerStatewiseGstMaster = ''
               let state = await db.getState()

                return resolve(await readPythonScript(partners, partnerCategories, partnerLocations, partnerClientMapping, partnerStatewiseGstMaster, state, clientId, clientUuid, accessToken, fileObject, '', encriptionKey, encriptionIV, inputFolderPath, '', logFileName, dailyActivityLogId))
            }  
        } 
        catch(e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", getPath.getName('script/partner'), 'red')
            console.log(e)

            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', '', new Date())
            return resolve(false)
        }
    })
}

async function readPythonScript(partners, partnerCategories, partnerLocations, partnerClientMapping, partnerStatewiseGstMaster, state, clientId, clientUuid, accessToken, fileObject, res, encriptionKey, encriptionIV, inputFolderPath, logFilePath, logFileName, dailyActivityLogId)
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
                args: [JSON.stringify(partners), JSON.stringify(partnerCategories), JSON.stringify(partnerLocations), 
                JSON.stringify(partnerClientMapping), JSON.stringify(partnerStatewiseGstMaster), JSON.stringify(state), 
                clientId, clientUuid, accessToken, fileObject.uploadPartnerFile.filepath, api.baseUrl]
            };
        
            let pyshell = new PythonShell('PartnerScriptSFTP.py',options);
        
            pyshell.on('message', async function (message) {
                await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'blue')
                if(message.hasOwnProperty('code'))
                {
                    if(message?.data?.length > 0  && message?.code == 'ERROR')
                    {
                        console.log("message:   =========", message)                    
                        let mailFile = await mailFiles(fileObject.uploadPartnerFile, fs.readFileSync(fileObject.uploadPartnerFile.filepath), ` <p>${message?.data}</p>`, false)
                        let sql = `UPDATE partner_onboarding_log SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadPartnerFile.originalFilename?.toUpperCase()}'`
                        db.updateUploadDocLogMaster(sql, [new Date()]).then(async(updateDetail)=>{
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadPartnerFile.filepath)

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Partner', 'Error', clientUuid, new Date(), dailyActivityLogId)
                            return resolve(false);
                        })
                    }
                    else if(message?.code == 'CMPLT')
                    {
                        let mailFile = await mailFiles(fileObject.uploadPartnerFile, message?.data, ` `, true)
                        console.log("message:   =========", message)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        uniqueFunction.encryptFileBuffer(fileObject.uploadPartnerFile.filepath, fileObject.uploadPartnerFile.originalFilename,encriptionKey, encriptionIV, 'file').then(async(encryptedData) => 
                        {
                            if(encryptedData?.result)
                            {
                                uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadPartnerFile.originalFilename, clientUuid, documentNewFolderPath).then(async(uploadFileToS3Bucket) => 
                                {

                                
                                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadPartnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadPartnerFile.originalFilename)
                                    let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Processed" : 'Failed')
                                    let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                                    // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                                    let sql = `UPDATE partner_onboarding_log SET status = '${status}', processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', ${dates} = ?, completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadPartnerFile.originalFilename?.toUpperCase()}'`
                                    await uniqueFunction.writeLogIntoFile("Completed File Uploaded", logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'green')
                                    db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then(async(updateLog) => 
                                    {
                                        uniqueFunction.removeFileFromDirectory(fileObject.uploadPartnerFile.filepath)

                                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Partner', 'File Process completed', clientUuid, new Date(), dailyActivityLogId)
                                        return resolve(true);
                                    })
                                })
                            }
                            else
                            {
                                await uniqueFunction.writeLogIntoFile("Completed File Not Uploaded (Encryption error)", logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                                console.log("Completed File Not Uploaded (Encryption error)")
                                uniqueFunction.removeFileFromDirectory(fileObject.uploadPartnerFile.filepath)

                                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Partner', 'File Process completed', clientUuid, new Date(), dailyActivityLogId)
                                return resolve(true);
                            }
                        }) 
                    }
                    else if(message?.code == 'FILEFORMATERROR')
                    {
                        let mailFile = await mailFiles(fileObject.uploadPartnerFile, fs.readFileSync(fileObject.uploadPartnerFile.filepath), ` <p>${message?.data}</p>`, false)
                        console.log("message:   =========", message)
                        uniqueFunction.removeFileFromDirectory(inputFolderPath)
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadPartnerFile.filepath, fileObject.uploadPartnerFile.originalFilename,encriptionKey, encriptionIV, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadPartnerFile.originalFilename, clientUuid, documentFailedFolderPath)

                                
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadPartnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadPartnerFile.originalFilename)

                            //log
                            let sql = `UPDATE partner_onboarding_log SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'  WHERE UPPER(file_name) = '${fileObject.uploadPartnerFile.originalFilename?.toUpperCase()}'`
                            
                            await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                            let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadPartnerFile.filepath)

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Partner', 'Error', clientUuid, new Date(), dailyActivityLogId)

                            return resolve(true);
                        }
                        else
                        {
                            console.log("Failed (complete) File Not Uploaded (Encryption error)")
                            await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadPartnerFile.filepath)

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Partner', 'Error', clientUuid, new Date(), dailyActivityLogId)
                            return resolve(true);
                        } 
                    }
                }
            });
        
            pyshell.on('close', async function (close) {
                console.log("close:   =========", close);            
                await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')
            });
            
            pyshell.on('stderr', async function (stderr) {
                console.log("stderr:   =========", stderr);
                await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')
            });
            
            pyshell.on('pythonError', async function (pythonError) {
                console.log("pythonError:   =========", pythonError);
                await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')
            });
        
            pyshell.on('error', async function (error) {
                console.log("error:   =========", error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')
            });
            
            pyshell.end(async function (err,code,signal) 
            {
                if (err)
                {
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                }
                await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadPartnerFile.originalFilename, getPath.getName('script/partner'), 'black')
                console.log('The exit code was: ' + code);
                console.log('The exit signal was: ' + signal);
                console.log('finished');
            });
        }
        catch (e)
        {
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), getPath.getName('script/partner'), 'red')
            console.log(e)         
            uniqueFunction.removeFileFromDirectory(fileObject.uploadPartnerFile.filepath)

            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Partner', 'Error', clientUuid, new Date(), dailyActivityLogId)
            return resolve(false)
        }
    })
}

module.exports = processPartnerList

async function mailFiles(file, fileData, extraText, flag)
{
    return  new Promise(async(resolve, reject) => 
    {
        let fileExtension = file.originalFilename.split('.')[1]
        let mimeType = await db.getMimeType(fileExtension)
        let attachment = [{
            content : fileData.toString('base64'),
            type : mimeType[0].mime,
            name : file.originalFilename
        }]

        let textToSend = ''
        if(flag)
        {
            textToSend = "<div>Hello,</div><br/><br/><div>Please find status of partner onboarding in attachment.</div>"
        }
        else
        {
            textToSend = "<div>Hello,</div><br/><br/><div>Please find attachment of Partner Onboarding File.</div>" + extraText            
        }

        let dataToSend = {
            "to":[{"email" : process.env.rawFileMailId, "name": "Infoaugust", "type" : "to"}],
            "subject": "Partner Onboarding File",
            "text": textToSend,
            "rawFiles" : attachment
        }
        axios.post( api.serviceApi + api.common + api.sendMail, dataToSend).then((sendMail) =>
        {
            if(sendMail?.data) 
            {               
                console.log("mail sent")     
                return resolve(true)
            }
            else
            {
                console.log("mail sent failed")  
                return resolve(false)
            }
        })
        .catch(err => {
            console.log("mail sent failed")
            console.log(err.data)
            return resolve(false)
        })
    })
}