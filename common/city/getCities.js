let db = require('./dbQueryCity')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:stateId',async(req,res) => 
{
    try
    {
        let stateId = req.params.stateId
        let stateIsExist = await db.stateIsExist(stateId)
        if(stateIsExist.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "State Not Exist",
                "status_name" : getCode.getStatus(400)
            });
        }
        let getCities = await db.getCities(stateId)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"cities" : getCities},
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