let db = require('./dbQueryClient')
let clientObj = require('../model/client')
let client = new clientObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:serviceTypeIds?*',async(req,res) => 
{
    try
    {
        let getClients;
        let clientsList = []
        let serviceTypeIds = ''
        
        if(req.params['0'].length > 0 &&  req.params['0'] != '/')
        {
            let a = req.params['0'].split('/')
            if(a.length > 0)
            {
                serviceTypeIds = req.params['serviceTypeIds'] + a[0]
            }
            else if(a.length == 0) 
            {
                serviceTypeIds = req.params['serviceTypeIds'] + a[0]
            }
        }
        else
        {
            serviceTypeIds = req.params['serviceTypeIds']
        }
        
        getClients = await db.getClients(serviceTypeIds)
        if(getClients.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"clients" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            clientsList = []
            getClients.forEach((element) => 
            {
                client.setDataAll(element)
                clientsList.push(client.getDataAll())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"clients" : clientsList},
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