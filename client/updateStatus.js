let db = require('./dbQueryClient')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let uuid;
        let modifyById;
        let modifyOn;
        const loggedUserType = req.body.loggedUserType  || 'SYSTEM'
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
        const currentData = await db.getClientCurrentData(uuid)
        const currentRecord = currentData[0]

        const changes = {};
        const logChanges = [];

        const field1s = {           
            is_active: currentRecord['is_active'] == 0 ? 1 : 0,
            modify_on : modifyOn,
            modify_by_id : modifyById
        };
        let updateStatus = await db.updateStatus(uuid,modifyOn,modifyById)
        if(updateStatus.affectedRows > 0)
        {
            for (const field in field1s) 
            {
                if (field1s[field] != currentRecord[field]) {
                    changes[field] = {
                        oldValue: currentRecord[field],
                        newValue: field1s[field],
                    };
                    
                    const fieldName = field?.toString().split('_').join(' ').replace(/\w\S*/g, function (txt) {
                        return txt.charAt(0).toUpperCase() +
                            txt.substr(1).toLowerCase();
                    });

                    logChanges.push(`${fieldName}: '${currentRecord[field]}' -> '${field1s[field]}'`);
                }
            }

            if (Object.keys(logChanges).length == 0) {
                logChanges.push(`No fields were changed.`)
            }                        
            const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null
            
            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(modifyById, loggedUserType, loggedUserTable, 'Client Profile Updated', uniqueFunction.manageSpecialCharacter(logChanges.join(' ,')), currentRecord.id, 'client', null, 'success')
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
            "error"     :      e?.stack
        })  
    }
})
