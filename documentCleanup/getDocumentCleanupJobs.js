let db = require('./dbQueryDocumentCleanup')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid?',async(req,res) => 
{
    try
    {
        const clientUuid = req.query.clientUuid || null
        const userTypeCode = req.body.roleCode || null
        const getDocumentCleanupJobs = await db.getDocumentCleanupJobs(clientUuid)      
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"documentCleanupJobs" : getDocumentCleanupJobs},
            "status_name" : getCode.getStatus(200)
        });
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
})