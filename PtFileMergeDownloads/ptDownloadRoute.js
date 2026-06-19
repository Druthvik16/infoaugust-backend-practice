const express = require('express');
const ptDownload = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

ptDownload.use('/getPtFileDownload',require('../authenticate/validateToken.js'),require('./getPtFileDownload.js'))
ptDownload.use('/savePTFileDownloadQueue',require('../authenticate/validateToken.js'),require('./savePTFileDownloadQueue.js'))
ptDownload.use('/getPtDownloadQueue',require('../authenticate/validateToken.js'),require('./getPtDownloadQueue.js'))
ptDownload.use('/getPtDownloadQueueFile',require('../authenticate/validateToken.js'),require('./gePtDownloadQueueFile.js'))

ptDownload.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = ptDownload