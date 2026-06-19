let db = require('./dbQueryDashboard')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().get('/:clientUuid?',async(req,res) =>  {
    try
    {  
        let clientUuid = req.query.clientUuid
        let getLoggedInUsers = await db.getLoggedInUsers(clientUuid)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "data"        : {'loggedUsers' : getLoggedInUsers},
            "message"     : 'success',
            "status_name"   : getCode.getStatus(200)
        })
    } 
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code"   :   500,
            "message"       :   "Active Logging Not Found",
            "status_name"   :   getCode.getStatus(500),
            "error"         :   e.sqlMessage
        })     
    }
})