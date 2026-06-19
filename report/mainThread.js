const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
let db = require('./dbQueryReport')
let pendingListQueueObj = require('./pendingListQueue')
let pendingListQueue = new pendingListQueueObj()
let pendingWorkerThread = []
const numWorkers = 1; 
let workers = [];
let activeWorkers = 0;

async function mailReport() 
{
    try
    {
        console.log("Queue Log")
        if (isMainThread) 
        {
            try 
            { 
                let mails = await findQueuedMails()
                console.log("Queued Mails",mails)
                let pendingEmails = pendingListQueue.pendingQueueSize()
                if(pendingEmails > 0)
                {
                    if(pendingEmails <= numWorkers)
                    {
                        for(let i = 0; i < pendingEmails; i++)
                        {
                            let worker = new Worker('./report/threadList.js')
                            workers.push(worker)
                            msgPort()
                            assignTaskToWorkerThread(worker,"New")
                        }
                    }
                    else
                    {
                        for(let i = 0; i < numWorkers; i++)
                        {
                            let worker = new Worker('./report/threadList.js')
                            workers.push(worker)
                            msgPort()
                            assignTaskToWorkerThread(worker,"New")
                        }
                    }
                }
                else
                {
                    setTimeout(()=>{
                        mailReport()
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
                    let worker = new Worker('./report/threadList.js')
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
                    let worker = new Worker('./report/threadList.js')
                    workers.push(worker)
                    msgPort()
                    assignTaskToWorkerThread(worker,"New")
                }
            }
            
        }
        let task = await pendingListQueue.getFromQueue()
        console.log("task", worker.threadId, size, task)
        if(task)
        {
            worker.postMessage({'workerThreadId': worker.threadId,task : task});
            return true            
        }
        else
        {
            worker.terminate();
        }
    }
    else
    {
        worker.terminate();
    }
}

async function findQueuedMails()
{
    try
    {
        let sizeOfPendingQueue = pendingListQueue.pendingQueueSize()
        console.log("sizeOfPendingQueue",sizeOfPendingQueue)
        let list = await findQueuedMailId()
        console.log("list",list)
        if(list?.length == 0)
        {
            if(sizeOfPendingQueue == 0 && (workers?.length < numWorkers))
            {
                // console.log("Idle")
            }
            // findQueuedMails()
        }
        else
        {
            let pendingList = []
            console.log(list)
            pendingList = list?.slice();
            if(pendingList?.length == 0)
            {
                if(sizeOfPendingQueue == 0 && (workers?.length < numWorkers))
                {
                    // console.log("Idle")
                }
                // findQueuedMails()
            }
            else
            {     
                let inserted = await pendingListQueue.insertIntoQueue(pendingList);
                if(inserted)
                {
                    if(numWorkers > workers.length)
                    {
                        console.log("CREATE WORKER 3")
                        let worker = new Worker('./report/threadList.js')
                        workers.push(worker)
                        msgPort()
                        assignTaskToWorkerThread(worker,"New")
                    }
                    // findQueuedMails()
                }
            }
        }
        
    }
    catch(e)
    {
        console.log(e)
    }
}


async function findQueuedMailId () 
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
                    if(id.length == 0)
                    {
                        id = ele.id
                    }
                    else
                    {
                        id = id + ',' + ele.id
                    }
                })  
                let sql = `UPDATE report_processing_log SET status = 'Fetched' WHERE id IN (${id})`
                //  
                db.updateMailQueueStatus(sql, new Date()).then(updateStatus => 
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
            console.log("working")
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
                        mailReport()
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

module.exports = mailReport