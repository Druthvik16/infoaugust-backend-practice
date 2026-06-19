let db = require('./dbQueryLog')
let errorCode = require('../error/errorCode')
let uniqueFunction = require('../commonFunction/uniqueSearchFunction')
let getCode = new errorCode()
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let getLogProcesses;
        if(!req.body.logProcess?.trim() || !req.body.logFileType || !req.body.logDate)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        let fileName = (req.body.logFileType == 'creditNote/summary') ? 'creditNoteSummaryLogFile-' + req.body.logDate : (req.body.logFileType == 'creditNote/pdf') ? 'creditNotePdfLogFile-' + req.body.logDate : (req.body.logFileType == 'form16/summary') ? 'form16SummaryLogFile-' + req.body.logDate : (req.body.logFileType == 'form16/pdf') ? 'form16PdfLogFile-' + req.body.logDate : (req.body.logFileType == 'ledger') ? 'ledgerSummaryLogFile-' + req.body.logDate : (req.body.logFileType == 'paymentAdviceMaster') ? 'paymentAdviceMasterLogFile-' + req.body.logDate : (req.body.logFileType == 'paymentAdviceDetail') ? 'paymentAdviceDetailLogFile-' + req.body.logDate  : 'MISMATCH'
        if(fileName == 'MISMATCH')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"       :   "Document Type Not Exist",
                "status_name"   : getCode.getStatus(400)
            })
        }
        else
        {
            fileName = fileName + ".html"
        }

        let filePath = 'logs/vendor/' + req.body.logProcess + '/' + req.body.logFileType
        console.log(filePath+'/'+fileName)
        let file = await uniqueFunction.getFileUploadedPath(filePath, fileName, '', '')
        if(!file)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"       :   "Log File Not Exist",
                "status_name"   : getCode.getStatus(400)
            })
        }
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"       :   "success",
            "data"          :   {"file" : file.file},
            "status_name"   : getCode.getStatus(200)
        })
        // getLogProcesses = await db.getLogProcesses()
        // if(getLogProcesses.length == 0)
        // {
        //     res.status(200)
        //     return res.json({
        //         "status_code" : 200,
        //         "message"     : "success",
        //         "data"        : {"logProcesses" : []},
        //         "status_name" : getCode.getStatus(200)
        //     });
        // }
        // else
        // {
        //     res.status(200)
        //     return res.json({
        //         "status_code" : 200,
        //         "message"     : "success",
        //         "data"        : {"logProcesses" : getLogProcesses},
        //         "status_name" : getCode.getStatus(200)
        //     });
        // }
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