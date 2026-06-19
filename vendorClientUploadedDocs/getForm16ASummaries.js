let db = require('./dbQueryClientUploadedDocs')
let CNSObj = require('../model/creditNoteSummary')
let cns = new CNSObj()
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

        let getForm16ASummaries;
        let uploadDocList = []
        let getTotalCount = [{"totalCount":0}]
        console.log("Query Called", new Date(), " ___ ",getTotalCount)
        let getLastDocumentUploadOn = await db.getLastDocumentUploadDate(clientUuid, 'Form16A', vendorUuid, '')
        let uploadedOn = getLastDocumentUploadOn[0].uploadedOn
        getForm16ASummaries = await db.getForm16ASummaries(vendorUuid, clientUuid, fromDate, toDate, uploadedOn)
        console.log("Data Received and Sent", getForm16ASummaries?.length , new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"form16s" : getForm16ASummaries, 'totalMasterCount': getTotalCount[0].totalCount, "lastUploadedOn" : uploadedOn},
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