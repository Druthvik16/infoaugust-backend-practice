class endPointList 
{
    getEndPoint(provider)
    {
        if (provider) 
        {
            switch (provider) 
            {
                case 'sendInBlue': return '/smtp/email'; 
                case 'mailChimp': return '/messages/info'; 
                default:
                    return "unknown api"
            }
        }
    }
}
      
module.exports = endPointList;





















//       // Example usage
//       const myQueue = new FIFOQueue();
//       myQueue.enqueue('Item 1');
//       myQueue.enqueue('Item 2');
//       myQueue.enqueue('Item 3');
      
//       console.log(myQueue.dequeue()); 

//       console.log(myQueue.dequeue()); 

      
//       console.log(myQueue.size());    
//       console.log(myQueue.isEmpty()); 
