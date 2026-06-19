let db = require('./dbQueryProcessController')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {   
        let isExecuteBot;
        let botName = 'creditNotePdfBot'
        let checkBotStatus;
        let botStatus = 'waiting';
        let isExe;
        checkBotStatus = await db.checkBotStatus(botName)
        isExecuteBot = checkBotStatus[0].isExecuteBot == 0 ? false : true
        botStatus = isExecuteBot ? 'working' : 'waiting'
        isExe = checkBotStatus[0].isExecuteBot == 0 ? 1 : 0
        let updatePdfBotProcessLogStatus = await db.updatePdfBotProcessLogStatus(botName, botStatus, checkBotStatus[0].isBillNumber, checkBotStatus[0].isSummaryFile, checkBotStatus[0].isPDFFile, checkBotStatus[0].isExecuteBot, new Date())
        insertPdfBotProcessLogDetail = await db.insertPdfBotProcessLogDetail(botName, new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "status_name" : getCode.getStatus(200),
            "data"        : {"isExecuteBot" : isExecuteBot, "detailId":insertPdfBotProcessLogDetail.insertId}
        });
    }
    catch(e)
    {
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(200),
            "data"        : {"isExecuteBot" : false},
            "error"       : e?.stack
        });
    }
})