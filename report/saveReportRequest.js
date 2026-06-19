let db = require('./dbQueryReport')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let status
let fromDate;
let toDate;
let mailTo;
let clientId;
let clientUuid;
let createdOn;

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        if(!req.body.fromDate?.trim() || req.body.fromDate?.trim()?.length == 0 || !req.body.toDate || req.body.toDate?.trim()?.length == 0  || !req.body.client || !req.body.client?.uuid || !req.body.mailTo || req.body.mailTo?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        status = 'Pending'
        fromDate = new Date(uniqueFunction.manageSpecialCharacter(req.body.fromDate?.trim()));
        mailTo = JSON.stringify(req.body.mailTo)
        toDate = new Date(uniqueFunction.manageSpecialCharacter(req.body.toDate))
        createdOn =  new Date()
        clientUuid = req.body.client?.uuid
        console.log(status, fromDate, toDate, createdOn, clientUuid, mailTo)
        let saveRequest = await db.saveReportRequest(status, fromDate, toDate, createdOn, clientUuid, mailTo)
        if(saveRequest.affectedRows > 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : { "id" : saveRequest?.insertId},
                "status_name" : getCode.getStatus(200)
            })            
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Report request failed",
                "status_name" : getCode.getStatus(500)
            }) 
        } 
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Report request failed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        })   
    }
})
