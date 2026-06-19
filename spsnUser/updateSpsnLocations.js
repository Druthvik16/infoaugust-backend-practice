let db = require('./dbQuerySpsnUser')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        console.log(req.body)
        if(!req.body.moveTo || !req.body.partnerLocationsUuid || !req.body.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        const createdById = req.body.userId || 0;
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        let partnerLocationsUuid = req.body.partnerLocationsUuid
        let movedToUuid = req.body.moveTo?.uuid
        let uuid = req.body.uuid
        let getSpsn = await db.getSpsnWithUuid(movedToUuid)
        if(getSpsn?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Moved To Spsn not found",
                "status_name" : getCode.getStatus(400)
            })
        }
        let spsnId = getSpsn[0].id
        const currentDataLocation = await db.getPartnerLocationDataByUuids(partnerLocationsUuid)
        let updateSpsn = await db.updateSpsnLocations(spsnId, partnerLocationsUuid)
        if(updateSpsn.affectedRows > 0)
        { 
                    
            const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null
            
            for(const currentRecordLocation of currentDataLocation) 
            {
                const locationChanges = {};
                const locationLogChanges = [];
        
                const field2 = {
                    spsn_user_id : spsnId
                };
    
                
                for (const field in field2) {
                    if (field2[field] != currentRecordLocation[field]) {
                        locationChanges[field] = {
                            oldValue: currentRecordLocation[field],
                            newValue: field2[field],
                        };
                        
                        const fieldNameLocation = field?.toString().split('_').join(' ').replace(/\w\S*/g, function (txt) {
                            return txt.charAt(0).toUpperCase() +
                                txt.substr(1).toLowerCase();
                        });
    
                        locationLogChanges.push(`${fieldNameLocation}: '${currentRecordLocation[field]}' -> '${field2[field]}'`);
                    }
                }
    
                if (Object.keys(locationLogChanges).length == 0) {
                    locationLogChanges.push(`No fields were changed.`)
                }   
    
                const saveActivityLogLocation = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Profile Updated', uniqueFunction.manageSpecialCharacter(locationLogChanges.join(' ,')), currentRecordLocation.id, 'partner_location_detail', null, 'success')                  
            }  
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
                "message" : "SPSN Partner Locations Not Updated",
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
            "message" : "SPSN Partner Locations Not Updated",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})
