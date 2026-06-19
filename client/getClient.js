let db = require('./dbQueryClient')
let clientObj = require('../model/client')
let client = new clientObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:uuid',async(req,res) => 
{
    try
    {
        let getClient;
        let clientsList = []
        let uuid;
        uuid = req.params.uuid;
        getClient = await db.getClient(uuid)
        // console.log(getClient)
        if(getClient.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"client" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            clientsList = []
            if(getClient[0]?.serviceTypeName != 'Customer Portal')
            {
                getClient.forEach((element) => 
                {
                    client.setClientVendorAttachmentDocumentMapping(element)
                    clientsList.push(client.getClientVendorAttachmentDocumentMapping())
                });
            }
            getClient[0]['clientVendorAttachmentDocumentMapping'] = clientsList
            client.setDataAll(getClient[0])
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"client" : client.getDataAll()},
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
            "error"       : e?.stack
        });
    }
})