let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let attachmentType = 'Pdf'

////////////// This api will called by cn working script if credit note number not found in json passed by sys.argv.////////////////////
module.exports = require('express').Router().get('/:creditNoteNumber/:partnerLocationCode/:postingDate',async(req,res) => 
{
    try
    {
        const creditNoteNumber = req.params.creditNoteNumber
        const partnerLocationCode = req.params.partnerLocationCode
        const postingDate = req.params.postingDate
        const getCreditNoteNo = await db.getCreditNoteNo(creditNoteNumber, partnerLocationCode, postingDate)
        const remark = getCreditNoteNo?.[0]?.isExist > 0 ? 'Already uploaded' : 'Credit note number not found in database'
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"remark" : remark},
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