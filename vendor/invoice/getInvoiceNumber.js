let db = require('../dbQueryVendor')
let errorCode = require('../../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:invoiceNumber',async(req,res) => 
{
    try
    {
        const invoiceNumber = req.params.invoiceNumber;
        let getVendorInvoiceNumber = await db.getVendorInvoiceNumber(invoiceNumber)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"isInvoiceNumber" : getVendorInvoiceNumber[0].invoiceNumberExists},
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