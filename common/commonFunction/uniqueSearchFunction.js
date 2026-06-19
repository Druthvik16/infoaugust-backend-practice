let db = require('./dbQueryCommonFuntion')
let fs = require('fs');
let path = require('path')
const mime = require('mime');
const crypto = require('crypto');
const SftpClient = require('ssh2-sftp-client');
const s3 = require('../../awsS3BucketConfig/s3BucketConnection')
const getSftpConfig = require('../sftpConfig.js');
const config = getSftpConfig()

let folderToCreate = ['Input_Summary_Raw_Sap_dump', 'Uploaded_Summary_Sap_Dump', 'Rejected_Summary_Sap_Dump', 'Input_Working_Raw_Sap_dump', 'Uploaded_Working_Raw_Sap_dump', 'Rejected_Working_Raw_Sap_dump', 'Input_Pdfs', 'Uploaded_Pdfs', 'Rejected_Pdfs', 'Input_Ledger_Raw_Sap_dump','Uploaded_Ledger_Raw_Sap_dump','Rejected_Ledger_Raw_Sap_dump','Input_Invoice_Summary_Raw_Sap_dump','Uploaded_Invoice_Summary_Raw_Sap_dump','Rejected_Invoice_Summary_Raw_Sap_dump','Input_Invoice_Pdfs_Raw_Sap_dump','Uploaded_Invoice_Pdfs_Raw_Sap_dump','Rejected_Invoice_Pdfs_Raw_Sap_dump', 'Input_Invoice_Pt_File_Raw_Sap_dump','Uploaded_Invoice_Pt_File_Raw_Sap_dump','Rejected_Invoice_Pt_File_Raw_Sap_dump', 'Input_Monthly_Transactions_Raw_Sap_dump','Uploaded_Monthly_Transactions_Raw_Sap_dump','Rejected_Monthly_Transactions_Raw_Sap_dump', 'Input_Partner_Master_Raw_Sap_dump','Uploaded_Partner_Master_Raw_Sap_dump','Rejected_Partner_Master_Raw_Sap_dump' ]

let folderToCreateVendorModule = ['Input_Summary_Raw_Sap_dump', 'Uploaded_Summary_Sap_Dump', 'Rejected_Summary_Sap_Dump', 'Input_Pdfs', 'Uploaded_Pdfs', 'Rejected_Pdfs', 'Input_Ledger_Raw_Sap_dump','Uploaded_Ledger_Raw_Sap_dump','Rejected_Ledger_Raw_Sap_dump', 'Input_form16_Summary_Raw_Sap_dump', 'Uploaded_form16_Summary_Raw_Sap_dump', 'Rejected_form16_Summary_Raw_Sap_dump', 'Input_form16_Pdfs_Raw_Sap_dump', 'Uploaded_form16_Pdfs_Raw_Sap_dumpp', 'Rejected_form16_Pdfs_Raw_Sap_dumpp', 'Input_Payment_Advice_Master_Raw_Sap_dump', 'Uploaded_Payment_Advice_Master_Raw_Sap_dump', 'Rejected_Payment_Advice_Master_Raw_Sap_dump', 'Input_Payment_Advice_Detail_Raw_Sap_dump', 'Uploaded_Payment_Advice_Detail_Raw_Sap_dump', 'Rejected_Payment_Advice_Detail_Raw_Sap_dump', 'Uploaded_Balance_Confirmation_Letter_Pdfs', 'Uploaded_No_Dues_Certificate_Pdfs' ]

let folderToCreateSpsnModule = ['Input_Outstanding_Report_Summary_Raw_Sap_dump', 'Uploaded_Outstanding_Report_Summary_Sap_Dump', 'Rejected_Outstanding_Report_Summary_Sap_Dump',  'Input_Adjustment_Report_Summary_Raw_Sap_dump', 'Uploaded_Adjustment_Report_Summary_Sap_Dump', 'Rejected_Adjustment_Report_Summary_Sap_Dump','Uploaded_Ledger_Download_File','Uploaded_Ledger_Json_Raw_File']

let folderToCreateInLocal = ['Input_Summary_Raw_Sap_dump', 'Input_Working_Raw_Sap_dump', 'Input_Pdfs', 'Input_Ledger_Raw_Sap_dump','Input_Invoice_Summary_Raw_Sap_dump','Input_Invoice_Pdfs_Raw_Sap_dump', 'Input_Invoice_Pt_File_Raw_Sap_dump', 'Input_Monthly_Transactions_Raw_Sap_dump', 'Input_Partner_Master_Raw_Sap_dump']


let folderToCreateInLocalVendorModule = ['Input_Summary_Raw_Sap_dump', 'Input_Pdfs', 'Input_Ledger_Raw_Sap_dump', 'Input_form16_Summary_Raw_Sap_dump', 'Input_form16_Pdfs_Raw_Sap_dump', 'Input_Payment_Advice_Master_Raw_Sap_dump', 'Input_Payment_Advice_Detail_Raw_Sap_dump']


let folderToCreateInLocalSpsnModule = ['Input_Outstanding_Report_Summary_Raw_Sap_dump', 'Input_Adjustment_Report_Summary_Raw_Sap_dump']

const bucketName = process.env.Bucket_Name;
const folderName = process.env.currentFolder
const vendorModule = process.env.vendorModule;
const spsnModule = process.env.spsnModule;

let documentFolders = 'documentFolders'

let uniqueFunction = {}

uniqueFunction.spsnModule = spsnModule
uniqueFunction.vendorModule = vendorModule

uniqueFunction.unquieName = (identifierName, columnName, columnValue, id, uuid) => 
{
    return new Promise((resolve, reject) => {
        try
        {
            let condition = ``
            let returnRes = -1
            for(let i = 0; i < columnName.length; i++)
            {
                if(columnValue[columnName[i]] != '')
                {
                    if(columnName[i] == 'name' || columnName[i] == 'code'|| columnName[i] == 'tax_code'|| columnName[i] == 'description' || columnName[i] == 'tax_section' || columnName[i] == 'gl_account_id' || columnName[i] == 'gst_number' || columnName[i] == 'pan_number' || columnName[i] == 'cin_number' || columnName[i] == 'msme_number')
                    {
                        condition = condition + 'UPPER('+ columnName[i] +  ') = ' + 'UPPER(' + `'${columnValue[columnName[i]]}'` + ')'
                    }
                    else if (columnName[i] === 'client_id' || columnName[i] === 'partner_id')
                    {
                        condition = condition + columnName[i] + ' = ' +  `${columnValue[columnName[i]]}`
                    }
                    else
                    {
                        condition = condition + columnName[i] + ' = ' +  `'${columnValue[columnName[i]]}'`
                    }
                    if(columnName.length != i+1)
                    {
                        condition += ' AND '
                    }
                }
            }
            if(id)
            {
                condition += ` AND id != ${id}`
            }
            if(uuid.length > 0)
            {
                condition += ` AND uuid != '${uuid}'`
            }
            if(identifierName != '' && condition != '')
            {
                let sql = `SELECT IF(COUNT(id) > 0,1,0) AS isExist FROM ${identifierName} WHERE ${condition}`
                db.getUnique(sql).then(res => 
                {
                    if(res)
                    {
                        if(res[0].isExist == 0)
                        {
                            returnRes = 0
                            return resolve(returnRes)
                        }
                        else
                        {
                            returnRes = 1
                            return resolve(returnRes)
                        }
                    }
                })
            }
            else
            {
                return resolve(returnRes)
            }
        }
        catch(e)
        {
            // throw e
            return resolve(returnRes)
        }
    })
}

uniqueFunction.manageSpecialCharacter = (data) => {
    if(data?.includes("'"))
    {
        data = data?.split("'").join("''")
        data = data?.toString().trim();
    }
    return data
}

uniqueFunction.singleFileUpload = (filePathOrBuffer, destinationBaseFolder, fileName, addiFolder) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let addiFolderCreated = 1
            let newpath = destinationBaseFolder 
            if (!fs.existsSync(newpath + '/')) {
                fs.mkdirSync(newpath, { recursive: true });
            }
            console.log("folder created", newpath)
            if(addiFolder != '')
            {
                let folders = addiFolder.split('/')
                let i = 0
                for(; i < folders.length; i++)
                {
                    try 
                    {
                        if (!fs.existsSync(newpath + '/' + folders[i])) 
                        {
                            fs.mkdirSync(newpath + '/' + folders[i]);
                            newpath = newpath + '/' + folders[i]
                        }
                        else
                        {
                            newpath = newpath + '/' + folders[i]
                            // fs.readdirSync(newpath).forEach(ele => {
                            //     fs.unlinkSync(newpath + '/' + ele);
                            // })
                        }
                    } 
                    catch (err) 
                    {
                        console.log(err);
                    }
                }
                // if(parseInt(i) != folders.length)
                // {
                //     for( ; i < folders.length; i++)
                //     {
                //         try 
                //         {
                //             if (!fs.existsSync(folders[i])) 
                //             {
                //                 fs.rmdirSync(folders[i]);
                //             }
                //         } 
                //         catch (err) 
                //         {
                //             console.log(err);
                //         }
                //     }
                //     addiFolderCreated = 0
                // }
            }
            if(addiFolderCreated == 1)
            {
                console.log("File upload to local bucket started : ", fileName)
                try
                {
                    let filepath = new Buffer.from(filePathOrBuffer);
                    newpath = newpath + '/';
                    newpath += fileName;
                    fs.writeFileSync(newpath,filepath)
                    uniqueFunction.removeFileFromDirectory(filepath)
                    return resolve({"result" : true, "localFilePath" : newpath})
                }
                catch(e)
                {
                    console.log(e)
                    return resolve(false)
                }
            }
            else
            {
                return resolve(false)
            }
        }
        catch(e)
        { 
            console.log(e)
            return resolve(false)
        }
    });
}

uniqueFunction.deleteUploadedFile = (destinationBaseFolder, fileName, addiFolder, action, isDeleteFolder = 0) =>
{
    return new Promise((resolve, reject)=>{
        try{
            let newpath = destinationBaseFolder
            if (!fs.existsSync(newpath)) {
                fs.mkdirSync(newpath, { recursive: true });
            }
            if(addiFolder != '')
            {
                let folders = addiFolder.split('/')
                let i = 0
                for(; i < folders.length; i++)
                {
                    try 
                    {
                        let generatedFilePath = ''
                        if(action.length == 0)
                        {
                            generatedFilePath = newpath + '/' + folders[i] + '/' + fileName
                        }
                        else
                        {
                            generatedFilePath = newpath + '/' + folders[i] + '/' + action + '/' + fileName
                        }
                        if (fs.existsSync(generatedFilePath)) 
                        {
                            fs.unlinkSync(generatedFilePath)
                            if(isDeleteFolder == 1)
                            {
                                let dir = newpath + '/' + folders[i]
                                fs.readdir(dir, (err, files) => {
                                    if(files.length == 0)
                                    {
                                        fs.rmdirSync(dir);
                                    }
                                });       
                            } 
                            if(action == 'working-files' || action == 'response' || action == 'query')    
                            {
                                let dir = newpath + '/' + folders[i] + action
                                fs.readdir(dir, (err, files) => {
                                    if(files.length == 0)
                                    {
                                        fs.rmdirSync(dir);
                                    }
                                });   
                            }                
                            newpath = newpath + '/' + folders[i]
                            return resolve(true)
                        }
                        else
                        {
                            return resolve(true)
                        }
                    } 
                    catch (err) 
                    {
                        console.error(err);
                    }
                }
            }
        }
        catch(e)
        { 
            console.log(e)
        }
    });
}

uniqueFunction.getFileUploadedPath = (destinationBaseFolder, fileName, addiFolder, action) =>
{
    return new Promise((resolve, reject)=>{
        try{
            let newpath = destinationBaseFolder
            if (!fs.existsSync(newpath)) {
                fs.mkdirSync(newpath, { recursive: true });
            }
            if(addiFolder != '')
            {
                let folders = addiFolder?.split('/')
                let i = 0
                for(; i < folders?.length; i++)
                {
                    try 
                    {
                        let generatedFilePath = ''
                        if(action.length == 0)
                        {
                            generatedFilePath = newpath + '/' + folders[i] + '/' + fileName
                        }
                        else
                        {
                            generatedFilePath = newpath + '/' + folders[i] + '/' + action + '/' + fileName
                        }
                        console.log(generatedFilePath)
                        if (fs.existsSync(generatedFilePath)) 
                        {
                            let file = fs.readFileSync(generatedFilePath, 'base64')
                            newpath = generatedFilePath
                            const mime_type = mime.getType(newpath)
                            return resolve({path:newpath, mime : mime_type, fileName : fileName, file: file})
                        }
                        else
                        {
                            newpath = newpath + '/' + folders[i]
                            return resolve(false)
                        }                        
                    } 
                    catch (err) 
                    {
                        console.error(err);
                    }
                }
            }
            else
            {

                // for templates
                try 
                {
                    let generatedFilePath = newpath + '/' + fileName
                    if (fs.existsSync(generatedFilePath)) 
                    {
                        let file = fs.readFileSync(generatedFilePath, 'base64')
                        newpath = generatedFilePath
                        const mime_type = mime.getType(newpath)
                        return resolve({path:newpath, mime : mime_type, fileName : fileName, file: file})
                    }
                    else
                    {
                        return resolve(false)
                    }                        
                } 
                catch (err) 
                {                    
                    console.error(err);
                    return resolve(false)
                }
            }
        }
        catch(e)
        { 
            console.log(e)            
            return resolve(false)
        }
    });
}

uniqueFunction.changeDateToSqlDate = (excelDate) =>
{
    if(excelDate != null)
    {
        let dateString = excelDate.split("-");
        if(dateString.length == 3)
        {
            return dateString[2] + "-" + dateString[0] + "-" + dateString[1];
        }
        else
        {
            return "";
        }
    }
    else
    {
        return "";
    }
}

uniqueFunction.multiFileUpload = (files, destinationBaseFolder, addiFolder, action) =>
{
    return new Promise((resolve, reject)=>{
        try{
            let addiFolderCreated = 1
            let newpath = destinationBaseFolder
            if (!fs.existsSync(newpath)) {
                fs.mkdirSync(newpath, { recursive: true });
            }
            if(addiFolder != '')
            {
                let folders = addiFolder.split('/')
                let i = 0
                for(; i < folders.length; i++)
                {
                    try 
                    {
                        if (!fs.existsSync(newpath + '/' + folders[i])) 
                        {
                            fs.mkdirSync(newpath + '/' + folders[i]);
                            newpath = newpath + '/' + folders[i]
                        }
                        else
                        {
                            newpath = newpath + '/' + folders[i]
                        }
                    } 
                    catch (err) 
                    {
                        console.log(err);
                        console.error(err);
                    }
                }
                if(parseInt(i) != folders.length)
                {
                    for( ; i < folders.length; i++)
                    {
                        try 
                        {
                            if (!fs.existsSync(folders[i])) 
                            {
                                fs.rmdirSync(folders[i]);
                            }
                        } 
                        catch (err) 
                        {
                            console.log(err);
                            console.error(err);
                        }
                    }
                    addiFolderCreated = 0
                }
            }
            if(addiFolderCreated == 1)
            {
                try
                {
                    if(action === 'logos')
                    {
                        fs.readdirSync(newpath).forEach(ele => {
                            fs.unlinkSync(newpath + '/' + ele);
                        })
                    }
                    uploadLogoFiles(files, 0, files.length, resolve, newpath, destinationBaseFolder, addiFolder, action)
                }
                catch(e)
                {
                    throw e
                }
            }
        }
        catch(e)
        { 
            console.log(e)
        }
    });
}


function uploadLogoFiles(files, start, end, resolve, newpath, destinationBaseFolder, addiFolder, action)
{
    try
    {
        if(start < end)
        {
            let file = files[start];
            let filepath = file.filepath;
            let fileName = file.originalFilename;
            console.log(newpath, newpath + '/' + fileName)
            if(action == 'vendorDocuments')
            {
                fileName = file.newFileName
                if (fs.existsSync(newpath + '/' + fileName)) 
                {
                    fs.unlinkSync(newpath + '/' + fileName)
                }
            }
            else if (fs.existsSync(newpath + '/' + fileName)) 
            {
                fs.unlinkSync(newpath + '/' + fileName)
            }
            fs.copyFile(filepath,( newpath + '/' + fileName), function (err) 
            {
                if(err)
                {
                    throw err 
                }
                fs.unlinkSync(filepath)
                start++
                uploadLogoFiles(files, start, end, resolve, newpath, destinationBaseFolder, addiFolder, action)
            });
        }
        else
        {
            return  resolve(true)
        }
    }
    catch(e)
    {
        console.log(e)
    }
}


uniqueFunction.uploadFiles = (fileBuffer, fileName, clientUuid, inputFolder) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            console.log("File upload to s3 bucket started : ", fileName)
            var base64data = new Buffer.from(fileBuffer);
            let s3FilePath = folderName + clientUuid + "/" + inputFolder + "/" + fileName
            s3.putObject(
            {
                'Bucket': bucketName,
                'Key': s3FilePath,
                'Body': base64data
            }, (error,data1) => {
                if(error)
                {
                    console.log(error)
                    return resolve(false)
                }
                else
                {
                    return resolve({"result" : true, "s3FilePath" : s3FilePath})
                }
            })
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}

uniqueFunction.uploadVendorFiles = (fileBuffer, fileName, clientUuid, inputFolder, action = 'client') =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            console.log("File upload to s3 bucket started : ", fileName)
            var base64data = new Buffer.from(fileBuffer);
            // var base64data = fileBuffer;let s3FilePath
            let s3FilePath = ""
            if(action == 'vendor')
            {
                s3FilePath = vendorModule + 'client/vendor/' + clientUuid + "/" + inputFolder + "/" + fileName
            }
            else
            {
                s3FilePath = vendorModule + 'client/' + clientUuid + "/" + inputFolder + "/" + fileName
            }
            s3.putObject(
            {
                'Bucket': bucketName,
                'Key': s3FilePath,
                'Body': base64data
            }, (error,data1) => {
                if(error)
                {
                    console.log(error)
                    return resolve(false)
                }
                else
                {
                    // console.log("arguments", arguments);
                    // console.log('Successfully uploaded', data1)
                    return resolve({"result" : true, "s3FilePath" : s3FilePath})
                }
            })
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}

uniqueFunction.uploadVendorModulesFiles = (fileBuffer, fileName, inputFolder) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            console.log("File upload to s3 bucket started : ", fileName)
            var base64data = new Buffer.from(fileBuffer);
            // var base64data = fileBuffer;
            let s3FilePath = vendorModule + inputFolder + "/" + fileName
            s3.putObject(
            {
                'Bucket': bucketName,
                'Key': s3FilePath,
                'Body': base64data
            }, (error,data1) => {
                if(error)
                {
                    console.log(error)
                    return resolve(false)
                }
                else
                {
                    // console.log("arguments", arguments);
                    // console.log('Successfully uploaded', data1)
                    return resolve({"result" : true, "s3FilePath" : s3FilePath})
                }
            })
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}

uniqueFunction.deleteVendorModuleFile = (inputFolderPath) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            const params = {
                Bucket: bucketName,
                Key : inputFolderPath
            };
            s3.deleteObject(params,async (err, data) =>
            {
                if (err) 
                {    
                    return resolve(false)
                } 
                else 
                {
                    return resolve(true)
                }   
            }) 
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}

uniqueFunction.getVendorModuleFile = (inputFolderPath, fileName, userType, vendorId, apiName, clientUuid,encriptionKey, encriptionIV) =>
{
    return new Promise(async(resolve, reject)=>
    {
        try
        {
            console.log("1", inputFolderPath, fileName, userType, vendorId, apiName, clientUuid,encriptionKey, encriptionIV)
            const params = {
                Bucket: bucketName,
                Key : inputFolderPath
            };
            console.log("2")
            let data = await s3.getObject(params).promise();
            console.log("3", data)
            let saveDataTransactLog = await db.saveDataTransactLog('DN', userType, vendorId, "", data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
            let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName,encriptionKey, encriptionIV)
            console.log("***********************************",decryptedData)
            if(decryptedData?.result)
            {
                console.log("4")
                // let base64data = "data:" + mimeType[0].mime + ";base64," + decryptedData?.file.toString('base64');
                console.log("sendedddddddddddddddddddddd")
                return resolve({"result" : true, "file" : decryptedData?.file, "mimeType" : mime.getType('.'+ fileName.split('.')[1])})
            }
            else
            {
                console.log("5")
                return resolve({"result" : false, "error" : "File Not Decrypted"})
            }
            // s3.getObject(params,async function(err, data) 
            // {
            //     console.log("2")
            //     if (err) 
            //     {
            //         console.log("3")
            //         console.error('Error list:', err);
            //         return resolve({"result" : false, "error" : err?.stack || err?.message})
            //     } 
            //     else 
            //     {
            //         console.log("4")
            //         let saveDataTransactLog = await db.saveDataTransactLog('DN', userType, vendorId, "", data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
            //         let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName,encriptionKey, encriptionIV)
            //         console.log(decryptedData)
            //         if(decryptedData?.result)
            //         {
            //             console.log("5")
            //             // let base64data = "data:" + mimeType[0].mime + ";base64," + decryptedData?.file.toString('base64');
            //             console.log("sendedddddddddddddddddddddd")
            //             return resolve({"result" : true, "file" : decryptedData?.file, "mimeType" : mime.getType('.'+ fileName.split('.')[1])})
            //         }
            //         else
            //         {
            //             console.log("6")
            //             return resolve({"result" : false, "error" : "File Not Decrypted"})
            //         }
            //     }
            // })
        }
        catch(e)
        {
            console.log("6")
            console.log(e)
            return resolve({"result" : false, "error" : e?.stack})
        }
    })
}

uniqueFunction.createFolderOnAwsS3Bucket = (params) =>
{
    return new Promise(async(resolve, reject)=>
    {
        try
        {
            let checkIfExist = await s3.getObject(params).promise()
            // console.log(checkIfExist)
            return  resolve({status : true, data : checkIfExist})
        }
        catch(e)
        { 
            console.log(e.code, params)
            if (e.code === 'NoSuchKey') 
            { 
                try
                {
                    let createdObject = await s3.putObject(params).promise();
                    return  resolve({status : true, data : createdObject})
                }
                catch (err)
                {
                    console.log(err);
                    throw err
                }
            } 
            else 
            {
                throw e
            }
        }
    });
}

uniqueFunction.createClientFoldersInLocal = (uuid) => 
{
    try 
    {
        for(let i = 0; i < folderToCreateInLocal.length; i++)
        {
            let newPath = documentFolders + '/' + uuid + '/' + folderToCreateInLocal[i]
            if (!fs.existsSync(newPath)) 
            {
                fs.mkdirSync(newPath);
            }
        }
    } 
    catch (err) 
    {
        console.log(err);
    } 
}

uniqueFunction.createClientFoldersInLocalVendorModule = (uuid) => 
{
    try 
    {
        for(let i = 0; i < folderToCreateInLocalVendorModule.length; i++)
        {
            let newPath = documentFolders + vendorModule + 'client/' + uuid + '/' + folderToCreateInLocalVendorModule[i]
            if (!fs.existsSync(newPath)) 
            {
                fs.mkdirSync(newPath);
            }
        }
    } 
    catch (err) 
    {
        console.log(err);
    } 
}

uniqueFunction.createClientFoldersInLocalSpsnModule = (uuid) => 
{
    try 
    {
        for(let i = 0; i < folderToCreateInLocalSpsnModule.length; i++)
        {
            // let newPath = documentFolders + 'spsnModule/client/' + uuid + '/' + folderToCreateInLocalSpsnModule[i]
            let newPath = documentFolders + spsnModule + 'client/' + uuid + '/' + folderToCreateInLocalSpsnModule[i]
            if (!fs.existsSync(newPath)) 
            {
                fs.mkdirSync(newPath);
            }
        }
    } 
    catch (err) 
    {
        console.log(err);
    } 
}

uniqueFunction.createFolderInAwsS3Bucket = async(uuid) =>
{
    try
    { 
        let params = {
            Bucket: bucketName,
            Key: folderName + uuid + "/"
        };
        console.log(params);
        let createBaseFolder = await uniqueFunction.createFolderOnAwsS3Bucket(params) // uuid folder created
        createFolderS3Bucket(uuid, folderToCreate, 0, folderToCreate?.length)
    }
    catch (e)
    {
        console.log( "Error creating",e)
    }
}

uniqueFunction.createFolderInAwsS3BucketVendorModule = async(uuid) =>
{
    try
    { 
        let params = {
            Bucket: bucketName,
            Key: vendorModule + 'client/' + uuid + "/"
        };
        console.log(params);
        let createBaseFolder = await uniqueFunction.createFolderOnAwsS3Bucket(params) // uuid folder created
        createFolderS3BucketVendorModule(uuid, folderToCreateVendorModule, 0, folderToCreateVendorModule?.length)
    }
    catch (e)
    {
        console.log( "Error creating",e)
    }
}

uniqueFunction.createFolderInAwsS3BucketSpsnModule = async(uuid) =>
{
    try
    { 
        let params = {
            Bucket: bucketName,
            Key: spsnModule + 'client/' + uuid + "/"
        };
        console.log(params);
        let createBaseFolder = await uniqueFunction.createFolderOnAwsS3Bucket(params) // uuid folder created
        createFolderS3BucketSpsnModule(uuid, folderToCreateSpsnModule, 0, folderToCreateSpsnModule?.length)
    }
    catch (e)
    {
        console.log( "Error creating",e)
    }
}

async function createFolderS3BucketVendorModule(uuid, folderToCreateVendorModule, start, end)
{
    try
    {
        if(start < end)
        {
            let newfolder = folderToCreateVendorModule[start]
            let params = {
                Bucket: bucketName,
                Key: vendorModule + 'client/' + uuid + "/" + newfolder + "/"
            };
            console.log(params);
            let createSubFolder = await uniqueFunction.createFolderOnAwsS3Bucket(params)
            if(createSubFolder?.status == true)
            {
                start++;
                createFolderS3BucketVendorModule(uuid, folderToCreateVendorModule, start, end)
            }
            else
            {
                start++;
                createFolderS3BucketVendorModule(uuid, folderToCreateVendorModule, start, end)
            }
        }
        else
        {
            // update database is_doc_folder
            let updateClient = await db.updateClientDocStatus(uuid)
            console.log("folders created successfully", updateClient)  
            console.log("Folder creation completed", new Date())          
        }
    }
    catch (e)
    {
        console.log( "Error creating",e)
    }
}

async function createFolderS3BucketSpsnModule(uuid, folderToCreateSpsnModule, start, end)
{
    try
    {
        if(start < end)
        {
            let newfolder = folderToCreateSpsnModule[start]
            let params = {
                Bucket: bucketName,
                Key: spsnModule + 'client/' + uuid + "/" + newfolder + "/"
            };
            console.log(params);
            let createSubFolder = await uniqueFunction.createFolderOnAwsS3Bucket(params)
            if(createSubFolder?.status == true)
            {
                start++;
                createFolderS3BucketSpsnModule(uuid, folderToCreateSpsnModule, start, end)
            }
            else
            {
                start++;
                createFolderS3BucketSpsnModule(uuid, folderToCreateSpsnModule, start, end)
            }
        }
        else
        {
            // update database is_doc_folder
            let updateClient = await db.updateClientDocStatus(uuid)
            console.log("folders created successfully", updateClient)  
            console.log("Folder creation completed", new Date())          
        }
    }
    catch (e)
    {
        console.log( "Error creating",e)
    }
}

async function createFolderS3Bucket(uuid, folderToCreate, start, end)
{
    try
    {
        if(start < end)
        {
            let newfolder = folderToCreate[start]
            let params = {
                Bucket: bucketName,
                Key: folderName + uuid + "/" + newfolder + "/"
            };
            console.log(params);
            let createSubFolder = await uniqueFunction.createFolderOnAwsS3Bucket(params)
            if(createSubFolder?.status == true)
            {
                start++;
                createFolderS3Bucket(uuid, folderToCreate, start, end)
            }
            else
            {
                start++;
                createFolderS3Bucket(uuid, folderToCreate, start, end)
            }
        }
        else
        {
            // update database is_doc_folder
            let updateClient = await db.updateClientDocStatus(uuid)
            console.log("folders created successfully", updateClient)  
            console.log("Folder creation completed", new Date())          
        }
    }
    catch (e)
    {
        console.log( "Error creating",e)
    }
}

uniqueFunction.removeFileFromDirectory = (path) => {
    console.log("file path removed : ",path)
    if (fs.existsSync(path)) 
    {
        fs.unlinkSync(path)
    }
}

uniqueFunction.uploadFilesOnS3Bucket = async (fileObject, start, end, clientUuid, masterId, s3Folder, clientId, documentAttachmentId, status, documentCategoryId, rejectedFiles) => 
{
    try
    {
        if(start < end)
        {
            let file = fileObject[start]
            let identifierName = 'upload_doc_log_master'
            let id = 0
            uniqueFunction.unquieName(identifierName, ['file_name'],{  "file_name" : file.originalFilename }, id, 0).then(uniqueCheckName => {
                if(uniqueCheckName != 0)
                {
                    rejectedFiles.push({ "fileName" : file.originalFilename, "remark" : "File name already exists" });
                    start++
                    uploadFileOnS3Bucket(fileObject, start, end, clientUuid, masterId, s3Folder, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                }
                else
                {            
                    uniqueFunction.uploadFiles(file.filepath, file.originalFilename, clientUuid, s3Folder).then(uploadFiles => 
                        {
                            if(uploadFiles && uploadFiles.result == true)
                            {
                                db.saveUploadDocLogMaster(file.originalFilename, clientId, documentAttachmentId, status, new Date(), uploadFiles.s3FilePath,documentCategoryId).then(saveMaster => {
                                    start++
                                    uploadFileOnS3Bucket(fileObject, start, end, clientUuid, masterId, s3Folder, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                                })
                            }
                            else
                            {
                                start++
                                uploadFileOnS3Bucket(fileObject, start, end, clientUuid, masterId, s3Folder, clientId, documentAttachmentId, status,documentCategoryId, rejectedFiles)
                            }
                        })
                }
            })
        }
        else
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : { "rejectedFiles" : rejectedFiles},
                "status_name" : getCode.getStatus(200)
            }) 
        }
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
}

uniqueFunction.encryptFileBuffer = (filePathOrBuffer, fileName, encriptionKey, encriptionIV, action) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            console.log("encryption started for ", fileName, encriptionKey, encriptionIV)
            let fileData = (action == 'file') ? fs.readFileSync(filePathOrBuffer) : ((action == 'base64') ?  Buffer.from(filePathOrBuffer, 'base64') : filePathOrBuffer) 
            encriptionKey = encriptionKey?.length > 0 ? Buffer.from(encriptionKey, 'base64') : crypto.randomBytes(32);
            encriptionIV = encriptionIV?.length > 0 ? Buffer.from(encriptionIV, 'base64') : crypto.randomBytes(16);
           
            // console.log(encriptionKey?.length,"encriptionKey: ", encriptionKey, encriptionIV)
            const cipher = crypto.createCipheriv('aes-256-cbc', encriptionKey, encriptionIV);
            const encrypted = Buffer.concat([cipher.update(fileData), cipher.final()]);
            if(action == 'file')
            {
                uniqueFunction.removeFileFromDirectory(filePathOrBuffer)
            }
            return resolve({'result' : true, 'file': encrypted, "encriptionKey" : encriptionKey?.toString('base64'), "encriptionIV": encriptionIV?.toString('base64')});
        }
        catch(e)
        {
            console.log(e)
            return resolve({'result' : false, 'file': '', 'error': e});
        }
    })
}

uniqueFunction.decryptFileBuffer = (fileBuffer, fileName, decriptionKey, decriptionIV) => 
{
    return new Promise((resolve, reject) => {
        try
        {
            console.log("decryptFileBuffer", fileBuffer, " f**** ", fileName, " f**** ", decriptionKey, " f**** ", decriptionIV)
            decriptionKey = Buffer.from(decriptionKey, 'base64')
            decriptionIV = Buffer.from(decriptionIV, 'base64')
            // console.log("decryptFileBuffer1", decriptionKey, decriptionIV)
            let fileData = fileBuffer
            const decipher = crypto.createDecipheriv('aes-256-cbc', decriptionKey, decriptionIV);
            const decrypted = Buffer.concat([decipher.update(fileData), decipher.final()]);
            return resolve({'result' : true, 'file': decrypted, "encriptionKey" : decriptionKey, "encriptionIV": decriptionIV});
        }
        catch(e)
        {
            console.log(e)
            return resolve({'result' : false, 'file': '', 'error' : e});
        }
    })
}

uniqueFunction.writeLogIntoFile = (data, newFileName, originalFilename, logPath, color) =>
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            // &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            let dummyData = `<div><div style ="color:black;font-weight:bold;font-size: 18px;">${uniqueFunction.getCurrentDateIndia()}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp; ${originalFilename}</div><br/> <div style="width:800px; margin:0 auto;color:${color};">${JSON.stringify(data)}</div></div><br/><br/>`;
            // let dummyData = new Date().toISOString().slice(0, 19).replace('T', ' ') + '\t\t\t\t\t' + "message-id : " + '\t' + originalFilename + '\n' + JSON.stringify(data)
            // let newFileName = fileName + new Date().toISOString().slice(0, 10).replace('T', ' ')
            let newpath = logPath
            try
            {
                if (fs.existsSync(newpath + '/' + newFileName + '.html')) 
                {
                    let filePath = newpath + '/' + newFileName + '.html'
                    // let stats = fs.statSync(filePath)
                    // let fileSizeInBytes = stats.size;
                    // // Convert the file size to kilobytes
                    // let fileSizeInKilobytes = fileSizeInBytes / (1024);
                    // console.log(fileSizeInKilobytes)
                    // if(fileSizeInKilobytes >= 20)
                    if(false)
                    {
                        fs.renameSync(filePath, newpath + '/' + newFileName + '_' + fileNumber + '.html')
                        fileNumber++;
                        fs.writeFileSync(filePath, dummyData);
                    }
                    else
                    {
                        fs.appendFileSync(filePath, dummyData);
                    }
                }
                else
                {
                    // fileNumber = 1
                    fs.writeFileSync(newpath + '/' + newFileName + '.html', dummyData);
                }
                return resolve(true)
            }
            catch (e)
            {
                console.log(e)
                dummyData = dummyData + "<div style ='color:red;'> &nbsp;Catch_1 Error : " + e + "</div>";
                fs.writeFileSync(newpath + '/' + newFileName + '.html', dummyData);
                return resolve(true)
            }
        }
        catch (e)
        {
            console.log(e)
            let dummyData = `<div style ="color:red;">${new Date().toISOString().slice(0, 19).replace('T', ' ')}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; fileName : &nbsp; ${originalFilename} <div>${JSON.stringify(data)}</div></div>` + "<div> &nbsp;Catch_2 Error : " + e + "</div>";
            fs.writeFileSync(logPath + '/' + newFileName + '.html', dummyData);
            return resolve(true)
        }
    })
}

uniqueFunction.getCurrentDateIndia = () => 
{
    try
    {
        const indiaTimeZone = 'Asia/Kolkata';
        const options = {
            timeZone: indiaTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };
    
        const formatter = new Intl.DateTimeFormat('en-GB', options);
        const parts = formatter.formatToParts(new Date());
    
        const date = parts.reduce((acc, part) => {
            if (part.type !== 'literal') {
                acc[part.type] = part.value;
            }
            return acc;
        }, {});
    
        // Get current milliseconds and format it to microseconds (000000 - 999999)
        // const now = new Date();
        // const millis = now.getMilliseconds();
        // const microseconds = String(millis * 1000).padStart(2, '0');
    
        // return `${date.day}-${date.month}-${date.year} ${date.hour}:${date.minute}:${date.second}.${microseconds}`;
        return `${date.day}-${date.month}-${date.year} ${date.hour}:${date.minute}:${date.second}`;
    }
    catch (e)
    {
        return new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
}

uniqueFunction.testSftpConnection = async(host, port, username, password, remoteFilePath) =>
{
    console.log(host, port, username, password, remoteFilePath)
    const sftp = new SftpClient();
    let algorithms = {"kex":["diffie-hellman-group1-sha1","ecdh-sha2-nistp256","ecdh-sha2-nistp384","ecdh-sha2-nistp521","diffie-hellman-group-exchange-sha256","diffie-hellman-group14-sha1"],"cipher":["3des-cbc","aes128-ctr","aes192-ctr","aes256-ctr","aes128-gcm","aes128-gcm@openssh.com","aes256-gcm","aes256-gcm@openssh.com"],"serverHostKey":["ssh-rsa","ecdsa-sha2-nistp256","ecdsa-sha2-nistp384","ecdsa-sha2-nistp521"],"hmac":["hmac-sha2-256","hmac-sha2-512","hmac-sha1"]}
    try 
    {
        await sftp.connect(config);
        await sftp.put(Buffer.from('hello client'), remoteFilePath);
        console.log("Sftp connection successful")
        return({ result: true });
    } 
    catch (err) 
    {
        console.error('SFTP connection or file operation failed:', err);
        console.log("Sftp connection failed")
        await sftp?.end();
        return({ result: false, error: err?.stack || err.message || err });
    }
}

uniqueFunction.uploadSpsnFiles = (fileBuffer, fileName, clientUuid, inputFolder, action = 'client') =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            console.log("File upload to s3 bucket started : ", fileName)
            var base64data = new Buffer.from(fileBuffer);
            // var base64data = fileBuffer;let s3FilePath
            let s3FilePath = ""
            if(action == 'spsn')
            {
                s3FilePath = spsnModule + 'client/' + clientUuid + "/spsn/" + inputFolder + "/" + fileName
            }
            else
            {
                s3FilePath = spsnModule + 'client/' + clientUuid + "/" + inputFolder + "/" + fileName
            }
            s3.putObject(
            {
                'Bucket': bucketName,
                'Key': s3FilePath,
                'Body': base64data
            }, (error,data1) => {
                if(error)
                {
                    console.log(error)
                    return resolve(false)
                }
                else
                {
                    // console.log("arguments", arguments);
                    // console.log('Successfully uploaded', data1)
                    return resolve({"result" : true, "s3FilePath" : s3FilePath})
                }
            })
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}

uniqueFunction.uploadSpsnModulesFiles = (fileBuffer, fileName, inputFolder) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            console.log("File upload to s3 bucket started : ", fileName)
            var base64data = new Buffer.from(fileBuffer);
            // var base64data = fileBuffer;
            let s3FilePath = spsnModule + inputFolder + "/" + fileName
            s3.putObject(
            {
                'Bucket': bucketName,
                'Key': s3FilePath,
                'Body': base64data
            }, (error,data1) => {
                if(error)
                {
                    console.log(error)
                    return resolve(false)
                }
                else
                {
                    // console.log("arguments", arguments);
                    // console.log('Successfully uploaded', data1)
                    return resolve({"result" : true, "s3FilePath" : s3FilePath})
                }
            })
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}

uniqueFunction.deleteSpsnModuleFile = (inputFolderPath) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            const params = {
                Bucket: bucketName,
                Key : inputFolderPath
            };
            s3.deleteObject(params,async (err, data) =>
            {
                if (err) 
                {    
                    return resolve(false)
                } 
                else 
                {
                    return resolve(true)
                }   
            }) 
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}

uniqueFunction.getSpsnModuleFile = (inputFolderPath, fileName, userType, spsnId, apiName, clientUuid,encryptionKey, encryptionIV) =>
{
    return new Promise(async(resolve, reject)=>
    {
        try
        {
            console.log("1", inputFolderPath, fileName, userType, spsnId, apiName, clientUuid,encryptionKey, encryptionIV)
            const params = {
                Bucket: bucketName,
                Key : inputFolderPath
            };
            let data = await s3.getObject(params).promise();
            let saveDataTransactLog = await db.saveDataTransactLog('DN', userType, spsnId, "", data?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileName)
            let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName,encryptionKey, encryptionIV)
            if(decryptedData?.result)
            {
                return resolve({"result" : true, "file" : decryptedData?.file, "mimeType" : mime.getType('.'+ fileName.split('.')[1])})
            }
            else
            {
                return resolve({"result" : false, "error" : "File Not Decrypted"})
            }
        }
        catch(e)
        {
            console.log(e)
            return resolve({"result" : false, "error" : e?.stack})
        }
    })
}




module.exports = uniqueFunction