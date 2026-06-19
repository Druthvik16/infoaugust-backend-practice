const express = require('express');
const uploadedDocRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

uploadedDocRoute.use('/saveClientUploadedSummaryDocs',require('./saveClientUploadedSummaryDocs.js'))
uploadedDocRoute.use('/saveMonthlyTransactionDocs',require('./saveMonthlyTransactionDocs.js'))
uploadedDocRoute.use('/saveInvoicePTDocs',require('./saveInvoicePTDocs.js'))
uploadedDocRoute.use('/saveCnsAndInvSummaryData',require('./saveCnsAndInvSummaryData.js'))
uploadedDocRoute.use('/processLedgerSummary',require('./processLedgerSummary.js'))
uploadedDocRoute.use('/processMonthlyTransaction',require('./processMonthlyTransaction.js'))
uploadedDocRoute.use('/processWorkingFile',require('./processWorkingFile.js'))
uploadedDocRoute.use('/processCreditNoteSummary',require('./processCreditNoteSummary.js'))
uploadedDocRoute.use('/processInvoiceSummary',require('./processInvoiceSummary.js'))
uploadedDocRoute.use('/uploadFailedFile',require('./uploadFailedFile.js'))
uploadedDocRoute.use('/uploadWorkingFile',require('./uploadWorkingFile.js'))
uploadedDocRoute.use('/getCreditNoteNumbers',require('./getCreditNoteNumbers.js'))
uploadedDocRoute.use('/uploadCreditNotePdf',require('./uploadCreditNotePdf.js'))
uploadedDocRoute.use('/uploadCreditNoteFailedPdf',require('./uploadCreditNoteFailedPdf.js'))
uploadedDocRoute.use('/getCreditNotePdfFilePathList',require('./getCreditNotePdfFilePathList.js'))
uploadedDocRoute.use('/getCreditNotePdfFile',require('./getCreditNotePdfFile.js'))
uploadedDocRoute.use('/getCreditNotePdfFileStatus',require('./getCreditNotePdfFileStatus.js'))
uploadedDocRoute.use('/getInvoiceNumbers',require('./getInvoiceNumbers.js'))
uploadedDocRoute.use('/uploadInvoicePdf',require('./uploadInvoicePdf.js'))
uploadedDocRoute.use('/uploadInvoiceFailedPdf',require('./uploadInvoiceFailedPdf.js'))
uploadedDocRoute.use('/getInvoicePdfFilePathList',require('./getInvoicePdfFilePathList.js'))
uploadedDocRoute.use('/getInvoicePdfFile',require('./getInvoicePdfFile.js'))
uploadedDocRoute.use('/getInvoicePdfFileStatus',require('./getInvoicePdfFileStatus.js'))


uploadedDocRoute.use('/processLedgerSummaryLocal',require('./processLedgerSummaryLocal.js'))
uploadedDocRoute.use('/processMonthlyTransactionLocal',require('./processMonthlyTransactionLocal.js'))
uploadedDocRoute.use('/processWorkingFileLocal',require('./processWorkingFileLocal.js'))
uploadedDocRoute.use('/processCreditNoteSummaryLocal',require('./processCreditNoteSummaryLocal.js'))
uploadedDocRoute.use('/processInvoiceSummaryLocal',require('./processInvoiceSummaryLocal.js'))
uploadedDocRoute.use('/processInvoicePtLocal',require('./processInvoicePtLocal.js'))
uploadedDocRoute.use('/getRemarkForCreditNote',require('./getRemarkForCreditNote.js'))


uploadedDocRoute.use('/getPartnerLedgers',require('../authenticate/validateToken'),require('./getPartnerLedgers.js'))
uploadedDocRoute.use('/getPartnerMonthlyTransaction',require('../authenticate/validateToken'),require('./getPartnerMonthlyTransaction.js'))
uploadedDocRoute.use('/downloadUploadedFile',require('../authenticate/validateToken'),require('./downloadUploadedFile.js'))
uploadedDocRoute.use('/downloadUploadDocFile',require('../authenticate/validateToken'),require('./downloadUploadDocFile.js'))
uploadedDocRoute.use('/getCreditNoteSummaries',require('../authenticate/validateToken'),require('./getCreditNoteSummaries.js'))
// uploadedDocRoute.use('/searchCreditNoteSummaries',require('../authenticate/validateToken'),require('./searchCreditNoteSummaries.js'))
uploadedDocRoute.use('/getInvoiceSummaries',require('../authenticate/validateToken'),require('./getInvoiceSummaries.js'))
uploadedDocRoute.use('/downloadCustomerUploadedFilePost',require('../authenticate/validateToken'),require('./downloadCustomerUploadedFilePost.js'))
uploadedDocRoute.use('/viewUploadedFile',require('../authenticate/validateToken'),require('./viewUploadedFile.js'))

uploadedDocRoute.use('/mailDocumentFile',require('../authenticate/validateToken'),require('./mailDocumentFile.js'))
uploadedDocRoute.use('/getPendingPdfSummaries',require('../authenticate/validateToken'),require('./getPendingPdfSummaries.js'))
uploadedDocRoute.use('/uploadPendingPdfForSummaries',require('../authenticate/validateToken'),require('./uploadPendingPdfForSummaries.js'))

uploadedDocRoute.use('/validateCreditNoteWorkingFile',require('./validateCreditNoteWorkingFile.js'))
uploadedDocRoute.use('/uploadCreditNoteWorkingForMaster',require('../authenticate/validateToken'),require('./uploadCreditNoteWorkingForMaster.js'))
uploadedDocRoute.use('/uploadCreditNoteWorkingUnverifiedFile',require('../authenticate/validateToken'),require('./uploadCreditNoteWorkingUnverifiedFile.js'))


uploadedDocRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = uploadedDocRoute