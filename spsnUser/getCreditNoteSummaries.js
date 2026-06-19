let db = require('./dbQuerySpsnUser')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().get('/:spsnUuid?/:partnerUuid?/:partnerLocationUuid?/:clientUuid?/:fromDate?/:toDate?/:action?/:dateType?/:selectedSpsnUuid?', async (req, res) => {
    try {
        const userTypeCode = req.body.roleCode || null
        const spsnUuid = req.query.spsnUuid || '';
        const partnerUuid = req.query.partnerUuid || '';
        const partnerLocationUuid = req.query.partnerLocationUuid || null;
        const clientUuid = req.query.clientUuid || null;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        let action = req.query.action || '';
        const dateType = req.query.dateType || ''; // posting or uploaded
        const selectedSpsnUuid = req.query.selectedSpsnUuid || ''

        
        const userDesignation = req.body.loggedUserType || null;

        action = action?.length > 0 ? (action == 'PROMO' ? 'Promo/EOSS' : (action == 'CASH' ? 'Cash Discount' : (action == 'GIFT' ? 'Gift Voucher' : (action == 'INCENTIVE' ? 'Incentive' : (action == 'GOODS' ? 'Goods Return' : (action == 'OTH' ? 'Other' : '')))))) : ''
        let getLastDocumentUploadOn = await db.getLastDocumentUploadDate(clientUuid, 'Credit Note', partnerUuid, partnerLocationUuid, action, spsnUuid, userTypeCode, userDesignation, selectedSpsnUuid)

        let uploadedOn = getLastDocumentUploadOn[0]
        const lastUploadedOn = dateType == 'posting' ? uploadedOn.postingDate : uploadedOn.uploadedOn
        console.log(uploadedOn)
        const getCreditNoteSummaries = await db.getCreditNoteSummaries(partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, null, spsnUuid, uploadedOn, userTypeCode, dateType, userDesignation, selectedSpsnUuid)
        console.log("Data Received and Sent", getCreditNoteSummaries?.length, new Date())
        res.status(200)
        return res.json({
            "status_code": 200,
            "message": "success",
            "data": { "creditNoteSummaries": getCreditNoteSummaries, lastUploadedOn },
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