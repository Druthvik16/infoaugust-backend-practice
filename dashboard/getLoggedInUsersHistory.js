let db = require('./dbQueryDashboard')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getLoggedInUsersHistory;

module.exports = require('express').Router().get('/:clientUuid?',async(req,res) =>  {
    try
    {  
        let clientUuid = req.query.clientUuid
        getLoggedInUsersHistory = await db.getLoggedInUsersHistory(clientUuid)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "data"        : {'loggedUsersHistory' : getLoggedInUsersHistory},
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