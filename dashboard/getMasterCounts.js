let db = require('./dbQueryDashboard')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:tableName?/:clientUuid?',async(req,res) => 
{
    try
    {
        let getMasterCounts;
        let getFileSizeCounts = [{}];
        let actionInput;
        let userTypeCode;
        let userId;
        actionInput = req.query.tableName
        userTypeCode = req.body.roleCode    
        let clientUuid = req.query.clientUuid  || ''
        let client = await db.selectClient(clientUuid)
        
        userId = req.body.userId
        let status = ""
        let clientId = client?.[0]?.id || ''
        if(userTypeCode == 'ADM')
        {
            status = "Document-Submitted"
        }
        else if(userTypeCode == 'CLNT')
        {
            status = "Document-Validated"
            clientId = req.body.userId
        }
        if(actionInput == 'loggedInUsers')
        {
            getMasterCounts = await db.getActiveLogging(clientUuid)
        }
        else  if(actionInput == 'loggedInUsersHistory')
        {
            getMasterCounts = await db.getLoggedInUsersHistoryCount(clientUuid)
        }        
        else  if(actionInput == 'dataTransactLog')
        {
            getMasterCounts = await db.getDataTransactLogFileSizeCounts(clientUuid)
            // getMasterCounts = await db.getDataTransactLogCounts()
        }             
        else  if(actionInput == 'vendor')
        {
            getMasterCounts = await db.getVendors(clientId, status)
        }
        else
        {
            getMasterCounts = await db.getMasterCounts(actionInput, userTypeCode, userId)
        }
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"masterDashboardStats" : getMasterCounts[0].activeUsers, "todaysFileSize":getMasterCounts[0]?.totaltodaysFileSizeCount, "totalsFileSize":getMasterCounts[0]?.activeUsers},
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