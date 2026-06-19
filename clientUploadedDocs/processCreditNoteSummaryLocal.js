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
let documentNewFolderPath = "Uploaded_Summary_Sap_Dump";
let documentFailedFolderPath = "Rejected_Summary_Sap_dump";
let logFileName = "creditNoteSummaryLogFile-"
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
        
        // let partnerLocations = await db.getPartnerLocationDatas()
        // console.log(partnerLocations)
        // return res.json(partnerLocations)
        logFileName = "creditNoteSummaryLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        apiName = req.baseUrl
        console.log(new Date())
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part?.originalFilename
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
                console.log("Error : ",error);
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, JSON.stringify(file), getPath.getName('script/creditNote/summary'), 'red')

                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Summary', 'File Process completed with error',  JSON.parse(fields.client)?.uuid, new Date())
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
                if(Array.isArray(file['uploadCNSFile']) == true)
                {
                    fileObject['uploadCNSFile'] = file['uploadCNSFile'][0]
                }
                else
                {
                    fileObject = file
                }
                fs.copyFileSync(fileObject.uploadCNSFile.filepath, 'tempFiles/'+fileObject.uploadCNSFile.originalFilename)
                uniqueFunction.removeFileFromDirectory(fileObject.uploadCNSFile.filepath)
                fileObject.uploadCNSFile.filepath = 'tempFiles/'+fileObject.uploadCNSFile.originalFilename
                let sql = `UPDATE upload_doc_log_master SET started_on = ? WHERE UPPER(file_name) = '${fileObject.uploadCNSFile.originalFilename?.toUpperCase()}'`
                let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
            }
            else
            {
                await uniqueFunction.writeLogIntoFile('File Not Found', logFileName, JSON.stringify(file), getPath.getName('script/creditNote/summary'), 'red')
                

                let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Summary', 'File Process completed with error',  JSON.parse(fields.client)?.uuid, new Date())
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
            req.body = fields
            inputFolderPath = req.body.inputFolderPath[0]
            if(path.extname(fileObject.uploadCNSFile.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(fileObject.uploadCNSFile.originalFilename)?.toLowerCase() != '.csv')
            {
                uniqueFunction.removeFileFromDirectory(inputFolderPath)
                let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadCNSFile.filepath, fileObject.uploadCNSFile.originalFilename,req.body.encriptionKey[0], req.body.encriptionIV[0], 'file')
                if(encryptedData?.result)
                {
                    let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadCNSFile.originalFilename,  JSON.parse(fields.client)?.uuid, documentFailedFolderPath)

                            
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadCNSFile.size, apiName, 'S3', new Date(),  JSON.parse(fields.client)?.uuid, fileObject.uploadCNSFile.originalFilename)
                    //log
                    let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileObject.uploadCNSFile.originalFilename?.toUpperCase()}'`
                    let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    uniqueFunction.removeFileFromDirectory(fileObject.uploadCNSFile.filepath)
                    await uniqueFunction.writeLogIntoFile("File type not accepted", logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
                            

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Summary', 'File Process completed',  JSON.parse(fields.client)?.uuid, new Date())
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "status_name" : getCode.getStatus(200)
                    })
                }
                else
                {
                    await uniqueFunction.writeLogIntoFile("Failed File Not Uploaded (Encryption error)", logFileName, inputFolderPath, getPath.getName('script/creditNote/summary'), 'red')
                    console.log("Failed File Not Uploaded (Encryption error)")
                            

                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Summary', 'File Process completed with error',  JSON.parse(fields.client)?.uuid, new Date())
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
                fs.writeFileSync("clientUploadedDocs/partnerLocationCNS.txt",JSON.stringify(partnerLocations))
                let documentAttachments = await db.getDocumentAttachments()
                let docNos = await db.getClientDocNo()
                let clientDocNos = docNos.map((docNo) => docNo.documentNumber)
                clientDocNos = clientDocNos?.length > 0 ? clientDocNos : []
                fs.writeFileSync("clientUploadedDocs/billNoCNS.txt",clientDocNos.join(","))
                readPythonScript(document, documentCategories, "clientUploadedDocs/partnerLocationCNS.txt", documentAttachments, clientId, clientUuid, fileObject, res, "clientUploadedDocs/billNoCNS.txt", dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
            }
        })    
    } 
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "**************", getPath.getName('script/creditNote/summary'), 'red')
        console.log(e)

        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Credit Note Summary', 'Error', clientUuid, new Date())
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Credit Note Summary Upload Failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

async function readPythonScript(document, documentCategories, partnerLocations, documentAttachments, clientId, clientUuid, fileObject, res, clientDocNos, dailyActivityLogId, encriptionKey, encriptionIV, inputFolderPath)
{
    try
    {
        let scriptPath = path.join(__dirname,'../',getPath.getName('script'))
        let options = {
            mode: 'json',
            pythonOptions: ['-u'],
            scriptPath : scriptPath,
            args: [JSON.stringify(document), JSON.stringify(documentCategories), partnerLocations, JSON.stringify(documentAttachments), clientId, clientUuid, fileObject.uploadCNSFile.filepath,documentNewFolderPath,documentFailedFolderPath, clientDocNos,api.baseUrl]
        };
    
        let pyshell = new PythonShell('CreditNoteSummary.py',options);
    
        pyshell.on('message', async function (message) {
            await uniqueFunction.writeLogIntoFile(JSON.stringify(message), logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'blue')
            if(message.hasOwnProperty('code'))
            {
                if(message?.data?.length > 0  && message?.code == 'ERROR')
                {
                    console.log("message:   =========", message)
                    let sql = `UPDATE upload_doc_log_master SET  remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}' WHERE UPPER(file_name) = '${fileObject.uploadCNSFile.originalFilename?.toUpperCase()}'`
                    db.updateUploadDocLogMaster(sql, [new Date()]).then(async(updateDetail)=>{
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadCNSFile.filepath)

                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
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
                    uniqueFunction.removeFileFromDirectory(inputFolderPath)
                    uniqueFunction.encryptFileBuffer(fileObject.uploadCNSFile.filepath, fileObject.uploadCNSFile.originalFilename,encriptionKey, encriptionIV, 'file').then(async(encryptedData) => 
                    {
                        if(encryptedData?.result)
                        {
                            uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadCNSFile.originalFilename, clientUuid, documentNewFolderPath).then(async(uploadFileToS3Bucket) => 
                            {

                            
                                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadCNSFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadCNSFile.originalFilename)
                                let status = message?.isFailed &&  message?.isSuccess ? "Partially-Completed" : ((!message?.isFailed &&  message?.isSuccess) ? "Completed" : 'Failed')
                                let dates = status == 'Failed' ? 'failed_on' : 'completed_on'
                                // failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'
                                let sql = `UPDATE upload_doc_log_master SET status = '${status}', processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}', ${dates} = ?, completed_on = ? WHERE UPPER(file_name) = '${fileObject.uploadCNSFile.originalFilename?.toUpperCase()}'`
                                await uniqueFunction.writeLogIntoFile("Completed File Uploaded", logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'green')
                                db.updateUploadDocLogMaster(sql, [new Date(), new Date()]).then(async(updateLog) => 
                                {
                                    uniqueFunction.removeFileFromDirectory(fileObject.uploadCNSFile.filepath)

                                    let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Summary', 'File Process completed', clientUuid, new Date(), dailyActivityLogId)
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
                            await uniqueFunction.writeLogIntoFile("Completed File Not Uploaded (Encryption error)", logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
                            console.log("Completed File Not Uploaded (Encryption error)")
                            uniqueFunction.removeFileFromDirectory(fileObject.uploadCNSFile.filepath)

                            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Summary', 'File Process completed', clientUuid, new Date(), dailyActivityLogId)
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
                    uniqueFunction.removeFileFromDirectory(inputFolderPath)
                    let encryptedData = await uniqueFunction.encryptFileBuffer(fileObject.uploadCNSFile.filepath, fileObject.uploadCNSFile.originalFilename,encriptionKey, encriptionIV, 'file')
                    if(encryptedData?.result)
                    {
                        let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(encryptedData?.file, fileObject.uploadCNSFile.originalFilename, clientUuid, documentFailedFolderPath)

                            
                            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '',fileObject.uploadCNSFile.size, apiName, 'S3', new Date(), clientUuid, fileObject.uploadCNSFile.originalFilename)

                        //log
                        let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = '${uniqueFunction.manageSpecialCharacter(message?.data)}', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}'  WHERE UPPER(file_name) = '${fileObject.uploadCNSFile.originalFilename?.toUpperCase()}'`
                        
                        await uniqueFunction.writeLogIntoFile("Failed File Uploaded", logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
                        let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadCNSFile.filepath)

                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)

                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message" : "success",
                            "status_name" : getCode.getStatus(200)
                        })
                    }
                    else
                    {
                        console.log("Failed (complete) File Not Uploaded (Encryption error)")
                        await uniqueFunction.writeLogIntoFile("File Not Uploaded (Encryption error)", logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
                        uniqueFunction.removeFileFromDirectory(fileObject.uploadCNSFile.filepath)

                        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
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
            await uniqueFunction.writeLogIntoFile("Close"+ JSON.stringify(close), logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
        });
          
        pyshell.on('stderr', async function (stderr) {
            console.log("stderr:   =========", stderr);
            await uniqueFunction.writeLogIntoFile(stderr?.stack, logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
        });
          
        pyshell.on('pythonError', async function (pythonError) {
            console.log("pythonError:   =========", pythonError);
            await uniqueFunction.writeLogIntoFile(pythonError?.stack, logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
        });
    
        pyshell.on('error', async function (error) {
            console.log("error:   =========", error);
            await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
        });
          
        pyshell.end(async function (err,code,signal) 
        {
            if (err)
            {
                await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'red')
            }
            await uniqueFunction.writeLogIntoFile('The exit code was: ' + code + '<br> The exit signal was: ' + signal + '<br> finished', logFileName, fileObject.uploadCNSFile.originalFilename, getPath.getName('script/creditNote/summary'), 'black')
            console.log('The exit code was: ' + code);
            console.log('The exit signal was: ' + signal);
            console.log('finished');
        });
    }
    catch (e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, JSON.stringify(fileObject), getPath.getName('script/creditNote/summary'), 'red')
        console.log(e)         
        uniqueFunction.removeFileFromDirectory(fileObject.uploadCNSFile.filepath)

        let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetailByMasterId('Process Local File', 'Credit Note Summary', 'Error', clientUuid, new Date(), dailyActivityLogId)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack,
            "status_name" : getCode.getStatus(500)
        })
    }
}