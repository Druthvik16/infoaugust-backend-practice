let db = require('./dbQueryPartner')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:clientUuid/:financialYearId?/:createdByUuid?/:status?/:fromDate?/:toDate?',async(req,res) => 
{
    try
    {
        const clientUuid = req.params.clientUuid
        const createdByUuid = req.query.createdByUuid
        const financialYearId = req.query.financialYearId
        const status = req.query.status
        const fromDate = req.query.fromDate
        const toDate = req.query.toDate
        const loggedUserType = req.body.loggedUserType;
        const userTypeCode = req.body.roleCode ? req.body.roleCode : loggedUserType; //AdditionalUser
        // const userTypeCode = req.body.roleCode || null; //req.body.roleCode ? req.body.roleCode : 'Partner';
        // console.log(req.query)

        const getLedgerDownloadQueue = await db.getLedgerDownloadQueue(clientUuid, createdByUuid, status, fromDate, toDate, userTypeCode, financialYearId)
      
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"ledgerDownloadQueue" : getLedgerDownloadQueue},
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
            "error"       : e?.stack
        });
    }
})