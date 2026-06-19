const express = require('express');
const spsnUser = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

spsnUser.use('/getInvoiceSummaries',require('../authenticate/validateToken.js'),require('./getInvoiceSummaries.js'))
spsnUser.use('/getPartnerLedgers',require('../authenticate/validateToken.js'),require('./getPartnerLedgers.js'))
spsnUser.use('/getPartnerMonthlyTransaction',require('../authenticate/validateToken.js'),require('./getPartnerMonthlyTransaction.js'))
spsnUser.use('/getCreditNoteSummaries',require('../authenticate/validateToken.js'),require('./getCreditNoteSummaries.js'))
spsnUser.use('/getSpsns',require('../authenticate/validateToken.js'),require('./getSpsns.js'))
spsnUser.use('/getSpsn',require('../authenticate/validateToken.js'),require('./getSpsn.js'))
spsnUser.use('/getPartnerLocations',require('../authenticate/validateToken'),require('./getPartnerLocations'))
spsnUser.use('/getPartnerLocation',require('../authenticate/validateToken'),require('./getPartnerLocation'))
spsnUser.use('/saveSpsnUser',require('../authenticate/validateToken'),require('./saveSpsnUser.js'))
spsnUser.use('/updateSpsn',require('../authenticate/validateToken'),require('./updateSpsn.js'))
spsnUser.use('/updateSpsnLocations',require('../authenticate/validateToken'),require('./updateSpsnLocations.js'))
spsnUser.use('/getSpsnWithLocations',require('../authenticate/validateToken'),require('./getSpsnWithLocations.js'))
spsnUser.use('/getLedgerDownload',require('../authenticate/validateToken'),require('./getLedgerDownload.js'))
spsnUser.use('/getLedgerDownloadQueue',require('../authenticate/validateToken'),require('./getLedgerDownloadQueue.js'))
spsnUser.use('/getSpsnOSReport',require('../authenticate/validateToken'),  require('./getSpsnOSReport.js')); 
spsnUser.use('/getSpsnCAReport',require('../authenticate/validateToken'),  require('./getSpsnCAReport.js'));
spsnUser.use('/getLedgerDownloadQueueFile',require('../authenticate/validateToken'),  require('./getLedgerDownloadQueueFile.js'));
spsnUser.use('/downloadUploadedFile',require('../authenticate/validateToken'),  require('./downloadUploadedFile.js'));
spsnUser.use('/downloadUploadDocFile',require('../authenticate/validateToken'),  require('./downloadUploadDocFile.js'));


spsnUser.use('/saveSpsnOSAndCAReport',require('./saveSpsnOSAndCAReport.js'));
spsnUser.use('/uploadFailedFileOSAndCAReport', require('./uploadFailedFileOSAndCAReport.js'));
spsnUser.use('/uploadOpeningBalance', require('./uploadOpeningBalance.js'));


spsnUser.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = spsnUser