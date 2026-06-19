let db = require('./dbQueryAuthenticate')
let errorCode = require('../common/errorCode/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res)=>
{
    try
    {
        let email;
        let newPassword;
        let user;
        if(!req.body.email || !req.body.newPassword)
        {
            res.status(404)
            return res.json({
                "status_code" : 404,
                "message"     : "Provide All Values",
                "status_name"   : getCode.getStatus(404)
            })
        }
        email = req.body.email;
        newPassword = req.body.newPassword;
        user = await db.checkResetLinkEmail(email);
        if(user.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Email Not Registered",
                "status_name" : getCode.getStatus(500)
            })
        }
        let checkLinkExist = await db.checkMailLinkExist(email)
        if(checkLinkExist[0].isExist == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Link Expired",
                "status_name" : getCode.getStatus(500)
            })
        }
        if(user.length > 0)
        {
            let updateUserPassword = await db.updateUserPassword(email, newPassword, new Date())
            let deletdResetLink = await db.deleteResetLinkData(email)
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : 'ok'
            })
        }  
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message": "Email Not Registered",
                "status_name" : getCode.getStatus(500)
            });
        } 
    } 
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Password Not Reset",
            "status_name" : getCode.getStatus(500),
            "errror"      : e.sqlMessage
        });
    }
})
