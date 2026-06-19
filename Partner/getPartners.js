let db = require('./dbQueryPartner')
let partnerObj = require('../model/partner')
let partner = new partnerObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid/:partnerCategoryId?/:fromDate?/:toDate?',async(req,res) => 
{
    try
    {
        let getPartners;
        let partnerList = []

        
        const clientUuid = req.params.clientUuid
        const partnerCategoryId = req.query.partnerCategoryId || null;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const userTypeCode = req.body.roleCode || null

        getPartners = await db.getPartners(clientUuid, partnerCategoryId, userTypeCode, fromDate, toDate)
        if(getPartners.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"partners" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            partnerList = []
            getPartners.forEach((element) => 
            {
                partner.setDataAll(element)
                partnerList.push(partner.getDataAll())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"partners" : partnerList},
                "status_name" : getCode.getStatus(200)
            });
        }
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