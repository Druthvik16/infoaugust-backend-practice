const express = require('express');
const uploadedDocRoute = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

uploadedDocRoute.use('/saveClientUploadedSummaryDocs',require('./saveClientUploadedSummaryDocs.js'))
uploadedDocRoute.use('/saveCnsAndForm16SummaryData',require('./saveCnsAndForm16SummaryData.js'))
uploadedDocRoute.use('/savePaymentAdviceMaster',require('./savePaymentAdviceMaster.js'))
uploadedDocRoute.use('/savePaymentAdviceDetail',require('./savePaymentAdviceDetail.js'))
// uploadedDocRoute.use('/processCreditNoteSummary',require('./processCreditNoteSummary.js'))
uploadedDocRoute.use('/uploadFailedFile',require('./uploadFailedFile.js'))
uploadedDocRoute.use('/getCreditNoteNumbers',require('./getCreditNoteNumbers.js'))
uploadedDocRoute.use('/uploadCreditNotePdf',require('./uploadCreditNotePdf.js'))
uploadedDocRoute.use('/uploadCreditNoteFailedPdf',require('./uploadCreditNoteFailedPdf.js'))
uploadedDocRoute.use('/getCreditNotePdfFilePathList',require('./getCreditNotePdfFilePathList.js'))
uploadedDocRoute.use('/getCreditNotePdfFile',require('./getCreditNotePdfFile.js'))
uploadedDocRoute.use('/getCreditNotePdfFileStatus',require('./getCreditNotePdfFileStatus.js'))
uploadedDocRoute.use('/getForm16Numbers',require('./getForm16Numbers.js'))
uploadedDocRoute.use('/uploadForm16Pdf',require('./uploadForm16Pdf.js'))
uploadedDocRoute.use('/uploadForm16FailedPdf',require('./uploadForm16FailedPdf.js'))
uploadedDocRoute.use('/getForm16PdfFilePathList',require('./getForm16PdfFilePathList.js'))
uploadedDocRoute.use('/getForm16PdfFile',require('./getForm16PdfFile.js'))
uploadedDocRoute.use('/getForm16PdfFileStatus',require('./getForm16PdfFileStatus.js'))

uploadedDocRoute.use('/getCreditNoteSummaries',require('../authenticate/validateToken.js'),require('./getCreditNoteSummaries.js'))
uploadedDocRoute.use('/getVendorCreditNoteSummaries',require('../authenticate/validateToken.js'),require('./getVendorCreditNoteSummaries.js'))
uploadedDocRoute.use('/saveVendorCreditNote',require('../authenticate/validateToken.js'),require('./saveVendorCreditNote.js'))
uploadedDocRoute.use('/saveVendorDebitNote',require('../authenticate/validateToken.js'),require('./saveVendorDebitNote.js'))
uploadedDocRoute.use('/getForm16ASummaries',require('../authenticate/validateToken.js'),require('./getForm16ASummaries.js'))
uploadedDocRoute.use('/getClientVendorLedgers',require('../authenticate/validateToken.js'),require('./getClientVendorLedgers.js'))
uploadedDocRoute.use('/getVendorLedgers',require('../authenticate/validateToken.js'),require('./getVendorLedgers.js'))
uploadedDocRoute.use('/saveVendorLedger',require('../authenticate/validateToken.js'),require('./saveVendorLedger.js'))
uploadedDocRoute.use('/downloadPaymentAdvice',require('../authenticate/validateToken.js'),require('./downloadPaymentAdvice.js'))
uploadedDocRoute.use('/getPaymentAdvices',require('../authenticate/validateToken.js'),require('./getPaymentAdvices.js'))
uploadedDocRoute.use('/generateBalanceConfirmation',require('../authenticate/validateToken.js'),require('./generateBalanceConfirmation.js'))
uploadedDocRoute.use('/generateNoDuesCertificate',require('../authenticate/validateToken.js'),require('./generateNoDuesCertificate.js'))
uploadedDocRoute.use('/getBCLorNDC',require('../authenticate/validateToken.js'),require('./getBCLorNDC.js'))
uploadedDocRoute.use('/uploadVendorBCLorNDC',require('../authenticate/validateToken.js'),require('./uploadVendorBCLorNDC.js'))
uploadedDocRoute.use('/downloadClientBCLorNDC',require('../authenticate/validateToken.js'),require('./downloadClientBCLorNDC.js'))


// uploadedDocRoute.use('/processCreditNoteSummaryLocal',require('./processCreditNoteSummaryLocal.js'))


uploadedDocRoute.use('/downloadUploadedFile',require('../authenticate/validateToken.js'),require('./downloadUploadedFile.js'))
uploadedDocRoute.use('/downloadVendorUploadedFile',require('../authenticate/validateToken.js'),require('./downloadVendorUploadedFile.js'))
uploadedDocRoute.use('/downloadUploadDocFile',require('../authenticate/validateToken.js'),require('./downloadUploadDocFile.js'))
// // uploadedDocRoute.use('/searchCreditNoteSummaries',require('../authenticate/validateToken'),require('./searchCreditNoteSummaries.js'))
// uploadedDocRoute.use('/downloadUploadedFilePost',require('../authenticate/validateToken.js'),require('./downloadUploadedFilePost.js'))

// uploadedDocRoute.use('/mailDocumentFile',require('../authenticate/validateToken.js'),require('./mailDocumentFile.js'))


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