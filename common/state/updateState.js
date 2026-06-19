let db = require('./dbQueryState')
let uniqueFunction = require('../commonFunction/uniqueSearchFunction')
let commondb = require('../commonFunction/dbQueryCommonFuntion')
let errorCode = require('../errorCode/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let name;
        let modifyOn;
        let modifyById;
        let accessToken;
        let id;
        let countryId;
        if(!req.body.name || !req.body.id || !req.body.country || !req.body.country?.id)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        name = req.body.name?.trim();
        countryId = req.body.country?.id
        accessToken = req.body.accessToken;
        let identifierName = 'state'
        id = req.body.id
        let columnName = ['name','country_id']
        let columnValue = 
        {
            "name" : name,
            "country_id" : countryId
        }
        let uniqueCheck = await uniqueFunction.unquieName(identifierName, columnName, columnValue, id, 0)
        if(uniqueCheck == 0)
        {
            modifyOn = new Date()
            authData = await commondb.selectToken(accessToken)
            modifyById = authData[0].userId
            let updateState = await db.updateState(name, modifyOn, modifyById, id, countryId)
            if(updateState.affectedRows > 0)
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
                    "message"     : "State not updated",
                    "status_name" : getCode.getStatus(500)
                });
            }
        }
        else if(uniqueCheck == 1)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "State Name Already Exist For Country",
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
            "message"     : "State not updated",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})