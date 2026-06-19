let db = require('./dbQueryPartner')
let partnerObj = require('../model/partner')
let partner = new partnerObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:uuid',async(req,res) => 
{
    try
    {
        let getPartner;
        let uuid;
        let clientList = [];
        uuid = req.params.uuid;
        getPartner = await db.getPartner(uuid)
        if(getPartner.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"partner" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            clientList = [];
            getPartner.forEach((element) => 
            {
                partner.setClient(element)
                clientList.push(partner.getClient());
            });
            getPartner[0]['clients'] = clientList
            partner.setDataAll(getPartner[0])
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"partner" : partner.getDataAll()},
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