let db = require('../dbQueryVendor')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:poNumber',async(req,res) => 
{
    try
    {
        const poNumber = req.params.poNumber;
        let getVendorPONumber = await db.getVendorPONumber(poNumber)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"isPONumber" : getVendorPONumber[0].poNumberExists},
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