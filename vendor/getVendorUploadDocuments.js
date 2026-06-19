let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let userId = req.body.userId
        console.log(userId)
        let getVendorUploadDocuments = await db.getVendorUploadDocuments(userId)
        const sanitizedData = getVendorUploadDocuments.map(row => {
            const { encryptionKey, encryptionIV, filePath, ...sanitizedRow } = row;
            return sanitizedRow;
        });
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"vendorUploadDocuemts" : sanitizedData},
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