const express = require('express');
const commonRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

commonRoute.use('/getPartnerCategories',require('../authenticate/validateToken'),require('./PartnerCategory/getPartnerCategories'))
commonRoute.use('/getStates',require('../authenticate/validateToken'),require('./state/getStates'))
commonRoute.use('/getCountries',require('../authenticate/validateToken'),require('./country/getCountries'))
commonRoute.use('/getCities',require('../authenticate/validateToken'),require('./city/getCities'))
commonRoute.use('/getBanks',require('../authenticate/validateToken'),require('./bank/getBanks'))
commonRoute.use('/duplicateEmailMobile',require('../authenticate/validateToken'),require('./duplicateEmailMobile'))
commonRoute.use('/getDocumentAttachemnts',require('../authenticate/validateToken'),require('./documentAttachments/getDocumentAttachemnts'))
commonRoute.use('/getRoles',require('../authenticate/validateToken'),require('./role/getRoles'))
commonRoute.use('/saveDocumentCategory',require('../authenticate/validateToken'),require('./documentCategory/saveDocumentCategory'))
commonRoute.use('/updateDocumentCategory',require('../authenticate/validateToken'),require('./documentCategory/updateDocumentCategory'))
commonRoute.use('/getDocumentCategories',require('../authenticate/validateToken'),require('./documentCategory/getDocumentCategories'))
commonRoute.use('/getDocuments',require('../authenticate/validateToken'),require('./document/getDocuments'))
commonRoute.use('/saveDocument',require('../authenticate/validateToken'),require('./document/saveDocument'))
commonRoute.use('/updateDocument',require('../authenticate/validateToken'),require('./document/updateDocument'))
commonRoute.use('/downloadTemplate',require('../authenticate/validateToken'),require('./downloadTemplate'))
commonRoute.use('/getHtmlLogFile',require('../authenticate/validateToken'),require('./htmlLogs/getHtmlLogFile'))
commonRoute.use('/getLogDocumentType',require('../authenticate/validateToken'),require('./htmlLogs/getLogDocumentType'))
commonRoute.use('/getLogProcesses',require('../authenticate/validateToken'),require('./htmlLogs/getLogProcesses'))
commonRoute.use('/getPdfBotLogs',require('../authenticate/validateToken'),require('./htmlLogs/getPdfBotLogs'))
commonRoute.use('/getPdfBotLogDetails',require('../authenticate/validateToken'),require('./htmlLogs/getPdfBotLogDetails'))
commonRoute.use('/getDailyActivityLogDetails',require('../authenticate/validateToken'),require('./htmlLogs/getDailyActivityLogDetails'))
commonRoute.use('/getStatesOfCountry',require('../authenticate/validateToken'),require('./state/getStatesOfCountry'))

commonRoute.use('/getHtmlLogFileVendor',require('../authenticate/validateToken'),require('./vendorHtmlLogs/getHtmlLogFileVendor'))
commonRoute.use('/getLogDocumentTypeVendor',require('../authenticate/validateToken'),require('./vendorHtmlLogs/getLogDocumentTypeVendor'))
commonRoute.use('/getLogProcessesVendor',require('../authenticate/validateToken'),require('./vendorHtmlLogs/getLogProcessesVendor'))
commonRoute.use('/getPdfBotLogsVendor',require('../authenticate/validateToken'),require('./vendorHtmlLogs/getPdfBotLogsVendor'))
commonRoute.use('/getPdfBotLogDetailsVendor',require('../authenticate/validateToken'),require('./vendorHtmlLogs/getPdfBotLogDetailsVendor'))
commonRoute.use('/getDailyActivityLogDetailsVendor',require('../authenticate/validateToken'),require('./vendorHtmlLogs/getDailyActivityLogDetailsVendor'))
commonRoute.use('/getReportingUsers',require('../authenticate/validateToken'),require('./reportingUsers/getReportingUsers'))
commonRoute.use('/saveReportingUser',require('../authenticate/validateToken'),require('./reportingUsers/saveReportingUser'))
commonRoute.use('/updateReportingUser',require('../authenticate/validateToken'),require('./reportingUsers/updateReportingUser'))
commonRoute.use('/getFinancialYears',require('../authenticate/validateToken'),require('./financialYear/getFinancialYears'))

commonRoute.use('/getHtmlLogFileSpsn',require('../authenticate/validateToken'),require('./spsnHtmlLogs/getHtmlLogFileSpsn'))
commonRoute.use('/getLogDocumentTypeSpsn',require('../authenticate/validateToken'),require('./spsnHtmlLogs/getLogDocumentTypeSpsn'))
commonRoute.use('/getLogProcessesSpsn',require('../authenticate/validateToken'),require('./spsnHtmlLogs/getLogProcessesSpsn'))
commonRoute.use('/getDailyActivityLogDetailsSpsn',require('../authenticate/validateToken'),require('./spsnHtmlLogs/getDailyActivityLogDetailsSpsn'))

commonRoute.use('/saveFinancialYear',require('../authenticate/validateToken'),require('./financialYear/saveFinancialYear'))

commonRoute.use('/sendMail',require('./sendMail'));

commonRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = commonRoute