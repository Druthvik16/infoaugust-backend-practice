let db = require('./dbQueryProcessController')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    { 
        let isExecuteBot;
        let botName = 'invoicePdfBot'
        let checkBotStatus;
        let botStatus = 'waiting';
        let detailId;  
        detailId = req.body.detailId;
        botStatus = 'waiting'
        checkBotStatus = await db.checkBotStatus(botName)
        let updatePdfBotProcessLogStatus = await db.updatePdfBotProcessLogStatus(botName, botStatus, 0, 0, 0, 0, new Date())
        console.log(updatePdfBotProcessLogStatus)
        let  updatePdfBotProcessLogDetail = await db.updatePdfBotProcessLogDetail(detailId, new Date())
        console.log(updatePdfBotProcessLogDetail)


        isExecuteBot = checkBotStatus[0].isExecuteBot;
        botStatus = checkBotStatus[0].botStatus;

        if(botStatus == 'working' && isExecuteBot == 1)
        {
            let updateDailyActivityLogDetail = await db.updateDailyActivityLogDetail('Process Local File', 'Invoice PDF', 'Bot File Process completed', new Date())
        }
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "status_name" : getCode.getStatus(200)
        });
    }
    catch(e)
    {
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "Error",
            "status_name" : getCode.getStatus(200),
            "error"       : e?.stack
        });
    }
})