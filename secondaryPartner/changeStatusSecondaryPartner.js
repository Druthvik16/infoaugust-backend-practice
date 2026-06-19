let db = require('./dbQuerySecondaryPartner')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')

module.exports = require('express').Router().get('/:uuid',async(req,res) => 
{
    try
    {
        const uuid = req.params.uuid;
        const userId = req.body.userId;
        const loggedUserType = req.body.loggedUserType  || 'SYSTEM'
        const currentData = await db.getSecondaryPartnerByUuid(uuid)
        const currentRecord = currentData[0]
        const changes = {};
        const logChanges = [];

        const field1s = {           
            is_active: currentRecord['is_active'] == 0 ? 1 : 0
        };

        const changeStatusSecondaryPartner = await db.changeStatusSecondaryPartner(uuid)
        if(changeStatusSecondaryPartner.affectedRows > 0)
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
            
            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(userId, loggedUserType, loggedUserTable, 'Partner User Profile Updated', uniqueFunction.manageSpecialCharacter(logChanges.join(' ,')), currentRecord.id, 'secondary_partner', null, 'success')
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Status not updated",
                "status_name" : getCode.getStatus(400)
            });
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Status not updated",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
})