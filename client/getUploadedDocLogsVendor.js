let db = require('./dbQueryClient')
let uploadDocObj = require('../model/uploadDocLog')
let uploadDoc = new uploadDocObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid/:documentAttachmentId?*',async(req,res) => 
{
    try
    {
        let getUploadedDocLogs;
        let uploadDocList = []
        let clientUuid;
        let documentAttachmentId;
        let fromDate;
        let toDate;
        let status;
        if(req.params['0'].length > 0 &&  req.params['0'] != '/')
        {
            let a = req.params['0'].split('/')
            if(a.length >= 5)
            {
                clientUuid = req.params.clientUuid + a[0]
                documentAttachmentId = a[1]
                fromDate = a[2]
                toDate = a[3]
                status = a[4]
            }
            else  if(a.length == 4)
            {
                clientUuid = req.params.clientUuid + a[0]
                documentAttachmentId = a[1]
                fromDate = a[2]
                toDate = a[3]
                status = ''
            }
            else  if(a.length == 3)
            {
                clientUuid = req.params.clientUuid + a[0]
                documentAttachmentId = a[1]
                fromDate = a[2]
                toDate = null
                status = ''
            }
            else  if(a.length == 2)
            {
                clientUuid = req.params.clientUuid + a[0]
                documentAttachmentId = a[1]
                fromDate = null
                toDate = null
                status = ''
            }
            else  if(a.length == 1)
            {
                clientUuid = req.params.clientUuid + a[0]
                documentAttachmentId = null
                fromDate = null
                toDate = null
                status = ''
            }
        }
        else
        {
            clientUuid = req.params.clientUuid
            documentAttachmentId = null
            fromDate = null
            toDate = null
            status = ''
        }
        getUploadedDocLogs = await db.getUploadedDocLogsVendor(clientUuid, documentAttachmentId, fromDate, toDate, status)
        if(getUploadedDocLogs.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"uploadDocLogs" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            uploadDocList = []
            getUploadedDocLogs.forEach((element) => 
            {
                uploadDoc.setDataAll(element)
                uploadDocList.push(uploadDoc.getDataAll())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"uploadDocLogs" : uploadDocList},
                "status_name" : getCode.getStatus(200)
            });
        }
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