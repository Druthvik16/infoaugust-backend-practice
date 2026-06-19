const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
let db = require('./dbQueryPTDowunload')
let pendingListQueueObj = require('./pendingListQueue')
let pendingListQueue = new pendingListQueueObj()
const { format } = require('date-fns');
const { enIN } = require('date-fns/locale');
let pendingWorkerThread = []
const numWorkers = 1; 
let workers = [];
let activeWorkers = 0;

async function ptDownload() 
{
    try
    {
        console.log("Queue Log")
        if (isMainThread) 
        {
            try 
            { 
                let ptDownloads = await findQueuedPtDownloads()
                console.log("Queued PT downloads",ptDownloads)
                let pendingEmails = pendingListQueue.pendingQueueSize()
                if(pendingEmails > 0)
                {
                    if(pendingEmails <= numWorkers)
                    {
                        for(let i = 0; i < pendingEmails; i++)
                        {
                            let worker = new Worker('./PtFileMergeDownloads/threadList.js')
                            workers.push(worker)
                            msgPort()
                            assignTaskToWorkerThread(worker,"New")
                        }
                    }
                    else
                    {
                        for(let i = 0; i < numWorkers; i++)
                        {
                            let worker = new Worker('./PtFileMergeDownloads/threadList.js')
                            workers.push(worker)
                            msgPort()
                            assignTaskToWorkerThread(worker,"New")
                        }
                    }
                }
                else
                {
                    setTimeout(()=>{
                        ptDownload()
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
                    let worker = new Worker('./PtFileMergeDownloads/threadList.js')
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
                    let worker = new Worker('./PtFileMergeDownloads/threadList.js')
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

async function findQueuedPtDownloads()
{
    try
    {
        let sizeOfPendingQueue = pendingListQueue.pendingQueueSize()
        console.log("sizeOfPendingPTDownloadQueue",sizeOfPendingQueue)
        let list = await findQueuedPTDownloadId()
        console.log("PT download list",list)

        if(list.length == 0 && workers.length == 0 && sizeOfPendingQueue == 0)
        {
            let sql = `UPDATE pt_ondemand_download_queue SET status = 'pending' WHERE status = 'queued'`
            db.updatPTDownloadQueueStatus(sql, new Date()).then(updateStatus => 
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
            // findQueuedPtDownloads()
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
                // findQueuedPtDownloads()
            }
            else
            {     
                let inserted = await pendingListQueue.insertIntoQueue(pendingList);
                if(inserted)
                {
                    if(numWorkers > workers.length)
                    {
                        console.log("CREATE WORKER 3")
                        let worker = new Worker('./PtFileMergeDownloads/threadList.js')
                        workers.push(worker)
                        msgPort()
                        assignTaskToWorkerThread(worker,"New")
                    }
                    // findQueuedPtDownloads()
                }
            }
        }
        
    }
    catch(e)
    {
        console.log(e)
    }
}

async function findQueuedPTDownloadId () 
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
                    ele.month = format(ele.month, 'yyyy-MM-dd', { locale: enIN })
                    if(id.length == 0)
                    {
                        id = ele.id
                    }
                    else
                    {
                        id = id + ',' + ele.id
                    }
                })  
                let sql = `UPDATE pt_ondemand_download_queue SET status = 'queued' WHERE id IN (${id})`
                //  
                db.updatPTDownloadQueueStatus(sql, new Date()).then(updateStatus => 
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
                        ptDownload()
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

module.exports = ptDownload