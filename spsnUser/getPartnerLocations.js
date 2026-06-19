let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:partnerUuid/:stateId?*',async(req,res) => 
{
    try
    {
        let getPartnerLocations;
        let partnerUuid;
        let stateId;
        const userTypeCode = req.body.roleCode || null
        const userDesignation = req.body.loggedUserType || null;
        if(req.params['0'].length > 0 &&  req.params['0'] != '/')
        {
            let a = req.params['0'].split('/')
            if(a.length > 1)
            {
                partnerUuid = req.params.partnerUuid + a[0]
                stateId = a[1]
            }
            else if(a.length == 1) 
            {
                partnerUuid = req.params.partnerUuid + a[0]
                stateId = ""
            }
        }
        else
        {
            partnerUuid = req.params.partnerUuid
            stateId = req.params['stateId'] ? req.params['stateId'] : ""
        }
        getPartnerLocations = await db.getPartnerLocations(partnerUuid, stateId, userTypeCode, userDesignation)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"partnerLocations" : getPartnerLocations},
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