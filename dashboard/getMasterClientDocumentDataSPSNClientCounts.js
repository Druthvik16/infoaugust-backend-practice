let db = require('./dbQueryDashboard')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getMasterClientDocumentDataCounts;
let clientUuid;
let userId;
let documentTypes = [{ "name" : 'Credit Note'
}, {"name" : 'Invoice'}, {"name" : 'Ledger'}, {"name" : 'Transaction'}]
module.exports = require('express').Router().get('/:clientUuid',async(req,res) => 
{
    try
    {
        clientUuid = req.params.clientUuid
        documentTypes = []
        documentTypes = [{ "name" : 'Credit Note'
        }, {"name" : 'Invoice'}, {"name" : 'Ledger'}, {"name" : 'Transaction'}]
        userId = req.body.userId
        let result = await getData(documentTypes.slice(), 0, documentTypes.slice()?.length)
        // console.log(result)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"masterDashboardStats" : result},
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


async function getData(copyDocumentTypes, start, end)
{
    try
    {
        if(start < end)
        {
            let documentName = copyDocumentTypes[start]
            let date = await db.getLastDocumentUploadDateSPSNClient(clientUuid, documentName.name)
            // console.log(date)
            copyDocumentTypes[start]['date'] = date[0].uploadedOn
            getMasterClientDocumentDataCounts = await db.getMasterClientDocumentDataCountsSPSNClient(clientUuid, documentName.name, date[0].uploadedOn, userId)
            copyDocumentTypes[start]['totalCount'] = getMasterClientDocumentDataCounts[0].totalCount
            start++
            return getData(copyDocumentTypes, start, end)
        }
        else
        {
            return copyDocumentTypes
        }
    }
    catch (e)
    {
        console.log("Error", e)
        return false
    }
}