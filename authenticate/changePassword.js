let db = require('./dbQueryAuthenticate')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let commonDb = require('../common/commonFunction/dbQueryCommonFuntion')

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        let user;
        let oldPassword;
        let newPassword;
        let userId;
        let passKey;
        let partner;
        let spsnUser;
        if(!req.body.oldPassword?.trim() || !req.body.newPassword?.trim())
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        oldPassword = req.body.oldPassword?.trim();
        newPassword = req.body.newPassword?.trim();
        accessToken = req.body.accessToken;
        passKey = req.body.passKey
        userId = req.body.userId;  
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        spsnUser = await db.matchPasswordSpsnUser(userId, oldPassword, passKey)
        if(spsnUser?.length > 0)
        {
            let updateSpsnUser = await db.updateSpsnUser(userId,newPassword, passKey)
            const saveLog = await commonDb.saveInfoaugustActivityLog(userId, loggedUserType, 'spsn_user_master', 'SPSN Profile Update', `Password updated from ${oldPassword} to ${newPassword}`, userId, 'spsn_user_master', null, 'success')
            if(updateSpsnUser.affectedRows > 0)
            {
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
                    "message" : "Password Not Changed",
                    "status_name" : getCode.getStatus(500)
                }) 
            }
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Old Password Not Matched",
                "status_name" : getCode.getStatus(500),
            }) 
        }
        // if(userId)
        // {
        //     user = await db.matchPassword(userId, oldPassword, passKey)
        //     if(user?.length > 0)
        //     {
        //         let updateUser = await db.updateUser(userId,newPassword, passKey)
        //         if(updateUser.affectedRows > 0)
        //         {
        //             res.status(200)
        //             return res.json({
        //                 "status_code" : 200,
        //                 "message" : "success",
        //                 "status_name" : 'ok'
        //             })            
        //         }
        //         else
        //         {
        //             res.status(500)
        //             return res.json({
        //                 "status_code" : 500,
        //                 "message" : "Password Not Changed",
        //                 "status_name" : getCode.getStatus(500)
        //             }) 
        //         }
        //     }
        //     else
        //     {
        //         partner = await db.matchPasswordPartner(userId, oldPassword, passKey)
        //         if(partner?.length > 0)
        //         {
        //             let updatePartner = await db.updatePartner(userId,newPassword, passKey)
        //             if(updatePartner.affectedRows > 0)
        //             {
        //                 res.status(200)
        //                 return res.json({
        //                     "status_code" : 200,
        //                     "message" : "success",
        //                     "status_name" : 'ok'
        //                 })            
        //             }
        //             else
        //             {
        //                 res.status(500)
        //                 return res.json({
        //                     "status_code" : 500,
        //                     "message" : "Password Not Changed",
        //                     "status_name" : getCode.getStatus(500)
        //                 }) 
        //             }
        //         }
        //         else
        //         {
        //             res.status(500)
        //             return res.json({
        //                 "status_code" : 500,
        //                 "message" : "Old Password Not Matched",
        //                 "status_name" : getCode.getStatus(500),
        //             }) 
        //         }
        //     }       
        // }
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Password Not Changed",
            "status_name" : getCode.getStatus(500),
            "error"     :      e.sqlMessage
        }) 
    }
})
