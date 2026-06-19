const express = require('express');
const processControllerRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

// let getCreditNoteSummary = require('./fileProcess/getCreditNoteSummaryFileFromInputFolderLocal.js')

processControllerRoute.use('/copyAndProcessSftpFileMasterApi', require('./copyAndProcessSftpFileMasterApi.js'))
processControllerRoute.use('/getProcessSequences', require('../authenticate/validateToken.js'), require('./getProcessSequences.js'))
processControllerRoute.use('/savePreference', require('../authenticate/validateToken.js'), require('./savePreference.js'))
processControllerRoute.use('/resetProcessSequenceMaster', require('../authenticate/validateToken.js'), require('./resetProcessSequenceMaster.js'))

// autoprocess controller
processControllerRoute.use('/getSftpUnreadFileCount', require('../authenticate/validateToken.js'), require('./getSftpUnreadFileCount.js'))
processControllerRoute.use('/getSftpUnreadFileList', require('../authenticate/validateToken.js'), require('./getSftpUnreadFileList.js'))
processControllerRoute.use('/downloadFileFromSftp', require('../authenticate/validateToken.js'), require('./downloadFileFromSftp.js'))
processControllerRoute.use('/markFileOnSftp', require('../authenticate/validateToken.js'), require('./markFileOnSftp.js'))

processControllerRoute.use('/',async(req,res,next) => 
{
    // let i = await getCreditNoteSummary.getFileList()
    // console.log("+++++++++++++++++++++++++         ",i)
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = processControllerRoute