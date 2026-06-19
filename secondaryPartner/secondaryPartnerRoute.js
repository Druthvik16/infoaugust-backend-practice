const express = require('express');
const secondaryPartnerRoute = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

secondaryPartnerRoute.use('/getSecondaryPartners',require('../authenticate/validateToken.js'),require('./getSecondaryPartners.js'))
secondaryPartnerRoute.use('/getSecondaryPartner',require('../authenticate/validateToken.js'),require('./getSecondaryPartner.js'))
secondaryPartnerRoute.use('/getSecondaryPartnerLocations',require('../authenticate/validateToken.js'),require('./getSecondaryPartnerLocations.js'))
secondaryPartnerRoute.use('/getSecondaryPartnerLocationsTopbar',require('../authenticate/validateToken.js'),require('./getSecondaryPartnerLocationsTopbar.js'))
secondaryPartnerRoute.use('/getSecondaryPartnerWithLocations',require('../authenticate/validateToken.js'),require('./getSecondaryPartnerWithLocations.js'))
secondaryPartnerRoute.use('/saveSecondaryPartner',require('../authenticate/validateToken.js'),require('./saveSecondaryPartner.js'))
secondaryPartnerRoute.use('/updateSecondaryPartner',require('../authenticate/validateToken.js'),require('./updateSecondaryPartner.js'))
secondaryPartnerRoute.use('/changeStatusSecondaryPartner',require('../authenticate/validateToken.js'),require('./changeStatusSecondaryPartner.js'))

secondaryPartnerRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = secondaryPartnerRoute