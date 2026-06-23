let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');
let dotenv = require('dotenv');
let errorCodes = require('./common/error/errorCode.js');
let getCode = new errorCodes()
let port = "3001";
let app = express(
let path = require('path');
app.use(cors());
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb',extended : true}));
dotenv.config();
let logoId = ''
  const { getDiskSpaceStatus } = require('./diskSpaceChecker/diskSpaceChecker.js');

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString()
    });
    console.log("health api called")
});


//For Logo 
app.use('/api/logo', (req,res,next) =>
{
    if(req.url == '/')
    {
        res.send('')
    }
    else
    {
        logoId = req.url
        let paths = path.join(__dirname, logoId)
        console.log(paths)
        res.sendFile(paths)
    }
});

app.use('/api/auth',require('./authenticate/authenticateRoute.js'))
app.use('/api/common',require('./common/commonRoute.js'))
app.use('/api/user',require('./user/userRoute.js'))
app.use('/api/staff',require('./staff/staffRoute.js'))
// app.use('/api/partner',require('./Partner/partnerRoute.js'))
// app.use('/api/secondaryPartner',require('./secondaryPartner/secondaryPartnerRoute.js'))
// app.use('/api/vendor',require('./vendor/vendorRoute.js'))
// app.use('/api/client',require('./client/clientRoute.js'))
// app.use('/api/uploadedDoc',require('./clientUploadedDocs/uploadedDocRoute.js'))
// app.use('/api/dashboard',require('./dashboard/dashboardRoute.js'))
// app.use('/api/cron',require('./cron/cronRoute.js'))
// app.use('/api/spsn',require('./spsnUser/spsnUserRoute.js'))
// app.use('/api/processController',require('./botProcessController/processControllerRoute.js'))
// app.use('/api/fileProcessController',require('./fileProcessController/processControllerRoute.js'))
// app.use('/api/report',require('./report/reportRoute.js'))
// app.use('/api/vendorUploadedDoc',require('./vendorClientUploadedDocs/vendorUploadedDocRoute.js'))
// app.use('/api/vendorProcessController',require('./vendorBotProcessController/vendorProcessControllerRoute.js'))
// app.use('/api/vendorFileProcessController',require('./vendorFileProcessController/vendorProcessControllerRoute.js'))
// app.use('/api/spsnFileProcessController',require('./spsnFileProcessController/spsnProcessControllerRoute.js'))
// app.use('/api/jsonProcess',require('./jsonProcess/jsonProcessRoute.js'))
// app.use('/api/documentCleanup',require('./documentCleanup/documentCleanupRoute.js'))
// app.use('/api/extendedUser',require('./spsnExtendedUser/extendedUserRoute.js'))

// app.use('/api/manualBlocker',require('./manualRunApiBlocker/manualBlockerRoute.js'))

// app.use('/api/ptDownload',require('./PtFileMergeDownloads/ptDownloadRoute.js'))

// app.use('/api/utils',require('./AdditionalUtils/additionalutisRoute.js'))
app.use('/api/',(req,res,next) =>
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})


app.listen(port, () => 
{
    console.log(`InfoAugust Server is running on port ${port}`)
    console.log(".....InfoAugust....Started......")
});