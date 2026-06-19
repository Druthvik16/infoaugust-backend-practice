let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let vendorCommonFunction = require('./vendorCommonFunction')
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        if(!req.body.vendor || !req.body.vendor?.uuid || !req.body.vendorDocument || !req.body.vendorDocument?.id)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let partnerUuid = req.body.vendor?.uuid
        let vendorDocumentId = req.body.vendorDocument.id
        let vendor = await db.getPartner(partnerUuid)
        if(vendor?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor not found",
                "status_name" : getCode.getStatus(400)
            });
        }
        let vendorDocState = vendor[0].docState;
        if(vendorDocState?.toString()?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor documents submission are pending",
                "status_name" : getCode.getStatus(400)
            });
        }
        let vendorStatusId = vendor[0].vendorStatusId;
        let vendorStatusName = vendor[0].vendorStatusName;
        if(vendorStatusName == 'Registration-Initiated')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor registration process is incomplete",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'Document-Validated')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor documents validation already completed.",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'On-Boarded')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor is already on-boarded.",
                "status_name" : getCode.getStatus(400)
            });
        }        
        else  if(vendorStatusName == 'Document-Submitted')
        {
            let userId = req.body.userId;
            let partnerId = vendor[0].id 

            let error = []
            let getVendorDocument = await db.getClientVendorUploadDocument(vendorDocumentId);
            console.log(getVendorDocument)
            if(getVendorDocument.length == 0) 
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Uploaded vendor document",
                    "status_name" : getCode.getStatus(500)
                });            
            }

            getVendorDocument.forEach((element) => 
            {
                if(element.isRequired == 1 && (!element?.fileName || element?.fileName?.length == 0))
                {
                    error.push({ field: element.clientVendorAttachmentName, message : `File upload reqired for ${element.clientVendorAttachmentName}`})
                }
                if(element.fileName?.toString()?.length > 0 && element.isInfomapVerified == 1)
                {
                    error.push({ field: element.clientVendorAttachmentName, message : `File already validated for ${element.clientVendorAttachmentName}`})
                }
            })

            if(error.length > 0) 
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"     : error[0].message,
                    "status_name" : getCode.getStatus(400)
                });
            }
            else
            {
                let element = getVendorDocument[0]
                // let deleteFile = await uniqueFunction.deleteUploadedFile(getPath.getName('vendor'), element.fileName, partnerUuid + '/' +  getPath.getName('vendor/uploadDocuments'), '')                    
                let deleteFile = await deleteFileFromS3VendorModule(element.filePath)                    
                let updateFileName = await db.updateVendorDocument(element.id,null, new Date(), partnerId, null, null, null)
                if(updateFileName.affectedRows > 0)
                {
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message"     : "success",
                        "status_name" : getCode.getStatus(200),
                    });
                }
                else
                {
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "Vendor document not deleted",
                        "status_name" : getCode.getStatus(500)
                    })
                }
            }
        }
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack || e.message || e,
            "status_name" : getCode.getStatus(500)
        }) 
    }
})

async function deleteFileFromS3VendorModule(inputFolderPath)
{
    try
    {
        let deleteFile = await uniqueFunction.deleteVendorModuleFile(inputFolderPath)
        return true;
    }
    catch (e)
    {
        console.log(e)
        return true;
    }
}