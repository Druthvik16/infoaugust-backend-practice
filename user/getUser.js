let db = require('./dbQueryUser')
let userObj = require('../model/user')
let user = new userObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:userUuid',async(req,res) => 
{
    try
    {
        let action = req.params.action;
        let getUser;
        let userClients = []
        let userClientPartner = []
        let userUuid;
        userUuid = req.params.userUuid        
        getUser = await db.getUser(userUuid) 
        if(getUser.length == 0)
        {
            getUser = await db.getAddonUser(userUuid) 
        } 
        if(getUser.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"user" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            userClientPartner = []
            userClients = []
            userClients = getUser.filter(client => 
            {
                return (client.userClientId != null)
            })
            userClients.forEach(client => {
                user.setUserClientPartner(client)
                userClientPartner.push(user.getUserClientPartner())
            })  
            getUser[0]['userClientPartner'] = userClientPartner   
            user.setDataAll(getUser[0])
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"user" : user.getDataAll()},
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