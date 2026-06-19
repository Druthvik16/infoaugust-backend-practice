let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let getVendors;
let clientUuid;
let statusId;
module.exports = require('express').Router().get('/:clientUuid?/:statusId?',async(req,res) => 
{
    try
    {
        console.log(req.params)
        // if(req.params['0'].length > 0 &&  req.params['0'] != '/')
        // {
        //     let a = req.params['0'].split('/')
        //     if(a.length > 1)
        //     {
        //         clientUuid = req.params['clientUuid'] + a[0]
        //         statusId = a[1]
        //     }
        //     else if(a.length == 1) 
        //     {
        //         clientUuid = req.params['clientUuid'] + a[0]
        //         statusId = ""
        //     }
        // }
        // else
        // {
        //     clientUuid = req.params['clientUuid']
        //     statusId = ""
        // }

        const clientUuid = req.query.clientUuid || "";
        const statusId = req.query.statusId || "";
        console.log(clientUuid, statusId)
        getVendors = await db.getVendors(clientUuid, statusId)
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"vendors" : getVendors},
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