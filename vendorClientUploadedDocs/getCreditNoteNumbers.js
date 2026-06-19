let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let attachmentType = 'Pdf'
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getCreditNoteNumberForPdf = []
        let documentAttachmentId = await db.getDocumentAttachmentId(attachmentType)
        getCreditNoteNumberForPdf = await db.getCreditNoteNumberForPdf(documentAttachmentId[0]?.id)
        getCreditNoteNumberForPdf = getCreditNoteNumberForPdf?.map(num => num?.creditNoteNumber)
        getCreditNoteNumberForPdf = getCreditNoteNumberForPdf?.length > 0 ? getCreditNoteNumberForPdf : []
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"creditNoteNumbers" : getCreditNoteNumberForPdf},
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