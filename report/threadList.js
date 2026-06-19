let axios = require('axios')
const archiver = require("archiver");
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
let db = require('./dbQueryReport')
let fs = require('fs');
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const xlsx = require('xlsx');
let mime = require('mime')
let path = require('path')
let apiUrl = require('../apiUrl')
let api = new apiUrl()
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let fileName = 'reportMailResponse-';
let fileNumber = 1;
// let outputFileName = './Consolidate_Document_Process_Report.xlsx'
let outputFileName = 'Consolidate_Document_Process_Report'
// Consolidate_Document_Process_Report-FromDate-TODate
const bucketName = process.env.Bucket_Name;

let commonHeaders = ['Sno', 'Received Date', 'PostingDate', 'Store Code', 'Store Name', 'Document Type'];

async function startProcessing(data) {
    try {

        data['rawOutputFileName'] = `${outputFileName}${data.task?.fromDate ? '-' + new Date(data.task.fromDate).toISOString().slice(0, 10).replace('T', ' ') : ''}${data.task?.toDate ? '-' + new Date(data.task.toDate).toISOString().slice(0, 10).replace('T', ' ') : ''}.xlsx`;

        data['outputFileName'] = `./${data.rawOutputFileName}`;

        let sql = `UPDATE report_processing_log SET status = 'Processing', started_on = ? WHERE id IN (${data.task.id})`
        let update = await db.updateMailQueueStatus(sql, new Date())
        let clientUuid = data.task.clientUuid
        let fromDate = data.task?.fromDate ? new Date(data.task.fromDate).toISOString().slice(0, 10).replace('T', ' ') : null;
        let toDate = data.task?.toDate ? new Date(data.task.toDate).toISOString().slice(0, 10).replace('T', ' ') : null;
        let partnerLocationUuid = ''
        let action = ''
        let creditNoteSummarryReport = await db.getCreditNoteSummaries(partnerLocationUuid, clientUuid, fromDate, toDate, action)
        let invoiceSummarryReport = await db.getInvoiceSummaries(partnerLocationUuid, clientUuid, fromDate, toDate, action)
        let ledgerSummarryReport = await db.getPartnerLedgers(partnerLocationUuid, clientUuid, fromDate, toDate, action)
        let monthlyTransactionReport = await db.getPartnerMonthlyTransactions(partnerLocationUuid, clientUuid, fromDate, toDate, action)
        let partnerOnboardings = await db.getPartnerOnboardings(clientUuid, fromDate, toDate)
        let processedFiles = partnerOnboardings.filter(file => file.completedOn)
        let failedFiles = partnerOnboardings.filter(file => file.failedOn)
        let processedFileList = await getPartnerOnboardingFiles(processedFiles, 0, processedFiles?.length, [])
        let failedFileList = await getPartnerOnboardingFiles(failedFiles, 0, failedFiles?.length, [])
        let processedSheet = ''
        let failedSheet = ''
        if(processedFileList)
        {
            processedFileList = processedFileList?.files
            processedSheet = await mergeSheetProcesseds(processedFileList, data)
        }
        if(failedFileList)
        {
            failedFileList = failedFileList?.files
            failedSheet = await mergeSheetFailed(failedFileList, data)
        }
        data['creditNoteSummarryReport'] = creditNoteSummarryReport
        data['invoiceSummarryReport'] = invoiceSummarryReport
        data['ledgerSummarryReport'] = ledgerSummarryReport
        data['monthlyTransactionReport'] = monthlyTransactionReport
        createXlsxFile(data, processedSheet, failedSheet)
    }
    catch (e) {
        console.log(e)
        let sql = `UPDATE report_processing_log SET status = 'Pending' WHERE id IN (${data.task.id})`
        let update = await db.updateMailQueueStatus(sql, new Date())
        parentPort.postMessage({ action: "terminate" })
    }
}


async function createXlsxFile(data1, processedSheet, failedSheet) {
    try {
        const sheetData = [
            {
                name: 'Credit Note Process Report',
                extraColumn: ['Bill /RefNo', 'PDF Status']
            },
            {
                name: 'Invoice Document Process Report',
                extraColumn: ['Bill /RefNo', 'PDF Status', 'PT File Status']
            },
            {
                name: 'Ledger Document Process Report',
                extraColumn: ['Month/Period', 'Excel Status']
            },
            {
                name: 'Monthly Transact Process Report',
                extraColumn: ['From Date', 'To Date', 'Excel Status']
            }
        ];
        const workbook = xlsx.utils.book_new();
        sheetData.forEach(sheet => {
            let headersToWriteInFile = commonHeaders.slice()
            headersToWriteInFile.push(...sheet.extraColumn);
            const { data: sheetData, headers } = createSheetData(sheet.name, headersToWriteInFile, data1);
            const worksheet = xlsx.utils.aoa_to_sheet(sheetData);

            // Add the worksheet to the workbook
            xlsx.utils.book_append_sheet(workbook, worksheet, sheet.name);

            // Merge cells for the title row and sheet name row
            worksheet['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }
            ];
        });  
        const partnerSheet = xlsx.utils.aoa_to_sheet(processedSheet); // Write data into the new sheet
        xlsx.utils.book_append_sheet(workbook, partnerSheet, 'Customer');

        const failedPartnerSheet = xlsx.utils.aoa_to_sheet(failedSheet); // Write data into the new sheet
        xlsx.utils.book_append_sheet(workbook, failedPartnerSheet, 'Format Error Customers');

        xlsx.writeFile(workbook, data1.outputFileName);
        let result = await mailFiles(data1)
        if (result) {
            uniqueFunction.removeFileFromDirectory(data1.outputFileName)
            let sql = `UPDATE report_processing_log SET status = 'Sent', sent_on = ? WHERE id IN (${data1.task.id})`
            let update = await db.updateMailQueueStatus(sql, new Date())
            parentPort.postMessage({ action: "terminate" })
        }
        else {
            let sql = `UPDATE report_processing_log SET status = 'Pending' WHERE id IN (${data1.task.id})`
            let update = await db.updateMailQueueStatus(sql, new Date())
            parentPort.postMessage({ action: "terminate" })
        }
    }
    catch (e) {
        console.log(e)
        let sql = `UPDATE report_processing_log SET status = 'Pending' WHERE id IN (${data1.task.id})`
        let update = await db.updateMailQueueStatus(sql, new Date())
        parentPort.postMessage({ action: "terminate" })
    }
}

const createSheetData = (sheetName, headers, data) => {
    let sheetData = []
    const tempData = [
        ['InfoAugust Application Document Processing Report'],
        ['From Date', data.task?.fromDate ? format(data.task.fromDate, 'dd-MM-yyyy', { locale: enIN }) : '', 'To Date', data.task?.toDate ? format(data.task.toDate, 'dd-MM-yyyy', { locale: enIN }) : ''],
        [sheetName],
        headers
    ];

    if (sheetName?.toLowerCase().includes('credit')) {
        // 'Sno', 'Received Date', 'PostingDate', 'Store Code', 'Store Name', 'Document Type', 'Bill /RefNo'
        // [1, '2023-01-01', '2023-01-01', 'SC001', 'Store 1', 'Type A', 'Ref001', 'Status 1'],
        sheetData = data.creditNoteSummarryReport
        sheetData.forEach((ele, i) => {
            tempData.push([i + 1, format(ele.uploadedOn, 'dd-MM-yyyy', { locale: enIN }), format(ele.postingDate, 'dd-MM-yyyy', { locale: enIN }), ele.partnerLocationCode, ele.partnerLocationStoreName, ele.documentName, ele.billNoOrRefNo?.length > 0 ? ele.billNoOrRefNo : ele.documentNumber, ele.isPdfExist == 0 ? 'Not Found' : 'Uploaded'])
        })
    }
    else if (sheetName?.toLowerCase().includes('invoice')) {
        sheetData = data.invoiceSummarryReport
        sheetData.forEach((ele, i) => {
            tempData.push([i + 1, format(ele.uploadedOn, 'dd-MM-yyyy', { locale: enIN }), format(ele.postingDate, 'dd-MM-yyyy', { locale: enIN }), ele.partnerLocationCode, ele.partnerLocationStoreName, ele.documentName, ele.billNoOrRefNo?.length > 0 ? ele.billNoOrRefNo : ele.documentNumber, ele.isPdfExist == 0 ? 'Not Found' : 'Uploaded', ele.isPtExist == 0 ? 'Not Found' : 'Uploaded'])
        })
    }
    else if (sheetName?.toLowerCase().includes('ledger')) {
        sheetData = data.ledgerSummarryReport
        sheetData.forEach((ele, i) => {
            tempData.push([i + 1, format(ele.uploadedOn, 'dd-MM-yyyy', { locale: enIN }), format(ele.postingDate, 'dd-MM-yyyy', { locale: enIN }), ele.partnerLocationCode, ele.partnerLocationStoreName, ele.documentName, ele.monthPeriodNarration, ele.isFileExist == 0 ? 'Not Found' : 'Uploaded'])
        })
    }
    else if (sheetName?.toLowerCase().includes('monthly')) {
        sheetData = data.monthlyTransactionReport
        sheetData.forEach((ele, i) => {
            tempData.push([i + 1, format(ele.uploadedOn, 'dd-MM-yyyy', { locale: enIN }), ele?.postingDate ? format(ele?.postingDate, 'dd-MM-yyyy', { locale: enIN }) : '', ele.partnerLocationCode, ele.partnerLocationStoreName, ele.documentName, format(ele.fromDate, 'dd-MM-yyyy', { locale: enIN }), format(ele.toDate, 'dd-MM-yyyy', { locale: enIN }), ele.isFileExist == 0 ? 'Not Found' : 'Uploaded'])
        })
    }

    // const date = format(currentDate, 'dd/MM/yyyy', { locale: enIN })

    return { data: tempData, headers: headers };
};

async function mailFiles(masterData) {
    return new Promise(async (resolve, reject) => {
        let file = fs.readFileSync(masterData.outputFileName)

        let zipFileName = masterData.rawOutputFileName?.split('.')[0] + '.zip'

        const zipBuffer = await createZipBuffer(masterData.rawOutputFileName, file)

        let attachment = [{
            content: zipBuffer.toString('base64'),         //file.toString('base64'),
            type:   mime.getType(zipFileName),       //mime.getType(masterData.outputFileName),
            name:   zipFileName                        //masterData.outputFileName
        }]
        let dataToSend = {
            "to": JSON.parse(masterData?.task?.mailTo),
            "subject": `Info August Customer Data Processing Report_${new Date().toISOString().slice(0, 10).replace('T', ' ')}`,
            "text": "<div>Hello,</div><br/><br/><div>Please find attachment of consolidate report</div>",
            "rawFiles": attachment
        }
        // console.log(dataToSend)
        axios.post(api.serviceApi + api.common + api.sendMail, dataToSend).then((sendMail) => {
            // console.log(sendMail)
            if (sendMail?.data) {
                console.log("mail sent")
                return resolve(true)
            }
            else {
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
async function createZipBuffer(fileName, fileBuffer) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const zipBuffers = [];

    archive.on("data", (chunk) => zipBuffers.push(chunk));
    archive.on("error", (err) => reject(err));
    archive.on("end", () => resolve(Buffer.concat(zipBuffers)));

    archive.append(fileBuffer, { name: fileName });
    archive.finalize();
  });
}

async function getPartnerOnboardingFiles(fileList, start, end, files) {
        try {
            if(start < end)
            {
                let file = fileList[start]
                let response = await getFiles(file)
                if(response)
                {
                    files.push(response.file)
                }
                start++;
                return getPartnerOnboardingFiles(fileList, start, end, files)
            }
            else
            {
                // console.log("\n---------------------------------------------Retun------------------------------------------", files)
                return { result : true, fileList : fileList, start : start, end : end, 'files' : files }
            }
        }
        catch (err) {
            console.log(err)
            return false
        }
}

async function getFiles(file) {
    return new Promise(async (resolve, reject) => {
        try {
            let encriptionKey;
            let encriptionIV;
            let apiName = '/report/getReports'
            let folderPath = file?.processedFilePath?.length > 0 ? file.processedFilePath : file?.failedFilePath
            const params = {
                Bucket: bucketName,
                Key: folderPath
            };
            let fileName = file.fileName
            encriptionKey = file.encryptionKey
            encriptionIV = file.encryptionIV
            s3.getObject(params, async function (err, data) {
                if (err) {
                    console.error('Error list:', err);
                   return resolve(false);
                }
                else {
                    let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', null, null, data?.ContentLength, apiName, 'S3', new Date(), folderPath.split('/')[1], fileName)
                    let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName, encriptionKey, encriptionIV)
                    if (decryptedData?.result) {
                        // let base64data = "data:" + mimeType[0].mime + ";base64," + decryptedData?.file.toString('base64');
                        file['fileBuffer'] = decryptedData?.file
                        return resolve({ 'result' : true, 'file' : file})
                       
                    }
                    else {
                       return resolve(false);
                    }
                }
            })


        }
        catch (e) {
            console.log(e)
            return resolve(false);
        }
    })
}

async function mergeSheetProcesseds(fileBuffers, data) {
    //   let allData = []; // Array to hold combined data
    
    //   fileBuffers?.forEach((buffer, index) => {
    //     // Read each buffer as a workbook
    //     const workbook = xlsx.read(buffer?.fileBuffer, { type: 'buffer' });
    //     const sheet = workbook.Sheets['Locations']; // Assuming the data is in 'Sheet1'
    //     const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Read as JSON with header row
    
    //     if (index === 0) {
    //         // console.log(sheetData)
    //       // For the first file, include the header row 
    //         allData = allData.concat([])
    //         allData = allData.concat(['InfoAugust Application Partner Onboarding Report'])
    //         allData = allData.concat(['From Date', data.task?.fromDate ? format(data.task.fromDate, 'dd-MM-yyyy', { locale: enIN }) : '', 'To Date', data.task?.toDate ? format(data.task.toDate, 'dd-MM-yyyy', { locale: enIN }) : '']);
    //         allData = allData.concat(['Partner Onboarding']);
    //         allData = allData.concat(sheetData);
    //     } else {
    //       // For subsequent files, skip the header row (first row)
    //       allData = allData.concat(sheetData.slice(1));
    //     }
    //   });
    
    // //   // Create a new workbook
    // //   const newWorkbook = xlsx.utils.book_new();
    
    // //   // Add the merged data into a new sheet called 'Partner'
    // //   const newSheet = xlsx.utils.aoa_to_sheet(allData);
    // //   xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Partner');
    
    //   // Write the new workbook to a buffer or file
    // //   const outputBuffer = xlsx.write(newWorkbook, { type: 'buffer' });
    // //   console.log(!Array.isArray(allData), !Array.isArray(allData[0]))
    // //   console.log(JSON.parse(allData))
    //   return allData; // You can also save this to a file if needed

let allData = []; // Array to hold combined data

fileBuffers?.forEach((buffer, index) => {
  const workbook = xlsx.read(buffer?.fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets['Locations']; // Assuming the data is in 'Locations'
  let sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Read as array of arrays

  if (index === 0) {
    allData.push(['InfoAugust Application Partner Onboarding Report']);
    allData.push(['From Date', data.task?.fromDate ? format(data.task.fromDate, 'dd-MM-yyyy', { locale: enIN }) : '', 'To Date', data.task?.toDate ? format(data.task.toDate, 'dd-MM-yyyy', { locale: enIN }) : '']);
    allData.push(['Partner Onboarding']);
    sheetData[0].push('Uploaded On');
  }
    // sheetData = sheetData.map(row => ({
    //     ...row,
    //     UploadedOn: buffer.uploadedOn
    // }));

//   sheetData = sheetData.map(row => [...row, buffer.uploadedOn]);


 // Get the header row
  let headerRow = sheetData[0];

  // Check if "Remark" column exists
  const remarkIndex = headerRow.indexOf('Remark');

  // Add "UploadedOn" header only if it's not already present
  if (!headerRow.includes('Uploaded On')) {
    headerRow.push('Uploaded On');
  }

  // Append "UploadedOn" value to each row while keeping "Remark" intact
  sheetData = sheetData.map((row, i) => {
    if (i === 0) return row; // Keep header row unchanged

    let newRow = [...row];

    if (remarkIndex !== -1) {
      // Ensure "UploadedOn" is added at the end, not replacing "Remark"
      newRow[remarkIndex + 1] = buffer.uploadedOn;
    } else {
      // If no "Remark" column, just append "UploadedOn"
      newRow.push(buffer.uploadedOn);
    }

    return newRow;
  });

// sheetData = sheetData.map((row, i) => i === 0 ? row : [...row,buffer.uploadedOn]);
  // Add sheet data, ensuring it's an array of arrays
  allData = allData.concat(sheetData);
});

return allData; // Return array of arrays
}


async function mergeSheetFailed(fileBuffers, data) {
    // let allData = []; // Array to hold combined data
  
    // fileBuffers.forEach((buffer, index) => {
    //   // Read each buffer as a workbook
    //   const workbook = xlsx.read(buffer, { type: 'buffer' });
    //   const firstSheetName = workbook.SheetNames[0]; // This gives the name of the 0th sheet
    //   const sheet = workbook.Sheets[firstSheetName]; // Access the sheet by its name
    //   const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Read as JSON with header row
  
    //   if (index === 0) {
    //     // For the first file, include the header row 
    //       allData = allData.concat(['InfoAugust Application Partner Onboarding Report'])
    //       allData = allData.concat(['From Date', data.task?.fromDate ? format(data.task.fromDate, 'dd-MM-yyyy', { locale: enIN }) : '', 'To Date', data.task?.toDate ? format(data.task.toDate, 'dd-MM-yyyy', { locale: enIN }) : '']);
    //       allData = allData.concat(['Failed Partner Onboarding']);
    //       allData = allData.concat(sheetData);
    //   } else {
    //     // For subsequent files, skip the header row (first row)
    //     allData = allData.concat([]);
    //     allData = allData.concat([]);
    //     allData = allData.concat(['Remark: ', buffer.remark]);
    //     allData = allData.concat([]);
    //     allData = allData.concat(sheetData);
    //   }
    // });
  
    // // Create a new workbook
    // // const newWorkbook = xlsx.utils.book_new();
  
    // // // Add the merged data into a new sheet called 'Partner'
    // // const newSheet = xlsx.utils.aoa_to_sheet(allData);
    // // xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Failed Partner');
  
    // // // Write the new workbook to a buffer or file
    // // const outputBuffer = xlsx.write(newWorkbook, { type: 'buffer' });
  
    // return allData; // You can also save this to a file if needed
    let allData = [];

    fileBuffers.forEach((buffer, index) => {
      const workbook = xlsx.read(buffer?.fileBuffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Use the first sheet
      const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Read as array of arrays
  
      if (index === 0) {
        allData.push(['InfoAugust Application Partner Onboarding Report']);
        allData.push(['From Date', data.task?.fromDate ? format(data.task.fromDate, 'dd-MM-yyyy', { locale: enIN }) : '', 'To Date', data.task?.toDate ? format(data.task.toDate, 'dd-MM-yyyy', { locale: enIN }) : '']);
        allData.push(['Failed Partner Onboarding']);
      }
  
      allData.push(['Remark: ', buffer.remark, 'Uploaded On :', buffer.uploadedOn]);
      // Add sheet data, ensuring it's an array of arrays
      allData = allData.concat(sheetData);
      allData.push([]);
      allData.push([]);
    });
  
    return allData; // Return array of arrays
  }





parentPort.on('message', (message) => {
    console.log(isMainThread)
    let results = startProcessing(message)
    console.log("response ", results)
    if (results) {
        console.log("ssssss")
        //    parentPort.postMessage(true)
    }
})
parentPort.on('close', (message) => {
    console.log("port close", message)
    parentPort.postMessage("close")
})
parentPort.on('messageerror', (message) => {
    console.log("port messageerror", message)
})