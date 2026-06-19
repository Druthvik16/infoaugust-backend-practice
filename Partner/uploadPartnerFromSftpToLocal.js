let formidable = require('formidable');
let db = require('./dbQueryPartner')
let path = require('path')
let fs = require('fs')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let axios = require('axios')
const { PythonShell } = require('python-shell');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let documentNewFolderPath = "Uploaded_Partner_Master_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Partner_Master_Raw_Sap_dump";
let logFileNamePrefix = "partnerLogFile-"
let apiName = ''
let accessToken = ''

module.exports = require('express').Router().post('/',async(req,res) =>
{
    let fileObject = {};
    let clientUuid;
    let logFileName = logFileNamePrefix
    logFileName = logFileName + new Date().toISOString().slice(0, 10)
    let logFilePath = getPath.getName('script/partner');
    console.log(new Date())
    apiName = req.baseUrl
    try
    {
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part?.originalFilename
                        }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) 
        {
            try
            {
                let getDailyActivityLog = await db.getDailyActivityLog(new Date())
                let dailyActivityLogId = getDailyActivityLog?.[0]?.id;
                if (!dailyActivityLogId) 
                {
                    const { insertId } = await db.saveDailyActivityLog(new Date());
                    dailyActivityLogId = insertId;
                }            
                if(error) 
                {
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', JSON.parse(fields?.client)?.uuid, new Date())
                    console.log("Error : ",error);
                    await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, JSON.stringify(file), logFilePath, 'red')
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
                    if(Array.isArray(file['partnerFile']) == true)
                    {
                        fileObject['partnerFile'] = file['partnerFile'][0]
                    }
                    else
                    {
                        fileObject = file
                    }
                    fs.copyFileSync(fileObject.partnerFile.filepath, 'tempFiles/'+fileObject.partnerFile.originalFilename)
                    uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                    fileObject.partnerFile.filepath = 'tempFiles/'+fileObject.partnerFile.originalFilename
                    await uniqueFunction.writeLogIntoFile(fileObject, logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'green')
                    let sql = `UPDATE partner_onboarding_log SET started_on = ? WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                }
                else
                {
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', JSON.parse(fields?.client)?.uuid, new Date())
                    await uniqueFunction.writeLogIntoFile('File Not Found', logFileName, JSON.stringify(file), logFilePath, 'red')
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "File Not Found",
                        "status_name" : getCode.getStatus(400)
                    }) 
                }
                req.body = fields
                let inputFolderPath = req.body.inputFolderPath[0]
                if(path.extname(fileObject.partnerFile.originalFilename)?.toLowerCase() != '.xlsx'  && path.extname(fileObject.partnerFile.originalFilename)?.toLowerCase() != '.csv')
                {
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', JSON.parse(fields?.client)?.uuid, new Date())
                    uniqueFunction.removeFileFromDirectory(inputFolderPath)
                    let mailFile = await mailFiles(fileObject.partnerFile, fs.readFileSync(fileObject.partnerFile.filepath), ' <p>File type not matched</p>', false)
                    let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.partnerFile.filepath, fileObject.partnerFile.originalFilename,req.body.encriptionKey[0], req.body.encriptionIV[0], 'file')
                    if(encryptedData?.result)
                    {
                        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.partnerFile.originalFilename,  JSON.parse(fields?.client)?.uuid, documentFailedFolderPath)
                
                        let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), JSON.parse(fields?.client)?.uuid, fileObject.partnerFile.originalFilename)      
                        if(uploadFileToS3Bucket && uploadFileToS3Bucket.result == true)
                        {                        
                            let sql = `UPDATE partner_onboarding_log SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', encryption_key = '${encryptedData?.encriptionKey}',encryption_iv = '${encryptedData?.encriptionIV}' 
                            WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                            let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                            uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                            await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'red')
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
                            let sql = `UPDATE partner_onboarding_log SET status = 'Failed',  
                            failed_on = ?, remark = 'File Not Uploaded' 
                            WHERE UPPER(file_name) = UPPER('${fileObject.partnerFile.originalFilename}')`
                            let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                            await uniqueFunction.writeLogIntoFile("Failed File not uploaded", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
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
                        await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, getPath.getName('script/partner'), 'red')
                        console.log("Failed File Not Uploaded (Encryption error)")
                                
    
                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'File Process completed with error',  JSON.parse(fields.client)?.uuid, new Date())
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
                    let clientUuid = JSON.parse(req.body.client)?.uuid
                    let clientId = JSON.parse(req.body.client)?.id       
                    let encriptionKey = req.body.encriptionKey[0]
                    let encriptionIV = req.body.encriptionIV[0]
                    
                    
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
                    readPythonScript(partners, partnerCategories, partnerLocations, partnerClientMapping, partnerStatewiseGstMaster, state, clientId, clientUuid, accessToken, fileObject, res, encriptionKey, encriptionIV, inputFolderPath, logFilePath, logFileName)
                }
            }                   
            catch(e)
            {
                await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", logFilePath, 'red')
                console.log(e)
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', '', new Date())
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Partner Upload Failed",
                    "status_name" : getCode.getStatus(500),
                    "error"     :      e
                }) 
            }
        })   
    } 
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", logFilePath, 'red')
        console.log(e)
        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', '', new Date())
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Partner Upload Failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

async function readPythonScript(partners, partnerCategories, partnerLocations, partnerClientMapping, partnerStatewiseGstMaster, state, clientId, clientUuid, accessToken, fileObject, res, encriptionKey, encriptionIV, inputFolderPath, logFilePath, logFileName)
{
    try
    {
        let scriptPath = path.join(__dirname,'../',getPath.getName('script'))
        let options = {
            mode: 'json',
            pythonOptions: ['-u'],
            scriptPath : scriptPath,
            args: [JSON.stringify(partners), JSON.stringify(partnerCategories), JSON.stringify(partnerLocations), 
            JSON.stringify(partnerClientMapping), JSON.stringify(partnerStatewiseGstMaster), JSON.stringify(state), 
            clientId, clientUuid, accessToken, fileObject.partnerFile.filepath, api.baseUrl]
        };

        let pyshell = new PythonShell('PartnerScriptSFTP.py',options);

        pyshell.on('message', async function (message) {
            await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'blue')
            if(message.hasOwnProperty('code'))
            {
                if(message?.data?.length > 0  && message?.code == 'ERROR')
                {
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', clientUuid, new Date())
                    let sql = `UPDATE partner_onboarding_log SET  remark = '${message?.data}' 
                    WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                    
                    let mailFile = await mailFiles(fileObject.partnerFile, fs.readFileSync(fileObject.partnerFile.filepath), ` <p>${message?.data}</p>`, false)
                    db.updatePartnerLogMaster(sql, [new Date()]).then(async(updateDetail)=>{
                        uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath) 

                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Partner', 'Error', clientUuid, new Date(), dailyActivityLogId)
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message" : message?.data,
                            "status_name" : getCode.getStatus(500)
                        })
                    })
                }
                else if(message?.data?.length > 0  && message?.code == 'CMPLT')
                {
                    
                    let mailFile = await mailFiles(fileObject.partnerFile, message?.data, ` `, true )	
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'File processing completed', clientUuid, new Date())
                    uniqueFunction.removeFileFromDirectory(inputFolderPath)
                    let encryptedData = await uniqueFunction.encryptFileBuffer(message?.data, 
                    fileObject.partnerFile.originalFilename,encriptionKey, encriptionIV, 'base64')
                    if(encryptedData?.result)
                    {
                        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.partnerFile.originalFilename, clientUuid, documentNewFolderPath)
               
                        let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.partnerFile.originalFilename)

                        //log
                        let sql = `UPDATE partner_onboarding_log SET status = 'Processed',  
                        completed_on = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', encryption_key = '${encryptedData?.encriptionKey}',encryption_iv = '${encryptedData?.encriptionIV}' 
                        WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                        let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                        await uniqueFunction.writeLogIntoFile("File Processed With Status Processed", logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'green')

                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'blue')
                        uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                        console.error('File Not Uploaded');
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                }
                else if(message?.data?.length == 0  && message?.code == 'CMPLT')
                {
                    
                    let mailFile = await mailFiles(fileObject.partnerFile, fs.readFileSync(fileObject.partnerFile.filepath), ` `, true)
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'File processing completed', clientUuid, new Date())
                    uniqueFunction.removeFileFromDirectory(inputFolderPath)
                    let status = "Processed"
                    let dates = 'completed_on'
                    // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                    let sql = `UPDATE partner_onboarding_log SET status = '${status}', processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', 
                    ${dates} = ? WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                    db.updatePartnerLogMaster(sql, [new Date()]).then((updateLog) => 
                    {
                        uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }) 
                }
                else if(message?.data?.length > 0  && message?.code == 'FILEFORMATERROR')
                {
                    
                    let mailFile = await mailFiles(fileObject.partnerFile, fs.readFileSync(fileObject.partnerFile.filepath), ` <p>${message?.data}</p>`, false)
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', clientUuid, new Date())
					console.log("message:   =========", message);
                    uniqueFunction.removeFileFromDirectory(inputFolderPath)
                    let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.partnerFile.filepath, fileObject.partnerFile.originalFilename,encriptionKey, encriptionIV, 'file')
                    if(encryptedData?.result)
                    {
                        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, 
                        fileObject.partnerFile.originalFilename, clientUuid, documentFailedFolderPath)
               
                        let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.partnerFile.originalFilename)

                        //log
                        let sql = `UPDATE partner_onboarding_log SET status = 'Failed', remark = '${message?.data}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'  WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                        let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                        await uniqueFunction.writeLogIntoFile("Failed file uploaded", logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'green')

                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        await uniqueFunction.writeLogIntoFile("Failed file not uploaded", logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                        console.error('File Not Uploaded');
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }  
                }
            }
        });

        pyshell.on('close', async function (close) {
            console.log("close:   =========", close);
            await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'red')
        });

        pyshell.on('stderr', async function (stderr) {
            console.log("stderr:   =========", stderr);
            await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'red')
        });

        pyshell.on('pythonError',async function (pythonError) {
            console.log("pythonError:   =========", pythonError);
            await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'red')
        });

        pyshell.on('error',async function (error) {
            console.log("error:   =========", error);
            await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'red')
        });
        
        pyshell.end(async function (err,code,signal) 
        {
            if (err)
            {
                await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'red')
            }
            await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.partnerFile.originalFilename, logFilePath, 'black')  
            console.log('The exit code was: ' + code);
            console.log('The exit signal was: ' + signal);
            console.log('finished');
        });
    }
    catch (e)
    {
        console.log(e) 
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), logFilePath, 'red')
        uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Partner', 'Error', clientUuid, new Date())
		res.status(500)
		return res.json({
			"status_code" : 500,
			"message" : e?.stack,
			"status_name" : getCode.getStatus(500)
		})
    }
}



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