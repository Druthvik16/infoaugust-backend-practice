let db = require('./dbQueryClient')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let formidable = require('formidable');
let path = require('path')
let apiName = ''

const spsnProcessSequence = [
    { seq_id: 1, name: 'OutstandingReportSummary', status: 0, type: 'FileSync', is_active: 1, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 2, name: 'AdjustmentReportSummary', status: 0, type: 'FileSync', is_active: 1, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 1, name: 'OutstandingReportSummary', status: 0, type: 'FileProcess', is_active: 1, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 2, name: 'AdjustmentReportSummary', status: 0, type: 'FileProcess', is_active: 1, read_type: 0, is_complete: 0, is_error: 0 },
];

const vendorProcessSequence = [
    { seq_id: 1, name: 'CreditNoteSummary', status: 0, type: 'FileSync', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 2, name: 'Form16ASummary', status: 0, type: 'FileSync', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 3, name: 'Ledger', status: 0, type: 'FileSync', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 4, name: 'PaymentAdviceMaster', status: 0, type: 'FileSync', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 5, name: 'PaymentAdviceDetail', status: 0, type: 'FileSync', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 6, name: 'CreditNotePdf', status: 0, type: 'FileSync', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 7, name: 'Form16APdf', status: 0, type: 'FileSync', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 1, name: 'CreditNoteSummary', status: 0, type: 'FileProcess', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 2, name: 'Form16ASummary', status: 0, type: 'FileProcess', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 3, name: 'Ledger', status: 0, type: 'FileProcess', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 4, name: 'PaymentAdviceMaster', status: 0, type: 'FileProcess', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 5, name: 'PaymentAdviceDetail', status: 0, type: 'FileProcess', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 1, name: 'CreditNotePdf', status: 0, type: 'BotProcess', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
    { seq_id: 2, name: 'Form16APdf', status: 0, type: 'BotProcess', is_active: 0, read_type: 0, is_complete: 0, is_error: 0 },
];

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let fileObject = {};
        let name
        let uuid;
        let code;
        let shortName;
        let email;
        let mobile;
        let gstin;
        let pan;
        let tan;
        let addressLine1;
        let addressLine2;
        let addressLine3;
        let city;
        let stateId;
        let pincode;
        let userUuid;
        let createdOn;
        let isActive
        let createdById;
        let currentUserId;
        let fullLogoName;
        let shortLogoName;
        let fullLogo;
        let shortLogo;
        let fileArray = []
        let passKey;
        let roleCode = 'CLNT'
        let password = 'admin'
        let roleId;
        let companyName;
        let documentArray = [];
        let serviceTypeId;
        let clientVendorDocuments;
        let clientId;

        let isFile = 1;
        apiName = req.baseUrl
        createdOn = new Date()
        createdById = req.body.userId || 0;
        passKey = req.body.passKey
        const loggedUserType = req.body.loggedUserType || 'SYSTEM';
        isActive = 1
        clientId = null;
        fileArray = []
        fileObject = {}
        documentArray = []
        let options = {
            filename: (name, ext, part, form) => {
                return part.originalFilename
            }
        }
        let form = new formidable.IncomingForm(options);

        form.parse(req, async function (error, fields, files) {
            try {
                isFile = 0;
                if (error) {
                    console.log(error);

                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": error?.stack,
                        "status_name": getCode.getStatus(400)
                    })
                }

                req.body = fields
                // console.log(req.body, files)       
                if (!req.body.name[0]?.trim() || !req.body.shortName[0]?.trim() || !req.body.companyName[0]?.trim() || !req.body.code || !req.body.email || !req.body.mobile || !req.body.gstin || !req.body.pan || !req.body.tan || !req.body.addressLine1 || !req.body.city || !req.body.pincode || !req.body.state || !JSON.parse(req.body.state)?.id || !req.body.serviceType || !JSON.parse(req.body.serviceType)?.id || !req.body.clientVendorDocuments) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": "Provide all values",
                        "status_name": getCode.getStatus(400)
                    })
                }

                uuid = createUuid.v1()
                name = uniqueFunction.manageSpecialCharacter(req.body.name[0]?.trim());
                shortName = uniqueFunction.manageSpecialCharacter(req.body.shortName[0])
                companyName = uniqueFunction.manageSpecialCharacter(req.body.companyName[0])
                code = uniqueFunction.manageSpecialCharacter(req.body.code[0])
                email = uniqueFunction.manageSpecialCharacter(req.body.email[0])
                mobile = req.body.mobile[0]
                pan = req.body.pan[0]
                tan = req.body.tan[0]
                gstin = req.body.gstin[0]
                addressLine1 = uniqueFunction.manageSpecialCharacter(req.body.addressLine1[0])
                addressLine2 = uniqueFunction.manageSpecialCharacter(req.body.addressLine2[0])
                addressLine3 = uniqueFunction.manageSpecialCharacter(req.body.addressLine3[0])
                city = uniqueFunction.manageSpecialCharacter(req.body.city[0])
                pincode = req.body.pincode[0]
                stateId = JSON.parse(req.body.state)?.id
                roleId = await db.getClientRoleId(roleCode)
                roleId = roleId[0].id
                serviceTypeId = JSON.parse(req.body.serviceType)?.id
                clientVendorDocuments = JSON.parse(req.body.clientVendorDocuments)

                shortLogoName = null;
                fullLogoName = null;
                if (Object.keys(files).length > 0) {
                    for (let file in files) {
                        if (Array.isArray(files[file]) == true) {
                            files[file] = files[file][0]
                        }
                    }

                    shortLogo = files?.shortLogo ? files.shortLogo : null
                    fullLogo = files?.fullLogo ? files.fullLogo : null

                    shortLogo.originalFilename = shortLogo.originalFilename?.split(' ').join('_')
                    fullLogo.originalFilename = fullLogo.originalFilename?.split(' ').join('_')

                    shortLogoName = shortLogo ? shortLogo.originalFilename : null
                    fullLogoName = fullLogo ? fullLogo.originalFilename : null

                    fileArray.push(files?.shortLogo)
                    fileArray.push(files?.fullLogo)
                    // console.log(files?.shortLogo,files?.fullLogo)
                }
                else {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": "File Not Found",
                        "status_name": getCode.getStatus(400)
                    })
                }
                if ((fullLogoName).toLowerCase() == (shortLogoName).toLowerCase()) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": "Cannot Upload Logo With Same File Names",
                        "status_name": getCode.getStatus(400)
                    });
                }
                let serviceType = await db.getServiceType(serviceTypeId)
                if (serviceType?.length == 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": "Service type not found",
                        "status_name": getCode.getStatus(400)
                    })
                }
                let serviceTypeName = serviceType[0].name
                if (!req.body.sftpHost || !req.body.sftpPort || !req.body.sftpUsername || !req.body.sftpPassword || !req.body.sftpBaseFolder || !req.body.docSendFromEmail || !req.body.docSendFromName || !req.body.isSftpConnected || !req.body.ftpDescription || !req.body.supportEmail || !req.body.supportTeam || !req.body.supportContactNo) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": "Missing SFTP Credentials",
                        "status_name": getCode.getStatus(400)
                    })
                }

                if (serviceTypeName == 'Vendor Portal' || serviceTypeName == 'Customer/Vendor Portal') {
                    if (!clientVendorDocuments || clientVendorDocuments?.length == 0) {
                        res.status(400)
                        return res.json({
                            "status_code": 400,
                            "message": "Client-Vendor attachment document list is missing",
                            "status_name": getCode.getStatus(400)
                        })
                    }
                    let fileFlag = 0;
                    let docFileNames = []
                    clientVendorDocuments.forEach(element => {
                        if (fileFlag)
                            return

                        if (parseInt(element?.isDulySigned) == 1 && parseInt(element?.isRequired) == 1) {
                            let documentName = "document" + element?.id;
                            let file = files[documentName]
                            console.log(documentName, element.fileName, file?.originalFilename)
                            if (element?.fileName?.length == 0 || !file) {
                                fileFlag = 1;
                                res.status(400)
                                return res.json({
                                    "status_code": 400,
                                    "message": "Required document is missing",
                                    "status_name": getCode.getStatus(400)
                                })
                            }
                            else {
                                if (path.extname(file.originalFilename)?.toLowerCase() != '.docx' && path.extname(file.originalFilename)?.toLowerCase() != '.doc' && path.extname(file.originalFilename)?.toLowerCase() != '.pdf') {
                                    fileFlag = 1;
                                    res.status(400)
                                    return res.json({
                                        "status_code": 400,
                                        "message": ` File type '${file?.originalFilename}' not allowed`,
                                        "status_name": getCode.getStatus(400)
                                    })
                                }
                                else if (docFileNames.includes(file?.originalFilename)) {
                                    fileFlag = 1;
                                    res.status(400)
                                    return res.json({
                                        "status_code": 400,
                                        "message": `File name ${file?.originalFilename} duplicate`,
                                        "status_name": getCode.getStatus(400)
                                    })
                                }
                                else if (file?.originalFilename?.toLowerCase() != element?.fileName?.toLowerCase()) {
                                    fileFlag = 1;
                                    res.status(400)
                                    return res.json({
                                        "status_code": 400,
                                        "message": `Uploaded document file name ${file?.originalFilename} not matched with file name attached with document ${element?.fileName}`,
                                        "status_name": getCode.getStatus(400)
                                    })
                                }
                                else {
                                    documentArray.push(file)
                                    element['docFile'] = file
                                    docFileNames.push(element?.fileName)
                                }
                            }
                        }
                    });

                    if (fileFlag)
                        return
                }
                let identifierName = 'client'
                let id = 0
                let uniqueCheckName = await uniqueFunction.unquieName(identifierName, ['name'], { "name": name }, id, 0)
                if (uniqueCheckName != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Client Name Already Exist`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckShortName = await uniqueFunction.unquieName(identifierName, ['short_name'], { "short_name": shortName }, id, 0)
                if (uniqueCheckShortName != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Client Short Name Already Exist`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckCompanyName = await uniqueFunction.unquieName(identifierName, ['company_name'], { "company_name": companyName }, id, 0)
                if (uniqueCheckCompanyName != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Client Company Name Already Exist`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckCode = await uniqueFunction.unquieName(identifierName, ['code'], { "code": code }, id, 0)
                if (uniqueCheckCode != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Client Code Already Exist`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckEmail = await uniqueFunction.unquieName(identifierName, ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmail != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Email Address Already Exist In Client`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckMobile = await uniqueFunction.unquieName(identifierName, ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobile != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Mobile Number Already Exist In Client`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckGstIn = await uniqueFunction.unquieName(identifierName, ['gstin'], { "gstin": gstin }, id, 0)
                if (uniqueCheckGstIn != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Client GST Number Already Exist`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                console.log(identifierName, ['pan'], { "pan": pan }, id, req.body)
                let uniqueCheckPan = await uniqueFunction.unquieName(identifierName, ['pan'], { "pan": pan }, id, 0);

                if (uniqueCheckPan != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Client PAN Number Already Exist`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckTan = await uniqueFunction.unquieName(identifierName, ['tan'], { "tan": tan }, id, 0)
                if (uniqueCheckTan != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Client TAN Number Already Exist`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckEmailInAddOnUser = await uniqueFunction.unquieName('additional_login_user', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInAddOnUser != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Email Address Already Exist In Additional User`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckMobileInAddOnUser = await uniqueFunction.unquieName('additional_login_user', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInAddOnUser != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Mobile Number Already Exist In Additional User`,
                        "status_name": getCode.getStatus(400)
                    });
                }

                let uniqueCheckEmailInStaff = await uniqueFunction.unquieName('staff', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInStaff != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Email Address Already Exist In Staff`,
                        "status_name": getCode.getStatus(400)
                    });
                }
                let uniqueCheckMobileInStaff = await uniqueFunction.unquieName('staff', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInStaff != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Mobile Number Already Exist In Staff`,
                        "status_name": getCode.getStatus(400)
                    });
                }

                let uniqueCheckEmailInPartner = await uniqueFunction.unquieName('partner', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInPartner != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Email Address Already Exist In Partner`,
                        "status_name": getCode.getStatus(400)
                    });
                }

                let uniqueCheckMobileInPartner = await uniqueFunction.unquieName('partner', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInPartner != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Mobile Number Already Exist In Partner`,
                        "status_name": getCode.getStatus(400)
                    });
                }

                let uniqueCheckEmailInSPSN = await uniqueFunction.unquieName('spsn_user_master', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInSPSN != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Email Address Already Exist In SPSN`,
                        "status_name": getCode.getStatus(400)
                    });
                }

                let uniqueCheckMobileInSPSN = await uniqueFunction.unquieName('spsn_user_master', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInSPSN != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Mobile Number Already Exist In SPSN`,
                        "status_name": getCode.getStatus(400)
                    });
                }


                let uniqueCheckEmailPartnerUser = await uniqueFunction.unquieName('secondary_partner', ['email'], { "email": email }, 0, 0)
                if (uniqueCheckEmailPartnerUser != 0) {

                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Email already exist in partner user `,
                        "status_name": getCode.getStatus(400)
                    });
                }

                let uniqueCheckMobilePartnerUser = await uniqueFunction.unquieName('secondary_partner', ['mobile'], { "mobile": mobile }, 0, 0)
                if (uniqueCheckMobilePartnerUser != 0) {

                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `Mobile already exist in partner user `,
                        "status_name": getCode.getStatus(400)
                    });
                }

                let fullLogoFilePath = getPath.getName('client') + '/' + uuid + '/' + fullLogoName
                let shortLogoFilePath = getPath.getName('client') + '/' + uuid + '/' + shortLogoName
                let saveClient = await db.saveClient(uuid, name, shortName, code, email, mobile, addressLine1, addressLine2, addressLine3, gstin, pan, tan, city, stateId, pincode, createdById, createdOn, isActive, fullLogoFilePath, shortLogoFilePath, companyName, serviceTypeId)
                if (saveClient.affectedRows > 0) {
                    clientId = saveClient.insertId

                    const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null

                    const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Client Profile Created', 'New Client Profile Created', clientId, 'client', null, 'success')

                    const sftpAlgorithms = uniqueFunction.manageSpecialCharacter(process.env.sftpAlgorithms)
                    const fileStoreTo = process.env.fileStoreTo
                    const rawFileMailedTo = process.env.rawFileMailId
                    let sftpHost = uniqueFunction.manageSpecialCharacter(req.body.sftpHost[0]?.trim());
                    let sftpPort = uniqueFunction.manageSpecialCharacter(req.body.sftpPort[0]?.trim());
                    let sftpUserName = uniqueFunction.manageSpecialCharacter(req.body.sftpUsername[0]?.trim());
                    let sftpPassword = uniqueFunction.manageSpecialCharacter(req.body.sftpPassword[0]?.trim());
                    let sftpBaseFolder = uniqueFunction.manageSpecialCharacter(req.body.sftpBaseFolder[0]?.trim());
                    let docSendFromEmail = uniqueFunction.manageSpecialCharacter(req.body.docSendFromEmail[0]?.trim());
                    let docSendFromName = uniqueFunction.manageSpecialCharacter(req.body.docSendFromName[0]?.trim());
                    let isSftpConnected = req.body.isSftpConnected[0]?.toString().trim();
                    let supportContactNo = req.body.supportContactNo[0]?.trim();
                    let ftpDescription = uniqueFunction.manageSpecialCharacter(req.body.ftpDescription[0]?.trim());
                    let supportEmail = uniqueFunction.manageSpecialCharacter(req.body.supportEmail[0]?.trim());
                    let supportTeam = uniqueFunction.manageSpecialCharacter(req.body.supportTeam[0]?.trim());
                    let saveClientSftp = await db.saveClientSftpMaster(clientId, sftpHost, sftpPort, sftpUserName, sftpPassword, sftpAlgorithms, sftpBaseFolder, fileStoreTo, rawFileMailedTo, docSendFromEmail, docSendFromName, isSftpConnected, ftpDescription, new Date(), createdById, supportTeam, supportContactNo, supportEmail)

                    // creating user account for client
                    let saveUser = await db.insertUser(createUuid.v1(), name + ' User', clientId, roleId, createdById, password, new Date(), 1, passKey)

                    let updateClientUser = await db.updateClientLinkedUser(clientId, saveUser.insertId)

                    let returnUuid = await db.getReturnUuid(clientId)
                    const fullAddress = [addressLine1, addressLine2, addressLine3]
                        .filter(address => address) // Filter out null or undefined values
                        .join(", ");

                    const state = await db.getState(stateId)

                    let uploadLogos = await uniqueFunction.multiFileUpload(fileArray, getPath.getName('client'), (uuid), 'logos')
                    console.log("Folder creation started", new Date())

                    if (serviceTypeName == 'Customer Portal' || serviceTypeName == 'Customer/Vendor Portal') {
                        uniqueFunction.createClientFoldersInLocal(returnUuid[0].uuid)
                        uniqueFunction.createFolderInAwsS3Bucket(returnUuid[0].uuid)
                        uniqueFunction.createClientFoldersInLocalSpsnModule(returnUuid[0].uuid)
                        uniqueFunction.createFolderInAwsS3BucketSpsnModule(returnUuid[0].uuid)

                        const values = spsnProcessSequence.map(row => [
                            row.seq_id,
                            clientId,
                            row.name,
                            row.status,
                            row.type,
                            row.is_active,
                            row.read_type,
                            row.is_complete,
                            row.is_error,
                        ]);
                        let saveSpsnProcessSequence = await db.saveSpsnProcessSequence(values)
                        let saveSpsnInteruptProcess = await db.saveSpsnInteruptProcess(clientId, 0, new Date())
                    }

                    if (serviceTypeName == 'Vendor Portal' || serviceTypeName == 'Customer/Vendor Portal') {
                        uniqueFunction.createClientFoldersInLocalVendorModule(returnUuid[0].uuid)
                        uniqueFunction.createFolderInAwsS3BucketVendorModule(returnUuid[0].uuid)

                        const values = vendorProcessSequence.map(row => [
                            row.seq_id,
                            clientId,
                            row.name,
                            row.status,
                            row.type,
                            row.is_active,
                            row.read_type,
                            row.is_complete,
                            row.is_error,
                        ]);

                        let vendorSpsnProcessSequence = await db.vendorSpsnProcessSequence(values)
                        let saveVendorInteruptProcess = await db.saveVendorInteruptProcess(clientId, 0, new Date())
                    }

                    if (clientVendorDocuments?.length > 0) {
                        let result = await saveClientVendorAttachmentDocumentMapping(clientVendorDocuments, 0, clientVendorDocuments?.length, clientId, createdById, uuid)
                        // if(result.success)
                        // {
                        //     let uploadAgreementForm = await uniqueFunction.multiFileUpload(documentArray, getPath.getName('client'), uuid + '/' + getPath.getName('client/documents'), 'registration')
                        //     console.log(uploadAgreementForm)
                        // }
                    }
                    res.status(200)
                    return res.json({
                        "status_code": 200,
                        "message": "success",
                        "data": { "uuid": returnUuid[0].uuid },
                        "status_name": getCode.getStatus(200)
                    })
                }
                else {
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": "Client Not Created",
                        "status_name": getCode.getStatus(500)
                    })
                }
            }
            catch (e) {
                console.log(e)
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Client Not Created",
                    "status_name": getCode.getStatus(500),
                    "error": e?.stack || e.message
                })
            }
        })

        form.on('error', (err) => {
            console.log(err)
        })

        form.on('fileBegin', (name, file) => {
            console.log(`Starting file upload for ${name}`);
        });

        form.on('progress', (bytesReceived, bytesExpected) => {
            console.log(`Progress: ${(bytesReceived / bytesExpected * 100).toFixed(2)}%`);
        });

        form.on('end', () => {
            console.log('File upload complete');
        });
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "Client Not Created",
            "status_name": getCode.getStatus(500),
            "error": e
        })
    }
})

async function saveClientVendorAttachmentDocumentMapping(clientVendorDocuments, start, end, clientId, createdById, clientUuid) {
    try {
        if (start < end) {
            let clientVendorDocument = clientVendorDocuments[start]
            let isRequired = clientVendorDocument.isRequired
            let documentId = clientVendorDocument.id
            let isDulySigned = clientVendorDocument.isDulySigned
            let fileName = clientVendorDocument.fileName?.length > 0 ? clientVendorDocument.fileName : null
            let filePath = null
            let encryptionKey = null
            let encryptionIV = null
            let file = clientVendorDocument?.docFile ? clientVendorDocument?.docFile : null
            if (file) {
                let uploadFileToS3 = await uploadFileToS3VendorModule(file, clientUuid, clientId)
                filePath = uploadFileToS3.filePath
                encryptionKey = uploadFileToS3.encryptionKey
                encryptionIV = uploadFileToS3.encryptionIV
            }
            let saveMapping = await db.saveClientVendorDocMapping(clientId, documentId, isRequired, createdById, new Date(), isDulySigned, fileName, filePath, encryptionKey, encryptionIV)
            start++;
            return (saveClientVendorAttachmentDocumentMapping(clientVendorDocuments, start, end, clientId, createdById, clientUuid))
        }
        else {
            return { success: true }
        }
    }
    catch (e) {
        console.log(e)
        return { success: false, error: e?.stack };
    }
}

async function uploadFileToS3VendorModule(file, clientUuid, clientId) {
    try {
        let encryptedData = await uniqueFunction.encryptFileBuffer(file.filepath, file.originalFilename, null, null, 'file')

        if (encryptedData?.result) {
            let s3Folder = 'client/' + clientUuid + '/clientDocs'
            let uploadFiles = await uniqueFunction.uploadVendorModulesFiles(encryptedData?.file, file.originalFilename, s3Folder)

            let saveDataTransactLog = await db.saveDataTransactLog('UP', 'EU', '', '', file?.size, apiName, 'S3', new Date(), clientId, file.originalFilename)
            if (uploadFiles && uploadFiles.result == true) {
                return { "result": true, "filePath": uploadFiles.s3FilePath, "encryptionKey": encryptedData?.encriptionKey, "encryptionIV": encryptedData?.encriptionIV }
            }
            else {
                return (uploadFileToS3VendorModule(file, clientUuid, clientId))
            }
        }
        else {
            return (uploadFileToS3VendorModule(file, clientUuid, clientId))
        }
    }
    catch (e) {
        console.log(e)
        return (uploadFileToS3VendorModule(file, clientUuid, clientId))
    }
}
