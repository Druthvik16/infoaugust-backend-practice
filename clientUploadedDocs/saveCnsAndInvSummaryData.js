let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let createdOn;
        let documentDate;
        let documentNumber;
        let documentCategoryId;
        let documentId;
        let partnerLocationDetailUuid;
        let clientUuid;
        let narration;
        let monthPeriod;
        let postingDate;
        let debitAmount;
        let creditAmount;
        let billNoOrRefNo;
        let documentAttachmentId;
        let documentNewFolderPath;
        let openingBalance;
        let closingBalance;
        let fileObject = {};
        if(!req.body.client || !req.body.client?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }

        documentDate = req.body.documentDate
        documentNumber = req.body.documentNumber
        documentCategoryId = req.body.documentCategory?.id
        documentId = req.body.document?.id
        partnerLocationDetailUuid = req.body.partnerLocationDetail?.uuid
        clientUuid = req.body.client?.uuid
        narration = uniqueFunction.manageSpecialCharacter(req.body.narration)
        monthPeriod = req.body.monthPeriod
        postingDate = req.body.postingDate
        debitAmount = req.body.debitAmount
        creditAmount = req.body.creditAmount
        billNoOrRefNo = req.body.billNoOrRefNo
        documentAttachmentId = req.body.documentAttachment?.id
        documentNewFolderPath = req.body.documentNewFolderPath
        openingBalance = ''
        closingBalance = ''
        createdOn =  new Date()
        
        let saveClientUploadedDocMaster = await db.saveClientUploadedDocMaster(documentDate, documentNumber, documentCategoryId, documentId, partnerLocationDetailUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, createdOn, openingBalance, closingBalance)

        if(saveClientUploadedDocMaster.affectedRows > 0)
        {
            let s3FilePath = ""
            let fileName = ""            
            let encriptionKey = ""
            let encriptionIV = ""
            let saveClientUploadedDocDetail = await db.saveClientUploadedDocDetail(fileName, s3FilePath, saveClientUploadedDocMaster.insertId, documentAttachmentId, createdOn, encriptionKey, encriptionIV) 
            
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : getCode.getStatus(200)
            })            
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Summary Data Not Saved",
                "status_name" : getCode.getStatus(500)
            }) 
        } 
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Summary Data Not Saved",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})
