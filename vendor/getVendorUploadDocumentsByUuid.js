let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:uuid',async(req,res) => 
{
    try
    {
        let uuid = req.params.uuid

        
        let vendor = await db.getPartner(uuid)
        if(vendor?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor not found",
                "status_name" : getCode.getStatus(400)
            });
        }                    
        let id = vendor[0].id    
        console.log(id)
        let getVendorUploadDocuments = await db.getVendorUploadDocuments(id)
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