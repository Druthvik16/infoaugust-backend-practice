let db = require('./dbQueryLog')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:botName/:date',async(req,res) => 
{
    try
    {
        let getPdfBotLogs;
        let botName;
        let date;
        console.log(new Date())
        botName = req.params.botName
        date = req.params.date
        getPdfBotLogs = await db.getPdfBotLogDetails(date, botName)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"pdfBotLogDetail" : getPdfBotLogs},
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