let db = require('./dbQueryStaff')
let staffObj = require('../model/staff')
let staff = new staffObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getStaffs;
        let staffsList = []
        getStaffs = await db.getStaffs()
        if(getStaffs.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"staffs" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            staffsList = []
            getStaffs.forEach((element) => 
            {
                staff.setDataAll(element)
                staffsList.push(staff.getDataAll())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"staffs" : staffsList},
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