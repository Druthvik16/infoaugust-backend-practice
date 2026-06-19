let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let path = require("path")

module.exports = require('express').Router().get('/:vendorDocumentId/:action',async(req,res) =>  
{
    try
    {
        let vendorDocumentId = req.params.vendorDocumentId 
        let action = req.params.action // client or vendor
        let getVendorDocument = await db.getClientVendorUploadDocument(vendorDocumentId)
        console.log(getVendorDocument)
        if(!getVendorDocument.lenght == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"       :  "Vendor document not found",
                "status_name"   : getCode.getStatus(400)
            })
        }        
        let clientUuid = getVendorDocument[0]?.clientUuid?.trim()
        let partnerUuid = getVendorDocument[0]?.partnerUuid?.trim()
        let partnerId = getVendorDocument[0]?.partnerId
        let fileName = ''
        let filePath = ''
        let apiName = req.baseUrl
        let encryptionKey = ''
        let encryptionIV = ''
        let userType = 'EU'
        if(action == 'client')
        {
            fileName = getVendorDocument[0]?.clientVendorDocumentFileName?.trim()
            filePath = getVendorDocument[0]?.clientVendorDocumentFilePath
            encryptionIV = getVendorDocument[0]?.clientVendorDocumentEncryptionIV
            encryptionKey = getVendorDocument[0]?.clientVendorDocumentEncryptionKey
            if(!fileName || fileName?.length == 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"       :   "File Not Exist",
                    "status_name"   : getCode.getStatus(400)
                })
            }
        }
        else if(action == "vendor")
        {
            fileName = getVendorDocument[0]?.fileName?.trim()
            filePath = getVendorDocument[0]?.filePath
            encryptionIV = getVendorDocument[0]?.encryptionIV
            encryptionKey = getVendorDocument[0]?.encryptionKey
            if(!fileName || fileName?.length == 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"       :   "File Not Exist",
                    "status_name"   : getCode.getStatus(400)
                })
            }
        }
        // let file = await uniqueFunction.getFileUploadedPath(baseFolder, fileName, addiFolder, extraParam)
        // console.log(file)
        let file = await uniqueFunction.getVendorModuleFile(filePath, fileName, userType, partnerId, apiName, clientUuid, encryptionKey, encryptionIV)
        if(!file.result)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"       :   file?.error,
                "status_name"   : getCode.getStatus(400)
            })
        }
        let base64data = "data:" + file.mimeType + ";base64," + file?.file.toString('base64');
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"       :   "success",
            "data"          :   base64data,
            "status_name"   : getCode.getStatus(200)
        })
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code"   :   500,
            "message"       :   "File not found",
            "status_name"   :   getCode.getStatus(500),
            "error"         :   e.stack
        })     
    }
})
