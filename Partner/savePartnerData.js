let db = require('./dbQueryPartner')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let partnerCategoryCode = 'C'
module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        if (!req.body.name?.trim() || !req.body.pan || !req.body.email || !req.body.mobile || !req.body.gstin || !req.body.state || !req.body.state?.id || !req.body.client || !req.body.client?.uuid || !req.body.partnerLocations || req.body.partnerLocations?.length == 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            })
        }
        let name = uniqueFunction.manageSpecialCharacter(req.body.name?.trim());
        let pan = uniqueFunction.manageSpecialCharacter(req.body.pan)
        let email = uniqueFunction.manageSpecialCharacter(req.body.email)
        let gstin = uniqueFunction.manageSpecialCharacter(req.body.gstin)
        let clientUuid = req.body.client?.uuid
        let stateId = req.body.state?.id
        let mobile = req.body.mobile
        let partnerLocations = req.body.partnerLocations
        let uuid = createUuid.v1()
        let createdOn = new Date()
        const createdById = req.body.userId || 0;
        let isActive = 1
        let password = 'admin'
        let passKey = process.env.PASS_SECRET_KEY
        let id = 0;
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        let getPartnerCategory = await db.getPartnerCategory(partnerCategoryCode)
        if (getPartnerCategory?.length == 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Partner category not found",
                "status_name": getCode.getStatus(400)
            })
        }
        let partnerCategoryId = getPartnerCategory[0]?.id

        const validLocation = partnerLocations?.length == 1 ? (partnerLocations[0].storeCode == "" || !partnerLocations[0].storeCode): false;

        console.log(validLocation)

        if(!validLocation)
        {
            let uniqueCheckGSTInPartner = await uniqueFunction.unquieName('partner_statewise_gst_master', ['gstin'], { 'gstin': gstin }, 0, 0)
            if (uniqueCheckGSTInPartner != 0) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": `GST Number ${gstin} Already Exist For Some Other Partner`,
                    "status_name": getCode.getStatus(400)
                });
            }
        }

        let getPartnerWithEmailMobile = await db.getPartnerWithEmailMobile(email, mobile)
        if (getPartnerWithEmailMobile?.length > 0) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": `Partner already exists with email and mobile number.`,
                "status_name": getCode.getStatus(400)
            });
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
            let partnerId = savePartner.insertId
            let returnUuid = await db.getReturnUuidByID(partnerId, 'partner')
            let partnerUuid = returnUuid[0].uuid
            let savePartnerClientMapping = await saveClientPartnerMappings(partnerUuid, clientUuid, createdById, loggedUserType, loggedUserTable)
            if (!savePartnerClientMapping) {
                let deletePtnr = await db.deletePartner(partnerId)
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Partner Client Mapping Not Created",
                    "status_name": getCode.getStatus(500)
                })
            }
            let saveGst = await savePartnerGST(partnerUuid, stateId, gstin, createdById, loggedUserType, loggedUserTable)
            if (!saveGst) {
                let deletePtnr = await db.deletePartner(partnerId)
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Partner Gstin Not Saved",
                    "status_name": getCode.getStatus(500)
                })
            }
            let partnerStateWiseGstMasterId = saveGst?.id
            let { rejectedLocations } = await savePartnerLocations(partnerLocations, 0, partnerLocations?.length, [], partnerStateWiseGstMasterId, createdById, loggedUserType, loggedUserTable , clientUuid)
            res.status(200)
            return res.json({
                "status_code": 200,
                "message": "success",
                "data": { "uuid": partnerUuid, "rejectedLocations": rejectedLocations },
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

async function saveClientPartnerMappings(partnerUuid, clientUuid, createdById, loggedUserType, loggedUserTable) {
    try {
        let saveClientPartner = await db.saveClientPartnerMapping(partnerUuid, clientUuid)

        if (saveClientPartner.affectedRows > 0) {
            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner-Client Mapping Created', `New partner mapped with client, partner uuid : ${partnerUuid}, client uuid : ${clientUuid}`, saveClientPartner.insertId, 'partner_client_mapping', null, 'success')
            return true;
        }
        else {
            return false;
        }
    }
    catch (e) {
        console.log(e);
        return false;
    }
}

async function savePartnerGST(partnerUuid, stateId, gstin, createdById, loggedUserType, loggedUserTable) {
    try {
        let savePartnerStatewiseGst = await db.savePartnerStatewiseGst(partnerUuid, gstin, stateId)
        if (savePartnerStatewiseGst.affectedRows > 0) {
            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner State Wise GST Mapping Created', `Partner mapped with statewise GST, partner uuid : ${partnerUuid}, gstNumber : ${gstin}, stateId : ${stateId}`, savePartnerStatewiseGst.insertId, 'partner_statewise_gst_master', null, 'success')
            return { result: true, id: savePartnerStatewiseGst?.insertId };
        }
        else {
            return false;
        }
    }
    catch (e) {
        console.log(e);
        return false;
    }
}

async function savePartnerLocations(partnerLocations, start, end, rejectedLocations, partnerStateWiseGstMasterId, createdById, loggedUserType, loggedUserTable, clientUuid) {
    try {
        if (start < end) {
            let partnerLocation = partnerLocations[start];
            console.log(partnerLocation, partnerStateWiseGstMasterId)
            if (!partnerLocation.storeCode?.toString()?.trim() || !partnerLocation.state || !partnerLocation.state?.id || !partnerLocation.storeName || !partnerLocation.storeLocation?.trim() || !partnerLocation.mobile || !partnerLocation.email || !partnerLocation.addressLine1 || !partnerLocation.city || !partnerLocation.city?.name || !partnerLocation.pincode) {
                console.log(1)
                partnerLocation['remark'] = "Provide all values"
                rejectedLocations.push(partnerLocation)
                start++;
                return savePartnerLocations(partnerLocations, start, end, rejectedLocations, partnerStateWiseGstMasterId, createdById, loggedUserType, loggedUserTable, clientUuid)
            }
            // Check if code is valid
            let storeCode = uniqueFunction.manageSpecialCharacter(partnerLocation.storeCode?.toString()?.trim());
            let isVaildCodePrefixForPartner = await db.checkCustomerTypeCode(storeCode.substring(0,2));
            if(isVaildCodePrefixForPartner.length === 0)
            {
                partnerLocation['remark'] = `Customer type code not present. Code : ${storeCode}`
                rejectedLocations.push(partnerLocation)
                start++;
                return savePartnerLocations(partnerLocations, start, end, rejectedLocations, partnerStateWiseGstMasterId, createdById, loggedUserType, loggedUserTable, clientUuid)
            }
            let tan = partnerLocation.tan
            let storeName = uniqueFunction.manageSpecialCharacter(partnerLocation.storeName)
            let storeLocation = uniqueFunction.manageSpecialCharacter(partnerLocation.storeLocation)
            let mobile = partnerLocation.mobile
            let email = uniqueFunction.manageSpecialCharacter(partnerLocation.email)
            let addressLine1 = uniqueFunction.manageSpecialCharacter(partnerLocation.addressLine1)
            let addressLine2 = (partnerLocation.addressLine2?.length > 0) ? uniqueFunction.manageSpecialCharacter(partnerLocation.addressLine2) : null
            let addressLine3 = (partnerLocation.addressLine3?.length > 0) ? uniqueFunction.manageSpecialCharacter(partnerLocation.addressLine3) : null
            let city = partnerLocation.city?.name
            let pincode = partnerLocation.pincode
            let msmeNumber = uniqueFunction.manageSpecialCharacter(partnerLocation.msmeNumber)
            let stateId = partnerLocation.state?.id
            let uuid = createUuid.v1()
            let createdOn = new Date()
            let isActive = 1
            let spsnUuid = partnerLocation.spsn?.uuid
            let uniqueCheckCodeInPartnerLocation = await uniqueFunction.unquieName('partner_location_detail', ['code'], { "code": storeCode }, 0, 0)
            if (uniqueCheckCodeInPartnerLocation != 0) {
                console.log(2)
                partnerLocation['remark'] = `Partner Location Code ${storeCode} Already Exist For Some Other Partner`
                rejectedLocations.push(partnerLocation)
                start++;
                return savePartnerLocations(partnerLocations, start, end, rejectedLocations, partnerStateWiseGstMasterId, createdById, loggedUserType, loggedUserTable, clientUuid)
            }
            let savePartnerLocation = await db.savePartnerLocationData(uuid, storeCode, storeName, storeLocation, partnerStateWiseGstMasterId, mobile, email, tan, addressLine1, addressLine2, addressLine3, city, stateId, pincode, msmeNumber, isActive, createdOn, createdById, spsnUuid, clientUuid)
            if (savePartnerLocation.affectedRows > 0) {
                const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Profile Created', 'New Partner Location On-boarded', savePartnerLocation.insertId, 'partner_location_detail', null, 'success')

                const financialYears = await db.getFinancialYears()

                for(const fy of financialYears)
                {
                    const saveOpeningBalance = await db.savePartnerLocationOpeningBalance(savePartnerLocation.insertId, storeCode, 0, fy.id)

                    const saveActivityLogOpeningBalance = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Opening Balance Master Created', `New partner location opening balance master created with 0 opening balance, location code : ${storeCode}, Financial Year Id : ${fy.id}`, saveOpeningBalance.insertId, 'customer_opening_balance_master', null, 'success')
                }
                console.log(3)
                start++;
                return savePartnerLocations(partnerLocations, start, end, rejectedLocations, partnerStateWiseGstMasterId, createdById, loggedUserType, loggedUserTable, clientUuid)
            }
            else {
                console.log(4)
                partnerLocation['remark'] = `Partner Location Not Created`
                rejectedLocations.push(partnerLocation)
                start++;
                return savePartnerLocations(partnerLocations, start, end, rejectedLocations, partnerStateWiseGstMasterId, createdById, loggedUserType, loggedUserTable, clientUuid)
            }
        }
        else {
            return { rejectedLocations }
        }
    }
    catch (e) {
        console.log(5)
        console.log(e)
        partnerLocations[start]['remark'] = e?.stack || e?.message || e
        rejectedLocations.push(partnerLocations[start])
        start++;
        return savePartnerLocations(partnerLocations, start, end, rejectedLocations, partnerStateWiseGstMasterId, createdById, loggedUserType, loggedUserTable, clientUuid)
    }
}
