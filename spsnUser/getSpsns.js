let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid',async(req,res) => 
{
    try
    {
        let getSpsns;
        let clientUuid;
        clientUuid = req.params.clientUuid
        const userTypeCode = req.body.roleCode || null
        getSpsns = await db.getSpsns(clientUuid, userTypeCode)      
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"spsns" : getSpsns},
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