const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
let db = require('./dbQueryDocumentCleanup')
const bucketName = process.env.Bucket_Name;
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');


async function startProcessing(data) {
    try {
        // let sql = `UPDATE document_cleanup_job_detail SET status = 'Processing', process_started_on = NOW() WHERE id IN (${data.task.detail_id})`
        // let update = await db.updateDocumentCleanupQueueStatus(sql, new Date())
        // console.log(data, update)
        // let getClientUploadedDocDetail = await db.getClientUploadedDocDetail(data.task.matched_document_detail_id)
        // if(getClientUploadedDocDetail?.length == 0)
        // {
        //     let sql = `UPDATE document_cleanup_job_detail  SET status = 'Failed', failed_on = NOW(), thread_remark = 'Not found in client uploaded document detail' WHERE id IN (${data.task.detail_id})`
        //     let update = await db.updateDocumentCleanupQueueStatus(sql, new Date())
        //     const checkAndMarkJobAsComplete = await db.checkAndMarkJobAsComplete(data.task.id)
        //     parentPort.postMessage({ action: "terminate" })
        //     return;
        // }
        const deleteDetailFromClientUploadedDoc = await db.deleteClientUploadedDetail(data.task.matched_document_detail_id);

        console.log(" delete log ",deleteDetailFromClientUploadedDoc)

        // if(deleteDetailFromClientUploadedDoc?.affectedRows > 0)
        // {
        let sql1 = `UPDATE document_cleanup_job_detail SET status = 'Processed', completed_on = NOW() WHERE id IN (${data.task.detail_id})`
        let update1 = await db.updateDocumentCleanupQueueStatus(sql1, new Date());
        console.log("update1", update1)
            // Delete s3 file
        // }
        // else
        // {
        //     let sql = `UPDATE document_cleanup_job_detail  SET status = 'Failed', failed_on = NOW(), thread_remark = 'Database error' WHERE id IN (${data.task.detail_id})`
        //     let update = await db.updateDocumentCleanupQueueStatus(sql, new Date())
        //     const checkAndMarkJobAsComplete = await db.checkAndMarkJobAsComplete(data.task.id)
        // }
        const checkAndMarkJobAsComplete = await db.checkAndMarkJobAsComplete(data.task.id)
        parentPort.postMessage({ action: "terminate" })
        console.log("terminate")
        return;
    }
    catch (e) {
        console.log(e)
        let sql = `UPDATE document_cleanup_job_detail SET status = 'Pending', thread_remark = ${uniqueFunction.manageSpecialCharacter(e?.stack || e?.message)} WHERE id IN (${data.task.detail_id})`
        let update = await db.updateDocumentCleanupQueueStatus(sql, new Date())
        const checkAndMarkJobAsComplete = await db.checkAndMarkJobAsComplete(data.task.id)
        parentPort.postMessage({ action: "terminate" })
        return;
    }
}


parentPort.on('message', async (message) => {
    console.log(isMainThread)
    let results = await startProcessing(message)
    console.log("response ", results)
    if (results) {
        console.log("document_cleanup_child_thread")
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