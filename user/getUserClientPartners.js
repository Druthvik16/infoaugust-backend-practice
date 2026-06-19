let db = require('./dbQueryUser')
let userObj = require('../model/user')
let user = new userObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:userUuid',async(req,res) => 
{
    try
    {
        let getUserClientPartners;
        let usersList = []
        let userUuid;
        // getUserClientPartners
        userUuid = req.params.userUuid
        getUserClientPartners = await db.getUserClientPartners(userUuid)
        if(getUserClientPartners.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"userClientPartners" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            usersList = []
            getUserClientPartners.forEach((element) => 
            {
                user.setUserClientPartner(element)
                usersList.push(user.getUserClientPartner())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"userClientPartners" : usersList},
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})