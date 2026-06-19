let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let axios = require('axios');
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let documentCategoryCode = 'BCL'
let documentCategoryLedgerCode = 'LGR'
let documentAttachmentName = 'Summary'
let documentTypeCode = 'BCL'
let statusFailed = 'Failed'
let statusSuccess = 'Success'

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let documentCategoryId;
        let documentId;
        let vendorUuids;
        let documentAttachmentId;
        if(!req.body.vendorUuids || req.body.vendorUuids?.length == 0 || !req.body.client?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        let documentCategory = await db.getDocumentCategories()
        documentCategoryId = documentCategory.find(item => item.code == documentCategoryCode)?.id
        let documentCategoryLedgerId = documentCategory.find(item => item.code == documentCategoryLedgerCode)?.id
        let documentAttachment = await db.getDocumentAttachments()
        documentAttachmentId = documentAttachment.find(item => item.name == documentAttachmentName)?.id
        let documentType = await db.getDocuments()
        documentId = documentType.find(item => item.code == documentTypeCode)?.id
        vendorUuids = req.body.vendorUuids
        userId = req.body.userId     ////////    client user id
        let clientUuid = req.body.client?.uuid
        let vendorsLedger = await db.getVendorsLedger(vendorUuids, documentCategoryLedgerId)
        let client = await db.getClient(clientUuid)
        console.log(documentCategoryId, documentCategory, documentAttachment, documentAttachmentId, documentType, documentId, client)
        let response = await processVendor(vendorsLedger, 0, vendorsLedger?.length, documentCategoryId, client[0], documentId, documentAttachmentId, [], []);

        if(response)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : { result : response?.vendorResult},
                "status_name" : getCode.getStatus(200)
            })  
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Balance confirmation not generated",
                "status_name" : getCode.getStatus(500),
            }) 
        }
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Balance confirmation not generated",
            "status_name" : getCode.getStatus(500),
            "error"     :      e?.stack || e?.message
        }) 
    }
})

async function processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail) 
{
    try
    {
        if(start < end)
        {
            let vendorLedger = vendorLedgers[start];
            let vendorId = vendorLedger.id;
            let amount = vendorLedger.closing_balance;
            let uploadedOn = new Date()
            if(!amount || amount?.toString()?.length == 0)
            {                
                vendorResult.push(perparedResult(vendorLedger, statusFailed, 'Invalid closing balance'));
                start++
                return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail) 
            }
            let saveBalanceConfirmationAndNoDueLog = await db.saveBalanceConfirmationAndNoDueLog(new Date(), documentCategoryId, vendorId)             
            if(saveBalanceConfirmationAndNoDueLog?.affectedRows > 0)
            {
                let saveClientUploadedDocMaster = await db.saveClientUploadedDocMasterBDLNDC(documentCategoryId, documentId, vendorId, client.id, uploadedOn, amount)
    
                if(saveClientUploadedDocMaster.affectedRows > 0)
                {
                    let s3FilePath = ""
                    let fileName = ""            
                    let encriptionKey = ""
                    let encriptionIV = ""
                    let saveClientUploadedDocDetail = await db.saveClientUploadedDocDetailPAM(fileName, s3FilePath, saveClientUploadedDocMaster.insertId, documentAttachmentId, new Date(), encriptionKey, encriptionIV) 
                    if(saveClientUploadedDocDetail.affectedRows > 0)
                    {
                        vendorResult.push(perparedResult(vendorLedger, statusSuccess, ''));
                        vendorToMail.push(vendorLedger) 
                        start++
                        return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail) 
                    }
                    else
                    {
                        vendorResult.push(perparedResult(vendorLedger, statusFailed, 'Balance confirmation not generated'));
                        start++
                        return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail) 
                    }    
                }
                else
                {
                    vendorResult.push(perparedResult(vendorLedger, statusFailed, 'Balance confirmation not generated'));
                    start++
                    return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail) 
                }
            }
            else
            {
                vendorResult.push(perparedResult(vendorLedger, statusFailed, 'Balance confirmation not generated'));
                start++
                return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail) 
            }
        }
        else
        {
            balanceConfirmationInitiatedTemplate(vendorToMail, client.name)
            return {result : true, vendorResult}
        }
    }
    catch (e)
    {
        console.log(e);
        vendorResult.push(perparedResult(vendorLedgers?.[start], statusFailed, e?.stack));
        start++
        return processVendor(vendorLedgers, start, end, documentCategoryId, client, documentId, documentAttachmentId, vendorResult, vendorToMail) 
    }
}
async function balanceConfirmationInitiatedTemplate(vendors, clientName) 
    {
        try
        {
            let mailTo = vendors.map(vendor => { return {"email": vendor.email, "name": vendor.name, "type": "to"}})
            const [year, month, day] =  new Date().toISOString().slice(0, 10).replace('T', ' ').split('-')
            let cutOffDate = `${day}-${month}-${year}`
            let dataToSend = 
            {
                "to": mailTo,
                "subject": "Balance confirmation as on " + cutOffDate,
                "text": `<p>Dear Sir/Madam,</p>
                        <p>We have initiated a request for Balance confirmation as on ${cutOffDate}</p>
                        <p>Request you download the request letter and affix your signature and offical seal and upload the request letter.</p>

                        <p>Regards,<br>${clientName}</p>`,
                "rawFiles": ""
            }
            axios.post( api.serviceApi + api.common + api.sendMail, dataToSend).then((sendMail) =>
            {
                console.log("mail sent")
                return {result:true, data : dataToSend}    
            })
        }
        catch (e)
        {
            console.log(e);
            return {result:false, error: e?.stack || e?.message || e}
        }
    }

    
function perparedResult(vendor, status, remark)
{
    return {uuid: vendor?.uuid, code : vendor.code, name:vendor.name, status:status, remark : remark}
}