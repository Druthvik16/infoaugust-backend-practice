class pendingListQueue 
{
    constructor() 
    {
        this.queue = [];
    }
    
    insertIntoQueue(item) 
    {
        return new Promise((resolve, reject) => 
        {
            try
            { 
                item.forEach(element => 
                {
                    const containsTarget = this.queue?.some(jsonObject => 
                    {
                        return JSON.stringify(jsonObject) === JSON.stringify(element);
                    });
                    if(!containsTarget)
                    {
                        this.queue.push(element);         
                    }
                });
                return resolve(true)
            }
            catch (e)
            {
                console.log(e)
            }
        })
    }
    
    async getFromQueue() 
    {
        return new Promise((resolve, reject) => 
        {
            return resolve(this.queue.shift());
        })
    }
    
    isQueueEmpty() 
    {
        return this.queue.length === 0;
    }
    
    pendingQueueSize() 
    {
        return this.queue.length;
    }

    pendingQueue() 
    {
        return this.queue;
    }

    checkQueueSize()
    {
        return new Promise((resolve, reject) => 
        {
            try
            {
                if(this.isQueueEmpty())
                {
                    this.checkQueueSize()
                }
                else
                {
                    return resolve(true)
                }
            }
            catch (e)
            {
                console.log(e)
            }
        })
    }
}
      
module.exports = pendingListQueue;