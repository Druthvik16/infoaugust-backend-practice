let db = require('./dbQueryPartner')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:partnerUuid/:action',async(req,res) => 
{
    try
    {
        let partnerUuid = req.params.partnerUuid
        let action = req.params.action // action = checked, unchecked
        let getDisclaimerStatus = await db.getDisclaimerStatus(partnerUuid)        
        if(getDisclaimerStatus[0].isDisclaimer == 0 && action == 'checked')
        {
            let updateDisclaimerStatus = await db.updateDisclaimerStatus(partnerUuid)
        }
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"isDisclaimer" : getDisclaimerStatus[0].isDisclaimer},
            "status_name" : getCode.getStatus(200)
        });
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})