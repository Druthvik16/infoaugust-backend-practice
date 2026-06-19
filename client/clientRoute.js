const express = require('express');
const clientRoute = express.Router();
let errorCode = require('../common/error/errorCode');
const formidable = require('formidable');
let getCode = new errorCode()

clientRoute.use('/getClients',require('../authenticate/validateToken'),require('./getClients.js'))
clientRoute.use('/getClient',require('../authenticate/validateToken'),require('./getClient.js'))
clientRoute.use('/getUnallocatedClients',require('../authenticate/validateToken'),require('./getUnallocatedClients.js'))
clientRoute.use('/updateStatus',require('../authenticate/validateToken'),require('./updateStatus.js'))
clientRoute.use('/saveClient',require('../authenticate/validateToken'),require('./saveClient.js'))
clientRoute.use('/updateClient',require('../authenticate/validateToken'),require('./updateClient.js'))
clientRoute.use('/createDocFolders',require('../authenticate/validateToken'),require('./createDocFolders.js'))
clientRoute.use('/uploadSummarySheet',require('../authenticate/validateToken'),require('./uploadSummarySheet.js'))
clientRoute.use('/uploadWorkingFile',require('../authenticate/validateToken'),require('./uploadWorkingFile.js'))
clientRoute.use('/uploadPdfFile',require('../authenticate/validateToken'),require('./uploadPdfFile.js'))
clientRoute.use('/uploadLedgerFile',require('../authenticate/validateToken'),require('./uploadLedgerFile.js'))
clientRoute.use('/uploadInvoiceSummary',require('../authenticate/validateToken'),require('./uploadInvoiceSummary.js'))
clientRoute.use('/uploadInvoicePdf',require('../authenticate/validateToken'),require('./uploadInvoicePdf.js'))
clientRoute.use('/uploadMonthlyTransactionFile',require('../authenticate/validateToken'),require('./uploadMonthlyTransactionFile.js'))
clientRoute.use('/uploadInvoicePtFile',require('../authenticate/validateToken'),require('./uploadInvoicePtFile.js'))
clientRoute.use('/getUploadedDocLogs',require('../authenticate/validateToken'),require('./getUploadedDocLogs.js'))
clientRoute.use('/getServiceTypes',require('../authenticate/validateToken'),require('./getServiceTypes.js'))
clientRoute.use('/getClientVendorAttachments',require('../authenticate/validateToken'),require('./getClientVendorAttachments.js'))
clientRoute.use('/testSftpConnection',require('../authenticate/validateToken'),require('./testSftpConnection.js'))
clientRoute.use('/getUploadedDocLogsVendor',require('../authenticate/validateToken'),require('./getUploadedDocLogsVendor.js'))
clientRoute.use('/getUploadedDocLogsSpsn',require('../authenticate/validateToken'),require('./getUploadedDocLogsSpsn.js'))

clientRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = clientRoute