let db = require('./dbQuerySecondaryPartner')
let partnerLocationObj = require('../model/partnerLocation')
let partnerLocation = new partnerLocationObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:secondaryPartnerUuid/:stateId?',async(req,res) => 
{
    try
    {
        const userTypeCode = req.body.roleCode || null;
        const secondaryPartnerUuid = req.params.secondaryPartnerUuid || null;
        const stateId = req.query.stateId || null;
        const userId = req.body.userId || null;
       
        const getSecondaryPartnerLocations = await db.getSecondaryPartnerLocations(secondaryPartnerUuid, stateId, userTypeCode, userId)
        // if (getSecondaryPartnerLocations.length == 0) {
        //     res.status(200)
        //     return res.json({
        //         "status_code": 200,
        //         "message": "success",
        //         "data": { "secondaryPartnerLocations": [] },
        //         "status_name": getCode.getStatus(200)
        //     });
        // }
        // else {
        //     const partnerLocationList = []
        //     getSecondaryPartnerLocations.forEach((element) => {
        //         partnerLocation.setDataAll(element)
        //         partnerLocationList.push(partnerLocation.getDataAll())
        //     });
        //     res.status(200)
        //     return res.json({
        //         "status_code": 200,
        //         "message": "success",
        //         "data": { "secondaryPartnerLocations": partnerLocationList },
        //         "status_name": getCode.getStatus(200)
        //     });
        // }
        res.status(200)
        return res.json({
            "status_code": 200,
            "message": "success",
            "data": { "secondaryPartnerLocations": getSecondaryPartnerLocations },
            "status_name": getCode.getStatus(200)
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