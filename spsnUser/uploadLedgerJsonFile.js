let db = require('./dbQuerySpsnUser')
const alasql = require('alasql')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let fs = require('fs')
const path = require('path');
const xlsx = require('xlsx');
const mime = require('mime');
let axios = require('axios')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const sourceFolder = 'Uploaded_Ledger_Json_Raw_File'
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
// const spsnModule = 'spsnModule-dev/' //'spsnModule/'
const spsnModule = uniqueFunction.spsnModule // 'spsnModule/'
let spsnLedgerDownload = {}
const apiName = '/spsn/uploadLedgerDownloadMaster'

spsnLedgerDownload.uploadFile = async (fileObj, clientUuid, action, fyId, masterId, uploadedDocId, fyName) => 
{
    return new Promise(async (resolve, reject) => 
    {
        try 
        {
            const client = await db.getClient(clientUuid)
            const clientId = client[0]?.id
            const uploadFolder = path.join(__dirname, '../spsnLedgerDownloadFile');
            if (!fs.existsSync(uploadFolder)) {
                fs.mkdirSync(uploadFolder, { recursive: true });
            }
            const filePath = path.join(uploadFolder, fileObj.originalFilename || 'uploaded_file.xlsx');
            fs.copyFileSync(fileObj.filepath, filePath);
            const workbook = xlsx.readFile(filePath);
            const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            jsonData.forEach(dt => {
                dt['financialYearId'] = fyId;
                dt['clientUploadedMasterId'] = masterId;
                dt['uploadedDocId'] = uploadedDocId;
                dt['createdOn'] = new Date().toISOString().slice(0, 10);
            })
            uniqueFunction.removeFileFromDirectory(filePath);
            const masterEntry1 = await db.getLedgerMaster(clientId, fyId);
            // console.log(masterEntry1)
            if (masterEntry1?.length > 0) 
            {
                const masterEntry = masterEntry1[0] 
                const params = {
                    Bucket: bucketName,
                    Key: masterEntry.filePath,
                };
                // console.log("params ",params);                
                const s3File = await s3.getObject(params).promise();
                let saveDataTransactLog = await db.saveDataTransactLog('DN', 'SU', 0, 0, s3File?.ContentLength, apiName, 'S3', new Date(), clientUuid, fileObj.originalFilename)
                const decryptedData = await uniqueFunction.decryptFileBuffer(s3File?.Body, masterEntry?.fileName, masterEntry?.encryptionKey, masterEntry?.encryptionIV)
                let existingData = JSON.parse(decryptedData?.file.toString());
                console.log(existingData?.length);
                // const existingJsonData = JSON.parse(decryptedData?.file.toString('utf-8'));
                // if(action == 'update')
                // {
                //     console.log(action)
                //     const deduplicatedJsonData = alasql(`
                //         SELECT *
                //         FROM ?
                //         GROUP BY Customer, \`Posting Date\`
                //     `, [jsonData]);

                //     const deduplicatedExistingData = alasql(`
                //         SELECT *
                //         FROM ?
                //         GROUP BY Customer, \`Posting Date\`
                //     `, [existingData]);

                //                             let selectSql = `
                //                                 SELECT 
                //                                     existingTable.*,
                //                                     COALESCE(jsonData.\`Debit Amount\`, existingTable.\`Debit Amount\`) AS \`Debit Amount\`,
                //                                     COALESCE(jsonData.\`Credit Amount\`, existingTable.\`Credit Amount\`) AS \`Credit Amount\`,
                //                                     COALESCE(jsonData.\`Text\`, existingTable.\`Text\`) AS \`Text\`,
                //                                     COALESCE(jsonData.\`Bill No./Ref. No.\`, existingTable.\`Bill No./Ref. No.\`) AS \`Bill No./Ref. No.\`,
                //                                     COALESCE(jsonData.\`Doc./Inv Date\`, existingTable.\`Doc./Inv Date\`) AS \`Doc./Inv Date\`,
                //                                     COALESCE(jsonData.\`Balance\`, existingTable.\`Balance\`) AS \`Balance\`
                //                                 FROM ? existingTable
                //                                 LEFT JOIN ? jsonData 
                //                                 ON existingTable.Customer = jsonData.Customer 
                //                                 AND existingTable.\`Posting Date\` = jsonData.\`Posting Date\`;
                //                             `;

                //         const updatedData = alasql(selectSql, [deduplicatedExistingData, deduplicatedJsonData]);
                //                             console.log(updatedData?.length, existingData?.length)
                //                             existingData = updatedData
                // }
                // else
                // {
                    existingData.push(...jsonData); 
                // }               
                const updatedBuffer = Buffer.from(JSON.stringify(existingData));
                const encryptedData = await uniqueFunction.encryptFileBuffer(updatedBuffer, masterEntry?.fileName, masterEntry?.encryptionKey, masterEntry?.encryptionIV, 'Buffer')
                const uploadParams = {
                    Bucket: bucketName,
                    Key: masterEntry.filePath,
                    Body: encryptedData?.file,
                    ContentType: 'application/json',
                };
                // console.log("uploadParams1 ",uploadParams);
                await s3.upload(uploadParams).promise();
                let updateMaster = await db.updateLedgerDownloadMaster(masterEntry?.id, encryptedData?.encriptionKey, encryptedData?.encriptionIV, fyId)    
                return resolve(true);
            } 
            else 
            {
                const newFileName = `ledger_${fyName}.json`   
                const updatedBuffer = Buffer.from(JSON.stringify(jsonData));    
                const encryptedData = await uniqueFunction.encryptFileBuffer(updatedBuffer, newFileName, null, null, 'Buffer')           
                const newFilePath = spsnModule + 'client/' + clientUuid + "/" + sourceFolder + "/" + newFileName
                const uploadParams = {
                    Bucket: bucketName,
                    Key: newFilePath,
                    Body: encryptedData?.file,
                    ContentType: 'application/json',
                };
                // console.log("uploadParams2 ",uploadParams);
                await s3.upload(uploadParams).promise();

                let saveMaster = await db.saveLedgerDownloadMaster(newFileName, newFilePath, clientId, encryptedData?.encriptionKey, encryptedData?.encriptionIV, fyId) 
    
                return resolve(true);
            }
        }
        catch (err) 
        {
            console.log(err);
            return resolve(false);
        }
    })
}


module.exports = spsnLedgerDownload;







// const db = require('./dbQuerySpsnUser');
// const alasql = require('alasql');
// const errorCode = require('../common/error/errorCode');
// const apiUrl = require('../apiUrl');
// const fs = require('fs');
// const path = require('path');
// const xlsx = require('xlsx');
// const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
// const os = require('os');
// const { pipeline } = require('stream');
// const s3 = require('../awsS3BucketConfig/s3BucketConnection');
// const bucketName = process.env.Bucket_Name;
// const spsnModule = 'spsnModule-dev/'; // 'spsnModule/'
// const sourceFolder = 'Uploaded_Ledger_Json_Raw_File';

// let spsnLedgerDownload = {};
// const apiName = '/spsn/uploadLedgerDownloadMaster';

// spsnLedgerDownload.uploadFile = async (fileObj, clientUuid, action) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // Fetch client information
//       const client = await db.getClient(clientUuid);
//       const clientId = client[0]?.id;

//       // Create temporary upload folder if it doesn't exist
//       const uploadFolder = path.join(os.tmpdir(), 'spsnLedgerTemp');
//       if (!fs.existsSync(uploadFolder)) {
//         fs.mkdirSync(uploadFolder, { recursive: true });
//       }

//       // Copy file to temporary directory
//       const tempFilePath = path.join(uploadFolder, fileObj.originalFilename || 'uploaded_file.xlsx');
//       fs.copyFileSync(fileObj.filepath, tempFilePath);

//       // Process the Excel file using streams to reduce memory usage
//       const workbook = xlsx.readFile(tempFilePath, { dense: true });
//       const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

//       // Remove the temporary file
//       uniqueFunction.removeFileFromDirectory(tempFilePath);

//       // Check if master entry exists
//       const masterEntry1 = await db.getLedgerMaster(clientId);
//       if (masterEntry1?.length > 0) {
//         const masterEntry = masterEntry1[0];
//         const params = { Bucket: bucketName, Key: masterEntry.filePath };

//         // Stream data from S3
//         const s3Stream = s3.getObject(params).createReadStream();
//         const decryptedFilePath = path.join(uploadFolder, 'decrypted_ledger.json');

//         await new Promise((resolveDecrypt, rejectDecrypt) => {
//           pipeline(
//             s3Stream,
//             fs.createWriteStream(decryptedFilePath),
//             (err) => (err ? rejectDecrypt(err) : resolveDecrypt())
//           );
//         });

//         // Decrypt and process existing data
//         const decryptedBuffer = fs.readFileSync(decryptedFilePath);
//         const decryptedData = await uniqueFunction.decryptFileBuffer(
//           decryptedBuffer,
//           masterEntry.fileName,
//           masterEntry.encryptionKey,
//           masterEntry.encryptionIV
//         );
//         const existingData = JSON.parse(decryptedData.file.toString());

//         // Append new data to existing data
//         const mergedData = [...existingData, ...jsonData];

//         // Encrypt and upload the updated data back to S3
//         const updatedBuffer = Buffer.from(JSON.stringify(mergedData));
//         const encryptedData = await uniqueFunction.encryptFileBuffer(
//           updatedBuffer,
//           masterEntry.fileName,
//           masterEntry.encryptionKey,
//           masterEntry.encryptionIV,
//           'Buffer'
//         );

//         const uploadParams = {
//           Bucket: bucketName,
//           Key: masterEntry.filePath,
//           Body: encryptedData.file,
//           ContentType: 'application/json',
//         };

//         await s3.upload(uploadParams).promise();
//         await db.updateLedgerDownloadMaster(
//           masterEntry.id,
//           encryptedData.encriptionKey,
//           encryptedData.encriptionIV
//         );

//         return resolve(true);
//       } else {
//         // No master entry, create a new one
//         const newFileName = `ledger.json`;
//         const updatedBuffer = Buffer.from(JSON.stringify(jsonData));
//         const encryptedData = await uniqueFunction.encryptFileBuffer(
//           updatedBuffer,
//           newFileName,
//           null,
//           null,
//           'Buffer'
//         );

//         const newFilePath = `${spsnModule}client/${clientUuid}/${sourceFolder}/${newFileName}`;
//         const uploadParams = {
//           Bucket: bucketName,
//           Key: newFilePath,
//           Body: encryptedData.file,
//           ContentType: 'application/json',
//         };

//         await s3.upload(uploadParams).promise();
//         await db.saveLedgerDownloadMaster(
//           newFileName,
//           newFilePath,
//           clientId,
//           encryptedData.encriptionKey,
//           encryptedData.encriptionIV
//         );

//         return resolve(true);
//       }
//     } catch (err) {
//       console.error('Error in uploadFile:', err);
//       return resolve(false);
//     } finally {
//       // Clean up temporary files
//       if (fs.existsSync(uploadFolder)) {
//         fs.rmSync(uploadFolder, { recursive: true, force: true });
//       }
//     }
//   });
// };

// module.exports = spsnLedgerDownload;
