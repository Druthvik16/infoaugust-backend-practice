let db = require('./dbQueryReportingUsers')
let uniqueFunction = require('../commonFunction/uniqueSearchFunction')
let commondb = require('../commonFunction/dbQueryCommonFuntion')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        if(!req.body.name || !req.body.email || !req.body.type || !req.body.client || !req.body.client?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let name = uniqueFunction.manageSpecialCharacter(req.body.name);
        let email = uniqueFunction.manageSpecialCharacter(req.body.email);
        let type = uniqueFunction.manageSpecialCharacter(req.body.type);
        let clientUuid = uniqueFunction.manageSpecialCharacter(req.body.client?.uuid);
        let createdById = req.body.userId;
        let accessToken = req.body?.accessToken;
        let identifierName = 'reporting_user'
        let id = 0
        let columnName = ['email']
        let columnValue = 
        {
            "email" : email
        }
        let uniqueCheck = await uniqueFunction.unquieName(identifierName, columnName, columnValue, id, 0)
        if(uniqueCheck == 0)
        {
            let saveReportingUser = await db.saveReportingUser(name, email, type, new Date(), createdById, clientUuid)
            if(saveReportingUser.affectedRows > 0)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message"     : "success",
                    "data"        : {"id" : saveReportingUser.insertId},
                    "status_name" : getCode.getStatus(200)
                });
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "User not saved",
                    "status_name" : getCode.getStatus(500)
                });
            }
        }
        else if(uniqueCheck == 1)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "User Email Already Exist",
                "status_name" : getCode.getStatus(400)
            });
        }
        else
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "User not saved",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})