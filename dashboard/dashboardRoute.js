const express = require('express');
const dashboardRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
dashboardRoute.use('/getActiveLogging', require('../authenticate/validateToken'), require('./getActiveLogging'))
dashboardRoute.use('/getLoggedInUsers', require('../authenticate/validateToken'), require('./getLoggedInUsers'))
dashboardRoute.use('/getLoggedInUsersHistory', require('../authenticate/validateToken'), require('./getLoggedInUsersHistory'))
dashboardRoute.use('/getDataTransactLog', require('../authenticate/validateToken'), require('./getDataTransactLog'))
dashboardRoute.use('/getDataTransactLogTotalCounts', require('../authenticate/validateToken'), require('./getDataTransactLogTotalCounts'))
dashboardRoute.use('/getMasterClientDocumentDataCountsPartner', require('../authenticate/validateToken'), require('./getMasterClientDocumentDataCountsPartner.js'))
dashboardRoute.use('/getMasterCounts', require('../authenticate/validateToken'), require('./getMasterCounts'))
dashboardRoute.use('/getMasterClientDocumentDataCounts', require('../authenticate/validateToken'), require('./getMasterClientDocumentDataCounts'))
dashboardRoute.use('/getMasterClientDocumentDataSPSNClientCounts', require('../authenticate/validateToken'), require('./getMasterClientDocumentDataSPSNClientCounts'))
dashboardRoute.use('/getVendorDashboardCounts', require('../authenticate/validateToken'), require('./getVendorDashboardCounts'))
dashboardRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = dashboardRoute