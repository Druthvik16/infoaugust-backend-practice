let db = require('./dbQueryUser')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let password;
        let email;
        let mobile;
        let uuid;
        let createdOn;
        let isActive
        let createdById;
        let allocatedToUuid;
        let roleId;
        let roleCode;
        let linkedToId;
        let passKey;
        if (!req.body.email?.trim() || !req.body.mobile?.trim() || !req.body.role || !req.body.role?.id) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            })
        }
        password = 'admin';
        email = req.body.email?.trim();
        mobile = req.body.mobile?.trim();
        roleId = req.body.role?.id
        allocatedToUuid = req.body.allocatedTo?.uuid?.length > 0 ? req.body.allocatedTo?.uuid : null
        uuid = null
        passKey = req.body.passKey
        createdOn = new Date()
        createdById = req.body.userId;
        lastLoggedIn = null
        isActive = 1
        roleCode = await db.getRole(roleId)
        if (roleCode?.length == 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Role Not Found",
                "status_name": getCode.getStatus(400)
            })
        }
        roleCode = roleCode[0].code
        if (allocatedToUuid?.length > 0) {
            linkedToId = await db.getLinkedUserId(roleCode, allocatedToUuid)
            if (linkedToId?.length == 0 && roleCode == 'CLNT') {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": "Allocated Client Not Exist",
                    "status_name": getCode.getStatus(400)
                })
            }
            else if (linkedToId?.length == 0 && roleCode != 'CLNT') {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": "Allocated Staff Not Exist",
                    "status_name": getCode.getStatus(400)
                })
            }
            linkedToId = linkedToId[0].id
        }
        else {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Mapped User Not Found",
                "status_name": getCode.getStatus(400)
            })
        }
        let identifierName = 'additional_login_user'
        let id = 0
        let uniqueCheckEmailInAddOnUser = await uniqueFunction.unquieName(identifierName, ['email'], { "email": email }, id, 0)
        if (uniqueCheckEmailInAddOnUser != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address Already Exist In Additional User`,
                "status_name": getCode.getStatus(400)
            });
        }
        let uniqueCheckMobileInAddOnUser = await uniqueFunction.unquieName(identifierName, ['mobile'], { "mobile": mobile }, id, 0)
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

        let uniqueCheckEmailInPartnerSecondary = await uniqueFunction.unquieName('secondary_partner', ['email'], { "email": email }, id, 0)
        if (uniqueCheckEmailInPartnerSecondary != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address ${email} Already Exist For Partner User`,
                "status_name": getCode.getStatus(400)
            });
        }

        let uniqueCheckMobileInPartnerSecondary = await uniqueFunction.unquieName('secondary_partner', ['mobile'], { "mobile": mobile }, id, 0)
        if (uniqueCheckMobileInPartnerSecondary != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Mobile Number ${mobile} Already Exist For Partner User`,
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



        let insertUser = await db.insertAddonUser(email, mobile, linkedToId, roleId, createdById, createdOn, isActive)
        if (insertUser.affectedRows > 0) {
            res.status(200)
            return res.json({
                "status_code": 200,
                "message": "success",
                "data": { "uuid": insertUser.insertId },
                "status_name": getCode.getStatus(200)
            })
        }
        else {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "User Not Created",
                "status_name": getCode.getStatus(500)
            })
        }
    }
    catch (e) {
        console.log(e)
        if (e.code == 'ER_DUP_ENTRY') {
            let msg = e.sqlMessage.replace('_UNIQUE', '');
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": msg,
                "status_name": getCode.getStatus(500),
                "error": msg
            })
        }
        else {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "User Not Created",
                "status_name": getCode.getStatus(500),
                "error": e
            })
        }
    }
})
