let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:uuid',async(req,res) => 
{
    try
    {
        let getPartnerLocation;
        let uuid;
        uuid = req.params.uuid
        getPartnerLocation = await db.getPartnerLocation(uuid)
        
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"partnerLocation" : getPartnerLocation[0]},
            "status_name" : getCode.getStatus(200)
        });
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