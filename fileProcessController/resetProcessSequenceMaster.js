let db = require('./dbQueryProcessController')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let resetProcessSequence = await db.resetProcessSequence(0,0,0)
        let interuptProcess = await db.updateInteruptProcess(0, new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
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