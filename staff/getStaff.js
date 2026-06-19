let db = require('./dbQueryStaff')
let staffObj = require('../model/staff')
let staff = new staffObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:uuid',async(req,res) => 
{
    try
    {
        let getStaff;
        let staffsList = []
        let uuid;
        uuid = req.params.uuid
        getStaff = await db.getStaff(uuid)
        if(getStaff.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"staff" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            staffsList = []
            getStaff.forEach((element) => 
            {
                staff.setDataAll(element)
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"staff" : staff.getDataAll()},
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