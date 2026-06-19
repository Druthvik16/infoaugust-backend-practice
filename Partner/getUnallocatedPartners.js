let db = require('./dbQueryPartner')
let partnerObj = require('../model/partner')
let partner = new partnerObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid/:managerUserUuid?*',async(req,res) => 
{
    try
    {
        let getUnallocatedPartners;
        let partnersList = []
        let clientUuid;
        let managerUserUuid;
        const userTypeCode = req.body.roleCode || null
        if(req.params['0'].length > 0 &&  req.params['0'] != '/')
        {
            let a = req.params['0'].split('/')
            if(a.length > 1)
            {
                clientUuid = req.params.clientUuid + a[0]
                managerUserUuid = a[1]
            }
            else if(a.length == 1) 
            {
                clientUuid = req.params.clientUuid + a[0]
                managerUserUuid = ""
            }
        }
        else
        {
            clientUuid = req.params.clientUuid
            managerUserUuid = req.params['managerUserUuid'] ? req.params['managerUserUuid'] : ""
        }
        getUnallocatedPartners = await db.getUnallocatedPartners(clientUuid, managerUserUuid, userTypeCode)
        if(getUnallocatedPartners.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedPartners" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            partnersList = []
            getUnallocatedPartners.forEach((element) => 
            {
                partner.setData(element)
                partnersList.push(partner.getData())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedPartners" : partnersList},
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