const express = require('express');
const staffRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

staffRoute.use('/getStaffs',require('../authenticate/validateToken'),require('./getStaffs'))
staffRoute.use('/getStaff',require('../authenticate/validateToken'),require('./getStaff'))
staffRoute.use('/getUnallocatedStaffs',require('../authenticate/validateToken'),require('./getUnallocatedStaffs'))
staffRoute.use('/updateStatus',require('../authenticate/validateToken'),require('./updateStatus'))
staffRoute.use('/saveStaff',require('../authenticate/validateToken'),require('./saveStaff'))
staffRoute.use('/updateStaff',require('../authenticate/validateToken'),require('./updateStaff'))

staffRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = staffRoute