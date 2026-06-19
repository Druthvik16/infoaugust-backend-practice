const express = require('express');
const router = express.Router();
const db = require('./dbQuerySecondaryPartner');
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

router.post('/', async (req, res) => {
    const { userId, mobile, partnerLocationDetailUuids } = req.body;
    try {


        const id = 0;

        const email = uniqueFunction.manageSpecialCharacter(req.body.email)
        const name = uniqueFunction.manageSpecialCharacter(req.body.name)

        if (!name?.trim() || !partnerLocationDetailUuids || partnerLocationDetailUuids?.length == 0 || !email || !mobile) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            })
        }

        if(!validateEmail(email))
        {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide valid email",
                "status_name": getCode.getStatus(400)
            })
        }

        if(!validateMobile(mobile))
        {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide valid mobile",
                "status_name": getCode.getStatus(400)
            })
        }

        const uuidArray = partnerLocationDetailUuids
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        const locationRows = await db.getPartnerLocations(uuidArray)

        if (locationRows.length === 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Partner Location not found",
                "status_name": getCode.getStatus(400)
            });
        }

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
                "message": `Email Address ${email} Already Exist For Partner`,
                "status_name": getCode.getStatus(400)
            });
        }

        let uniqueCheckMobileInPartner = await uniqueFunction.unquieName('partner', ['mobile'], { "mobile": mobile }, id, 0)
        if (uniqueCheckMobileInPartner != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Mobile Number ${mobile} Already Exist For Partner`,
                "status_name": getCode.getStatus(400)
            });
        }



        let uniqueCheckEmailInPartnerSecondary = await uniqueFunction.unquieName('secondary_partner', ['email'], { "email": email }, id, 0)
        if (uniqueCheckEmailInPartnerSecondary != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Email Address ${email} Already Exist For Some Other Partner User`,
                "status_name": getCode.getStatus(400)
            });
        }

        let uniqueCheckMobileInPartnerSecondary = await uniqueFunction.unquieName('secondary_partner', ['mobile'], { "mobile": mobile }, id, 0)
        if (uniqueCheckMobileInPartnerSecondary != 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Mobile Number ${mobile} Already Exist For Some Other Partner User`,
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


        const secondaryPartnerResult = await db.saveSecondaryPartner(userId, name, email, mobile);
        const secondaryPartnerId = secondaryPartnerResult.insertId;

        for (let row of locationRows) {
            await db.saveSecondaryPartnerLocation(row.id, secondaryPartnerId, userId)
        }
        res.status(200).json({
            "status_code": 200,
            "message": "success",
            "status_name": getCode.getStatus(200)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            "status_code": 500,
            "message": "Partner User Not Created",
            "status_name": getCode.getStatus(500),
            error: error.message
        });
    }
});



const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return email && emailRegex.test(email);
};

const validateMobile = (mobile) => {
    mobile = mobile?.toString()
    const mobileRegex = /^(?!0{10}$)[0-9]{10}$/;
    return mobile && mobileRegex.test(mobile) && new Set(mobile).size > 1;
};

module.exports = router;
