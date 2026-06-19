let db = require('./dbQueryClient')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let formidable = require('formidable');
let path = require('path')

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
        let modifyOn;
        let isActive
        let modifyById;
        let clientData;
        let fullLogoName;
        let shortLogoName;
        let fullLogo;
        let shortLogo;
        let fileArray = []
        let companyName;

        modifyOn = new Date()
        modifyById = req.body.userId;
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        isActive = 1
        fileArray = []
        fileObject = {}
        let options = {
            filename: (name, ext, part, form) => {
                return part.originalFilename
            }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, files) {
            if (error) {
                console.log(error);
                throw error;
            }
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

                shortLogoName = shortLogo ? shortLogo.originalFilename : null
                fullLogoName = fullLogo ? fullLogo.originalFilename : null


                fileArray.push(files?.shortLogo)
                fileArray.push(files?.fullLogo)
                if ((fullLogoName).toLowerCase() == (shortLogoName).toLowerCase()) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": "Cannot Upload Logo With Same File Names",
                        "status_name": getCode.getStatus(400)
                    });
                }
                // console.log(files?.shortLogo,files?.fullLogo)
            }

            req.body = fields
            if (!req.body.uuid || !req.body.name[0]?.trim() || !req.body.shortName[0]?.trim() || !req.body.companyName[0]?.trim() || !req.body.code || !req.body.email || !req.body.mobile || !req.body.gstin || !req.body.pan || !req.body.tan || !req.body.addressLine1 || !req.body.city || !req.body.pincode || !req.body.state || !JSON.parse(req.body.state)?.id) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": "Provide all values",
                    "status_name": getCode.getStatus(400)
                })
            }
            uuid = req.body.uuid[0]
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
            // console.log("*************************************************************************************",name, shortName, req.body)

            let identifierName = 'client'
            let id = 0
            clientData = await db.getClientData(uuid)
            let uniqueCheckName = await uniqueFunction.unquieName(identifierName, ['name'], { "name": name }, id, uuid)
            if (uniqueCheckName != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Client Name Already Exist`,
                    "status_name": getCode.getStatus(400)
                });
            }
            let uniqueCheckShortName = await uniqueFunction.unquieName(identifierName, ['short_name'], { "short_name": shortName }, id, uuid)
            if (uniqueCheckShortName != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Client Short Name Already Exist`,
                    "status_name": getCode.getStatus(400)
                });
            }

            let uniqueCheckCompanyName = await uniqueFunction.unquieName(identifierName, ['company_name'], { "company_name": companyName }, id, uuid)
            if (uniqueCheckCompanyName != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Client Company Name Already Exist`,
                    "status_name": getCode.getStatus(400)
                });
            }

            let uniqueCheckCode = await uniqueFunction.unquieName(identifierName, ['code'], { "code": code }, id, uuid)
            if (uniqueCheckCode != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Client Code Already Exist`,
                    "status_name": getCode.getStatus(400)
                });
            }
            let uniqueCheckEmail = await uniqueFunction.unquieName(identifierName, ['email'], { "email": email }, id, uuid)
            if (uniqueCheckEmail != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Email Address Already Exist In Client`,
                    "status_name": getCode.getStatus(400)
                });
            }
            let uniqueCheckMobile = await uniqueFunction.unquieName(identifierName, ['mobile'], { "mobile": mobile }, id, uuid)
            if (uniqueCheckMobile != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Mobile Number Already Exist In Client`,
                    "status_name": getCode.getStatus(400)
                });
            }
            let uniqueCheckGstIn = await uniqueFunction.unquieName(identifierName, ['gstin'], { "gstin": gstin }, id, uuid)
            if (uniqueCheckGstIn != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Client GST Number Already Exist`,
                    "status_name": getCode.getStatus(400)
                });
            }
            let uniqueCheckPan = await uniqueFunction.unquieName(identifierName, ['pan'], { "pan": pan }, id, uuid)
            if (uniqueCheckPan != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Client PAN Number Already Exist`,
                    "status_name": getCode.getStatus(400)
                });
            }
            let uniqueCheckTan = await uniqueFunction.unquieName(identifierName, ['tan'], { "tan": tan }, id, uuid)
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
            const currentData = await db.getClientCurrentData(uuid)
            const currentRecord = currentData[0]


            let fullLogoFilePath = ''
            let shortLogoFilePath = ''

            if (Object.keys(files).length > 0) {
                let uploadLogos = await uniqueFunction.multiFileUpload(fileArray, getPath.getName('client'), (uuid), 'logos')
                fullLogoFilePath = getPath.getName('client') + '/' + uuid + '/' + fullLogoName?.length > 0 ? fullLogoName : currentRecord['full_logo_file_path'].split('/').pop()
                shortLogoFilePath = getPath.getName('client') + '/' + uuid + '/' + shortLogoName?.length > 0 ? shortLogoName : currentRecord['short_logo_file_path'].split('/').pop()
            }

            const changes = {};
            const logChanges = [];

            const field1s = {
                name,
                short_name: shortName,
                code,
                email,
                mobile,
                gstin,
                pan,
                tan,
                address_line1: addressLine1,
                address_line2: addressLine2,
                address_line3: addressLine3,
                city,
                state_id: stateId,
                pincode,
                is_active: isActive,
                company_name: companyName,
                modify_on: modifyOn,
                modify_by_id: modifyById
            };

            let updateClient = await db.updateClient(uuid, name, shortName, code, email, mobile, addressLine1, addressLine2, addressLine3, gstin, pan, tan, city, stateId, pincode, modifyById, modifyOn, isActive, companyName)
            if (updateClient.affectedRows > 0) {
                for (const field in field1s) {
                    if (field1s[field] != currentRecord[field]) {
                        changes[field] = {
                            oldValue: currentRecord[field],
                            newValue: field1s[field],
                        };

                        const fieldName = field?.toString().split('_').join(' ').replace(/\w\S*/g, function (txt) {
                            return txt.charAt(0).toUpperCase() +
                                txt.substr(1).toLowerCase();
                        });

                        logChanges.push(`${fieldName}: '${currentRecord[field]}' -> '${field1s[field]}'`);
                    }
                }

                if (Object.keys(logChanges).length == 0) {
                    logChanges.push(`No fields were changed.`)
                }


                if (Object.keys(files).length > 0) {
                    if (shortLogoFilePath != currentRecord['short_logo_file_path']) {
                        logChanges.push(`Short Logo Path: '${currentRecord['short_logo_file_path']}' -> '${shortLogoFilePath}'`)
                        changes['short_logo_file_path'] = {
                            oldValue: currentRecord['short_logo_file_path'],
                            newValue: shortLogoFilePath,
                        };
                    }
                    if (shortLogoFilePath != currentRecord['full_logo_file_path']) {
                        logChanges.push(`Full Logo Path: '${currentRecord['full_logo_file_path']}' -> '${fullLogoFilePath}'`)
                        changes['full_logo_file_path'] = {
                            oldValue: currentRecord['full_logo_file_path'],
                            newValue: fullLogoFilePath,
                        };
                    }
                    let updateClientLogoFile = await db.updateClientLogoFile(fullLogoFilePath, shortLogoFilePath)
                }


                const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null

                const saveActivityLog = await commonDb.saveInfoaugustActivityLog(modifyById, loggedUserType, loggedUserTable, 'Client Profile Updated', uniqueFunction.manageSpecialCharacter(logChanges.join(' ,')), currentRecord.id, 'client', null, 'success')

                res.status(200)
                return res.json({
                    "status_code": 200,
                    "message": "success",
                    "status_name": getCode.getStatus(200)
                })
            }
            else {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Client Not Updated",
                    "status_name": getCode.getStatus(500)
                })
            }
        })
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "Client Not Updated",
            "status_name": getCode.getStatus(500),
            "error": e
        })
    }
})