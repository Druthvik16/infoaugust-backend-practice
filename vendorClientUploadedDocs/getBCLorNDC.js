let db = require('./dbQueryClientUploadedDocs')
let CNSObj = require('../model/creditNoteSummary')
let cns = new CNSObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid?/:vendorUuid?/:fromDate?/:toDate?/:action?',async(req,res) => 
{
    try
    {
        const clientUuid = req.query.clientUuid || "";
        const vendorUuid = req.query.vendorUuid || "";
        const fromDate = req.query.fromDate || "";
        const toDate = req.query.toDate || "";
        let action = req.query.action || "";

        let getBCLorNDC;
        let getTotalCount = [{"totalCount":0}]
        let documentCategory = await db.getDocumentCategories()
        let documentCategoryId = documentCategory.find(item => item.code == action)?.id
        action = (action?.length > 0) ? ((action == 'BCL') ? 'Balance Confirmation Letter' : 'No Dues Certificate') :  ''
        let getLastDocumentUploadOn = await db.getLastDocumentUploadDate(clientUuid, action, vendorUuid, action)
        let uploadedOn = getLastDocumentUploadOn[0].uploadedOn
        console.log(uploadedOn)
        getBCLorNDC = await db.getBCLorNDC(vendorUuid, clientUuid, fromDate, toDate, action, uploadedOn, documentCategoryId)
        console.log("Data Received and Sent", getBCLorNDC?.length , new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"balanceConfirmationOrNoDues" : getBCLorNDC, 'totalMasterCount': getTotalCount[0].totalCount, "lastUploadedOn" : uploadedOn},
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









