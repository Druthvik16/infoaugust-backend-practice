let db = require('./dbQueryReportingUsers')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid',async(req,res) => 
{
    try
    {
        let clientUuid = req.params.clientUuid
        let getReportingUsers = await db.getReportingUsers(clientUuid)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"reportingUsers" : getReportingUsers},
            "status_name" : getCode.getStatus(200)
        });
    }
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})