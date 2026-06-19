let db = require('./dbQueryState')
let stateObj = require('../../model/state')
let state = new stateObj()
let errorCode = require('../errorCode/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:countryCode',async(req,res) => 
{
    try
    {
        let getStatesByCountryCode;
        let statesList = []
        let countryCode;
        countryCode = req.params.countryCode
        let countryIsExistByCode = await db.countryIsExistByCode(countryCode)
        if(countryIsExistByCode.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Country Not Exist",
                "status_name" : getCode.getStatus(400)
            });
        }
        getStatesByCountryCode = await db.getStatesByCountryCode(countryCode)
        if(getStatesByCountryCode.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"states" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            statesList = []
            getStatesByCountryCode.forEach((element) => 
            {
                state.setDataAll(element)
                statesList.push(state.getData())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"states" : statesList},
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