let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let db = require('./dbQueryClientUploadedDocs')
let path = require('path')
let fs = require('fs')
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let inputFolderPath = 'Input_form16_Pdfs_Raw_Sap_dump';
let documentFailedFolderPath = 'Rejected_form16_Pdfs_Raw_Sap_dump'
const bucketName = process.env.Bucket_Name;
let folderName = ''
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let logFileName = "form16PdfLogFile-"
let fileStoreTo = process.env.fileStoreTo
const logFilePath = getPath.getName('vendor/s3/form16/pdf')
const vendorModuleClientPath = '/' + uniqueFunction.vendorModule + 'client'


module.exports = require('express').Router().get('/',async(req,res) => 
{
    try 
    { 
        logFileName = "form16PdfLogFile-"
        logFileName = logFileName + new Date().toISOString().slice(0, 10)
        folderName = getPath.getName('documentFolders') + vendorModuleClientPath

        let getDailyActivityLog = await db.getDailyActivityLog(new Date())
        if(getDailyActivityLog?.length == 0)
        {
            let saveDailyActivityLog = await db.saveDailyActivityLog(new Date())
        }
        let clients = await db.getClientsUuid()
        clients = clients.map(client => client.uuid)
        if(clients.length > 0)
        {
            getListObjectFromLocal(clients, 0, clients?.length, res, [])
        }
        else
        {
            await uniqueFunction.writeLogIntoFile({"form16PdfFilePaths" : []}, logFileName, "Get Form 16 Pdf List", logFilePath, 'green')
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"form16PdfFilePaths" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Form 16 Pdf List", logFilePath, 'red')
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

async function getListObjectFromLocal(clients, start, end, res, fileList)
{
    try
    {
        if(start < end)
        {
            let clientUuid = clients[start]
            let localFilePathListObject = folderName + "/" + clientUuid + "/" + inputFolderPath + "/"
            let dirents = fs.readdirSync(localFilePathListObject, {withFileTypes : true});
            console.log("++++++ ",dirents)
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
                    uniqueFunction.writeLogIntoFile("File type not accepted : " + path.extname(fileName), logFileName, "Get Form 16 Pdf List: "+ file?.Key, logFilePath, 'red')
                    uniqueFunction.uploadVendorFiles(fileObj, fileName, clientUuid, documentFailedFolderPath).then(async(uploadFileToS3Bucket) => {
                        //log
                        let sql = `UPDATE client_vendor_upload_doc_log_master SET status = 'Failed', remark = 'File type not matched.', failed_on = ?, failed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' WHERE UPPER(file_name) = UPPER('${fileName}')`
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
            await uniqueFunction.writeLogIntoFile({"form16PdfFilePaths" : fileList}, logFileName, "Get Form 16 Pdf List", logFilePath, 'green')
            
            let saveDailyActivityLogDetail = await db.saveDailyActivityLogDetail('Process Local File', 'Form 16 PDF', 'Bot File processing started, No. of files available :' + fileList.length, '', new Date())

            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"form16PdfFilePaths" : fileList},
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        await uniqueFunction.writeLogIntoFile(e?.stack, logFileName, "Get Form 16 Pdf List => getListObjectFromLocal", logFilePath, 'red')
        console.log(e)
        start++;
        getListObjectFromLocal(clients, start, end, res,fileList)
    }
}