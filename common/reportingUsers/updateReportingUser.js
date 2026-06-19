let db = require('./dbQueryReportingUsers')
let uniqueFunction = require('../commonFunction/uniqueSearchFunction')
let commondb = require('../commonFunction/dbQueryCommonFuntion')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        if(!req.body.id || !req.body.name || !req.body.email || !req.body.type || !req.body.client || !req.body.client?.uuid)
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
        let id = req.body.id
        let columnName = ['email']
        let columnValue = 
        {
            "email" : email
        }
        let uniqueCheck = await uniqueFunction.unquieName(identifierName, columnName, columnValue, id, 0)
        if(uniqueCheck == 0)
        {
            let updateReportingUser = await db.updateReportingUser(name, email, type, new Date(), createdById, clientUuid, id)
            if(updateReportingUser.affectedRows > 0)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message"     : "success",
                    "status_name" : getCode.getStatus(200)
                });
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "User not updated",
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
            "message"     : "User not updated",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})