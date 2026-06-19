let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid?/:partnerUuid?/:partnerLocationUuid?/:fromDate?/:toDate?/:documentCategoryId?/:documentId?',async(req,res) => 
{
    try
    {
        const userTypeCode = req.body.roleCode || null 
        const partnerUuid = req.query.partnerUuid || ""
        const partnerLocationUuid = req.query.partnerLocationUuid || ""
        const clientUuid = req.query.clientUuid || ""
        const fromDate = req.query.fromDate || ""
        const toDate = req.query.toDate || ""
        const documentCategoryId = req.query.documentCategoryId || null
        const documentId = req.query.documentId || null

        const documentCategories = await db.getDocumentCategories();
        const documentCategory = documentCategories.find(doc => doc.id == documentCategoryId)?.name || null;
        console.log(documentCategory, documentCategoryId)
        if(!documentCategory)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Document category not found",
                "status_name" : getCode.getStatus(500)
            });
        }

        const documents = await db.getDocuments();
        const document = documents.find(doc => doc.id == documentId)?.name || null;
        console.log(document, documentCategory)
        // if(!document)
        // {
        //     res.status(500)
        //     return res.json({
        //         "status_code" : 500,
        //         "message"     : "Document type not found",
        //         "status_name" : getCode.getStatus(500),
        //     });
        // }
       
        // const action = action?.length > 0 ? (action == 'PROMO' ? 'Promo/EOSS' : (action == 'CASH' ? 'Cash Discount' : (action == 'GIFT' ? 'Gift Voucher' : (action == 'INCENTIVE' ? 'Incentive' : (action == 'GOODS' ? 'Goods Return' :  (action == 'OTH' ? 'Other' : '')))))) : ''

        const action = document || ""
        
        let getLastDocumentUploadOn = await db.getLastDocumentUploadDate(clientUuid, documentCategory, partnerUuid, partnerLocationUuid, action, userTypeCode)

        const uploadedOn = getLastDocumentUploadOn[0].uploadedOn
        console.log(uploadedOn)

        const getSummaries = await db.getPendingPdfSummaries(partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, documentCategory, uploadedOn, userTypeCode)

        console.log("Data Received and Sent", getSummaries?.length , new Date())

        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"summaries" : getSummaries, "lastUploadedOn" : uploadedOn},
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
            "error"       : e?.stack
        });
    }
})