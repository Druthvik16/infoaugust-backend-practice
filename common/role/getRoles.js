let db = require('./dbQueryRole')
let roleObj = require('../../model/role')
let role = new roleObj()
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getRoles;
        let roleList = []
        getRoles = await db.getRoles()
        if(getRoles.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"roles" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            roleList = []
            getRoles.forEach((element) => 
            {
                role.setData(element)
                roleList.push(role.getData())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"roles" : roleList},
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