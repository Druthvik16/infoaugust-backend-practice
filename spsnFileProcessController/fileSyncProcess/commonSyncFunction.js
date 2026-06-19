let db = require('../dbQueryProcessController')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
const uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction');
const Client = require('ssh2-sftp-client');
const sftp = new Client();
const randomKey = require('../../authenticate/tokenGenerate')
const baseFolder =  process.env.baseFolder
const getSftpConfig = require('../../common/sftpConfig');
const config = getSftpConfig();
let docPath = require('../../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
const vendorModuleClientPath = '/' + uniqueFunction.vendorModule + 'client'
const commonSyncFunction = {}

commonSyncFunction.getFileFromSftp = async(file, uniqueCheckName, apiName, logFilePath, logFileName)=> 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            await connectSFTP()
            let sourceFileContents = await sftp.get(file.sftpPath + file.fileName)               
            if(uniqueCheckName != 0)
            {
                file.fileName = file['newFileName']
            }
            let saveDataTransactLog = await db.saveDataTransactLog('DN', 'SU', '', '', file?.file.size, apiName, 'SFTP', new Date(), file.clientUuid, file?.fileName)
            let encryptedData = await uniqueFunction.encryptFileBuffer(sourceFileContents, file.fileName, null,null, 'buffer')
            if(encryptedData?.result)
            {
                sourceFileContents = encryptedData?.file
                let uploadFiles = await uniqueFunction.singleFileUpload(sourceFileContents, getPath.getName('documentFolders') + vendorModuleClientPath, file.fileName, (file.clientUuid + '/' + file.destinationFolder))
                let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', file?.file.size, apiName, 'LOC', new Date(), file.clientUuid, file?.fileName)
                if(uploadFiles && uploadFiles.result == true)
                {
                    let saveLog = await db.saveUploadDocLogMasterLocal(file.fileName, file.clientId, file.documentAttachmentId, file.status, new Date(), uploadFiles.localFilePath,file.documentCategoryId, encryptedData?.encriptionKey, encryptedData?.encriptionIV)
                    await uniqueFunction.writeLogIntoFile("File uploaded and database log updatd", logFileName, file.fileName, logFilePath, 'green') 
                    console.log("remane3")
                    let rename = await renameFile(file)
                    if(rename)
                    {
                        start++
                        return  getFileObject(files, start, end, res)
                    }
                }
                else
                {
                    console.log("File Not Uploaded")
                    await uniqueFunction.writeLogIntoFile("File not uploaded", logFileName, file.fileName, logFilePath, 'red')
                    start++
                    return  getFileObject(files, start, end, res)
                }
            }
            else
            {
                console.log("file encryption error")
                await uniqueFunction.writeLogIntoFile("File not encrypted error : " + JSON.stringify(encryptedData?.error), logFileName, file.fileName, logFilePath, 'red')
                await sftp?.end()
                return commonSyncFunction.getFileFromSftp(file, uniqueCheckName, apiName, logFilePath)
            } 
        }
        catch(sftpGetError) 
        {
            await uniqueFunction.writeLogIntoFile(sftpGetError?.stack, logFileName, file.fileName, logFilePath, 'red')
            await sftp?.end();
            return commonSyncFunction.getFileFromSftp(file, uniqueCheckName, apiName, logFilePath)
        }
    })    
}

const connectSFTP = async (count, sftp, config, logFileName, logFilePath) => 
    {
        try 
        {
            if (!sftp.sftp) 
            {
                await sftp.connect(config);
                return {result: true, sftp: sftp};
            }
            else
            {
                return {result: true, sftp: sftp};
            }
        } 
        catch (error) 
        {
            count++;
            if(count >= 10)
            {
                return false;
            }
            else
            {
                await sftp?.end()
                // await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, "*********", getPath.getName('sftp/creditNote/summary'), 'red')
                await uniqueFunction.writeLogIntoFile(error?.stack, logFileName, "*********", logFilePath, 'red')
                await sleep(10000);  // Sleep for 10 second
                return connectSFTP(count)
            }
        }
    }
    
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    async function renameFile(file)
    {
        return new Promise(async(resolve, reject) => {     
            if(file?.fileName && file?.fileName?.includes('_read'))
            {
                return resolve(true)
            }
            else if(file?.oldFileName && file?.oldFileName?.includes('_read'))
            {
                return resolve(true)
            }
            else if(file?.newFileName)
            {
                file.fileName = file?.oldFileName
            }
            if(sftp?.sftp)
            {
                let nameArray = file.fileName.split('.')
                let newFileName = ''
                if(file?.newFileName)
                {
                    newFileName = nameArray[0] + '_' + file?.randomKey + '_read.' + nameArray[1]
                }
                else
                {
                    newFileName = nameArray[0] + '_read.' + nameArray[1]
                }
                try
                {
                    console.log(file.sftpPath + file.fileName,file.sftpPath + newFileName)
                    let rename = await sftp.rename(file.sftpPath + file.fileName,file.sftpPath + newFileName)
                    await uniqueFunction.writeLogIntoFile(`*************File Renamed (${file.fileName} to ${newFileName}) *******`, logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'green')
                    return resolve(true)
                }
                catch(rnameErr)
                {
                    await uniqueFunction.writeLogIntoFile(rnameErr?.stack, logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                    console.log("Error renaming",rnameErr)
                    return resolve(true)
                }
            }
            else
            {
                await uniqueFunction.writeLogIntoFile("Sftp connection lost file rename failed", logFileName, file.fileName, getPath.getName('sftp/creditNote/summary'), 'red')
                return resolve(true)
            }
        })
    }
    
    async function mailFiles(file, fileData)
    {
        return  new Promise(async(resolve, reject) => 
        {
            let fileExtension = file.fileName.split('.')[1]
            let mimeType = await db.getMimeType(fileExtension)
            let attachment = [{
                content : fileData.toString('base64'),
                type : mimeType[0].mime,
                name : file.fileName
            }]
    
            let dataToSend = {
                "to":[{"email" : process.env.rawFileMailId, "name": "Infoaugust", "type" : "to"}],
                "subject": "Credit Note Summary Raw File",
                "text": "<div>Hello,</div><br/><br/><div>Please find attachment of Credit Note Summary</div>",
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