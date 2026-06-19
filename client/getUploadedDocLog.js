let db = require('./dbQueryClient')
let uploadDocObj = require('../model/uploadDoc')
let uploadDoc = new uploadDocObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getUploadedDocLog;
let uploadDocList = []
let uploadedDocLogId;
module.exports = require('express').Router().get('/:uploadedDocLogId',async(req,res) => 
{
    try
    {
        uploadedDocLogId = req.params.uploadedDocLogId
        getUploadedDocLog = await db.getUploadedDocLog(uploadedDocLogId)
        if(getUploadedDocLog.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"uploadDocLog" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            uploadDocList = []
            getUploadedDocLog.forEach((element) => 
            {
                uploadDoc.setUploadDocLogDetails(element)
                uploadDocList.push(uploadDoc.getUploadDocLogDetails())
            });
            getUploadedDocLog[0]['uploadDocLogDetails'] = uploadDocList
            uploadDoc.setDataAll(getUploadedDocLog[0])
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"uploadDocLog" : uploadDoc.getDataAll()},
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