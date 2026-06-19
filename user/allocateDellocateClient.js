let db = require('./dbQueryUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let clientUuid;
        let uuid;
        let modifyOn;
        let modifyById;
        let userData;
        let clientId;
        if(!req.body.uuid?.trim() || !req.body.client)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        uuid = req.body.uuid?.trim();
        clientUuid = req.body.client?.uuid?.length > 0 ? req.body.client?.uuid : null
        modifyOn =  new Date()
        modifyById = req.body.userId;
        if(clientUuid)
        {
            clientId = await db.checkClientExist(clientUuid)
            if(clientId?.length == 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Client Not Found",
                    "status_name" : getCode.getStatus(400)
                })
            }
            clientId = clientId[0].id
        }
        else
        {
            clientId = null
        }
        userData = await db.getUserData(uuid)
        if(userData[0]?.id == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "User Not Found",
                "status_name" : getCode.getStatus(400)
            })
        }

        if(clientId)
        {
            if(userData[0].linkedToId == clientId)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : getCode.getStatus(200)
                })   
            }
            if(userData?.length > 0 && userData[0]?.linkedToId && userData[0]?.linkedToId > 0 && userData[0]?.isExist != 0 && clientId != userData[0]?.linkedToId)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"     : `User's Client Already Mapped With Partner `,
                    "status_name" : getCode.getStatus(400)
                });
            }
            let allocateClientToUser = await db.allocateClientToUser(uuid, clientId, modifyOn, modifyById)
            if(allocateClientToUser.affectedRows > 0)
            {
                let sql = ``
                sql = `UPDATE client SET linked_user_id = '${userData[0].id}', modify_on = ?, modify_by_id = '${modifyById}' WHERE id = '${clientId}'`
                let updateStaffOrClient = await db.updateStaffOrClient(sql, [new Date()])
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Client Not Allocated",
                    "status_name" : getCode.getStatus(500)
                }) 
            }
        }
        else
        {
            if(userData?.length > 0 && userData[0]?.linkedToId && userData[0]?.linkedToId > 0 && userData[0]?.isExist != 0 && clientId != userData[0]?.linkedToId)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"     : `User's Client Already Mapped With Partner `,
                    "status_name" : getCode.getStatus(400)
                });
            }
            let deallocateStaffFromUser = await db.deallocateStaffFromUser(uuid, modifyOn, modifyById)
            let deallocateUserFromClient = await db.deallocateUserFromClient(userData[0].linkedToId, modifyOn, modifyById)
        }
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message" : "success",
            "status_name" : getCode.getStatus(200)
        })  
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Client Not Updated",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})