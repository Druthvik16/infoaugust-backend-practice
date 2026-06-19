let db = require('./dbQueryLog')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:date',async(req,res) => 
{
    try
    {
        let getDailyActivityLogDetails;
        let date;
        console.log(new Date())
        date = req.params.date
        getDailyActivityLogDetails = await db.getDailyActivityLogDetails(date)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"dailyActivityLogDetail" : getDailyActivityLogDetails},
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