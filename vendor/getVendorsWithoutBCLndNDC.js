let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getVendors;
let ledgerDocumentCategoryCode = 'LGR'
module.exports = require('express').Router().get('/:clientUuid/:action',async(req,res) => 
{
    try
    {
        const clientUuid = req.params.clientUuid;
        const action = req.params.action;
        const status = 'On-Boarded';    // BCL or NDC
        let documentCategory = await db.getDocumentCategories()
        let documentCategoryId = documentCategory.find(item => item.code == action)?.id
        if(!documentCategoryId)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Provide valid document category",
                "status_name" : getCode.getStatus(500)
            });
        }
        let ledgerDocumentCategoryId = documentCategory.find(item => item.code == ledgerDocumentCategoryCode)?.id
        getVendors = await db.getVendorsWithoutBCLndNDC(clientUuid, status, documentCategoryId, ledgerDocumentCategoryId)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"vendors" : getVendors},
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