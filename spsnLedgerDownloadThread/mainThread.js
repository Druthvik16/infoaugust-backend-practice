const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
let db = require('./dbQuerySpsn')
let pendingListQueueObj = require('./pendingListQueue')
let pendingListQueue = new pendingListQueueObj()
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');
let pendingWorkerThread = []
const numWorkers = 1; 
let workers = [];
let activeWorkers = 0;

async function spsnLedgerDownload() 
{
    try
    {
        console.log("Queue Log")
        if (isMainThread) 
        {
            try 
            { 
                let ledgerDownloads = await findQueuedLedgerDownloads()
                console.log("Queued Ledger downloads",ledgerDownloads)
                let pendingEmails = pendingListQueue.pendingQueueSize()
                if(pendingEmails > 0)
                {
                    if(pendingEmails <= numWorkers)
                    {
                        for(let i = 0; i < pendingEmails; i++)
                        {
                            let worker = new Worker('./spsnLedgerDownloadThread/threadList.js')
                            workers.push(worker)
                            msgPort()
                            assignTaskToWorkerThread(worker,"New")
                        }
                    }
                    else
                    {
                        for(let i = 0; i < numWorkers; i++)
                        {
                            let worker = new Worker('./spsnLedgerDownloadThread/threadList.js')
                            workers.push(worker)
                            msgPort()
                            assignTaskToWorkerThread(worker,"New")
                        }
                    }
                }
                else
                {
                    setTimeout(()=>{
                        spsnLedgerDownload()
                    }, 35000)
                    console.log("workers?.length",workers?.length)
                }
            }
            catch(e)
            {
                console.log("e************", e)
            }            
        } 
        else 
        {
            console.log("isMailThread Else part", isMainThread)
        }
    }
    catch(e)
    {
        console.log(e)
    }
}

async function assignTaskToWorkerThread(worker,action)
{ 
    let size = pendingListQueue.pendingQueueSize()
    console.log("worker", worker.threadId, size,action, workers.length)
    if(size > 0)
    {
        if(numWorkers > workers.length)
        {
            if(workers.length < size && numWorkers > size)
            {
                console.log("CREATE WORKER 1")
                for(let i = workers.length; i <= size; i++)
                {
                    let worker = new Worker('./spsnLedgerDownloadThread/threadList.js')
                    workers.push(worker)
                    msgPort()
                    assignTaskToWorkerThread(worker,"New")
                }
            }
            else if(workers.length < size && numWorkers < size)
            {
                console.log("CREATE WORKER 2")
                for(let i = workers.length; i <= numWorkers; i++)
                {
                    let worker = new Worker('./spsnLedgerDownloadThread/threadList.js')
                    workers.push(worker)
                    msgPort()
                    assignTaskToWorkerThread(worker,"New")
                }
            }
        }
        let task = await pendingListQueue.getFromQueue()
        console.log("task", worker.threadId, size, task, !task)
        if(task)
        {
            worker.postMessage({'workerThreadId': worker.threadId,task : task});
            return true            
        }
        else
        {
            // worker.terminate();
            setTimeout(() => {
                if (pendingListQueue.isQueueEmpty()) worker.terminate();
            }, 5000); // 5-second cooldown before termination
        }
    }
    else
    {
        // worker.terminate();
        setTimeout(() => {
            if (pendingListQueue.isQueueEmpty()) worker.terminate();
        }, 5000); // 5-second cooldown before termination
    }
}

async function findQueuedLedgerDownloads()
{
    try
    {
        let sizeOfPendingQueue = pendingListQueue.pendingQueueSize()
        console.log("sizeOfPendingLedgerDownloadQueue",sizeOfPendingQueue)
        let list = await findQueuedLedgerDownloadId()
        console.log("ledger download list",list)

        if(list.length == 0 && workers.length == 0 && sizeOfPendingQueue == 0)
        {
            let sql = `UPDATE ledger_download_queue SET status = 'pending' WHERE status = 'queued'`
            db.updateLedgerDownloadQueueStatus(sql, new Date()).then(updateStatus => 
            {
               return
            })

        }

        if(list?.length == 0)
        {
            if(sizeOfPendingQueue == 0 && (workers?.length < numWorkers))
            {
                // console.log("Idle")
            }
            // findQueuedLedgerDownloads()
        }
        else
        {
            let pendingList = []
            pendingList = list?.slice();
            if(pendingList?.length == 0)
            {
                if(sizeOfPendingQueue == 0 && (workers?.length < numWorkers))
                {
                    // console.log("Idle")
                }
                // findQueuedLedgerDownloads()
            }
            else
            {     
                let inserted = await pendingListQueue.insertIntoQueue(pendingList);
                if(inserted)
                {
                    if(numWorkers > workers.length)
                    {
                        console.log("CREATE WORKER 3")
                        let worker = new Worker('./spsnLedgerDownloadThread/threadList.js')
                        workers.push(worker)
                        msgPort()
                        assignTaskToWorkerThread(worker,"New")
                    }
                    // findQueuedLedgerDownloads()
                }
            }
        }
        
    }
    catch(e)
    {
        console.log(e)
    }
}

async function findQueuedLedgerDownloadId () 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        { 
            let id = ''
            let checkLogStatusPending = await db.checkLogStatusesPending()
            if(checkLogStatusPending.length > 0)
            {
                checkLogStatusPending?.forEach(ele =>
                {
                    ele.fromDate = format(ele.fromDate, 'yyyy-MM-dd', { locale: enIN })
                    ele.toDate = format(ele.toDate, 'yyyy-MM-dd', { locale: enIN })
                    if(id.length == 0)
                    {
                        id = ele.id
                    }
                    else
                    {
                        id = id + ',' + ele.id
                    }
                })  
                let sql = `UPDATE ledger_download_queue SET status = 'queued' WHERE id IN (${id})`
                //  
                db.updateLedgerDownloadQueueStatus(sql, new Date()).then(updateStatus => 
                {
                    // console.log("update", updateStatus)
                    if(updateStatus.affectedRows > 0)
                    {
                        return resolve(checkLogStatusPending)              
                    }
                    else
                    {
                        return resolve(checkLogStatusPending)   
                    }
                })
            }
            else
            {
                return resolve(checkLogStatusPending)
            }
        }
        catch(e)
        {
          console.log(e)
          return resolve(false)
        }
    })
}

function msgPort()
{
    try
    {
        workers?.forEach((worker) => 
        {
            console.log("working", worker, worker?.taskInProgress)
            worker.on('message', (msg) => 
            {
                console.log("message from thread*************************" ,msg, workers?.length)
                if(msg?.action == 'terminate')
                {
                    let listSize = pendingListQueue.pendingQueueSize()
                    console.log("listSize************************* ", listSize)
                    if(listSize == 0)
                    {
                        worker.terminate()
                    }
                    else
                    {
                        assignTaskToWorkerThread(worker,"Old")
                    }
                }
            });

            worker.on('online', (msg) => 
            {
                activeWorkers++
                console.log("online", msg, workers.length)
            })

            worker.on('error', (msg) => 
            {
                console.log("error",msg)
            })

            worker.on('exit', (msg) => 
            {
                console.log("exit",msg,workers.length, worker.threadId, activeWorkers)
                
                const index = workers.indexOf(worker);
                if (index !== -1) 
                {
                    activeWorkers--
                    workers.splice(index, 1);
                }
                if(workers?.length == 0)
                {
                    setTimeout(()=>{
                        spsnLedgerDownload()
                    }, 10000)
                }
            })

            worker.on('messageerror', (msg) => 
            {
                console.log("msgError",msg)
            })

            worker.on('close', (msg) => 
            {
                console.log("close ** ",msg)
            })
        });
    }
    catch(e)
    {
        console.log(e)
    }
}

module.exports = spsnLedgerDownload