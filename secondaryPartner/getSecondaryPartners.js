let db = require('./dbQuerySecondaryPartner')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let partnerObj = require('../model/partner')
let partner = new partnerObj()
module.exports = require('express').Router().get('/:fromDate?/:toDate?',async(req,res) => 
{
    try
    {        
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const userTypeCode = req.body.roleCode || null;
        const userId = req.body.userId || null;

        const getSecondaryPartners = await db.getSecondaryPartners(userTypeCode, fromDate, toDate, userId)

        // if(getSecondaryPartners.length == 0)
        //     {
        //         res.status(200)
        //         return res.json({
        //             "status_code" : 200,
        //             "message"     : "success",
        //             "data"        : {"secondaryPartners" : []},
        //             "status_name" : getCode.getStatus(200)
        //         });
        //     }
        //     else
        //     {
        //         partnerList = []
        //         getSecondaryPartners.forEach((element) => 
        //         {
        //             partner.setDataAll(element)
        //             partnerList.push(partner.getDataAll())
        //         });
        //         res.status(200)
        //         return res.json({
        //             "status_code" : 200,
        //             "message"     : "success",
        //             "data"        : {"secondaryPartners" : partnerList},
        //             "status_name" : getCode.getStatus(200)
        //         });
        //     }

            res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message"     : "success",
                    "data"        : {"secondaryPartners" : getSecondaryPartners},
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