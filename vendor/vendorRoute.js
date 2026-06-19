const express = require('express');
const vendorRoute = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

vendorRoute.use('/saveVendors',require('../authenticate/validateToken'),require('./saveVendors'))
vendorRoute.use('/saveVendor',require('../authenticate/validateToken'),require('./saveVendor'))
vendorRoute.use('/getVendors',require('../authenticate/validateToken'),require('./getVendors'))
vendorRoute.use('/getVendor',require('../authenticate/validateToken'),require('./getVendor'))
vendorRoute.use('/getVendorStatuses',require('../authenticate/validateToken'),require('./getVendorStatuses'))
vendorRoute.use('/draftVendorRegistration',require('../authenticate/validateToken'),require('./draftVendorRegistration'))
vendorRoute.use('/getVendorRegistrationForm',require('../authenticate/validateToken'),require('./getVendorRegistrationForm'))
vendorRoute.use('/saveVendorRegistration',require('../authenticate/validateToken'),require('./saveVendorRegistration'))
vendorRoute.use('/getVendorUploadDocuments',require('../authenticate/validateToken'),require('./getVendorUploadDocuments'))
vendorRoute.use('/draftVendorUploadDocuments',require('../authenticate/validateToken'),require('./draftVendorUploadDocuments'))
vendorRoute.use('/saveVendorUploadDocuments',require('../authenticate/validateToken'),require('./saveVendorUploadDocuments'))
vendorRoute.use('/submitVendorDocuments',require('../authenticate/validateToken'),require('./submitVendorDocuments'))
vendorRoute.use('/getPreviewFile',require('../authenticate/validateToken'),require('./getPreviewFile'))
vendorRoute.use('/downloadDocument',require('../authenticate/validateToken'),require('./downloadDocument'))
vendorRoute.use('/createDocumentTimeline',require('../authenticate/validateToken'),require('./createDocumentTimeline'))
vendorRoute.use('/validateVendorDocument',require('../authenticate/validateToken'),require('./validateVendorDocument'))
vendorRoute.use('/updateVendorByInfomap',require('../authenticate/validateToken'),require('./updateVendorByInfomap'))
vendorRoute.use('/submitVendorValidation',require('../authenticate/validateToken'),require('./submitVendorValidation'))
vendorRoute.use('/getVendorRegistrationFormByUuid',require('../authenticate/validateToken'),require('./getVendorRegistrationFormByUuid'))
vendorRoute.use('/getVendorUploadDocumentsByUuid',require('../authenticate/validateToken'),require('./getVendorUploadDocumentsByUuid'))
vendorRoute.use('/validateVendorForm',require('../authenticate/validateToken'),require('./validateVendorForm'))
vendorRoute.use('/deleteVendorUploadDocument',require('../authenticate/validateToken'),require('./deleteVendorUploadDocument'))
vendorRoute.use('/getDocumentTimelines',require('../authenticate/validateToken'),require('./getDocumentTimelines'))
vendorRoute.use('/getDocumentTimelineFile',require('../authenticate/validateToken'),require('./getDocumentTimelineFile.js'))
vendorRoute.use('/getVendorPreviewFile',require('../authenticate/validateToken'),require('./getVendorPreviewFile'))
vendorRoute.use('/submitVendorApproval',require('../authenticate/validateToken'),require('./submitVendorApproval'))
vendorRoute.use('/getUploadedPOOrInvoiceFile',require('./getUploadedPOOrInvoiceFile'))
vendorRoute.use('/getPurchaseOrders',require('../authenticate/validateToken'),require('./PO/getPurchaseOrders.js'))
vendorRoute.use('/savePOs',require('../authenticate/validateToken'),require('./PO/savePOs.js'))
vendorRoute.use('/attachPOPdfs',require('../authenticate/validateToken'),require('./PO/attachPOPdfs.js'))
vendorRoute.use('/saveInvoice',require('../authenticate/validateToken'),require('./invoice/saveInvoice.js'))
vendorRoute.use('/getVendorInvoices',require('../authenticate/validateToken'),require('./invoice/getVendorInvoices.js'))
vendorRoute.use('/getInvoiceNumber',require('../authenticate/validateToken'),require('./invoice/getInvoiceNumber.js'))
vendorRoute.use('/getPONumber',require('../authenticate/validateToken'),require('./invoice/getPONumber.js'))
vendorRoute.use('/getVendorsWithoutBCLndNDC',require('../authenticate/validateToken'),require('./getVendorsWithoutBCLndNDC.js'))
vendorRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = vendorRoute