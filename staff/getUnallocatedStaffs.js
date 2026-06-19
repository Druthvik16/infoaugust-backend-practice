let db = require('./dbQueryStaff')
let staffObj = require('../model/staff')
let staff = new staffObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getUnallocatedStaffs;
        let staffsList = []
        // getUnallocatedStaffs
        getUnallocatedStaffs = await db.getUnallocatedStaffs()
        if(getUnallocatedStaffs.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedStaffs" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            staffsList = []
            getUnallocatedStaffs.forEach((element) => 
            {
                staff.setUnallocatedStaff(element)
                staffsList.push(staff.getUnallocatedStaff())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"unallocatedStaffs" : staffsList},
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