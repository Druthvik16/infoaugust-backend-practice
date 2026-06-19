const express = require('express');
const partnerRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

partnerRoute.use('/getPartners',require('../authenticate/validateToken'),require('./getPartners'))
partnerRoute.use('/getPartner',require('../authenticate/validateToken'),require('./getPartner'))
partnerRoute.use('/getPartnerLocations',require('../authenticate/validateToken'),require('./getPartnerLocations'))
partnerRoute.use('/getPartnerLocation',require('../authenticate/validateToken'),require('./getPartnerLocation'))
partnerRoute.use('/savePartner',require('../authenticate/validateToken'),require('./savePartner'))
partnerRoute.use('/updatePartner',require('../authenticate/validateToken'),require('./updatePartner'))
partnerRoute.use('/savePartnerClientMapping',require('../authenticate/validateToken'),require('./savePartnerClientMapping'))
partnerRoute.use('/savePartnerStatewiseGst',require('../authenticate/validateToken'),require('./savePartnerStatewiseGst'))
partnerRoute.use('/savePartnerLocation',require('../authenticate/validateToken'),require('./savePartnerLocation'))
partnerRoute.use('/uploadPartner',require('../authenticate/validateToken'),require('./uploadPartner'))
partnerRoute.use('/getUnallocatedPartnerLocations',require('../authenticate/validateToken'),require('./getUnallocatedPartnerLocations'))
partnerRoute.use('/getAllocatedPartnerLocations',require('../authenticate/validateToken'),require('./getAllocatedPartnerLocations'))
partnerRoute.use('/getUnallocatedPartners',require('../authenticate/validateToken'),require('./getUnallocatedPartners'))
partnerRoute.use('/getPartnersDownload',require('../authenticate/validateToken'),require('./getPartnersDownload'))
partnerRoute.use('/getPartnerOnboardingLogs',require('../authenticate/validateToken'),require('./getPartnerOnboardingLogs'))
partnerRoute.use('/downloadPartnerOnboardFile',require('../authenticate/validateToken'),require('./downloadPartnerOnboardFile'))
partnerRoute.use('/savePartnerData',require('../authenticate/validateToken'),require('./savePartnerData'))
partnerRoute.use('/getDisclaimerStatus',require('../authenticate/validateToken'),require('./getDisclaimerStatus'))
partnerRoute.use('/getPartnerWithLocations',require('../authenticate/validateToken'),require('./getPartnerWithLocations'))
partnerRoute.use('/changeStatusPartnerLocation',require('../authenticate/validateToken'),require('./changeStatusPartnerLocation'))

partnerRoute.use('/getLedgerDownload',require('../authenticate/validateToken'),require('./getLedgerDownload.js'))
partnerRoute.use('/getLedgerDownloadQueue',require('../authenticate/validateToken'),require('./getLedgerDownloadQueue.js'));
partnerRoute.use('/getLedgerDownloadQueueFile',require('../authenticate/validateToken'),  require('./getLedgerDownloadQueueFile.js'));
partnerRoute.use('/updatePartnerLocation',require('../authenticate/validateToken'),  require('./updatePartnerLocation.js'));
partnerRoute.use('/getPartnerLocationForSecondaryMapping',require('../authenticate/validateToken'),  require('./getPartnerLocationForSecondaryMapping.js'));

partnerRoute.use('/uploadPartnerFromSftpToLocal',require('./uploadPartnerFromSftpToLocal'))
partnerRoute.use('/uploadPartnerFromSftp',require('./uploadPartnerFromSftp'))
partnerRoute.use('/savePartnerSftp',require('./savePartnerSftp'))
partnerRoute.use('/savePartnerClientMappingSftp',require('./savePartnerClientMappingSftp'))
partnerRoute.use('/savePartnerStatewiseGstSftp',require('./savePartnerStatewiseGstSftp'))
partnerRoute.use('/savePartnerLocationSftp',require('./savePartnerLocationSftp'))

partnerRoute.use('/movePartnerLocation',require('./movePartnerLocation'))


partnerRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = partnerRoute