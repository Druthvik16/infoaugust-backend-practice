let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let path = require("path")
const fs = require('fs');
let mime = require('mime');


module.exports = require('express').Router().get('/:id/:action',async(req,res) =>  
{
    try
    {
        let id = req.params.id 
        let action = req.params.action // po or invoice
        let getData = ''
        let userType = 'EU'
        let apiName = req.baseUrl
        if(action == 'po')
        {
            getData = await db.getPOFile(id)
            if(getData?.length == 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"       :  "PO not found",
                    "status_name"   : getCode.getStatus(400)
                })
            }
        }
        else if(action == 'invoice')
        {
            getData = await db.getInvoiceFile(id)
            if(getData?.length == 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"       :  "Invoice not found",
                    "status_name"   : getCode.getStatus(400)
                })
            }
        }
        else
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"       :  "File not found",
                "status_name"   : getCode.getStatus(400)
            })
        }  
        let fileName = getData[0].filePath.split('/').pop()
        let clientUuid = getData[0].filePath.split('/')[2]
        // let file = fs.readFileSync(getData[0].filePath, 'base64')
        let file = await uniqueFunction.getVendorModuleFile(getData[0].filePath, fileName, userType, getData[0].vendorId, apiName, clientUuid, getData[0].encryptionKey, getData[0].encryptionIV)
        console.log(file)
        if(!file.result)
        {
            res.status(500)
            return res.json({
                "status_code"   :   500,
                "message"       :   file.error,
                "status_name"   :   getCode.getStatus(500)
            })   
        }
        let base64data = "data:" + file.mimeType + ";base64," + file?.file.toString('base64');
        // let pdfFile = `data:${mime.getType(getData[0].filePath)};base64,${file}`
        // res.status(200)
        // return res.json({
        //     "status_code" : 200,
        //     "message"       :   "success",
        //     "data"          :   {'name':getData[0].filePath.split('/').pop(),'file' : pdfFile},
        //     "status_name"   : getCode.getStatus(200)
        // })
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"       :   "success",
            "data"          :   {'name':fileName,'file' : base64data},
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
