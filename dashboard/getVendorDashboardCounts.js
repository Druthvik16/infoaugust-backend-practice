let db = require('./dbQueryDashboard')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:actionInput/:status',async(req,res) => 
{
    try
    {
        let getMasterCounts;
        let getFileSizeCounts = [{}];
        let actionInput;
        let userTypeCode;
        let userId;
        actionInput = req.params.actionInput
        userTypeCode = req.body.roleCode      
        
        userId = req.body.userId
        let status = req.params.status
        let clientId = ""
        if(userTypeCode == 'CLNT')
        {
            clientId = req.body.userId
        }
        getMasterCounts = await db.getVendors(clientId, status)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"masterDashboardStats" : getMasterCounts[0].activeUsers},
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