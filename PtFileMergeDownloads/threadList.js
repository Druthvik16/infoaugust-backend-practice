let axios = require('axios')
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
let db = require('./dbQueryPTDowunload')
let fs = require('fs');
const xlsx = require('xlsx');
let mime = require('mime')
let path = require('path')
let apiUrl = require('../apiUrl')
let api = new apiUrl()
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');
const bucketName = process.env.Bucket_Name;
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const sourceFolder = 'Uploaded_Ledger_Download_File'
const s3BaseFolder = 'OnDemandPTFiles/' + process.env.ENV + '/'


async function startProcessing(data) {
    try {
        data['outputFileName'] = `ptDownload_${data.task.id}_${new Date().toISOString().slice(0, 10).replace('T', ' ')}.xlsx`;

        let sql = `UPDATE pt_ondemand_download_queue SET status = 'in_progress', started_on = ? WHERE id IN (${data.task.id})`
        let update = await db.updatPTDownloadQueueStatus(sql, new Date())
        const clientUuid = data.task.client_uuid
        const month = data.task?.month ? new Date(data.task.month).toISOString().slice(0, 10).replace('T', ' ') : null;
        const clientId = data.task.client_id
        const financialYearId = data.task?.financial_year_id;
        const partnerLocationUuids = JSON.parse(data.task?.partner_location_uuids || []);

        const postingDate = new Date(month);
        if (isNaN(postingDate)) {
            let sql = `UPDATE pt_ondemand_download_queue SET status = 'failed', failed_on = NOW(), remark = 'Invalid date format' WHERE id IN (${data.task.id})`
            let update = await db.updatPTDownloadQueueStatus(sql, new Date())
            parentPort.postMessage({ action: "terminate" })
            return
        }

        const monthNumber = postingDate.getMonth() + 1;
        const year = postingDate.getFullYear();

        let getPTMasterFiles = await db.getPTMasterFiles(clientUuid, partnerLocationUuids, monthNumber, year)
        if (getPTMasterFiles?.length == 0) {
            let sql = `UPDATE pt_ondemand_download_queue SET status = 'failed', failed_on = NOW(), remark = 'No PT files found' WHERE id IN (${data.task.id})`
            let update = await db.updatPTDownloadQueueStatus(sql, new Date())
            parentPort.postMessage({ action: "terminate" })
            return
        }

        createLedgerDocumentXlsx(data, getPTMasterFiles)
    }
    catch (e) {
        console.log(e)
        let sql = `UPDATE pt_ondemand_download_queue SET status = 'pending' WHERE id IN (${data.task.id})`
        let update = await db.updatPTDownloadQueueStatus(sql, new Date())
        parentPort.postMessage({ action: "terminate" })
        return 
    }
}
async function createLedgerDocumentXlsx(masterEntry, getPTMasterFiles) {
    try {
        const outputFileName = masterEntry?.outputFileName
        const id = masterEntry?.task.id
        const clientUuid = masterEntry.task.client_uuid

        const createFileResponse = await createFile(masterEntry, getPTMasterFiles)

         if (!createFileResponse?.result) {
            let sql = `UPDATE pt_ondemand_download_queue SET status = 'failed', failed_on = NOW(), remark = '${createFileResponse?.message}' WHERE id IN (${data.task.id})`
            let update = await db.updatPTDownloadQueueStatus(sql, new Date())
            parentPort.postMessage({ action: "terminate" })
            return;
        }

        const encryptedData = await uniqueFunction.encryptFileBuffer(createFileResponse?.filePath, outputFileName, null, null, 'file')
        const newFilePath = s3BaseFolder + 'client/' + clientUuid + "/" + outputFileName;

        const uploadParams = {
            Bucket: bucketName,
            Key: newFilePath,
            Body: encryptedData?.file,
            ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        console.log("uploadParams1 ", uploadParams);
        await s3.upload(uploadParams).promise();
        let updateMaster = await db.updatePTDownloadQueue(id, 'completed', outputFileName, newFilePath, encryptedData?.encriptionKey, encryptedData?.encriptionIV, createFileResponse?.message || '')
        parentPort.postMessage({ action: "terminate" })
    }
    catch (err) {
        console.log(err)
        let sql = `UPDATE pt_ondemand_download_queue SET status = 'failed', failed_on = NOW(), remark = '${err?.stack}' WHERE id IN (${masterEntry.task.id})`
        let update = await db.updatPTDownloadQueueStatus(sql, new Date())
        parentPort.postMessage({ action: "terminate" })
        return
    }
}

async function createFile(data, rows) {
    const outputDir = path.join(__dirname, '/generatedPTFiles');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    console.log(outputDir, data.task)

    const outputFilePath = path.join(
        outputDir,
        data.outputFileName
    );

    let workbook;
    let worksheet;
    let headerWritten = false;
    let rowPointer = 0;

    for (const file of rows) {

        try {

            const s3Object = await s3.getObject({
                Bucket: bucketName,
                Key: file.filePath
            }).promise();

            const decryptedData = await uniqueFunction.decryptFileBuffer(
                s3Object.Body,
                file.fileName,
                file.encryption_key,
                file.encryption_iv
            );

            if (!decryptedData?.result) continue;

            const sourceWorkbook = xlsx.read(decryptedData.file, { type: 'buffer' });

            const sheetName = sourceWorkbook.SheetNames[0];
            if (!sheetName) continue;

            const worksheetSource = sourceWorkbook.Sheets[sheetName];

            const jsonData = xlsx.utils.sheet_to_json(worksheetSource, {
                header: 1,
                raw: true,
                defval: ''
            });

            if (!jsonData.length) continue;

            let rowsToWrite = [];

            jsonData.forEach((row, index) => {
                if (index === 0) {

                    if (!headerWritten) {
                        rowsToWrite.push(row);
                        headerWritten = true;
                    }

                } else {

                    if (row.some(col => col !== '')) {
                        rowsToWrite.push(row);
                    }
                }
            });

            if (!rowsToWrite.length) continue;

            if (!workbook) {
                workbook = xlsx.utils.book_new();
                worksheet = xlsx.utils.aoa_to_sheet(rowsToWrite);

                xlsx.utils.book_append_sheet(workbook, worksheet, 'Combined');

                rowPointer = rowsToWrite.length;
            } else {
                xlsx.utils.sheet_add_aoa(
                    worksheet,
                    rowsToWrite.slice(headerWritten ? 1 : 0),
                    { origin: rowPointer }
                );
                rowPointer += rowsToWrite.length - 1;
            }
        } catch (err) {
            console.error(`File skipped: ${file.fileName}`, err.message);
            continue;
        }
    }

    if (!workbook) {
        return {
            result: false,
            message: 'No valid data found'
        };
    }

    xlsx.writeFile(workbook, outputFilePath);

    return {
        result: true,
        message: 'File created successfully',
        filePath: outputFilePath
    };
}

parentPort.on('message', (message) => {
    console.log(isMainThread)
    let results = startProcessing(message)
    console.log("response ", results)
    if (results) {
        console.log("ssssss")
    }
})
parentPort.on('close', (message) => {
    console.log("port close", message)
    parentPort.postMessage("close")
})
parentPort.on('messageerror', (message) => {
    console.log("port messageerror", message)
})