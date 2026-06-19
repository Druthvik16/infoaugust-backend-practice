let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let vendorCommonFunction = require('./vendorCommonFunction')

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        if(!req.body.vendor || !req.body.vendor?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let partnerUuid = req.body.vendor?.uuid
        let isFormValidated = 1
        let date = new Date()
        let vendor = await db.getPartner(partnerUuid)
        if(vendor?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor not found",
                "status_name" : getCode.getStatus(400)
            });
        }
        if(vendor[0]?.isFormValidated == 1)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor form already validated",
                "status_name" : getCode.getStatus(400)
            });
        }
        let vendorDocState = vendor[0].docState;
        if(vendorDocState?.toString()?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor documents submission are pending",
                "status_name" : getCode.getStatus(400)
            });
        }
        let vendorStatusId = vendor[0].vendorStatusId;
        let vendorStatusName = vendor[0].vendorStatusName;
        if(vendorStatusName == 'Registration-Initiated')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor registration process is incomplete",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'Document-Validated')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor validation already completed.",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'On-Boarded')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor is already on-boarded.",
                "status_name" : getCode.getStatus(400)
            });
        }        
        else  if(vendorStatusName == 'Document-Submitted')
        {
            let userId = req.body.userId;
            let partnerId = vendor[0].id            
            let getVendorRegistrationForm = await db.getVendorRegistrationForm(partnerId)
            if(getVendorRegistrationForm?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Fill vendor registration form",
                    "status_name" : getCode.getStatus(500)
                });
            }
            let  vendorFormValidation = await db.vendorFormValidation(partnerId, date, isFormValidated, userId)
            if(vendorFormValidation.affectedRows > 0)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message"     : "success",
                    "status_name" : getCode.getStatus(200),
                });
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Vendor document validation failed",
                    "status_name" : getCode.getStatus(500)
                })
            }
            
        }
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack || e.message || e,
            "status_name" : getCode.getStatus(500)
        }) 
    }
})



