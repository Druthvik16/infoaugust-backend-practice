let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let db = require('./dbQueryClientUploadedDocs')
let path = require('path')
let fs = require('fs')
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let inputFolderPath = 'Input_Invoice_Pdfs_Raw_Sap_dump';
let documentFailedFolderPath = 'Rejected_Invoice_Pdfs_Raw_Sap_dump'
const bucketName = process.env.Bucket_Name;
let folderName = ''
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "invoicePdfLogFile-"
let fileStoreTo = process.env.fileStoreTo


module.exports = require('express').Router().get('/',async(req,res) => 
{
    try 
    { 
        logFileName = "invoicePdfLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
        folderName = getPath.getName('documentFolders')

        let getDailyActivityLog = await db.getDailyActivityLog(new Date())
        if(getDailyActivityLog?.length == 0)
        {
            let saveDailyActivityLog = await db.saveDailyActivityLog(new Date())
        }
        let clients = await db.getClientsUuid()
        clients = clients.map(client => client.uuid)
        if(clients.length > 0)
        {
            if(fileStoreTo == 'S3BUCKET')
            {
                getListObjectFromS3Bucket(clients, 0, clients?.length, res, [])
            }
            else
            {
                getListObjectFromLocal(clients, 0, clients?.length, res, [])
            }
        }
        else
        {
            await uniqueFunction.writeLogIntoFile({"invoicePdfFilePaths" : []}, logFileName, "Get Invoice Pdf List", getPath.getName('s3/invoice/pdf'), 'green')
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"invoicePdfFilePaths" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Invoice Pdf List", getPath.getName('s3/invoice/pdf'), 'red')
        console.log("e************", e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Error",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    } 
})


async function getListObjectFromS3Bucket(clients, start, end, res, fileList)
{
    try
    {
        if(start < end)
        {
            let clientUuid = clients[start]
            let s3FilePathListObject = folderName + clientUuid + "/" + inputFolderPath + "/"
            const params = {
                Bucket: bucketName,
                Prefix : s3FilePathListObject
            };
            s3.listObjectsV2(params,async(err, data) =>
            {
                if (err) 
                {
                    console.error('Error list:', err);
                    await uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "Get Invoice Pdf List: "+ s3FilePathListObject, getPath.getName('s3/invoice/pdf'), 'red')
                    start++;
                    getListObjectFromS3Bucket(clients, start, end, res,fileList)
                } 
                else 
                {
                    let content = data.Contents
                    content.forEach(file => {
                        if(file?.Key?.length > s3FilePathListObject?.length)
                        {
                            const fileName = file.Key.split('/').pop();
                            if(path.extname(fileName)?.toLowerCase() != '.pdf')
                            {
                                const params = {
                                    Bucket: bucketName,
                                    Key : file?.Key
                                };
                                uniqueFunction.writeLogIntoFile("File type not accepted : " + path.extname(fileName), logFileName, "Get Invoice Pdf List: "+ file?.Key, getPath.getName('s3/invoice/pdf'), 'red')
                                console.log(params);
                                s3.getObject(params,(err, fileObj) =>
                                {
                                    if (err) 
                                    {
                                        console.error('Error list:', err);
                                        uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "Get Invoice Pdf List: "+ file?.Key, getPath.getName('s3/invoice/pdf'), 'red')
                                    } 
                                    else 
                                    {
                                        s3.deleteObject(params,async(err, data) =>
                                        {
                                            if (err) 
                                            {
                                                uniqueFunction.writeLogIntoFile(err?.stack, logFileName, "Get Invoice Pdf List: "+ file?.Key, getPath.getName('s3/invoice/pdf'), 'red')
                                                console.error('Error list:', err);
                                            } 
                                            else 
                                            {
                                                let uploadFileToS3Bucket = await uniqueFunction.uploadFiles(fileObj.Body, fileName, clientUuid, documentFailedFolderPath)
                        
                                                //log
                                                let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = '${fileName?.toUpperCase()}'`
                                                let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                                            }   
                                        })
                                    }   
                                })
                            }
                            else
                            {
                                fileList.push({"clientUuid" : clientUuid, "filePath" : file.Key, "fileName" : file.Key.split('/').pop()})
                            }
                        }
                    })
                    start++;
                    getListObjectFromS3Bucket(clients, start, end, res,fileList)
                }   
            })  
        }
        else
        {
            await uniqueFunction.writeLogIntoFile({"invoicePdfFilePaths" : fileList}, logFileName, "Get Invoice Pdf List", getPath.getName('s3/invoice/pdf'), 'green')
            let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Invoice PDF', 'Bot File processing started, No. of files available :' + fileList.length, '', new Date())
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"invoicePdfFilePaths" : fileList},
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Invoice Pdf List => getListObjectFromS3Bucket", getPath.getName('s3/invoice/pdf'), 'red')
        console.log(e)
        start++;
        getListObjectFromS3Bucket(clients, start, end, res,fileList)
    }
}


async function getListObjectFromLocal(clients, start, end, res, fileList)
{
    try
    {
        if(start < end)
        {
            let clientUuid = clients[start]
            let localFilePathListObject = folderName + "/" + clientUuid + "/" + inputFolderPath + "/"
            let dirents = fs.readdirSync(localFilePathListObject, {withFileTypes : true});
            // console.log("++++++ ",dirents)
            let fileLists = dirents
            .filter(dirent => dirent.isFile())
            .map(dirent => {
                dirent["clientUuid"] = clientUuid;
                dirent["filePath"]= localFilePathListObject + dirent.name;
                dirent["fileName"] = dirent.name;
                delete dirent?.parentPath;
                delete dirent.name;
                delete dirent.path;
                return dirent;
            });
            console.log("++++++ ",fileLists)
            fileLists.forEach(file => {               
                const fileName = file.fileName;
                if(path.extname(fileName)?.toLowerCase() != '.pdf')
                {
                    let fileObj = fs.readFileSync(file.filePath)
                    uniqueFunction.removeFileFromDirectory(file.filePath)
                    uniqueFunction.writeLogIntoFile("File type not accepted : " + path.extname(fileName), logFileName, "Get Invoice Pdf List: "+ file?.Key, getPath.getName('s3/invoice/pdf'), 'red')
                    uniqueFunction.uploadFiles(fileObj, fileName, clientUuid, documentFailedFolderPath).then(async(uploadFileToS3Bucket) => {
                        //log
                        let sql = `UPDATE upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = UPPER('${fileName}')`
                        let updateLog = await db.updateUploadDocLogMaster(sql, [new Date()])
                    })
                }
                else
                {
                    fileList.push(file)
                }
            })
            start++;
            getListObjectFromLocal(clients, start, end, res,fileList)
        }
        else
        {
            let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Invoice PDF', 'Bot File processing started, No. of files available :' + fileList.length, '', new Date())
            await uniqueFunction.writeLogIntoFile({"invoicePdfFilePaths" : fileList}, logFileName, "Get Invoice Pdf List", getPath.getName('s3/invoice/pdf'), 'green')
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"invoicePdfFilePaths" : fileList},
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Invoice Pdf List => getListObjectFromLocal", getPath.getName('s3/invoice/pdf'), 'red')
        console.log(e)
        start++;
        getListObjectFromLocal(clients, start, end, res,fileList)
    }
}