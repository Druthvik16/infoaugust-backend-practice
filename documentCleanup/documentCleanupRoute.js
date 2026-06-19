const express = require('express');
const documentCleanupRoute = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

documentCleanupRoute.use('/uploadDocumentCleanupFile',require('../authenticate/validateToken.js'),require('./uploadDocumentCleanupFile'))
documentCleanupRoute.use('/updateDocumentCleanupJobStatus',require('../authenticate/validateToken.js'),require('./updateDocumentCleanupJobStatus'))
documentCleanupRoute.use('/downloadCleanupFile',require('../authenticate/validateToken.js'),require('./downloadCleanupFile'))
documentCleanupRoute.use('/getDocumentCleanupJobs',require('../authenticate/validateToken.js'),require('./getDocumentCleanupJobs'))


documentCleanupRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = documentCleanupRoute