let db = require('./dbQueryAuthenticate')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:action',async(req,res) =>
{
    try
    {
        let userId;
        userId = req.body.userId       
        let action = req.params.action
        if(action == 'user')
        {
            let deletedToken = await db.deleteToken(userId, new Date())
            if(deletedToken.affectedRows > 0)
            {
                let updateLoginHistory2 = await db.updateLoginHistory(userId, 'Client Admin', new Date(), 'END USER')
                let updateLoginHistory3 = await db.updateLoginHistory(userId, 'Infomap Admin', new Date(), 'END USER')
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : 'ok'
                })            
            }
        }
        if(action == 'addon')
        {
            let deleteTokenAddOn = await db.deleteTokenAddOn(userId, new Date());
            if(deleteTokenAddOn.affectedRows > 0)
            {
                let updateLoginHistory2 = await db.updateLoginHistory(userId, 'Client User', new Date(), 'END USER')
                let updateLoginHistory3 = await db.updateLoginHistory(userId, 'Infomap User', new Date(), 'END USER')
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : 'ok'
                })            
            }
        }

        if(action == 'partner')
        {
            let deleteTokenPartner = await db.deleteTokenPartner(userId, new Date())
            if(deleteTokenPartner.affectedRows > 0)
            {
                let updateLoginHistory = await db.updateLoginHistory(userId, 'Partner', new Date(), 'END USER')
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : 'ok'
                })            
            }

        }

        if(action == 'partner-user')
        {
            let deleteTokenPartnerSecondary = await db.deleteTokenPartnerSecondary(userId, new Date())
            if(deleteTokenPartnerSecondary.affectedRows > 0)
            {
                let updateLoginHistory = await db.updateLoginHistory(userId, 'Partner-User', new Date(), 'END USER')
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : 'ok'
                })            
            }

        }

        if(action == 'spsn')
        {
            let deleteTokenSpsnUser = await db.deleteTokenSpsnUser(userId, new Date())
            if(deleteTokenSpsnUser.affectedRows > 0)
            {
                let updateLoginHistory = await db.updateLoginHistory(userId, 'SPSN-User', new Date(), 'END USER')
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : 'ok'
                })            
            }
        }
        // else
        // {
        //     let deleteTokenAddOn = await db.deleteTokenAddOn(userId, new Date());
        //     if(deleteTokenAddOn.affectedRows > 0)
        //     {
        //         let updateLoginHistory2 = await db.updateLoginHistory(userId, 'Client User', new Date(), 'END USER')
        //         let updateLoginHistory3 = await db.updateLoginHistory(userId, 'Infomap User', new Date(), 'END USER')
        //         res.status(200)
        //         return res.json({
        //             "status_code" : 200,
        //             "message" : "success",
        //             "status_name" : 'ok'
        //         })            
        //     }
        //     else
        //     {
            
        //         let deleteTokenPartner = await db.deleteTokenPartner(userId, new Date())
        //         if(deleteTokenPartner.affectedRows > 0)
        //         {
        //             let updateLoginHistory = await db.updateLoginHistory(userId, 'Partner', new Date(), 'END USER')
        //             res.status(200)
        //             return res.json({
        //                 "status_code" : 200,
        //                 "message" : "success",
        //                 "status_name" : 'ok'
        //             })            
        //         }
        //         else
        //         {
        //             let deleteTokenSpsnUser = await db.deleteTokenSpsnUser(userId, new Date())
        //             if(deleteTokenSpsnUser.affectedRows > 0)
        //             {
        //                 let updateLoginHistory = await db.updateLoginHistory(userId, 'SPSN-User', new Date(), 'END USER')
        //                 res.status(200)
        //                 return res.json({
        //                     "status_code" : 200,
        //                     "message" : "success",
        //                     "status_name" : 'ok'
        //                 })            
        //             }
        //             else
        //             {
        //                 res.status(404)
        //                 return res.json({
        //                     "status_code" : 404,
        //                     "message" : "Logout Failed, user not found",
        //                     "status_name" : getCode.getStatus(404)
        //                 }) 
        //             } 
        //         }
        //     }
        // }   
    } 
    catch(e)
    {
        console.log(e);
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Logout Failed",
                "status_name" : getCode.getStatus(500),
            "error"     : e.sqlMessage
        }) 
    }
})
