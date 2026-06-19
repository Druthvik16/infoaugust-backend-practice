let db = require('./dbQueryPartner')
let partnerObj = require('../model/partnerLocation')
let partner = new partnerObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:userUuid/:partnerUuid/:managerUserUuid?*',async(req,res) => 
{
    try
    {
        let getUnallocatedPartnerLocations;
        let partnerLocationsList = []
        let userUuid;
        let partnerUuid;
        let managerUserUuid;
        const userTypeCode = req.body.roleCode || null
        if(req.params['0'].length > 0 &&  req.params['0'] != '/')
        {
            let a = req.params['0'].split('/')
            if(a.length > 1)
            {
                partnerUuid = req.params.partnerUuid + a[0]
                managerUserUuid = a[1]
            }
            else if(a.length == 1) 
            {
                partnerUuid = req.params.partnerUuid + a[0]
                managerUserUuid = ""
            }
        }
        else
        {
            partnerUuid = req.params.partnerUuid
            managerUserUuid = req.params['managerUserUuid'] ? req.params['managerUserUuid'] : ""
        }
        userUuid = req.params.userUuid
        let getUserRoleCode = await db.getUserRoleCode(userUuid)
        if(getUserRoleCode?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "User IS Inactive OR Not Exist",
                "status_name" : getCode.getStatus(400)
            });
        }
        getUnallocatedPartnerLocations = await db.getUnallocatedPartnerLocations(partnerUuid, getUserRoleCode[0].code, managerUserUuid, getUserRoleCode[0].id, userTypeCode)
        if(getUnallocatedPartnerLocations.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedPartnerLocations" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            partnerLocationsList = []
            getUnallocatedPartnerLocations.forEach((element) => 
            {
                partner.setData(element)
                partnerLocationsList.push(partner.getData())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedPartnerLocations" : partnerLocationsList},
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