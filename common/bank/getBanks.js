let db = require('./dbQueryBank')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getBanks = await db.getBanks()
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"banks" : getBanks},
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