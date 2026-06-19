const router = require('express').Router()
const db = require('./dbQueryExtendedUser')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

router.post('/', async (req, res) => {
    try {
        const id = 0;
        const { name, email, mobile, designationCode, clientUuid,
            userId: createdById } = req.body

        if (!name || !email || !mobile || !designationCode || !clientUuid)
            return res.status(400).json({ success: false, message: 'Mandatory fields missing' })

        if (!['NSM', 'ASM', 'RSM'].includes(designationCode))
            return res.status(400).json({ success: false, message: 'Invalid designation' })


        let clientId = null;
        if (clientUuid) {
            const client = await db.getClient(clientUuid);
            if (!client.length) {
                return res.status(400).json({ success: false, message: 'Invalid client' })
            }
            clientId = client[0].id || null;
        }

        const password = email.split('@')[0]


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

        let uniqueCheckEmailInSPSNExtendedUser = await uniqueFunction.unquieName('spsn_extended_user', ['email'], { "email": email }, id, 0)
        if (uniqueCheckEmailInSPSNExtendedUser != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address Already Exist In SPSN Extended User`,
                "status_name": getCode.getStatus(400)
            });
        }

        let uniqueCheckMobileInSPSNExtendedUser = await uniqueFunction.unquieName('spsn_extended_user', ['mobile'], { "mobile": mobile }, id, 0)
        if (uniqueCheckMobileInSPSNExtendedUser != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Mobile Number Already Exist In SPSN Extended User`,
                "status_name": getCode.getStatus(400)
            });
        }


        const userId = await db.createExtendedUser({
            name, email, mobile, designationCode, password, clientId, createdById
        })

        const user = await db.getExtendedUser(userId)

        res.json({ success: true, extendedUserId: user[0].uuid })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

module.exports = router
