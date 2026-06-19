let db = require('./dbQueryProcessController')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid',async(req,res) => 
{
    try
    {
        let clientUuid = req.params.clientUuid
        let getClient = await db.getClientData(clientUuid)
        if(getClient?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Client not found",
                "status_name" : getCode.getStatus(400)
            });
        }
        let resetProcessSequence = await db.resetProcessSequence(0,0,0, getClient[0].id)
        let interuptProcess = await db.updateInteruptProcess(0, new Date(), getClient[0].id)
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