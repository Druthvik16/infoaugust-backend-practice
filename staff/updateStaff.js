let db = require('./dbQueryStaff')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let name
        let uuid;
        let createdOn;
        let isActive
        let createdById;
        let userUuid;
        let email;
        let mobile;
        let address;
        let currentUserId;
        let userLinkedToId;
        let staffData;
        let userData;
        if (!req.body.uuid || !req.body.name?.trim() || !req.body.email || !req.body.mobile || !req.body.address) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            })
        }
        name = uniqueFunction.manageSpecialCharacter(req.body.name?.trim());
        email = uniqueFunction.manageSpecialCharacter(req.body.email)
        mobile = req.body.mobile
        address = uniqueFunction.manageSpecialCharacter(req.body.address)
        userUuid = req.body.user?.uuid?.length > 0 ? req.body.user?.uuid : null
        uuid = req.body.uuid
        createdOn = new Date()
        createdById = req.body.userId;
        isActive = 1
        let identifierName = 'staff'
        let id = 0
        staffData = await db.getStaffData(uuid)
        if (staffData?.length == 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Staff Not Exist",
                "status_name": getCode.getStatus(400)
            })
        }
        userData = await db.getUserData(uuid)
        if (userUuid?.length > 0) {
            currentUserId = await db.getLinkedUserId(userUuid)
            if (currentUserId?.length == 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": "User Not Exist",
                    "status_name": getCode.getStatus(400)
                })
            }
            else if (currentUserId[0].code == 'CLNT') {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": "Client User Cannot Be Allocated To A Staff",
                    "status_name": getCode.getStatus(400)
                })
            }
            userLinkedToId = currentUserId[0].linked_to_id
            currentUserId = currentUserId[0].id
            if (staffData[0].current_user_id != currentUserId) {
                let identifierName = 'staff'
                let id = 0
                let columnName = ['current_user_id']
                let columnValue =
                {
                    "current_user_id": currentUserId
                }
                let uniqueCheck = await uniqueFunction.unquieName(identifierName, columnName, columnValue, id, 0)
                if (uniqueCheck != 0) {
                    res.status(400)
                    return res.json({
                        "status_code": 400,
                        "message": `User Already Allocated`,
                        "status_name": getCode.getStatus(400)
                    });
                }
            }
        }
        else {
            currentUserId = null
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

        let uniqueCheckEmailInStaff = await uniqueFunction.unquieName(identifierName, ['email'], { "email": email }, id, uuid)
        if (uniqueCheckEmailInStaff != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address Already Exist In Staff`,
                "status_name": getCode.getStatus(400)
            });
        }
        let uniqueCheckMobileInStaff = await uniqueFunction.unquieName(identifierName, ['mobile'], { "mobile": mobile }, id, uuid)
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

        let updateStaff = await db.updateStaff(uuid, name, currentUserId, email, mobile, address, createdById, createdOn, isActive)
        if (updateStaff.affectedRows > 0) {
            if (currentUserId) {
                if (staffData[0].current_user_id != currentUserId) {
                    let allocateStaffToUser = await db.allocateStaffToUser(currentUserId, staffData[0].id, new Date(), createdById)
                    let staffAllocationHistoy = await db.staffAllocationHistoy(staffData[0].id, currentUserId, new Date())
                    if (staffData[0].current_user_id && staffData[0].current_user_id > 0) {
                        let deallocateStaffFromUser = await db.deallocateStaffFromUser(staffData[0].current_user_id, new Date(), createdById)
                        let staffDeallocationHistoy = await db.staffDeallocationHistoy(staffData[0].id, staffData[0].current_user_id, new Date())
                    }
                }
            }
            else {
                if (staffData[0].current_user_id && staffData[0].current_user_id > 0) {
                    let deallocateStaffFromUser = await db.deallocateStaffFromUser(staffData[0].current_user_id, new Date(), createdById)
                    let staffDeallocationHistoy = await db.staffDeallocationHistoy(staffData[0].id, staffData[0].current_user_id, new Date())
                }
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
                "message": "Staff Not Updated",
                "status_name": getCode.getStatus(500)
            })
        }
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "Staff Not Updated",
            "status_name": getCode.getStatus(500),
            "error": e
        })
    }
})
