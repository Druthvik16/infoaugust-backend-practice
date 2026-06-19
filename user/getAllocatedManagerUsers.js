let db = require('./dbQueryUser')
let userObj = require('../model/user')
let user = new userObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getAllocatedManagerUsers;
        let usersList = []
        getAllocatedManagerUsers = await db.getAllocatedManagerUsers()
        if(getAllocatedManagerUsers.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedManagerUsers" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            usersList = []
            getAllocatedManagerUsers.forEach((element) => 
            {
                user.setAllocatedManagerUsers(element)
                usersList.push(user.getAllocatedManagerUsers())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedManagerUsers" : usersList},
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