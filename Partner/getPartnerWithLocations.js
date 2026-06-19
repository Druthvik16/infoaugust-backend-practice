let db = require('./dbQueryPartner')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid/:partnerCategoryId?/:fromDate?/:toDate?',async(req,res) => 
{
    try
    {     
        const clientUuid = req.params.clientUuid
        const partnerCategoryId = req.query.partnerCategoryId || null;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const userTypeCode = req.body.roleCode || null

        let getPartners = await db.getPartnerWithLocations(clientUuid, partnerCategoryId, userTypeCode, fromDate, toDate)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"partnerLocations" : getPartners},
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