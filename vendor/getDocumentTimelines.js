let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:vendorUuid',async(req,res) => 
{
    try
    {
        let vendorUuid = req.params.vendorUuid
        let status = 'Fixed'
        let getDocumentTimelines = await db.getDocumentTimelines(vendorUuid, status)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"documentTimelines" : getDocumentTimelines},
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