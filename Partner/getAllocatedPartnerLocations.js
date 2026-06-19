let db = require('./dbQueryPartner')
let partnerObj = require('../model/partnerLocation')
let partner = new partnerObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:userUuid',async(req,res) => 
{
    try
    {
        let getAllocatedPartnerLocations;
        let partnerLocationsList = []
        let userUuid;
        // getAllocatedPartnerLocations
        userUuid = req.params.userUuid
        getAllocatedPartnerLocations = await db.getAllocatedPartnerLocations(userUuid)
        if(getAllocatedPartnerLocations.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"allocatedPartnerLocations" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            partnerLocationsList = []
            getAllocatedPartnerLocations.forEach((element) => 
            {
                partner.setData(element)
                partnerLocationsList.push(partner.getData())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"allocatedPartnerLocations" : partnerLocationsList},
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