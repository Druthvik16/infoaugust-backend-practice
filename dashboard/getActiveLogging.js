let db = require('./dbQueryDashboard')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getActiveLogging;

module.exports = require('express').Router().get('/',async(req,res) =>  {
    try
    {  
        getActiveLogging = await db.getActiveLogging()
        res.status(200)
        return res.json({
            "status_code" : 200,
            "data"        : {'activeLoggingCount' : getActiveLogging[0].activeLoggings},
            "message"     : 'success',
            "status_name"   : getCode.getStatus(200)
        })
    } 
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code"   :   500,
            "message"       :   "Active Logging Not Found",
            "status_name"   :   getCode.getStatus(500),
            "error"         :   e.sqlMessage
        })     
    }
})