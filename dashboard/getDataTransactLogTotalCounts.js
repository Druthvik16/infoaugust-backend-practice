let db = require('./dbQueryDashboard')
let CNSObj = require('../model/creditNoteSummary')
let cns = new CNSObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getDataTransactLog;
module.exports = require('express').Router().get('/:storageType?/:clientUuid?',async(req,res) => 
{
    try
    {
        let storageType = req.query.storageType || null;
        let clientUuid = req.query.clientUuid || ''
        console.log(new Date())
     
        getDataTransactLog = await db.getDataTransactLogTotalCounts(storageType, clientUuid)
        console.log("Data Received and Sent", getDataTransactLog?.length , new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"dataTransactLogTotalCounts" : getDataTransactLog},
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
            "error"       : e
        });
    }
})