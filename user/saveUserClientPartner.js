let db = require('./dbQueryUser')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()


module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let createdOn;
        let isActive
        let createdById;
        let clientUuid;
        let userUuid;
        let partnerLocations;
        let userData;
        let clientId;
        if(!req.body.user || !req.body.user?.uuid || !req.body.client  || !req.body.client?.uuid || req.body.partnerLocations?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        userUuid = req.body.user?.uuid
        clientUuid = req.body.client?.uuid
        partnerLocations = req.body.partnerLocations
        createdOn =  new Date()
        createdById = req.body.userId;
        isActive = 1
        userData = await db.getUserData(userUuid);
        if(!userData[0]?.id)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "User Not Exist",
                "status_name" : getCode.getStatus(400)
            })
        }
        if(userData[0]?.code != 'MGR' && userData[0]?.code != 'EXE')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Only Manager or Executive User Mapped With Client Partner",
                "status_name" : getCode.getStatus(400)
            })
        }
        if(!userData[0]?.id)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "User Not Exist",
                "status_name" : getCode.getStatus(400)
            })
        }
        clientId = await db.checkClientExist(clientUuid)
        if(clientId.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Client Not Exist",
                "status_name" : getCode.getStatus(400)
            })
        }
        clientId = clientId[0]?.id
        let deleteUserClientPartnerByUserAndClient = await db.deleteUserClientPartnerByUserAndClient(userData[0]?.id, clientId)
        saveUserClientPartner(partnerLocations, 0, partnerLocations?.length, clientId, res, [], userData, createdById)
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "User Client Partner Not Created",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

async function saveUserClientPartner(partnerLocations, start, end, clientId, res, unsavedPartnerLocations, userData, createdById)
{
    try
    {
        if(start < end)
        {
            let ele = partnerLocations[start];
            let partnerId = await db.getPartnerData(ele.uuid)  
            console.log(partnerId, (partnerId?.length == 0), (!partnerId)) 
            if(partnerId?.length == 0 || !partnerId)
            {
                unsavedPartnerLocations.push(ele)
                start++
                saveUserClientPartner(partnerLocations, start, end, clientId, res, unsavedPartnerLocations, userData, createdById)
            }   
            else
            {
                let partnerLocationId = partnerId[0]?.partnerLocationId
                partnerId = partnerId[0]?.partnerId
                let uuid = createUuid.v1()
                let saveDataUserClientPartner = await db.saveDataUserClientPartner(uuid, userData[0]?.id, clientId, new Date(), createdById, isActive, partnerId, partnerLocationId)
                start++
                saveUserClientPartner(partnerLocations, start, end, clientId, res, unsavedPartnerLocations, userData, createdById)
            } 
        }
        else
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : {"unsavedPartnerLocations" : unsavedPartnerLocations},
                "status_name" : getCode.getStatus(200)
            })
        }
    }
    catch(e)
    {
        console.log(2)
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "User Client Partner Not Created",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
}