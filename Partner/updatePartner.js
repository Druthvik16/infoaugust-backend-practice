let db = require('./dbQueryPartner')
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
        let identifierName = 'partner'
        let id = 0
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

        let uniqueCheckEmailInClient = await uniqueFunction.unquieName('client', ['email'], { "email": email }, id, 0)
        if (uniqueCheckEmailInClient != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address Already Exist In Client`,
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

        let uniqueCheckEmailInPartner = await uniqueFunction.unquieName(identifierName, ['email'], { "email": email }, id, uuid)
        if (uniqueCheckEmailInPartner != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address Already Exist In Partner`,
                "status_name": getCode.getStatus(400)
            });
        }

        let uniqueCheckMobileInPartner = await uniqueFunction.unquieName(identifierName, ['mobile'], { "mobile": mobile }, id, uuid)
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
        const currentData = await db.getPartnerByUuid(uuid)
        const currentRecord = currentData[0]

        const changes = {};
        const logChanges = [];

        const field1s = {
            email,
            mobile,
            name,
            modify_on: createdOn,
            modify_by_id: createdById
        };

        let updatePartner = await db.updatePartner(uuid, email, mobile, createdById, createdOn, name)
        if (updatePartner.affectedRows > 0) {
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

            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Profile Updated', uniqueFunction.manageSpecialCharacter(logChanges.join(' ,')), currentRecord.id, 'partner', null, 'success')

            const currentDataLocation = await db.getPartnerLocationDataByPartnerUuid(uuid)
            let updatePartnerLocation = await db.updatePartnerLocation(uuid, email, mobile)

            for (const currentRecordLocation of currentDataLocation) {
                const locationChanges = {};
                const locationLogChanges = [];

                const field2 = {
                    email,
                    mobile
                };


                for (const field in field2) {
                    if (field2[field] != currentRecordLocation[field]) {
                        locationChanges[field] = {
                            oldValue: currentRecordLocation[field],
                            newValue: field2[field],
                        };

                        const fieldNameLocation = field?.toString().split('_').join(' ').replace(/\w\S*/g, function (txt) {
                            return txt.charAt(0).toUpperCase() +
                                txt.substr(1).toLowerCase();
                        });

                        locationLogChanges.push(`${fieldNameLocation}: '${currentRecordLocation[field]}' -> '${field2[field]}'`);
                    }
                }

                if (Object.keys(locationLogChanges).length == 0) {
                    locationLogChanges.push(`No fields were changed.`)
                }

                const saveActivityLogLocation = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Profile Updated', uniqueFunction.manageSpecialCharacter(locationLogChanges.join(' ,')), currentRecordLocation.id, 'partner_location_detail', null, 'success')
            }
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
                "message": "Partner Not Updated",
                "status_name": getCode.getStatus(500)
            })
        }
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "Partner Not Updated",
            "status_name": getCode.getStatus(500),
            "error": e
        })
    }
})
