let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let createdOn;
        let documentCategoryId;
        let documentId;
        let vendorUuid;
        let clientUuid;
        let narration;
        let paidDate;
        let totalAmount;
        let billNoOrRefNo;
        let documentAttachmentId;
        let documentNewFolderPath;
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
        documentCategoryId = req.body.documentCategory?.id
        documentId = req.body.document?.id
        vendorUuid = req.body.vendor?.uuid
        clientUuid = req.body.client?.uuid
        narration = uniqueFunction.manageSpecialCharacter(req.body.narration)
        paidDate = req.body.paidDate;
        totalAmount = req.body.totalAmount
        billNoOrRefNo = req.body.billNoOrRefNo
        documentAttachmentId = req.body.documentAttachment?.id
        documentNewFolderPath = req.body.documentNewFolderPath
        createdOn =  new Date()
        
        let saveClientUploadedDocMaster = await db.saveClientUploadedDocMasterPAM(documentCategoryId, documentId, vendorUuid, clientUuid, narration, billNoOrRefNo, new Date(), paidDate, totalAmount)

        if(saveClientUploadedDocMaster.affectedRows > 0)
        {
            let s3FilePath = ""
            let fileName = ""            
            let encriptionKey = ""
            let encriptionIV = ""
            let saveClientUploadedDocDetail = await db.saveClientUploadedDocDetailPAM(fileName, s3FilePath, saveClientUploadedDocMaster.insertId, documentAttachmentId, createdOn, encriptionKey, encriptionIV) 
            
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
