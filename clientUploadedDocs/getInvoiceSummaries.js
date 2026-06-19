let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().get('/:partnerUuid?/:partnerLocationUuid?/:clientUuid?/:fromDate?/:toDate?/:dateType?', async (req, res) => {
    try {
        const userTypeCode = req.body.roleCode || null
        const partnerUuid = req.query.partnerUuid || '';
        const partnerLocationUuid = req.query.partnerLocationUuid || null;
        const clientUuid = req.query.clientUuid || null;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const dateType = req.query.dateType || ''; // posting or uploaded
        const loggedUserType = req.body.loggedUserType || null;

        // let getTotalCount = await db.getTotalCount(partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, 'Invoice')

        let getTotalCount = [{ "totalCount": 0 }]

        let getLastDocumentUploadOn = await db.getLastDocumentUploadDate(clientUuid, 'Invoice', partnerUuid, partnerLocationUuid, '', userTypeCode, loggedUserType)

        let uploadedOn = getLastDocumentUploadOn[0]
        console.log(uploadedOn)
        
        const lastUploadedOn = dateType == 'posting' ? uploadedOn.postingDate : uploadedOn.uploadedOn

        const getInvoiceSummaries = await db.getInvoiceSummaries(partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, null, uploadedOn, userTypeCode, dateType, loggedUserType)

        res.status(200)
        return res.json({
            "status_code": 200,
            "message": "success",
            "data": { "invoiceSummaries": getInvoiceSummaries, 'totalMasterCount': getTotalCount[0].totalCount, lastUploadedOn },
            "status_name": getCode.getStatus(200)
        });
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "No Data Found",
            "status_name": getCode.getStatus(500),
            "error": e
        });
    }
})