let db = require('./dbQueryExtendedUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid/:fromDate?/:toDate?',async(req,res) => 
{
    try
    {     
        const clientUuid = req.params.clientUuid
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const userTypeCode = req.body.roleCode || null

        let data = await db.getExtendedUserWithLocations(clientUuid, userTypeCode, fromDate, toDate)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"partnerLocations" : data},
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