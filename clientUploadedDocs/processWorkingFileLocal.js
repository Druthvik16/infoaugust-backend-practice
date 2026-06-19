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
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
let documentNewFolderPath = "Uploaded_Working_Raw_Sap_dump";
let documentFailedFolderPath = "Rejected_Working_Raw_Sap_dump";
let logFileName = "creditNoteWorkingLogFile-"
let apiName = ''

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
        logFileName = "creditNoteWorkingLogFile-"
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
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Working', 'Error', JSON.parse(fields.client)?.uuid, new Date())
                console.log(error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, JSON.stringify(file), getPath.getName('script/creditNote/working'), 'red')
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
                if(Array.isArray(file['uploadWorkingFile']) == true)
                {
                    fileObject['uploadWorkingFile'] = file['uploadWorkingFile'][0]
                }
                else
                {
                    fileObject = file
                }
                fs.copyFileSync(fileObject.uploadWorkingFile.filepath, 'tempFiles/'+fileObject.uploadWorkingFile.originalFilename)
                uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                fileObject.uploadWorkingFile.filepath = 'tempFiles/'+fileObject.uploadWorkingFile.originalFilename
                let sql = `UPDATE upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
            }
            else
            {
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Working', 'Error', JSON.parse(fields.client)?.uuid, new Date())
                await uniqueFunction.writeLogIntoFile('File Not Found', logFileName, JSON.stringify(file), getPath.getName('script/creditNote/working'), 'red')
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            req.body = fields
            inputFolderPath = req.body.inputFolderPath[0]        
            encriptionKey = req.body.encriptionKey[0]
            encriptionIV = req.body.encriptionIV[0]
            clientUuid = JSON.parse(req.body.client)?.uuid
            clientId = JSON.parse(req.body.client)?.id
            if(path.extname(fileObject.uploadWorkingFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadWorkingFile.originalFilename)?.toLowerCase() != '.csv')
            {
                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Working', 'Error', JSON.parse(fields.client)?.uuid, new Date())
                uniqueFunction.removeFileFromDirectory(inputFolderPath)
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, JSON.parse(fields.client)?.uuid, documentFailedFolderPath)

                            
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), JSON.parse(fields.client)?.uuid, fileObject.uploadWorkingFile.originalFilename)

                    //log
                    let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                    await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "status_name" : getCode.getStatus(200)
                    })
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, getPath.getName('script/creditNote/working'), 'red')
                    console.error('File Not Uploaded');
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
                let fileNamePrefix = fileObject.uploadWorkingFile.originalFilename?.split('_')[0]
                console.log(fileNamePrefix);
                
                // const documentCode = fileNamePrefix == 'PCNW' ? 'PE' : fileNamePrefix == 'GVCNW' ? 'GV' : fileNamePrefix == 'ICNW' ? 'INC' : null;
                // if(!documentCode)
                // {
                //     await uniqueFunction.writeLogIntoFile(`File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                //     let sql = `UPDATE upload_doc_log_master SET remark = 'File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                //     db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                //         res.status(500)
                //         return res.json({
                //             "status_code" : 500,
                //             "message" : message?.data,
                //             "status_name" : getCode.getStatus(500)
                //         })
                //     })
                // }

                if(fileNamePrefix != 'MBO' && fileNamePrefix != 'FOFO')
                {
                    await uniqueFunction.writeLogIntoFile(`File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')

                    const fileUploadToS3 = await saveFailedFile(inputFolderPath, fileObject, clientUuid, dailyActivityLogId, encriptionKey, encriptionIV, documentFailedFolderPath, apiName, `File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`)
                    // let sql = `UPDATE upload_doc_log_master SET remark = 'File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                    // db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                    //     res.status(500)
                    //     return res.json({
                    //         "status_code" : 500,
                    //         "message" : `File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`,
                    //         "status_name" : getCode.getStatus(500)
                    //     })
                    // })
                    
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : `File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`,
                        "status_name" : getCode.getStatus(500)
                    })
                }
                
                const documentCode = fileNamePrefix == 'MBO' ? 'PE' : null;
                console.log(inputFolderPath,clientUuid)
                let documentAttachments = await db.getDocumentAttachments()
                let docAttachment = documentAttachments.find(attachs => attachs.name == 'Working File')
                let creditNoteNumber = await db.getCreditNoteNumberForWorkingFile(docAttachment?.id, documentCode)
                // console.log(creditNoteNumber)
                creditNoteNumber?.forEach(num => {
                    delete num?.document_attachment_ids
                    delete num?.attach
                    delete num?.docId
                    num.postingDate = new Date(num.postingDate)?.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
                })
                creditNoteNumber = creditNoteNumber?.length > 0 ? creditNoteNumber : [];
                let filePath = "clientUploadedDocs/billNoCNW_"+fileNamePrefix+".txt"
                fs.writeFileSync(filePath,JSON.stringify(creditNoteNumber))
                // console.log(creditNoteNumber)
                let filePathPartnerLocation = "clientUploadedDocs/partnerLocationCNW_"+fileNamePrefix+".txt"
                let partnerLocations = await db.getPartnerLocationDatas()
                fs.writeFileSync(filePathPartnerLocation,JSON.stringify(partnerLocations))
                // PCNW, GVCNW
                if(fileNamePrefix == 'MBO')
                {
                    readPythonScriptMBO(documentAttachments, clientId, clientUuid, fileObject, res, filePath, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath, filePathPartnerLocation)
                }
                else if(fileNamePrefix == 'FOFO')
                {
                    readPythonScriptFOFO(documentAttachments, clientId, clientUuid, fileObject, res, filePath, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath, filePathPartnerLocation)
                }
                // else if(fileNamePrefix == 'ICNW')
                // {
                //     readPythonScriptIncentive(documentAttachments, clientId, clientUuid, fileObject, res, filePath, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath, filePathPartnerLocation)
                // }
                else
                {
                    await uniqueFunction.writeLogIntoFile(`File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                    
                    const fileUploadToS3 = await saveFailedFile(inputFolderPath, fileObject, clientUuid, dailyActivityLogId, encriptionKey, encriptionIV, documentFailedFolderPath, apiName, `File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`)

                    // let sql = `UPDATE upload_doc_log_master SET remark = 'File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                    // db.updateUploadDocLogMaster(sql, [new Date()]).then((updateDetail)=>{
                    //     res.status(500)
                    //     return res.json({
                    //         "status_code" : 500,
                    //         "message" : `File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`,
                    //         "status_name" : getCode.getStatus(500)
                    //     })
                    // }) 
                    // 
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : `File name ${fileNamePrefix} prefix not allowed.(allowed prefix - MBO or FOFO)`,
                        "status_name" : getCode.getStatus(500)
                    })
                }
            }
        })    
    } 
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "***************", getPath.getName('script/creditNote/working'), 'red')
        console.log(e)
        
        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice PT', 'Error', clientUuid, new Date())
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Partner Upload Failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

async function readPythonScriptFOFO(documentAttachments, clientId, clientUuid, fileObject, res, creditNoteNumber, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath, filePathPartnerLocation)
{
    try
    {
        let scriptPath = path.join(__dirname,'../',getPath.getName('script'))
        let options = {
            mode: 'json',
            pythonOptions: ['-u'],
            scriptPath : scriptPath,
            args: [JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadWorkingFile.filepath,documentNewFolderPath,documentFailedFolderPath, creditNoteNumber, api.baseUrl, filePathPartnerLocation]
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
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        }) 
                    }
                    else
                    {
                        console.error('File Not Uploaded');
                        await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
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

                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        console.error('File Not Uploaded');
                        await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
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
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack,
            "status_name" : getCode.getStatus(500)
        })
    }
}
async function readPythonScriptMBO(documentAttachments, clientId, clientUuid, fileObject, res, creditNoteNumber, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath, filePathPartnerLocation)
{
    try
    {
        let scriptPath = path.join(__dirname,'../',getPath.getName('script'))
        let options = {
            mode: 'json',
            pythonOptions: ['-u'],
            scriptPath : scriptPath,
            args: [JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadWorkingFile.filepath,documentNewFolderPath,documentFailedFolderPath, creditNoteNumber, api.baseUrl, filePathPartnerLocation]
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
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        }) 
                    }
                    else
                    {
                        console.error('File Not Uploaded');
                        await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
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

                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        console.error('File Not Uploaded');
                        await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
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
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack,
            "status_name" : getCode.getStatus(500)
        })
    }
}

async function readPythonScriptIncentive(documentAttachments, clientId, clientUuid, fileObject, res, creditNoteNumber, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath, filePathPartnerLocation)
{
    try
    {
        let scriptPath = path.join(__dirname,'../',getPath.getName('script'))
        let options = {
            mode: 'json',
            pythonOptions: ['-u'],
            scriptPath : scriptPath,
            args: [JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadWorkingFile.filepath,documentNewFolderPath,documentFailedFolderPath, creditNoteNumber,api.baseUrl, filePathPartnerLocation]
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
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message" : "success",
                                "status_name" : getCode.getStatus(200)
                            })
                        }) 
                    }
                    else
                    {
                        console.error('File Not Uploaded');
                        await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
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
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        console.error('File Not Uploaded');
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath) 
                        await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
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
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack,
            "status_name" : getCode.getStatus(500)
        })
    }
}

async function saveFailedFile(inputFolderPath, fileObject, clientUuid, dailyActivityLogId, encriptionKey, encriptionIV, documentFailedFolderPath, apiName, remark)
{
    return new Promise(async(resolve, reject) => {
        try
        {
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Working', 'Error', clientUuid, new Date(), dailyActivityLogId)
            uniqueFunction.removeFileFromDirectory(inputFolderPath)
            let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadWorkingFile.filepath, fileObject.uploadWorkingFile.originalFilename,encriptionKey, encriptionIV, 'file')
            if(encryptedData?.result)
            {
                let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadWorkingFile.originalFilename, clientUuid, documentFailedFolderPath)
        
                    
                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadWorkingFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadWorkingFile.originalFilename)
                //log
                let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(remark)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadWorkingFile.originalFilename?.toUpperCase()}'`
                let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
        
                uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath) 
               
                return resolve({result: true})
            }
            else
            {
                console.error('File Not Uploaded');
                uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath) 
                await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
                uniqueFunction.removeFileFromDirectory(fileObject.uploadWorkingFile.filepath)
               
                return resolve({result: true})
            }
        }
        catch (e)
        {
            console.log(e)
            await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, fileObject.uploadWorkingFile.originalFilename, getPath.getName('script/creditNote/working'), 'red')
            return resolve({result: false, message: e?.stack})
        }
    })
}