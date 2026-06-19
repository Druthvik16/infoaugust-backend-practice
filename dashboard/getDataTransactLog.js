let db = require('./dbQueryDashboard')
let CNSObj = require('../model/creditNoteSummary')
let cns = new CNSObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getDataTransactLog;
let partnerUuid = null;
let partnerLocationUuid = null;
let clientUuid = null;
let fromDate = null;
let toDate = null;
let action = null;
let fileName = null; 
let userType = null;
let activity = null; 
let storageType = null; 
module.exports = require('express').Router().get('/:partnerUuid?*',async(req,res) => 
{
    try
    {
        console.log(new Date())
        if(!req.params['partnerUuid'])
        {
            req.params['partnerUuid'] = ''
        }
        if(req.params['0'].length > 0 &&  req.params['0'] != '/')
        {
            let a = req.params['0'].split('/')
            let [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = a;
            partnerUuid = p1 !== undefined ? req.params['partnerUuid'] + p1 : null;
            partnerLocationUuid = p2 !== undefined ? p2 : null;
            clientUuid = p3 !== undefined ? p3 : null;
            fromDate = p4 !== undefined ? p4 : null;
            toDate = p5 !== undefined ? p5 : null;
            fileName = p6 !== undefined ? p6 : null;
            userType = p7 !== undefined ? p7 : null;
            activity = p8 !== undefined ? p8 : null;
            storageType = p9 !== undefined ? p9 : null;
            action = p10 !== undefined ? p10 : null;
        }
        else
        {
            partnerUuid = null
            partnerLocationUuid = null
            clientUuid = null
            fromDate = null
            toDate = null
            fileName = null
            userType = null
            activity = null
            storageType = null
            action = null
        }
        // console.log("partnerUuid: ",partnerUuid," partnerLocationUuid: ",partnerLocationUuid," clientUuid: ", clientUuid, " fromDate: ", fromDate," toDate: ", toDate," fileName: ", fileName," userType: ", userType," activity: ", activity, " storageType: ", storageType, " action: ", action)
        let action1 = action == 'view' ? 'viewUploadedFile' : ''
        action = action?.length > 0 ? action == 'download' ? 'downloadCustomerUploadedFilePost' : (action == 'view' ? 'downloadUploadedFile' : 'mailDocumentFile') : ''
        let getLastDocumentUploadOn = await db.getLastDocumentUploadDateLog(partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, fileName, action1, activity, userType, storageType)
        // let uploadedOn = new Date(getLastDocumentUploadOn[0].uploadedOn).toISOString().slice(0, 10).replace('T', ' ')
        let uploadedOn = getLastDocumentUploadOn[0].uploadedOn
        console.log(uploadedOn)
        getDataTransactLog = await db.getDataTransactLog(partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, fileName, action1, activity, userType, storageType, uploadedOn)
        console.log("Data Received and Sent", getDataTransactLog?.length , new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"dataTransactLog" : getDataTransactLog, "lastUploadedOn" : uploadedOn},
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