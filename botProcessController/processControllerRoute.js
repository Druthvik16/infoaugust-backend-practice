const express = require('express');
const processControllerRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

processControllerRoute.use('/checkCreditNotPdfBotStatus',require('./checkCreditNotPdfBotStatus'))
processControllerRoute.use('/stopCreditNotePdfBot',require('./stopCreditNotePdfBot'))

processControllerRoute.use('/checkInvoicePdfBotStatus',require('./checkInvoicePdfBotStatus'))
processControllerRoute.use('/stopInvoicePdfBot',require('./stopInvoicePdfBot'))

processControllerRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = processControllerRoute