const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
let db = require('./dbQueryDocumentCleanup')
let pendingListQueueObj = require('./pendingListQueue')
let pendingListQueue = new pendingListQueueObj()
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');
let pendingWorkerThread = []
const numWorkers = 1;
let workers = [];
let activeWorkers = 0;

async function documentCleanupMainThread() {
    try {
        console.log("Queue Log")
        if (isMainThread) {
            try {
                let ledgerDownloads = await findApprovedDocumentCleanupJobs()
                console.log("Queued Ledger downloads", ledgerDownloads)
                // let pendingEmails = pendingListQueue.pendingQueueSize()
                // if (pendingEmails > 0) {
                //     if (pendingEmails <= numWorkers) {
                //         for (let i = 0; i < pendingEmails; i++) {
                //             let worker = new Worker('./documentCleanupThread/threadList.js')
                //             workers.push(worker)
                //             msgPort()
                //             assignTaskToWorkerThread(worker, "New")
                //         }
                //     }
                //     else {
                //         for (let i = 0; i < numWorkers; i++) {
                //             let worker = new Worker('./documentCleanupThread/threadList.js')
                //             workers.push(worker)
                //             msgPort()
                //             assignTaskToWorkerThread(worker, "New")
                //         }
                //     }
                // }
                // else {
                //     setTimeout(() => {
                //         documentCleanupMainThread()
                //     }, 35000)
                //     console.log("workers?.length", workers?.length)
                // }

                let pendingEmails = pendingListQueue.pendingQueueSize();

                if (pendingEmails > 0) {
                    // how many more workers we can create (don’t exceed numWorkers)
                    const availableSlots = numWorkers - workers.length;
                    const workersToCreate = Math.min(availableSlots, pendingEmails);

                    // create new workers if needed
                    for (let i = 0; i < workersToCreate; i++) {
                        let worker = new Worker('./documentCleanupThread/threadList.js');
                        workers.push(worker);
                        msgPort();
                        assignTaskToWorkerThread(worker, "New");

                        // when a worker finishes, reassign next pending task if any
                        worker.on('message', (msg) => {
                            if (msg === 'done') {
                                if (pendingListQueue.pendingQueueSize() > 0) {
                                    assignTaskToWorkerThread(worker, "New");
                                }
                            }
                        });
                    }

                    // assign tasks to existing idle workers
                    workers.forEach(worker => {
                        assignTaskToWorkerThread(worker, "New");
                    });
                } else {
                    setTimeout(() => {
                        documentCleanupMainThread();
                    }, 35000);
                    console.log("workers?.length", workers?.length);
                }
            }
            catch (e) {
                console.log("e************", e)
            }
        }
        else {
            console.log("isMailThread Else part", isMainThread)
        }
    }
    catch (e) {
        console.log(e)
    }
}

async function assignTaskToWorkerThread(worker, action) {
    let size = pendingListQueue.pendingQueueSize()
    console.log("worker", worker.threadId, size, action, workers.length)
    if (size > 0) {
        // if (numWorkers > workers.length) {
        //     if (workers.length < size && numWorkers > size) {
        //         console.log("CREATE WORKER 1")
        //         for (let i = workers.length; i <= size; i++) {
        //             let worker = new Worker('./documentCleanupThread/threadList.js')
        //             workers.push(worker)
        //             msgPort()
        //             assignTaskToWorkerThread(worker, "New")
        //         }
        //     }
        //     else if (workers.length < size && numWorkers < size) {
        //         console.log("CREATE WORKER 2")
        //         for (let i = workers.length; i <= numWorkers; i++) {
        //             let worker = new Worker('./documentCleanupThread/threadList.js')
        //             workers.push(worker)
        //             msgPort()
        //             assignTaskToWorkerThread(worker, "New")
        //         }
        //     }
        // }
        let task = await pendingListQueue.getFromQueue()
        console.log("task", worker.threadId, size, task, !task)
        if (task) {
            worker.postMessage({ 'workerThreadId': worker.threadId, task: task });
            return true
        }
        else {
            setTimeout(() => {
                if (pendingListQueue.isQueueEmpty()) worker.terminate();
            }, 5000); // 5-second cooldown before termination
        }
    }
    else {
        setTimeout(() => {
            if (pendingListQueue.isQueueEmpty()) worker.terminate();
        }, 5000); // 5-second cooldown before termination
    }
}

async function findApprovedDocumentCleanupJobs() {
    try {
        let sizeOfPendingQueue = pendingListQueue.pendingQueueSize()
        console.log("sizeOfApprovedDocumentCleanupJobQueue", sizeOfPendingQueue)
        let list = await findQueuedDocumentCleanupId()
        // console.log("document cleanup list", list)

        if (list.length == 0 && workers.length == 0 && sizeOfPendingQueue == 0) {
            let sql = `UPDATE document_cleanup_job_detail SET status = 'Pending' WHERE status = 'Queued'`
            await db.updateDocumentCleanupQueueStatus(sql, new Date())
        }

        if (list?.length == 0) {
            if (sizeOfPendingQueue == 0 && (workers?.length < numWorkers)) {
                // console.log("Idle")
            }
            // findApprovedDocumentCleanupJobs()
        }
        else {
            let pendingList = []
            pendingList = list?.slice();
            if (pendingList?.length == 0) {
                if (sizeOfPendingQueue == 0 && (workers?.length < numWorkers)) {
                    // console.log("Idle")
                }
                // findApprovedDocumentCleanupJobs()
            }
            else {
                let inserted = await pendingListQueue.insertIntoQueue(pendingList);
                if (inserted) {
                    if (numWorkers > workers.length) {
                        console.log("CREATE WORKER 3")
                        let worker = new Worker('./documentCleanupThread/threadList.js')
                        workers.push(worker)
                        msgPort()
                        assignTaskToWorkerThread(worker, "New")
                    }
                    // findApprovedDocumentCleanupJobs()
                }
            }
        }

    }
    catch (e) {
        console.log(e)
    }
}

async function findQueuedDocumentCleanupId() {
    return new Promise(async (resolve, reject) => {
        try {
            let id = ''
            let deleteId = ''
            let checkLogStatusPending = await db.checkLogStatusesPending()
            const checkAndMarkAllApprovedJobsAsComplete = await db.checkAndMarkAllApprovedJobsAsComplete();
            if (checkLogStatusPending.length > 0) {
                checkLogStatusPending?.forEach(ele => {
                    id = id.length == 0 ? ele.detail_id : id + ',' + ele.detail_id
                    deleteId = deleteId.length == 0 ? ele.matched_document_detail_id : deleteId + ',' + ele.matched_document_detail_id
                })

                const deleSql =  `DELETE FROM client_uploaded_document_detail
                        WHERE id IN (${deleteId}) `

                
                let deleteU = await db.updateDocumentCleanupQueueStatus(deleSql, new Date())

                let sql = `UPDATE document_cleanup_job_detail SET status = 'Processed' WHERE id IN (${id})`
                await db.updateDocumentCleanupQueueStatus(sql, new Date())

                // Also update parent job to 'Processing'
                let jobIds = [...new Set(checkLogStatusPending.map(row => row.id))];
                let updateJobsSql = `UPDATE document_cleanup_job SET processing_status = 'Processing' WHERE id IN (${jobIds.join(',')})`
                await db.updateDocumentCleanupQueueStatus(updateJobsSql, new Date());
                
                for(const task of checkLogStatusPending)
                {
                    const checkAndMarkJobAsComplete = await db.checkAndMarkJobAsComplete(task.id)
                }

                return resolve(checkLogStatusPending)
            }
            else {
                return resolve(checkLogStatusPending)
            }
        }
        catch (e) {
            console.log(e)
            return resolve(false)
        }
    })
}

// function msgPort() {
//     try {
//         workers?.forEach((worker) => {
//             console.log("working", worker?.taskInProgress)
//             worker.on('message', (msg) => {
//                 console.log("message from thread*************************", msg, workers?.length)
//                 if (msg?.action == 'terminate') {
//                     let listSize = pendingListQueue.pendingQueueSize()
//                     console.log("listSize************************* ", listSize)
//                     if (listSize == 0) {
//                         worker.terminate()
//                     }
//                     else {
//                         assignTaskToWorkerThread(worker, "Old")
//                     }
//                 }
//             });

//             worker.on('online', (msg) => {
//                 activeWorkers++
//                 console.log("online", msg, workers.length)
//             })

//             worker.on('error', (msg) => {
//                 console.log("error", msg)
//             })

//             worker.on('exit', (msg) => {
//                 console.log("exit", msg, workers.length, worker.threadId, activeWorkers)

//                 const index = workers.indexOf(worker);
//                 if (index !== -1) {
//                     activeWorkers--
//                     workers.splice(index, 1);
//                 }
//                 if (workers?.length == 0) {
//                     setTimeout(() => {
//                         documentCleanupMainThread()
//                     }, 10000)
//                 }
//             })

//             worker.on('messageerror', (msg) => {
//                 console.log("msgError", msg)
//             })

//             worker.on('close', (msg) => {
//                 console.log("close ** ", msg)
//             })
//         });
//     }
//     catch (e) {
//         console.log(e)
//     }
// }

function msgPort() {
    try {
        workers?.forEach((worker) => {
            console.log("working", worker?.taskInProgress);

            // message
            if (worker.listenerCount('message') === 0) {
                worker.on('message', (msg) => {
                    console.log("message from thread*************************", msg, workers?.length);
                    if (msg?.action == 'terminate') {
                        let listSize = pendingListQueue.pendingQueueSize();
                        console.log("listSize************************* ", listSize);
                        if (listSize == 0) {
                            worker.terminate();
                        } else {
                            assignTaskToWorkerThread(worker, "Old");
                        }
                    }
                });
            }

            // online
            if (worker.listenerCount('online') === 0) {
                worker.on('online', (msg) => {
                    activeWorkers++;
                    console.log("online", msg, workers.length);
                });
            }

            // error
            if (worker.listenerCount('error') === 0) {
                worker.on('error', (msg) => {
                    console.log("error", msg);
                });
            }

            // exit
            if (worker.listenerCount('exit') === 0) {
                worker.on('exit', (msg) => {
                    console.log("exit", msg, workers.length, worker.threadId, activeWorkers);

                    const index = workers.indexOf(worker);
                    if (index !== -1) {
                        activeWorkers--;
                        workers.splice(index, 1);
                    }
                    if (workers?.length == 0) {
                        setTimeout(() => {
                            documentCleanupMainThread();
                        }, 10000);
                    }
                });
            }

            // messageerror
            if (worker.listenerCount('messageerror') === 0) {
                worker.on('messageerror', (msg) => {
                    console.log("msgError", msg);
                });
            }

            // close
            if (worker.listenerCount('close') === 0) {
                worker.on('close', (msg) => {
                    console.log("close ** ", msg);
                });
            }
        });
    } catch (e) {
        console.log(e);
    }
}


module.exports = documentCleanupMainThread