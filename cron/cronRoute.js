const express = require('express');
const cronRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

cronRoute.use('/removeToken', require('./removeToken'))
cronRoute.use('/setCreditNotPdfBotStatus', require('./setCreditNotPdfBotStatus'))
cronRoute.use('/setInvoicePdfBotStatus', require('./setInvoicePdfBotStatus'))
cronRoute.use('/copyAndProcessSftpFileMasterApi', require('./copyAndProcessSftpFileMasterApi'))

// cronRoute.use('/copyPartnerFileFromSftp', require('./copyPartnerFileFromSftp'))
cronRoute.use('/getCreditNoteSummaryFileFromInputFolder', require('./getCreditNoteSummaryFileFromInputFolder'))
cronRoute.use('/getCreditNoteWorkingFileFromInputFolder', require('./getCreditNoteWorkingFileFromInputFolder'))
cronRoute.use('/getPartnerFileFromInputFolder', require('./getPartnerFileFromInputFolder'))
cronRoute.use('/getLedgerSummaryFileFromInputFolder', require('./getLedgerSummaryFileFromInputFolder'))
cronRoute.use('/getInvoiceSummaryFileFromInputFolder', require('./getInvoiceSummaryFileFromInputFolder'))
cronRoute.use('/getMonthlyTransactionFileFromInputFolder', require('./getMonthlyTransactionFileFromInputFolder'))
// cronRoute.use('/copyCreditNoteSummaryFileFromSftp', require('./copyCreditNoteSummaryFileFromSftp'))
// cronRoute.use('/copyCreditNoteWorkingFileFromSftp', require('./copyCreditNoteWorkingFileFromSftp'))
// cronRoute.use('/copyCreditNotePdfFileFromSftp', require('./copyCreditNotePdfFileFromSftp'))
// cronRoute.use('/copyLedgerSummaryFileFromSftp', require('./copyLedgerSummaryFileFromSftp'))
// cronRoute.use('/copyInvoiceSummaryFileFromSftp', require('./copyInvoiceSummaryFileFromSftp'))
// cronRoute.use('/copyInvoicePdfFileFromSftp', require('./copyInvoicePdfFileFromSftp'))
// cronRoute.use('/copyMonthlyTransactionFileFromSftp', require('./copyMonthlyTransactionFileFromSftp'))

cronRoute.use('/copyPartnerFileFromSftpToLocal', require('./copyPartnerFileFromSftpToLocal'))
cronRoute.use('/getCreditNoteSummaryFileFromInputFolderLocal', require('./getCreditNoteSummaryFileFromInputFolderLocal'))
cronRoute.use('/getCreditNoteWorkingFileFromInputFolderLocal', require('./getCreditNoteWorkingFileFromInputFolderLocal'))
cronRoute.use('/getPartnerFileFromInputFolderLocal', require('./getPartnerFileFromInputFolderLocal'))
cronRoute.use('/getLedgerSummaryFileFromInputFolderLocal', require('./getLedgerSummaryFileFromInputFolderLocal'))
cronRoute.use('/getInvoiceSummaryFileFromInputFolderLocal', require('./getInvoiceSummaryFileFromInputFolderLocal'))
cronRoute.use('/getInvoicePtFileFromInputFolderLocal', require('./getInvoicePtFileFromInputFolderLocal'))
cronRoute.use('/getMonthlyTransactionFileFromInputFolderLocal', require('./getMonthlyTransactionFileFromInputFolderLocal'))
cronRoute.use('/copyCreditNoteSummaryFileFromSftpToLocal', require('./copyCreditNoteSummaryFileFromSftpToLocal'))
cronRoute.use('/copyCreditNoteWorkingFileFromSftpToLocal', require('./copyCreditNoteWorkingFileFromSftpToLocal'))
cronRoute.use('/copyCreditNotePdfFileFromSftpToLocal', require('./copyCreditNotePdfFileFromSftpToLocal'))
cronRoute.use('/copyLedgerSummaryFileFromSftpToLocal', require('./copyLedgerSummaryFileFromSftpToLocal'))
cronRoute.use('/copyInvoiceSummaryFileFromSftpToLocal', require('./copyInvoiceSummaryFileFromSftpToLocal'))
cronRoute.use('/copyInvoicePdfFileFromSftpToLocal', require('./copyInvoicePdfFileFromSftpToLocal'))
cronRoute.use('/copyMonthlyTransactionFileFromSftpToLocal', require('./copyMonthlyTransactionFileFromSftpToLocal'))
cronRoute.use('/copyInvoicePtFileFromSftpToLocal', require('./copyInvoicePtFileFromSftpToLocal'))
cronRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = cronRoute