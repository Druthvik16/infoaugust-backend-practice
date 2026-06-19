const db = require('./dbQueryAuthenticate');
const errorCode = require('../common/error/errorCode');
const getCode = new errorCode();
const fs = require('fs');

async function verifyToken(req, res, next) {
    try {
        let authData = [];
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(401).json({
                "message": "Provide Token",
                "status_name": getCode.getStatus(401),
                "status_code": 401
            });
        }

        let tokenArr = token.split(" ");
        if (tokenArr.length !== 2 || !tokenArr[1]) {
            log("No access token");
            return res.status(401).json({
                "message": "Invalid Token",
                "status_name": getCode.getStatus(401),
                "status_code": 401
            });
        }

        let accessToken = tokenArr[1].toString();

        authData = await db.selectToken(accessToken);

        if (authData.length === 0) 
        { 
            return res.status(401).json({
                "message": "Invalid Token",
                "status_name": getCode.getStatus(401),
                "status_code": 401
            });
        } 
        else 
        {
            await updateLastLogin(req.baseUrl, authData[0]?.userType, authData[0].userId, accessToken);
        }

        let userId = authData[0]?.userId;

        console.log(tokenArr);
        if (userId) 
        {
            const user = authData;
            let roleCode = req.body.roleCode || user[0]?.roleCode;
            const verified = (accessToken === authData[0]?.authToken);
            if (verified) {
                let isAuth = isAuthorizedPath(req.baseUrl, req.method)
                console.log(isAuth)
                if (isAuth) {
                    if(authData[0].userType == 'AdditionalUser')
                    {
                        userId = authData[0].mappedId || userId
                    }
                    populateRequestBody(req, accessToken, roleCode, userId, authData[0].uuid, authData[0].userType);
                    next();
                } else {
                    return unauthorizedResponse(res, 'Invalid user');
                }
            } else {
                return unauthorizedResponse(res, 'Invalid user');
            }
        } else {
            return unauthorizedResponse(res, 'Unauthenticated User');
        }
    } catch (error) {
        console.log(error);
        res.status(401);
        return res.json({
            'message': 'Unauthorized User',
            "status_name": getCode.getStatus(401),
            "status_code": 401,
            "error": error
        });
    }
}

async function updateLastLogin(baseUrl, userType, userId, accessToken) {
    if (baseUrl !== '/api/auth/logout') {

        const updateFunctions = {
            'User': db.insertLastLoginAndAuthToken,
            'Partner': db.insertLastLoginAndAuthTokenPartner,
            'Partner-User': db.insertLastLoginAndAuthTokenPartnerSecondary,
            'SpsnUser': db.insertLastLoginAndAuthTokenSpsnUser,
            'SpsnExdUser': db.insertLastLoginAndAuthTokenSpsnExtendedUser,
            'AdditionalUser': db.insertLastLoginAndAuthTokenAdditionalUser
        };

        const userTypeCode = (userType == 'NSM' || userType == 'ASM' || userType == 'RSM') ? 'SpsnExdUser' : userType;

        await updateFunctions[userTypeCode](new Date(), userId, accessToken, null);
    }
}

function isAuthorizedPath(baseUrl, method) {
    const authorizedPaths = [
        '/api/client/createDocFolders',
        '/api/client/uploadSummarySheet',
        '/api/client/uploadMonthlyTransactionFile',
        '/api/client/uploadInvoicePtFile',
        '/api/client/uploadWorkingFile',
        '/api/client/uploadPdfFile',
        '/api/client/uploadLedgerFile',
        '/api/client/uploadInvoiceSummary',
        '/api/client/uploadInvoicePdf',
        '/api/client/saveClient',
        '/api/client/updateStatus',
        '/api/client/updateClient',
        '/api/client/testSftpConnection',
        '/api/partner/updatePartner',
        '/api/partner/updatePartnerLocation',
        '/api/partner/downloadPartnerOnboardFile',
        '/api/partner/savePartnerLocation',
        '/api/partner/savePartnerStatewiseGst',
        '/api/partner/savePartnerClientMapping',
        '/api/partner/savePartner',
        '/api/partner/uploadPartner',
        '/api/partner/savePartnerData',
        '/api/staff/getStaffs',
        '/api/staff/updateStaff',
        '/api/staff/saveStaff',
        '/api/staff/updateStatus',
        '/api/user/changeUserStatus',
        '/api/user/changeUserClientPartnerStatus',
        '/api/user/allocateDellocateStaff',
        '/api/user/allocateDellocateClient',
        '/api/user/saveUserClientPartner',
        '/api/user/deleteUserClientPartner',
        '/api/user/deleteUserClient',
        '/api/user/saveUserClient',
        '/api/user/getUserClients',
        '/api/user/saveUser',
        '/api/user/saveAddonUser',
        '/api/user/updateAssignedManager',
        '/api/common/duplicateEmailMobile',
        '/api/common/updateDocumentCategory',
        '/api/common/saveDocumentCategory',
        '/api/common/saveDocument',
        '/api/common/updateDocument',
        '/api/common/getHtmlLogFile',
        '/api/common/saveReportingUser',
        '/api/common/updateReportingUser',
        '/api/common/saveFinancialYear',
        '/api/uploadedDoc/mailDocumentFile',
        '/api/uploadedDoc/uploadPendingPdfForSummaries',
        '/api/spsn/saveSpsnUser',
        '/api/spsn/updateSpsn',
        '/api/spsn/updateSpsnLocations',
        '/api/fileProcessController/savePreference',
        '/api/fileProcessController/resetProcessSequenceMaster',
        '/api/vendor/saveVendors',
        '/api/vendor/saveVendor',
        '/api/vendor/draftVendorRegistration',
        '/api/vendor/saveVendorRegistration',
        '/api/vendor/draftVendorUploadDocuments',
        '/api/vendor/saveVendorUploadDocuments',
        '/api/vendor/submitVendorDocuments',
        '/api/vendor/createDocumentTimeline',
        '/api/vendor/validateVendorDocument',
        '/api/vendor/updateVendorByInfomap',
        '/api/vendor/submitVendorValidation',
        '/api/vendor/validateVendorForm',
        '/api/vendor/deleteVendorUploadDocument',
        '/api/vendor/submitVendorApproval',
        '/api/vendor/savePOs',
        '/api/vendor/attachPOPdfs',
        '/api/vendor/saveInvoice',
        '/api/report/saveReportRequest',
        '/api/auth/sendOtpToRegisteredSpsn',
        '/api/uploadedDoc/downloadCustomerUploadedFilePost',
        '/api/uploadedDoc/viewUploadedFile',
        '/api/uploadedDoc/uploadCreditNoteWorkingForMaster',
        '/api/uploadedDoc/uploadCreditNoteWorkingUnverifiedFile',
        '/api/vendorFileProcessController/resetProcessSequenceMaster',
        '/api/vendorFileProcessController/savePreference',
        '/api/vendorUploadedDoc/saveVendorCreditNote',
        '/api/vendorUploadedDoc/saveVendorDebitNote',
        '/api/vendorUploadedDoc/saveVendorLedger',
        '/api/vendorUploadedDoc/generateBalanceConfirmation',
        '/api/vendorUploadedDoc/generateNoDuesCertificate',
        '/api/vendorUploadedDoc/uploadVendorBCLorNDC',
        '/api/spsnFileProcessController/savePreference',        
        '/api/spsnFileProcessController/resetProcessSequenceMaster',
        '/api/secondaryPartner/saveSecondaryPartner',
        '/api/secondaryPartner/updateSecondaryPartner',
        '/api/documentCleanup/uploadDocumentCleanupFile',
        '/api/extendedUser/getPartnerLocationList',
        '/api/extendedUser/saveExtendedUserMappings',
        '/api/extendedUser/saveExtendedUser',
        '/api/extendedUser/updateExtendedUserStatus',

        ////////////// PT FILE DOWNLOAD ////////////////// 
        '/api/ptDownload/getPtFileDownload',
        '/api/ptDownload/savePTFileDownloadQueue',
    ];
    const postPaths = ['/api/auth/changePassword'];
    const getPaths = [
        '/api/partner/changeStatusPartnerLocation',
        '/api/auth/logout', 
        '/api/common/downloadTemplate', 
        '/api/uploadedDoc/downloadUploadedFile', 
        '/api/uploadedDoc/downloadUploadDocFile', 
        '/api/partner/downloadPartnerOnboardFile',
        '/api/vendor/downloadDocument',
        '/api/vendorFileProcessController/resetProcessSequenceMaster',
        '/api/spsnFileProcessController/resetProcessSequenceMaster',
        '/api/vendorUploadedDoc/downloadUploadedFile', 
        '/api/vendorUploadedDoc/downloadVendorUploadedFile', 
        '/api/vendorUploadedDoc/downloadUploadDocFile', 
        '/api/vendorUploadedDoc/downloadPaymentAdvice', 
        '/api/vendorUploadedDoc/downloadClientBCLorNDC', 
        '/api/spsn/downloadUploadedFile', 
        '/api/spsn/downloadUploadDocFile', 
        '/api/fileProcessController/downloadFileFromSftp',
        '/api/fileProcessController/markFileOnSftp',
        '/api/secondaryPartner/changeStatusSecondaryPartner',
        '/api/documentCleanup/updateDocumentCleanupJobStatus',
        '/api/documentCleanup/downloadCleanupFile',

    ];

    // let baseUrl1 = baseUrl.split("/")[3]
    // console.log("baseUrl1",baseUrl1)
    // baseUrl = baseUrl1

    let baseUrlWithoutParams = baseUrl.split('/').slice(0, 4).join('/');

    let authCheck = authorizedPaths.includes(baseUrl)
    let postCheck = (method === 'POST' && postPaths.includes(baseUrl))
    let getCheck = (method === 'GET' && (getPaths.includes(baseUrl) || getPaths.includes(baseUrlWithoutParams)))
    let get = baseUrl.includes('get')
    
    console.log("authCheck",authCheck, "getCheck", getCheck, "postCheck", postCheck, get, baseUrl, baseUrlWithoutParams, getPaths.includes(baseUrl), getPaths.includes(baseUrlWithoutParams) )
    // return  (authCheck == baseUrl) ||  (method === 'POST' && (postCheck == baseUrl) ) || (method === 'GET' && (getCheck == baseUrl)  || baseUrl.includes('get'))

    // if(authCheck || postCheck || getCheck || get)
    // {
    //     return true
    // }
    // else
    // {
    //     return false;
    // }

    return authCheck || postCheck || getCheck || get;
}

function populateRequestBody(req, accessToken, roleCode, userId, uuid, userType) {
    req.body.accessToken = accessToken;
    req.body.roleCode = roleCode;
    req.body.userId = userId;
    req.body.loggedUserUuid = uuid;
    req.body.loggedUserType = userType
    req.body.passKey = process.env.PASS_SECRET_KEY;
}

function unauthorizedResponse(res, message) {
    return res.status(401).json({
        'message': message,
        "status_name": getCode.getStatus(401),
        "status_code": 401
    });
}

module.exports = verifyToken;
