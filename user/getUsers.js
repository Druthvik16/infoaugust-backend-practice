let db = require('./dbQueryUser')
let userObj = require('../model/user')
let user = new userObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getUsers;
        let usersList = []
        getUsers = await db.getUsers()
        if(getUsers.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"users" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            usersList = []
            getUsers.forEach((element) => 
            {
                user.setDataAll(element)
                usersList.push(user.getDataAll())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"users" : usersList},
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