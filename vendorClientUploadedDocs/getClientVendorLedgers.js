let db = require('./dbQueryClientUploadedDocs')
let ledgerObj = require('../model/ledger')
let ledger = new ledgerObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid?/:vendorUuid?/:fromDate?/:toDate?',async(req,res) => 
{
    try
    {
        const clientUuid = req.query.clientUuid || "";
        const vendorUuid = req.query.vendorUuid || "";
        const fromDate = req.query.fromDate || "";
        const toDate = req.query.toDate || "";

        let getClientVendorLedgers;
        let uploadDocList = []
        let getTotalCount = [{"totalCount":0}]
        console.log("Query Called", new Date(), " ___ ",getTotalCount)
        let getLastDocumentUploadOn = await db.getLastDocumentUploadDate(clientUuid, 'Ledger', vendorUuid, '')
        let uploadedOn = getLastDocumentUploadOn[0].uploadedOn
        getClientVendorLedgers = await db.getClientVendorLedgers(vendorUuid, clientUuid, fromDate, toDate, uploadedOn)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"ledgers" : getClientVendorLedgers, 'totalMasterCount': getTotalCount[0].totalCount, "lastUploadedOn" : uploadedOn},
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