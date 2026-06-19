const express = require('express');
const spsnProcessControllerRoute = express.Router();
let errorCode = require('../common/error/errorCode.js')
let getCode = new errorCode()

// let getCreditNoteSummary = require('./fileProcess/getCreditNoteSummaryFileFromInputFolderLocal.js')

spsnProcessControllerRoute.use('/copyAndProcessSftpFileMasterApi', require('./copyAndProcessSftpFileMasterApi.js'))
spsnProcessControllerRoute.use('/getProcessSequences', require('../authenticate/validateToken.js'), require('./getProcessSequences.js'))
spsnProcessControllerRoute.use('/savePreference', require('../authenticate/validateToken.js'), require('./savePreference.js'))
spsnProcessControllerRoute.use('/resetProcessSequenceMaster', require('../authenticate/validateToken.js'), require('./resetProcessSequenceMaster.js'))

spsnProcessControllerRoute.use('/',async(req,res,next) => 
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
module.exports = spsnProcessControllerRoute