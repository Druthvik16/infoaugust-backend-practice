let db = require('./dbQueryUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let uuid;
        let managerUserUuid;
        let modifyOn;
        let modifyById;
        let managerUserId;
        let userData;
        if(!req.body.uuid || !req.body.managerUser || !req.body.managerUser?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        managerUserUuid = req.body.managerUser?.uuid
        uuid = req.body.uuid
        modifyOn =  new Date()
        modifyById = req.body.userId;
        userData = await db.getUserData(uuid);
        if(userData[0]?.code == 'MGR' && managerUserUuid?.length > 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Cannot Assign Manager to Manager User",
                "status_name" : getCode.getStatus(400)
            })
        }
        if(managerUserUuid?.length > 0 && managerUserUuid?.toString() == userData[0]?.assignedManagerUuid?.toString())
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : getCode.getStatus(200)
            }) 
        }
        let managerUser = await db.getUserData(managerUserUuid)
        if(managerUser?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Manager Not Exist",
                "status_name" : getCode.getStatus(400)
            })
        }
        managerUserId = managerUser[0]?.id
        let deleteUserClintPartners = await db.deleteUserClientPartnerByUser(uuid)

        let updateUserAssignedManager = await db.updateUserAssignedManager(uuid, managerUserId, modifyOn, modifyById)
        if(updateUserAssignedManager.affectedRows > 0)
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
                "message" : "Assigned Manager Not Updated",
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
            "message" : "Assigned Manager Not Updated",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})
