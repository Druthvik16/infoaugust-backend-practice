let db = require('./dbQueryUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let uuid
        let modifyOn;
        let modifyById;
        let staffUuid;
        let staffId;
        let userData;
        if(!req.body.uuid?.trim() || !req.body.staff)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        uuid = req.body.uuid?.trim();
        staffUuid = req.body.staff?.uuid?.length > 0 ? req.body.staff?.uuid : null
        modifyOn =  new Date()
        modifyById = req.body.userId;
        if(staffUuid)
        {
            staffId = await db.checkStaffExist(staffUuid)
            if(staffId?.length == 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Staff Not Found",
                    "status_name" : getCode.getStatus(400)
                })
            }
            staffId = staffId[0].id
        }
        else
        {
            staffId = null
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
        if(staffId)
        {
            if(userData[0].linkedToId == staffId)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : getCode.getStatus(200)
                })   
            }
            let allocateStaffToUser = await db.allocateStaffToUser(uuid, staffId, modifyOn, modifyById)
            if(allocateStaffToUser.affectedRows > 0)
            {
                let sql = ``
                sql = `UPDATE staff SET current_user_id = '${userData[0].id}', modify_on = ?, modify_by_id = '${modifyById}' WHERE id = '${staffId}'`
    
                let staffAllocationHistoy = await db.staffAllocationHistoy(staffId, userData[0].id, new Date())
                let updateStaffOrClient = await db.updateStaffOrClient(sql, [new Date()])
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Staff Not Allocated",
                    "status_name" : getCode.getStatus(500)
                }) 
            }
        }
        else
        {
           let deallocateStaffFromUser = await db.deallocateStaffFromUser(uuid, modifyOn, modifyById)
           let deallocateUserFromStaff = await db.deallocateUserFromStaff(userData[0].linkedToId, modifyOn, modifyById)
        }
        let staffDeallocationHistoy = await db.staffDeallocationHistoy(userData[0].linkedToId, userData[0].id, new Date())
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
            "message" : "Something Went Wrong",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})
