let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getVendorStatuses;
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        getVendorStatuses = await db.getVendorStatuses()
      
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"statuses" : getVendorStatuses},
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