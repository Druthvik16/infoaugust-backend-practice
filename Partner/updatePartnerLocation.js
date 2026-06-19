let db = require('./dbQueryPartner')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    { 
        console.log(req.body)
        if (
            !req.body.uuid ||
            !req.body.storeName ||
            !req.body.storeLocation ||
            !req.body.pincode ||
            !req.body.addressLine1 ||
            !req.body.city
        ) {
            res.status(400);
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            });
        }
        
        const uuid = req.body.uuid
        const storeName = uniqueFunction.manageSpecialCharacter(req.body.storeName)
        const storeLocation = uniqueFunction.manageSpecialCharacter(req.body.storeLocation)
        const msemNumber = uniqueFunction.manageSpecialCharacter(req.body.msemNumber) || ''
        const tan = uniqueFunction.manageSpecialCharacter(req.body.tan) || ''
        const pincode = uniqueFunction.manageSpecialCharacter(req.body.pincode)
        const addressLine1 = uniqueFunction.manageSpecialCharacter(req.body.addressLine1)
        const addressLine2 = uniqueFunction.manageSpecialCharacter(req.body.addressLine2) || ''
        const addressLine3 = uniqueFunction.manageSpecialCharacter(req.body.addressLine3) || ''
        const city = uniqueFunction.manageSpecialCharacter(req.body.city)
        createdOn =  new Date()
        createdById = req.body.userId || 0;
        isActive = 1
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        const currentData = await db.getPartnerLocationByUuid(uuid)
        const currentRecord = currentData[0]

        const changes = {};
        const logChanges = [];

        console.log({storeLocation, storeName, addressLine1, addressLine2, addressLine3, tan, msemNumber, city, pincode})

        const field1s = {
            store_name: storeName,
            store_location : storeLocation,
            tan,
            address_line1 : addressLine1,
            address_line2 : addressLine2,
            address_line3 : addressLine3,
            city,
            pincode,
            msme_number : msemNumber,
            // modify_on : createdOn,
            // modify_by_id : createdById
        };

        let updatePartner = await db.updatePartnerLocationData(uuid, storeName, storeLocation, msemNumber, tan, pincode, addressLine1, addressLine2, addressLine3, city)
        console.log("Updated", updatePartner)
        if(updatePartner.affectedRows > 0)
        {        
            for (const field in field1s) {
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
            
            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Profile Updated', uniqueFunction.manageSpecialCharacter(logChanges.join(' ,')), currentRecord.id, 'partner_location_detail', null, 'success')       
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
                "message" : "Partner Not Updated",
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
            "message" : "Partner Not Updated",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack
        }) 
    }
})
