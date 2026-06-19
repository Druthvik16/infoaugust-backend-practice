let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let attachmentType = 'Pdf'
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getForm16NumberForPdf = []
        let documentAttachmentId = await db.getDocumentAttachmentId(attachmentType)
        getForm16NumberForPdf = await db.getForm16NumberForPdf(documentAttachmentId[0]?.id)
        getForm16NumberForPdf = getForm16NumberForPdf?.map(num => num?.form16Number)
        getForm16NumberForPdf = getForm16NumberForPdf?.length > 0 ? getForm16NumberForPdf : []
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"form16Numbers" : getForm16NumberForPdf},
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