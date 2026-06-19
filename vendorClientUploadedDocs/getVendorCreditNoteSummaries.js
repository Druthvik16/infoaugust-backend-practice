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

        let getCreditNoteSummaries;
        let uploadDocList = []
        let uploadDocDetailList = []
        action = (action?.length > 0) ? ((action == 'CREDIT') ? 'Credit Note' : 'Debit Note') :  ''
        let getTotalCount = [{"totalCount":0}]
        console.log("Query Called", new Date(), " ___ ",getTotalCount)
        let getLastDocumentUploadOn = await db.getVendorLastDocumentUploadDate(clientUuid, 'Credit Note', vendorUuid, action)
        let uploadedOn = getLastDocumentUploadOn[0].uploadedOn
        console.log(uploadedOn)
        getCreditNoteSummaries = await db.getVendorCreditNoteSummaries(vendorUuid, clientUuid, fromDate, toDate, action, uploadedOn)
        console.log("Data Received and Sent", getCreditNoteSummaries?.length , new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"creditNotes" : getCreditNoteSummaries, 'totalMasterCount': getTotalCount[0].totalCount, "lastUploadedOn" : uploadedOn},
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