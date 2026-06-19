let formidable = require('formidable');
let db = require('./dbQueryPartner')
let path = require('path')
let fs = require('fs');
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let apiUrl = require('../apiUrl')
let api = new apiUrl()
const { PythonShell } = require('python-shell');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let documentNewFolderPath = "Uploaded_Partner_Master_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Partner_Master_Raw_Sap_dump";
let logFileName = "partnerLogFile-"
let apiName = ''

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        let loggedUserUuid;
        let loggedUserId;
        let fileObject = {};
        let accessToken;
        let clientId;
        let clientUuid;
        logFileName = "partnerLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10)
        console.log(new Date())
        accessToken = req.body.accessToken;
        loggedUserId = req.body.userId;
        loggedUserUuid = req.body.loggedUserUuid;
        apiName = req.baseUrl
        // clientUuid = await db.getLoggedUserClientUuid(loggedUserId)
        // clientId = clientUuid[0].id;
        // clientUuid = clientUuid[0].uuid
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part.originalFilename
                        }
        }
        console.log(options)
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, file) 
        {
            try
            {
                if(error) 
                {
                    await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, "***********", getPath.getName('script/partner'), 'red')
                    console.log(error);
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "Error",
                        "status_name" : getCode.getStatus(400)
                    }) 
                }                
                req.body = fields
                if(!req.body.client || !JSON.parse(req.body.client)?.uuid)
                {
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "Provide all values",
                        "status_name" : getCode.getStatus(400)
                    })
                }
                clientUuid = JSON.parse(req.body.client)?.uuid;
                let getLoggedUserClientUuid = await db.getClient(clientUuid)
                clientId = getLoggedUserClientUuid[0].id;
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
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("File Not Found", logFileName, "***********", getPath.getName('script/partner'), 'red')
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "File Not Found",
                        "status_name" : getCode.getStatus(400)
                    }) 
                }
                let identifierName = 'partner_onboarding_log'            
                let id = 0
                let uniqueCheckName = await uniqueFunction.unquieName(identifierName, ['file_name'],{  "file_name" : fileObject.partnerFile.originalFilename }, id, 0)
                if(uniqueCheckName != 0)
                {
                    console.log("File already exists")
                    await uniqueFunction.writeLogIntoFile("File name alrady exist in database", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "File name alrady exist in database",
                        "status_name" : getCode.getStatus(500)
                    })
                }
                else
                {
                    let saveLog = await db.savePartnerOnboardingLogMaster(fileObject.partnerFile.originalFilename, clientId, 'Pending', new Date(), '', null, null) 
                    let sql = `UPDATE partner_onboarding_log SET started_on = ? 
                    WHERE UPPER(file_name) = UPPER('${fileObject.partnerFile.originalFilename}')`
                    let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])

                    if(path.extname(fileObject.partnerFile.originalFilename)?.toLowerCase() != '.xlsx'  && path.extname(fileObject.partnerFile.originalFilename)?.toLowerCase() != '.csv')
                    { 
                        let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.partnerFile.filepath, fileObject.partnerFile.originalFilename, null,null, 'file')
                        if(encryptedData?.result)
                        {
                            let uploadFiles = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.partnerFile.originalFilename, clientUuid, documentFailedFolderPath)
                            console.log("File uploaded :", uploadFiles)                           
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.partnerFile.originalFilename)      
                            if(uploadFiles && uploadFiles.result == true)
                            {
                                let sql = `UPDATE partner_onboarding_log SET status = 'Failed',  
                                failed_on = ?, failed_file_path = '${uploadFiles?.s3FilePath}', remark = 'File Type Not Matched', encryption_key = '${encryptedData?.encriptionKey}',encryption_iv = '${encryptedData?.encriptionIV}'
                                WHERE UPPER(file_name) = UPPER('${fileObject.partnerFile.originalFilename}')`
                                let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                                await uniqueFunction.writeLogIntoFile("File Type Not Matched", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red') 
                                res.status(400)
                                return res.json({
                                    "status_code" : 400,
                                    "message" : "File Type Not Matched",
                                    "status_name" : getCode.getStatus(400)
                                }) 
                            }
                            else
                            {
                                console.log("File Not Uploaded") 
                                let sql = `UPDATE partner_onboarding_log SET status = 'Failed',  
                                failed_on = ?, remark = 'File Not Uploaded' 
                                WHERE UPPER(file_name) = UPPER('${fileObject.partnerFile.originalFilename}')`
                                let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                                await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                                res.status(400)
                                return res.json({
                                    "status_code" : 400,
                                    "message" : "File not uploaded",
                                    "status_name" : getCode.getStatus(400)
                                }) 
                            }
                        }
                        else
                        {
                            console.log("file encryption error")
                            let sql = `UPDATE partner_onboarding_log SET status = 'Failed',  
                            failed_on = ?, remark = 'File encryption error' 
                            WHERE UPPER(file_name) = UPPER('${fileObject.partnerFile.originalFilename}')`
                            let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                            await uniqueFunction.writeLogIntoFile("File not encrypted error : " + JSON.stringify(encryptedData?.error), logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                            res.status(400)
                            return res.json({
                                "status_code" : 400,
                                "message" : "File encryption error",
                                "status_name" : getCode.getStatus(400)
                            }) 
                        } 
                    }
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
                    readPythonScript(partners, partnerCategories, partnerLocations, partnerClientMapping, partnerStatewiseGstMaster, state, clientId, clientUuid, accessToken, fileObject, res)
                }
            }
            catch (e)
            {
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
    } 
    catch(e)
    {
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

async function readPythonScript(partners, partnerCategories, partnerLocations, partnerClientMapping, partnerStatewiseGstMaster, state, clientId, clientUuid, accessToken, fileObject, res)
{
	try
	{
		let scriptPath = path.join(__dirname,'../',getPath.getName('script'))
		let options = {
			mode: 'json',
			pythonOptions: ['-u'],
			scriptPath : scriptPath,
			args: [JSON.stringify(partnerCategories), JSON.stringify(state), clientUuid, accessToken, fileObject.partnerFile.filepath, api.baseUrl]
		};

		let pyshell = new PythonShell('PartnerScript.py',options);

		pyshell.on('message', async function (message) {
            
					console.log("All message:   =========", message);
            await uniqueFunction.writeLogIntoFile(message, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'blue')
			if(message.hasOwnProperty('code'))
			{
				if(message?.data?.length > 0  && message?.code == 'FILEFORMATERROR')
				{
					console.log("message:   =========", message);
					let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.partnerFile.filepath, fileObject.partnerFile.originalFilename,null, null, 'file')
                    if(encryptedData?.result)
                    {
                        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, 
                        fileObject.partnerFile.originalFilename, clientUuid, documentNewFolderPath)
               
                        let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.partnerFile.originalFilename)     
                        //log
                        let sql = `UPDATE partner_onboarding_log SET status = 'Failed',   remark = '${message?.data}',  
                        failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', encryption_key = '${encryptedData?.encriptionKey}',encryption_iv = '${encryptedData?.encriptionIV}' 
                        WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                        let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message" : message?.data,
                            "status_name" : getCode.getStatus(500)
                        })
                    }
                    else
                    {                       
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message" : message?.data,
                            "status_name" : getCode.getStatus(500)
                        })
                    }
				}
				else if(message?.data?.length > 0  && message?.code == 'CMPLT')
				{ 
					console.log("message:   =========", message);
					let encryptedData = await uniqueFunction.encryptFileBuffer(message?.data, fileObject.partnerFile.originalFilename,null, null, 'base64')
                    if(encryptedData?.result)
                    {
                        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, 
                        fileObject.partnerFile.originalFilename, clientUuid, documentNewFolderPath)
               
                        let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', '', '', fileObject.partnerFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.partnerFile.originalFilename)     
                        //log
                        let sql = `UPDATE partner_onboarding_log SET status = 'Processed',  
                        completed_on = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', encryption_key = '${encryptedData?.encriptionKey}',encryption_iv = '${encryptedData?.encriptionIV}' 
                        WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                        let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                        await uniqueFunction.writeLogIntoFile("File Processed With Status Processed", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'green')

                        res.status(200)
                        return res.json(
                        {
                            "status_code" : 200,
                            "message" : "success",
                            "data" : {
                                        "fileWithRemark" : 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,'+ message?.data
                                    },
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        await uniqueFunction.writeLogIntoFile("File Encryption Error"+"<br/>File Processed With Status Processed", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "data" : {
                                        "fileWithRemark" : 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,'+ message?.data
                                    },
                            "status_name" : getCode.getStatus(200)
                        })
                    }
				}
				else if(message?.data?.length == 0  && message?.code == 'CMPLT')
				{
                    
                    let sql = `UPDATE partner_onboarding_log SET status = 'Processed',  
                    completed_on = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', encryption_key = '${encryptedData?.encriptionKey}',encryption_iv = '${encryptedData?.encriptionIV}' 
                    WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
					console.log("message:   =========", message);
					await uniqueFunction.writeLogIntoFile("File Processed With Status Completed", logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'green')
					res.status(200)
					return res.json({
						"status_code" : 200,
						"message" : "success",
						"status_name" : getCode.getStatus(200)
					}) 
				}
                else if(message?.data?.length > 0  && message?.code == 'ERROR')
                {
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
        
    pyshell.on('stderr', async function (stderr) {
        console.log("stderr:   =========", stderr);
        await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
    });
        
    pyshell.on('pythonError', async function (pythonError) {
        console.log("pythonError:   =========", pythonError);
        await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
    });

    pyshell.on('error', async function (error) {
        console.log("error:   =========", error);
        await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.partnerFile.originalFilename,  getPath.getName('script/partner'), 'red')
    });
		  
		pyshell.end(async function (err,code,signal) 
		{
			if (err)
			{
				await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.partnerFile.originalFilename,  getPath.getName('script/partner'), 'red')
			}
			await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'black')
			console.log('The exit code was: ' + code);
			console.log('The exit signal was: ' + signal);
			console.log('finished');
		});
	}
	catch (e)
	{
		console.log(e)
		await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileObject.partnerFile.originalFilename, getPath.getName('script/partner'), 'red')
		res.status(500)
		return res.json({
			"status_code" : 500,
			"message" : "Error",
			"status_name" : getCode.getStatus(500)
		})
	}
}