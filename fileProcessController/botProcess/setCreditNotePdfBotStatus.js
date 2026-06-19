let db = require('../dbQueryProcessController')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
const s3 = require('../../awsS3BucketConfig/s3BucketConnection')
let fs = require('fs')
let checkBillNoExist;
let attachmentType = 'Pdf'
let fileStoreTo = process.env.fileStoreTo
const bucketName = process.env.Bucket_Name;
let sourceFolderSummary = 'Input_Summary_Raw_Sap_dump'
let sourceFolderPdf = 'Input_Pdfs'
let isBillNoExist = 0;
let isSummaryFileExist = 0;
let isPdfFileExist = 0;
let folderName = ''
let returnMsg = ''
let isExecuteBot = false
let botName = 'creditNotePdfBot'

let setCreditNotePdfBotStatus = {}

setCreditNotePdfBotStatus.getFileList = () => 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {   
            let checkBotStatus = await db.checkBotStatus(botName)
            if(checkBotStatus[0].botStatus == 'working')
            {
                return resolve({"result" : false, "message" : "Bot is already working"})
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
                checkBillNoExist = await db.checkBillNoExistCreditNote(documentAttachmentId[0]?.id)
                isBillNoExist = checkBillNoExist[0].isBillNoExist
                return resolve(checkSummaryLocalInputFolders(clients, 0, clients?.length, ''))
                
            }
            else
            {
                return resolve({"result" : false, "message" : "Clients not found"})
            }
        }
        catch(e)
        {
            console.log(e);
            return resolve({"result" : false, "message" : e?.stack || e?.message})
        }
    })
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
                return checkSummaryLocalInputFolders(clients, start, end, res)
            }    
            else
            {
                start++;
                return checkSummaryLocalInputFolders(clients, start, end, res)
            } 
        }
        else
        {
            return checkPdfLocalInputFolders(clients, 0, clients?.length, res)
        }
    }
    catch (e)
    {
        return ({"result" : false, "message" : e?.stack || e?.message})
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
                return checkPdfLocalInputFolders(clients, start, end, res)
            }    
            else
            {
                start++;
                return checkPdfLocalInputFolders(clients, start, end, res)
            } 
        }
        else
        {
            let returnValue = await msgToReturn()
            return ({"result" : true, "message" : returnMsg,"isTableUpdated" : returnValue})
        }
    }
    catch (e)
    {
        return ({"result" : false, "message" : e?.stack || e?.message})
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
                msg = msg + ` Bot cannot be started because credit note pdf file not present. `
            }
        
            if(!isBillNoExist)
            {
                msg = msg + ` Bot cannot be started because credit note number not present. `
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

module.exports = setCreditNotePdfBotStatus