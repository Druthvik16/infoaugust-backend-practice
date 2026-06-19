let db = require('./dbQueryCronTab')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
let fs = require('fs')
let checkBillNoExistInvoice;
let attachmentType = 'Pdf'
let fileStoreTo = process.env.fileStoreTo
const bucketName = process.env.Bucket_Name;
let sourceFolderSummary = 'Input_Invoice_Summary_Raw_Sap_dump'
let sourceFolderPdf = 'Input_Invoice_Pdfs_Raw_Sap_dump'
let isBillNoExist = 0;
let isSummaryFileExist = 0;
let isPdfFileExist = 0;
let folderName = ''
let returnMsg = ''
let isExecuteBot = false
let botName = 'invoicePdfBot'
const { getDiskSpaceStatus } = require('../diskSpaceChecker/diskSpaceChecker.js');
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {   
        const disk = getDiskSpaceStatus();
        if(!disk.isAvailable)
        {
            return res.json({
                status_code: 500,
                message: "Insufficient disk space available for file processing",
                data: {
                    isDiskSpaceAvailable: disk.isAvailable,
                    availableGB: disk.availableGB
                },
                status_name: getCode.getStatus(500)
            });
        }
        let checkBotStatus = await db.checkBotStatus(botName)
        if(checkBotStatus[0].botStatus == 'working')
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Bot is already working",
                "status_name" : getCode.getStatus(500)
            });
        }

        let getDailyActivityLog = await db.getDailyActivityLog(new Date())
        if(getDailyActivityLog?.length == 0)
        {
            let saveDailyActivityLog = await db.saveDailyActivityLog(new Date())
        }
        isBillNoExist = 0;
        isSummaryFileExist = 0;
        isPdfFileExist = 0;
        returnMsg = '';
        isExecuteBot = false;
        let clients = await db.getClientsUuid()
        clients = clients.map(client => client.uuid)
        if(clients.length > 0)
        {            
            let documentAttachmentId = await db.getDocumentAttachmentId(attachmentType)
            checkBillNoExistInvoice = await db.checkBillNoExistInvoice(documentAttachmentId[0]?.id)
            isBillNoExist = checkBillNoExistInvoice[0].isBillNoExist
            if(fileStoreTo == 'S3BUCKET')
            {
                checkS3BucketSummaryInputFolder(clients, 0, clients?.length, res)
            }
            else
            {
                checkSummaryLocalInputFolders(clients, 0, clients?.length, res)
            }
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Client Not Found",
                "status_name" : getCode.getStatus(500)
            });
        }
    }
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
})

async function checkS3BucketSummaryInputFolder(clients, start, end, res)
{
    try
    {
        if(start < end)
        {  
            folderName = process.env.currentFolder
            let clientUuid = clients[start]
            let s3FilePathListObject = folderName + clientUuid + "/" + sourceFolderSummary + "/"
            const params = {
                Bucket: bucketName,
                Prefix : s3FilePathListObject
            };
            s3.listObjectsV2(params, async(err, file) =>
            {
                if (err) 
                {
                    console.error('Error list:', err);
                    start++;
                    checkS3BucketSummaryInputFolder(clients, start, end, res)
                } 
                else 
                {
                    let content = file.Contents
                    let flag = 0;
                    content.forEach(file => {
                        if(file?.Key?.length > s3FilePathListObject?.length)
                        {
                            flag = 1;
                        }
                    })
                    if(flag)
                    {
                        isSummaryFileExist = 1
                        start = end
                        checkS3BucketSummaryInputFolder(clients, start, end, res)
                    }    
                    else
                    {
                        start++;
                        checkS3BucketSummaryInputFolder(clients, start, end, res)
                    }   
                }   
            })  
        }
        else
        {
            checkS3BucketPdfInputFolder(clients, 0, clients?.length, res)
        }
    }
    catch (e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
}

async function checkS3BucketPdfInputFolder(clients, start, end, res)
{
    try
    {
        if(start < end)
        {
            folderName = process.env.currentFolder
            let clientUuid = clients[start]
            let s3FilePathListObject = folderName + clientUuid + "/" + sourceFolderPdf + "/"
            const params = {
                Bucket: bucketName,
                Prefix : s3FilePathListObject
            };
            s3.listObjectsV2(params, async(err, file) =>
            {
                if (err) 
                {
                    console.error('Error list:', err);
                    start++;
                    checkS3BucketPdfInputFolder(clients, start, end, res)
                } 
                else 
                {
                    let content = file.Contents
                    let flag = 0;
                    content.forEach(file => {
                        if(file?.Key?.length > s3FilePathListObject?.length)
                        {
                            flag = 1;
                        }
                    })
                    if(flag)
                    {
                        isPdfFileExist = 1
                        start = end
                        checkS3BucketPdfInputFolder(clients, start, end, res)
                    }    
                    else
                    {
                        start++;
                        checkS3BucketPdfInputFolder(clients, start, end, res)
                    }   
                }   
            })  
        }
        else
        {
            let returnValue = await msgToReturn()
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : returnMsg,
                "isTableUpdated" : returnValue,
                "status_name" : getCode.getStatus(200),
            });
        }
    }
    catch (e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
}

async function checkSummaryLocalInputFolders(clients, start, end, res)
{
    try
    {
        folderName = getPath.getName('documentFolders')
        if(start < end)
        {
            let clientUuid = clients[start]
            let localFilePathListObject = getPath.getName('documentFolders') + "/"  + clientUuid + "/" + sourceFolderSummary + "/"
            let dirents = fs.readdirSync(localFilePathListObject, {withFileTypes : true});
            let files = dirents
            .filter(dirent => dirent.isFile())
            .map(dirent => {
                return dirent;
            });

            if(files?.length > 0)
            {
                isSummaryFileExist = 1
                start = end
                checkSummaryLocalInputFolders(clients, start, end, res)
            }    
            else
            {
                start++;
                checkSummaryLocalInputFolders(clients, start, end, res)
            } 
        }
        else
        {
            checkPdfLocalInputFolders(clients, 0, clients?.length, res)
        }
    }
    catch (e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }    
}

async function checkPdfLocalInputFolders(clients, start, end, res)
{
    try
    {
        if(start < end)
        {
            folderName = getPath.getName('documentFolders')
            let clientUuid = clients[start]
            let localFilePathListObject = getPath.getName('documentFolders') + "/"  + clientUuid + "/" + sourceFolderPdf + "/"
            let dirents = fs.readdirSync(localFilePathListObject, {withFileTypes : true});
            let files = dirents
            .filter(dirent => dirent.isFile())
            .map(dirent => {
                return dirent;
            });

            if(files?.length > 0)
            {
                isPdfFileExist = 1
                start = end
                checkPdfLocalInputFolders(clients, start, end, res)
            }    
            else
            {
                start++;
                checkPdfLocalInputFolders(clients, start, end, res)
            } 
        }
        else
        {
            let returnValue = await msgToReturn()
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : returnMsg,
                "isTableUpdated" : returnValue,
                "status_name" : getCode.getStatus(200),
            });
        }
    }
    catch (e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Error",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
}



async function msgToReturn()
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let msg = ``
            if(isSummaryFileExist)
            {
                msg = msg + ` Bot cannot be started because unprocessed summary file is present. `
            }
        
            if(!isPdfFileExist)
            {
                msg = msg + ` Bot cannot be started because invoice pdf file not present. `
            }
        
            if(!isBillNoExist)
            {
                msg = msg + ` Bot cannot be started because invoice number not present. `
            }
        
            if(msg?.length == 0)
            {
                returnMsg = `success`
                isExecuteBot = true;
            }
            else
            {
                isExecuteBot = false;
                returnMsg = msg
            }
            let isExecute = isExecuteBot == true ? 1 : 0;
            let updateLog = await db.updatePdfBotProcessLog(botName, isBillNoExist, isExecute, isSummaryFileExist, isPdfFileExist)
            if(updateLog?.affectedRows > 0)
            {
                return resolve(true)
            }
            else
            {
                return resolve(false)
            }
        }
        catch (e)
        {
            console.log(e);
            return resolve(false)
        }
    })
}