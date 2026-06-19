let db = require('./dbQueryPartner')
let partnerObj = require('../model/partner')
let partner = new partnerObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        const userId = req.body.userId;
        const getPartnerLocationForSecondaryMapping = await db.getPartnerLocationForSecondaryMapping(userId)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"partnerLocations" : getPartnerLocationForSecondaryMapping},
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
            "error"       : e?.stack
        });
    }
})