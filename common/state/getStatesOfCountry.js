let db = require('./dbQueryState')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:countryId',async(req,res) => 
{
    try
    {
        let countryId = req.params.countryId
        let getStatesOfCountry = await db.getStatesOfCountry(countryId)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"states" : getStatesOfCountry},
            "status_name" : getCode.getStatus(200)
        });
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