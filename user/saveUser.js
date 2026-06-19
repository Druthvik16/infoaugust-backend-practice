let db = require('./dbQueryUser')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let password;
        let name
        let uuid;
        let createdOn;
        let isActive
        let createdById;
        let allocatedToUuid;
        let roleId;
        let roleCode;
        let linkedToId;
        let passKey;
        let managerUserUuid;
        let managerUserId;
        if(!req.body.name?.trim() || !req.body.role  || !req.body.role?.id)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        password = 'admin';
        name = uniqueFunction.manageSpecialCharacter(req.body.name?.trim());
        roleId = req.body.role?.id
        allocatedToUuid = req.body.allocatedTo?.uuid?.length > 0 ? req.body.allocatedTo?.uuid : null
        managerUserUuid = req.body.managerUser?.uuid?.length > 0 ? req.body.managerUser?.uuid : null
        uuid = createUuid.v1()
        passKey = req.body.passKey
        createdOn =  new Date()
        createdById = req.body.userId;
        lastLoggedIn = null
        isActive = 1
        roleCode = await db.getRole(roleId)
        if(roleCode?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Role Not Found",
                "status_name" : getCode.getStatus(400)
            })
        }
        roleCode = roleCode[0].code
        if(roleCode == 'EXE')
        {
            if(managerUserUuid?.length > 0)
            {
                managerUserId = await db.getManagerUserData(managerUserUuid)
                if(managerUserId?.length == 0)
                {
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "Assigned Manager Not Exist",
                        "status_name" : getCode.getStatus(400)
                    })
                }
                managerUserId = managerUserId[0].id
            }
            else
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Assign Manager To User",
                    "status_name" : getCode.getStatus(400)
                })
            }
        }
        else
        {
            managerUserId = null
        }
       
        if(allocatedToUuid?.length > 0)
        {
            linkedToId = await db.getLinkedUserId(roleCode, allocatedToUuid)
            if(linkedToId?.length == 0 && roleCode == 'CLNT')
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Allocated Client Not Exist",
                    "status_name" : getCode.getStatus(400)
                })
            }
            else if(linkedToId?.length == 0 && roleCode != 'CLNT')
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "Allocated Staff Not Exist",
                    "status_name" : getCode.getStatus(400)
                })
            }
            linkedToId = linkedToId[0].id
            let identifierName = 'user'
            let id = 0
            let columnName = ['linked_to_id', 'role_id']
            let columnValue = 
            {
                "linked_to_id" : linkedToId,
                'role_id' : roleId
            }            
            let uniqueCheck = await uniqueFunction.unquieName(identifierName, columnName, columnValue, id, 0)
            if(uniqueCheck != 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"     : `${roleCode == 'CLNT'? 'Client' : 'Staff'} Already Allocated`,
                    "status_name" : getCode.getStatus(400)
                });
            }
        }
        else
        {
            linkedToId = null
        }
        let insertUser = await db.insertUser(uuid,name,linkedToId,roleId,createdById,password,createdOn, isActive, passKey, managerUserId)
        if(insertUser.affectedRows > 0)
        {
            let sql = ``
            if(linkedToId && roleCode == 'CLNT')
            {
                sql = ``
                sql = `UPDATE client SET linked_user_id = '${insertUser.insertId}', modify_on = ?, modify_by_id = '${createdById}' WHERE id = '${linkedToId}'`
            }
            else if(linkedToId && roleCode != 'CLNT')
            {
                sql = ``
                sql = `UPDATE staff SET current_user_id = '${insertUser.insertId}', modify_on = ?, modify_by_id = '${createdById}' WHERE id = '${linkedToId}'`

                let staffAllocationHistoy = await db.staffAllocationHistoy(linkedToId, insertUser.insertId, new Date())
            }
            if(linkedToId)
            {
                //  
                let updateStaffOrClient = await db.updateStaffOrClient(sql, [new Date()])
            }
            let returnUuid = await db.getReturnUuid(insertUser.insertId) 
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : { "uuid" : returnUuid[0].uuid},
                "status_name" : getCode.getStatus(200)
            })            
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "User Not Created",
                "status_name" : getCode.getStatus(500)
            }) 
        } 
    } 
    catch(e)
    {
        console.log(e)
        if(e.code == 'ER_DUP_ENTRY')
        {
            let msg = e.sqlMessage.replace('_UNIQUE', '');
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : msg,
                "status_name" : getCode.getStatus(500),
                "error"     :    msg
            }) 
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "User Not Created",
                "status_name" : getCode.getStatus(500),
                "error"     :      e
            }) 
        }    
    }
})
