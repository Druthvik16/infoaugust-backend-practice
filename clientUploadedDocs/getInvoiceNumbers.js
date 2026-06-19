let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let attachmentType = 'Pdf'
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getInvoiceNumberForPdf = []
        let documentAttachmentId = await db.getDocumentAttachmentId(attachmentType)
        getInvoiceNumberForPdf = await db.getInvoiceNumberForPdf(documentAttachmentId[0]?.id)
        getInvoiceNumberForPdf = getInvoiceNumberForPdf?.map(num => num?.invoiceNumber)
        getInvoiceNumberForPdf = getInvoiceNumberForPdf?.length > 0 ? getInvoiceNumberForPdf : []
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"invoiceNumbers" : getInvoiceNumberForPdf},
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