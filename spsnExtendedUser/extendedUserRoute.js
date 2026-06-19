const express = require('express');
const extendedUser = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

extendedUser.use('/getExtendedUserDetail',require('../authenticate/validateToken.js'),require('./getExtendedUserDetail.js'))
extendedUser.use('/getExtendedUsers',require('../authenticate/validateToken.js'),require('./getExtendedUsers.js'))
extendedUser.use('/getPartnerLocationList',require('../authenticate/validateToken.js'),require('./getPartnerLocationList.js'))
extendedUser.use('/getSpsnList',require('../authenticate/validateToken.js'),require('./getSpsnList.js'))
extendedUser.use('/saveExtendedUser',require('../authenticate/validateToken.js'),require('./saveExtendedUser.js'))
extendedUser.use('/saveExtendedUserMappings',require('../authenticate/validateToken.js'),require('./saveExtendedUserMappings.js'))
extendedUser.use('/getExtendedUserWithLocations',require('../authenticate/validateToken.js'),require('./getExtendedUserWithLocations.js'))
extendedUser.use('/getExtendedUserWithSpsn',require('../authenticate/validateToken.js'),require('./getExtendedUserWithSpsn.js'))
extendedUser.use('/updateExtendedUserStatus',require('../authenticate/validateToken.js'),require('./updateExtendedUserStatus.js'))

extendedUser.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = extendedUser