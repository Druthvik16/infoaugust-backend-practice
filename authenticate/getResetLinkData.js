let db = require('./dbQueryAuthenticate')
let errorCode = require('../common/errorCode/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().get('/:code',async(req,res) =>  {
    try
    {
        let getResetLinkData;
        let code;
        if(!req.params.code)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Code Not Given",
                "status_name"   : getCode.getStatus(500)
            })
        }

        code = req.params.code
        getResetLinkData = await db.getResetLinkData(code)

        if(getResetLinkData.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code"   :   500,
                "message"       :   'Link Expired',
                "status_name"   :   getCode.getStatus(500),
            })   
        }

        res.status(200)
        return res.json({
            "status_code" : 200,
            "data"        : {'email' : getResetLinkData[0].email},
            "message"     : 'success',
            "status_name"   : getCode.getStatus(200)
        })
    } 
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code"   :   500,
            "message"       :   "Link Expired",
            "status_name"   :   getCode.getStatus(500),
            "error"         :   e.sqlMessage
        })     
    }
})