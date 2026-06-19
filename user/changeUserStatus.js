let db = require('./dbQueryUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let uuid;
        let modifyById;
        let modifyOn;
        if(!req.body.uuid?.trim())
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        uuid = req.body.uuid
        modifyById = req.body.userId
        modifyOn = new Date()
        let changeUserStatus = await db.changeUserStatus(uuid,modifyOn,modifyById)
        if(changeUserStatus.affectedRows > 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : getCode.getStatus(200)
            })            
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Status Not Changed",
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
            "message" : "Status Not Changed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        })  
    }
})
