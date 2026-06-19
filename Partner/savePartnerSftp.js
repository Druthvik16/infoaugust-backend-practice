let db = require('./dbQueryPartner')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let name
        let uuid;
        let createdOn;
        let isActive
        let createdById;
        let partnerCategoryId;
        let pan;
        let email;
        let mobile;
        let password;
        let passKey;
        let id = 0;
        let gstNumber;
        if (!req.body.name?.trim() || !req.body.partnerCategory || !req.body.partnerCategory?.id || !req.body.email || !req.body.mobile || !req.body.gstNumber) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            })
        }
        name = uniqueFunction.manageSpecialCharacter(req.body.name?.trim());
        pan = req.body.pan
        email = uniqueFunction.manageSpecialCharacter(req.body.email)
        mobile = req.body.mobile
        partnerCategoryId = req.body.partnerCategory?.id
        uuid = createUuid.v1()
        createdOn = new Date()
        createdById = 0;
        isActive = 1
        password = 'admin'
        passKey = process.env.PASS_SECRET_KEY
        id = 0;
        gstNumber = req.body.gstNumber
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'

        let uniqueCheckGSTInPartner = await uniqueFunction.unquieName('partner_statewise_gst_master', ['gstin'], { 'gstin': gstNumber }, 0, 0)
        if (uniqueCheckGSTInPartner != 0) {
            let getPartnerGstID = await db.getPartnerGstIDWithNumber(gstNumber)
            let pId = getPartnerGstID[0].partner_id
            let returnUuid = await db.getReturnUuidByID(pId, 'partner')
            res.status(200)
            return res.json({
                "status_code": 200,
                "message": "success",
                "data": { "uuid": returnUuid[0].uuid, isNewlyAdded: false },
                "status_name": getCode.getStatus(200)
            })
        }
        let getPartnerWithEmailMobile = await db.getPartnerWithEmailMobile(email, mobile)
        if (getPartnerWithEmailMobile?.length > 0) {
            res.status(200)
            return res.json({
                "status_code": 200,
                "message": "success",
                "data": { "uuid": getPartnerWithEmailMobile[0].uuid, isNewlyAdded: false },
                "status_name": getCode.getStatus(200)
            })
        }

        // let uniqueCheckPanInPartner = await uniqueFunction.unquieName('partner', ['pan'],{  "pan" : pan }, id, 0)
        // if(uniqueCheckPanInPartner != 0)
        // {
        //     res.status(400)
        //     return res.json({
        //         "status_code" : 400,
        //         "message"     : `PAN Number ${pan} Already Exist For Some Other Partner`,
        //         "status_name" : getCode.getStatus(400)
        //     });
        // }
        let uniqueCheckEmailInClient = await uniqueFunction.unquieName('client', ['email'], { "email": email }, id, 0)
        if (uniqueCheckEmailInClient != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address ${email} Already Exist In Client`,
                "status_name": getCode.getStatus(400)
            });
        }

        let uniqueCheckMobileInClient = await uniqueFunction.unquieName('client', ['mobile'], { "mobile": mobile }, id, 0)
        if (uniqueCheckMobileInClient != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Mobile Number ${mobile} Already Exist In Client`,
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
                "message": `Email Address ${email} Already Exist In Staff`,
                "status_name": getCode.getStatus(400)
            });
        }
        let uniqueCheckMobileInStaff = await uniqueFunction.unquieName('staff', ['mobile'], { "mobile": mobile }, id, 0)
        if (uniqueCheckMobileInStaff != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Mobile Number ${mobile} Already Exist In Staff`,
                "status_name": getCode.getStatus(400)
            });
        }

        let uniqueCheckEmailInPartner = await uniqueFunction.unquieName('partner', ['email'], { "email": email }, id, 0)
        if (uniqueCheckEmailInPartner != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address ${email} Already Exist For Some Other Mobile`,
                "status_name": getCode.getStatus(400)
            });
        }

        let uniqueCheckMobileInPartner = await uniqueFunction.unquieName('partner', ['mobile'], { "mobile": mobile }, id, 0)
        if (uniqueCheckMobileInPartner != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Mobile Number ${mobile} Already Exist For Some Other Email`,
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

        let savePartner = await db.savePartner(uuid, name, pan, partnerCategoryId, isActive, createdOn, createdById, email, mobile, password, passKey)
        if (savePartner.affectedRows > 0) {
            const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null

            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Profile Created', 'New Partner On-boarded', savePartner.insertId, 'partner', null, 'success')
            let returnUuid = await db.getReturnUuidByID(savePartner.insertId, 'partner')
            res.status(200)
            return res.json({
                "status_code": 200,
                "message": "success",
                "data": { "uuid": returnUuid[0].uuid, isNewlyAdded: true },
                "status_name": getCode.getStatus(200)
            })
        }
        else {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "Partner Not Created",
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
                "message": "Partner Not Created",
                "status_name": getCode.getStatus(500),
                "error": e
            })
        }
    }
})
