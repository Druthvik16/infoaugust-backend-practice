let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:uuid',async(req,res) => 
{
    try
    {
        let uuid = req.params['uuid']
        let getVendor = await db.getVendor(uuid)
        let getVendorDocuments = await db.getVendorUploadDocuments(getVendor[0]?.id);
        const sanitizedData = getVendorDocuments.map(row => {
            const { encryptionKey, encryptionIV, filePath, ...sanitizedRow } = row;
            return sanitizedRow;
        });
        getVendor[0]['vendorDocuments'] = sanitizedData
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"vendor" : getVendor[0]},
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