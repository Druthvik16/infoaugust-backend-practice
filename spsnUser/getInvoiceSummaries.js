let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().get('/:spsnUuid?/:partnerUuid?/:partnerLocationUuid?/:clientUuid?/:fromDate?/:toDate?/:dateType?/:selectedSpsnUuid?', async (req, res) => {
    try {
        const userTypeCode = req.body.roleCode || null
        const spsnUuid = req.query.spsnUuid || '';
        const partnerUuid = req.query.partnerUuid || '';
        const partnerLocationUuid = req.query.partnerLocationUuid || null;
        const clientUuid = req.query.clientUuid || null;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const dateType = req.query.dateType || ''; // posting or uploaded
        const selectedSpsnUuid = req.query.selectedSpsnUuid || ''

        
        const userDesignation = req.body.loggedUserType || null;

        let getLastDocumentUploadOn = await db.getLastDocumentUploadDate(clientUuid, 'Invoice', partnerUuid, partnerLocationUuid, '', spsnUuid, userTypeCode, userDesignation, selectedSpsnUuid)

        let uploadedOn = getLastDocumentUploadOn[0]
        
        const lastUploadedOn = dateType == 'posting' ? uploadedOn.postingDate : uploadedOn.uploadedOn

        const getInvoiceSummaries = await db.getInvoiceSummaries(partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, null, spsnUuid, uploadedOn, userTypeCode, dateType, userDesignation, selectedSpsnUuid)

        res.status(200)
        return res.json({
            "status_code": 200,
            "message": "success",
            "data": { "invoiceSummaries": getInvoiceSummaries, lastUploadedOn},
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