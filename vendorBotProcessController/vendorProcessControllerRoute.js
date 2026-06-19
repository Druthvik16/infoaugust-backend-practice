const express = require('express');
const vendorProcessControllerRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

vendorProcessControllerRoute.use('/checkCreditNotPdfBotStatus',require('./checkCreditNotPdfBotStatus'))
vendorProcessControllerRoute.use('/stopCreditNotePdfBot',require('./stopCreditNotePdfBot'))

vendorProcessControllerRoute.use('/checkForm16PdfBotStatus',require('./checkForm16PdfBotStatus'))
vendorProcessControllerRoute.use('/stopForm16PdfBot',require('./stopForm16PdfBot'))

vendorProcessControllerRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = vendorProcessControllerRoute