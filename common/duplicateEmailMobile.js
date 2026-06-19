let commondb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res)=>{
    try
    {
        let checkFor;
        let value;
        let duplicate;
        let uuid;
        let action;
        checkFor = req.body.checkFor;
        value = req.body.value;
        uuid = req.body.uuid;
        action = req.body.action;

        duplicate = checkFor == 'Email' ? await commondb.dupEmail(value, action) : await commondb.dupMobile(value, action)
        if(duplicate?.length > 0){
            if(uuid != duplicate[0]?.uuid)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : `Duplicate ${checkFor}`,
                    "status_name" : getCode.getStatus(500)
                })
            } 
            else{
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : getCode.getStatus(200)
                }) 
            }            
        }
        else{
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : getCode.getStatus(200)
            }) 
        } 
    
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code"   :   500,
            "message"       :   "Cannot check",
            "status_name"   :   getCode.getStatus(500),
            "error"         :   e.sqlMessage
        })     
    }
})
