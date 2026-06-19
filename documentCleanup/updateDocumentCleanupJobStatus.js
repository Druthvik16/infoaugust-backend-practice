const express = require('express');
const db = require('./dbQueryDocumentCleanup');
const router = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = router.get('/:id/:status',async(req,res) => 
{
    try
    {        
        const id = req.params.id;
        const status = req.params.status; // 'Approved', 'Not-Approved'
        const getFilePath = await db.getDocumentCleanupJob(id)

        if(getFilePath.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Provide valid Data",
                "status_name" : getCode.getStatus(500)
            });
        }
        else if(getFilePath.status != 'Pending')
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : `Document status already updated as ${getFilePath.status}`,
                "status_name" : getCode.getStatus(500)
            });
        }
        else
        {                   
            await db.updateDocumentCleanupJobStatus(id, status);
            
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "status_name" : getCode.getStatus(200)
            });                           
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})
