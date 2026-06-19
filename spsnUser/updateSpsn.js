let db = require('./dbQuerySpsnUser')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let uuid;
        let createdOn;
        let isActive
        let createdById;
        let email;
        let mobile;
        if (!req.body.uuid || !req.body.email || !req.body.name || !req.body.mobile) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            })
        }
        email = uniqueFunction.manageSpecialCharacter(req.body.email)
        mobile = req.body.mobile
        const name = uniqueFunction.manageSpecialCharacter(req.body.name)
        uuid = req.body.uuid
        createdOn = new Date()
        createdById = req.body.userId || 0;
        isActive = 1
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        let identifierName = 'spsn_user_master'
        let id = 0;


        const currentData = await db.getSpsnDataByUuid(uuid)
        const currentRecord = currentData[0]

        if (currentRecord.email != email) {

            let uniqueCheckEmailInSpsn = await uniqueFunction.unquieName(identifierName, ['email'], { "email": email }, id, uuid)
            if (uniqueCheckEmailInSpsn != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Email Address Already Exist In SPSN`,
                    "status_name": getCode.getStatus(400)
                });
            }

            let uniqueCheckEmailInClient = await uniqueFunction.unquieName('client', ['email'], { "email": email }, id, 0)
            if (uniqueCheckEmailInClient != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Email Address Already Exist In Client`,
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

            let uniqueCheckAddOnEmail = await uniqueFunction.unquieName('additional_login_user', ['email'], { "email": email }, 0, 0)
            if (uniqueCheckAddOnEmail != 0) {

                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Mobile Number Already Exist In Additional User`,
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

            let uniqueCheckEmailPartner = await uniqueFunction.unquieName('partner', ['email'], { "email": email }, 0, 0)
            if (uniqueCheckEmailPartner != 0) {

                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Email already exist in partner `,
                    "status_name": getCode.getStatus(400)
                });
            }
        }

        if (currentRecord.mobile != mobile) {

            let uniqueCheckMobileInSpsn = await uniqueFunction.unquieName(identifierName, ['mobile'], { "mobile": mobile }, id, uuid)
            if (uniqueCheckMobileInSpsn != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Mobile Number Already Exist In SPSN`,
                    "status_name": getCode.getStatus(400)
                });
            }

            let uniqueCheckMobileInClient = await uniqueFunction.unquieName('client', ['mobile'], { "mobile": mobile }, id, 0)
            if (uniqueCheckMobileInClient != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Mobile Number Already Exist In Client`,
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

            let uniqueCheckAddOnMobile = await uniqueFunction.unquieName('additional_login_user', ['mobile'], { "mobile": mobile }, 0, 0)
            if (uniqueCheckAddOnMobile != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Mobile Number Already Exist In Additional User`,
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

            let uniqueCheckMobilePartner = await uniqueFunction.unquieName('partner', ['mobile'], { "mobile": mobile }, 0, 0)
            if (uniqueCheckMobilePartner != 0) {

                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `Mobile already exist in partner `,
                    "status_name": getCode.getStatus(400)
                });
            }
        }


        const changes = {};
        const logChanges = [];

        const field1s = {
            email,
            mobile,
            name,
            modify_on: createdOn,
            modify_by_id: createdById
        };

        let updateSpsn = await db.updateSpsn(uuid, email, mobile, createdById, createdOn, name)
        if (updateSpsn.affectedRows > 0) {
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

            const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null

            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'SPSN Profile Updated', uniqueFunction.manageSpecialCharacter(logChanges.join(' ,')), currentRecord.id, 'spsn_user_master', null, 'success')

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
                "message": "SPSN Not Updated",
                "status_name": getCode.getStatus(500)
            })
        }
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "SPSN Not Updated",
            "status_name": getCode.getStatus(500),
            "error": e?.stack
        })
    }
})
