let db = require('./dbQueryClient')
let clientObj = require('../model/client')
let client = new clientObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getUnallocatedClients;
        let clientsList = []
        getUnallocatedClients = await db.getUnallocatedClients()
        if(getUnallocatedClients.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedClients" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            clientsList = []
            getUnallocatedClients.forEach((element) => 
            {
                client.setUnallocatedClient(element)
                clientsList.push(client.getUnallocatedClient())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedClients" : clientsList},
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})