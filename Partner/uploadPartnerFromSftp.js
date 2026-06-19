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
const { PythonShell } = require('python-shell');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
let fileObject = {};
let clientId;
let clientUuid;
let accessToken = ''
let documentNewFolderPath = "Uploaded_Partner_Master_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Partner_Master_Raw_Sap_dump";
let inputFolderPath;
let encriptionIV;
let encriptionKey;
let logFileName = "partnerLogFile-"
let apiName = ''

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        logFileName = "partnerLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        console.log(new Date())
        apiName = req.baseUrl
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part?.originalFilename
                        }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) 
        {
            if(error) 
            {

                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'Error', JSON.parse(fields?.client)?.uuid, new Date())
                console.log("Error : ",error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, JSON.stringify(file), getPath.getName('script/partner'), 'red')
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
                await uniqueFunction.writeLogIntoFile(fileObject, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'green')
                let sql = `UPDATE partner_onboarding_log SET started_on = ? WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
            }
            else
            {

                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'Error', JSON.parse(fields?.client)?.uuid, new Date())
                await uniqueFunction.writeLogIntoFile('File Not Found', logFileName, JSON.stringify(file), getPath.getName('script/partner'), 'red')
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            req.body = fields
            inputFolderPath = req.body.inputFolderPath[0]
            if(path.extname(fileObject.partnerFile.originalFilename).toLowerCase() != '.xlsx'  && path.extname(fileObject.partnerFile.originalFilename)?.toLowerCase() != '.csv')
            {

                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'Error', JSON.parse(fields?.client)?.uuid, new Date())
                const params = {
                    Bucket: bucketName,
                    Key : inputFolderPath
                };
                s3.deleteObject(params,async(err, data) =>
                {
                    if (err) 
                    {
                        await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, inputFolderPath, getPath.getName('script/partner'), 'red')
                        console.error('Error list:', err);
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    } 
                    else 
                    {
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.partnerFile.filepath, fileObject.partnerFile.originalFilename,req.body.encriptionKey[0], req.body.encriptionIV[0], 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.partnerFile.originalFilename, JSON.parse(fields?.client)?.uuid, documentFailedFolderPath)
               
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), JSON.parse(fields?.client)?.uuid, fileObject.partnerFile.originalFilename)   
                            //log
                            let sql = `UPDATE partner_onboarding_log SET status = 'Failed', remark = 'File type not matched.', 
							failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' 
							WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                            let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                            uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                            await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        }
                        else
                        {
                            await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, getPath.getName('script/partner'), 'red')
                            console.log('File Not Uploaded');
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        }
                    }   
                }) 
            }
            else
            {
                clientUuid = JSON.parse(req.body.client)?.uuid
                clientId = JSON.parse(req.body.client)?.id       
                encriptionKey = req.body.encriptionKey[0]
                encriptionIV = req.body.encriptionIV[0]
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
                readPythonScript(partners, partnerCategories, partnerLocations, partnerClientMapping, 
                partnerStatewiseGstMaster, state, clientId, clientUuid, accessToken, fileObject, res)
            }
        })    
    } 
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", getPath.getName('script/partner'), 'red')
        console.log(e)
        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'Error', '', new Date())
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Partner Upload Failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

// args: [JSON.stringify(partners), JSON.stringify(partnerCategories), JSON.stringify(partnerLocations), 
//     JSON.stringify(partnerClientMapping), JSON.stringify(partnerStatewiseGstMaster), JSON.stringify(state), 
//     clientId, clientUuid, accessToken, fileObject.partnerFile.filepath, api.baseUrl]

async function readPythonScript(partners, partnerCategories, partnerLocations, partnerClientMapping, partnerStatewiseGstMaster, state, clientId, clientUuid, accessToken, fileObject, res)
{
    try
    {
        let scriptPath = path.join(__dirname,'../',getPath.getName('script'))
        let options = {
            mode: 'json',
            pythonOptions: ['-u'],
            scriptPath : scriptPath,
            args: [JSON.stringify(partnerCategories), JSON.stringify(state), clientUuid, fileObject.partnerFile.filepath, api.baseUrl]
        };

        let pyshell = new PythonShell('PartnerScriptSFTP.py',options);

        pyshell.on('message',async function (message) {
            await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'blue')
            if(message.hasOwnProperty('code'))
            {
                if(message?.data?.length > 0  && message?.code == 'FILEFORMATERROR')
                {
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'Error', clientUuid, new Date())
					console.log("message:   =========", message);
                    const params = {
                        Bucket: bucketName,
                        Key : inputFolderPath
                    };
                    s3.deleteObject(params,async (err, data1) =>
                    {
                        if (err) 
                        {
                            await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                            console.error('Error list:', err);
                            uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        } 
                        else 
                        {
                            let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.partnerFile.filepath, fileObject.partnerFile.originalFilename,encriptionKey, encriptionIV, 'file')
                            if(encryptedData?.result)
                            {
                                let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, 
                                fileObject.partnerFile.originalFilename, clientUuid, documentFailedFolderPath)
               
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.partnerFile.originalFilename)  
        
                                //log
                                let sql = `UPDATE partner_onboarding_log SET status = 'Failed', remark = '${message?.data}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'  WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                                let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                                await uniqueFunction.writeLogIntoFile("Failed file uploaded", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'green')
        
                                res.status(200)
                                return res.json({
                                    "status_code" : 200,
                                    "message" : "success",
                                    "status_name" : getCode.getStatus(200)
                                })
                            }
                            else
                            {
                                await uniqueFunction.writeLogIntoFile("Failed file not uploaded", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
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
                    })  
                }
                else if(message?.data?.length > 0  && message?.code == 'CMPLT')
                {	
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'File processing completed', clientUuid, new Date())
                    const params = {
                        Bucket: bucketName,
                        Key : inputFolderPath
                    };
                    console.log(params);
                    s3.deleteObject(params,async(err, data1) =>
                    {
                        if (err) 
                        {
                            await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'blue')
                            console.error('Error list:', err);
                            uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        } 
                        else 
                        {
                            let encryptedData = await uniqueFunction.encryptFileBuffer(message?.data, 
                            fileObject.partnerFile.originalFilename,encriptionKey, encriptionIV, 'base64')
                            if(encryptedData?.result)
                            {
                                let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.partnerFile.originalFilename, clientUuid, documentNewFolderPath)
               
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.partnerFile.originalFilename)  
        
                                //log
                                let sql = `UPDATE partner_onboarding_log SET status = 'Processed',  
                                completed_on = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' 
                                WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                                let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
        
                                res.status(200)
                                return res.json({
                                    "status_code" : 200,
                                    "message" : "success",
                                    "status_name" : getCode.getStatus(200)
                                })
                            }
                            else
                            {
                                await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'blue')
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
                    }) 
                }
                else if(message?.data?.length == 0  && message?.code == 'CMPLT')
                {
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'File processing completed', clientUuid, new Date())
                    const params = {
                        Bucket: bucketName,
                        Key : inputFolderPath
                    };
                    console.log(params);
                    s3.deleteObject(params,async (err, data) =>
                    {
                        if (err) 
                        {
                            await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'blue')
                            console.error('Error list:', err);
                            uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath)
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        } 
                        else 
                        {
                            let status = "Processed"
                            let dates = 'completed_on'
                            // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                            let sql = `UPDATE partner_onboarding_log SET status = '${status}', 
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
                    }) 
                }
                else if(message?.data?.length > 0  && message?.code == 'ERROR')
                {
                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'Error', clientUuid, new Date())
                    let sql = `UPDATE partner_onboarding_log SET  remark = '${message?.data}' 
                    WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                    db.updatePartnerLogMaster(sql, [new Date()]).then((updateDetail)=>{
                        uniqueFunction.removeFileFromDirectory(fileObject.partnerFile.filepath) 
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message" : message?.data,
                            "status_name" : getCode.getStatus(500)
                        })
                    })
                }
            }
        });

        pyshell.on('close', async function (close) {
            console.log("close:   =========", close);
            await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
        });
        
        pyshell.on('stderr',async function (stderr) {
            console.log("stderr:   =========", stderr);
            await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
        });
        
        pyshell.on('pythonError',async function (pythonError) {
            console.log("pythonError:   =========", pythonError);
            await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
        });

        pyshell.on('error',async function (error) {
            console.log("error:   =========", error);
            await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
        });
        
        pyshell.end(async function (err,code,signal) 
        {
            if (err)
            {
                await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
            }
            await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'black')  
            console.log('The exit code was: ' + code);
            console.log('The exit signal was: ' + signal);
            console.log('finished');
        });
    }
    catch (e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), getPath.getName('script/partner'), 'red')
        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process S3 File', 'Partner', 'Error', clientUuid, new Date())
        console.log(e) 
        res.end()
    }
}