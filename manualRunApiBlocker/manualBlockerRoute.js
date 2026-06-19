const express = require('express');
const manualBlocker = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

manualBlocker.use('/getStatus',require('../authenticate/validateToken.js'),require('./getStatus.js'))

manualBlocker.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = manualBlocker