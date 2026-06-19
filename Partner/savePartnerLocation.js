let db = require('./dbQueryPartner')
let createUuid = require('uuid')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let uuid;
        let createdOn;
        let isActive
        let createdById;
        let code;
        let storeName;
        let storeLocation;
        let partnerStatewiseGstMasterId;
        let mobile;
        let email;
        let tan;
        let addressLine1;
        let addressLine2;
        let addressLine3;
        let city;
        let stateId;
        let pincode;
        let msmeNumber;
        let spsnCode = '';
        if(!req.body.code?.toString()?.trim() || !req.body.partnerStatewiseGstMaster  || !req.body.partnerStatewiseGstMaster?.id || !req.body.state  || !req.body.state?.id || !req.body.storeName || !req.body.storeLocation?.trim() || !req.body.mobile  || !req.body.email || !req.body.addressLine1 || !req.body.city || !req.body.pincode)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        code = uniqueFunction.manageSpecialCharacter(req.body.code?.toString()?.trim());
        let isVaildCodePrefixForPartner = await db.checkCustomerTypeCode(code.substring(0,2));
        if(isVaildCodePrefixForPartner.length === 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Customer type code not present. Code : " + code,
                "status_name" : getCode.getStatus(400)
            })
        }
        let clientIdResult = await db.getClientIdByPartnerStatewiseGstMasterId(req.body.partnerStatewiseGstMaster?.id)
        let clientId = clientIdResult?.length > 0 ? clientIdResult[0].clientId : null
        tan = req.body.tan
        storeName = uniqueFunction.manageSpecialCharacter(req.body.storeName)
        storeLocation = uniqueFunction.manageSpecialCharacter(req.body.storeLocation)
        mobile = req.body.mobile
        email = uniqueFunction.manageSpecialCharacter(req.body.email)
        addressLine1 = uniqueFunction.manageSpecialCharacter(req.body.addressLine1)
        addressLine2 = (req.body.addressLine2?.length > 0) ? uniqueFunction.manageSpecialCharacter(req.body.addressLine2) : null
        addressLine3 = (req.body.addressLine3?.length > 0) ? uniqueFunction.manageSpecialCharacter(req.body.addressLine3) : null 
        city = uniqueFunction.manageSpecialCharacter(req.body.city)
        pincode = req.body.pincode
        msmeNumber = req.body.msmeNumber
        stateId = req.body.state?.id
        partnerStatewiseGstMasterId = req.body.partnerStatewiseGstMaster?.id
        uuid = createUuid.v1()
        createdOn =  new Date()
        createdById = req.body.userId || 0;
        isActive = 1
        spsnCode = req.body.spsnCode;
        let spsnData = spsnCode?.length > 0 ? await db.getSpsn(spsnCode) : ''
        let spsnId = spsnData?.length > 0 ? spsnData[0].id : null
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        let uniqueCheckCodeInPartnerLocation = await uniqueFunction.unquieName('partner_location_detail', ['code'],{  "code" : code }, 0, 0)
        if(uniqueCheckCodeInPartnerLocation != 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : `Partner Location Code ${code} Already Exist For Some Other Partner`,
                "status_name" : getCode.getStatus(400)
            });
        }
        let savePartnerLocation = await db.savePartnerLocation(uuid, code, storeName, storeLocation, partnerStatewiseGstMasterId, mobile, email, tan, addressLine1, addressLine2, addressLine3, city, stateId, pincode, msmeNumber, isActive, createdOn, createdById, spsnId, clientId)
        if(savePartnerLocation.affectedRows > 0)
        {        
            const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null
            
            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Profile Created', 'New Partner Location On-boarded', savePartnerLocation.insertId, 'partner_location_detail', null, 'success')

            const financialYears = await db.getFinancialYears()
            
            for(const fy of financialYears)
            {
                const saveOpeningBalance = await db.savePartnerLocationOpeningBalance(savePartnerLocation.insertId, code, 0, fy.id)

                const saveActivityLogOpeningBalance = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Opening Balance Master Created', `New partner location opening balance master created with 0 opening balance, location code : ${code}, Financial Year Id : ${fy.id}`, saveOpeningBalance.insertId, 'customer_opening_balance_master', null, 'success')
            }

            // const saveOpeningBalance = await db.savePartnerLocationOpeningBalance(savePartnerLocation.insertId, code, 0)
            
            // const saveActivityLogOpeningBalance = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Opening Balance Master Created', `New partner location opening balance master created with 0 opening balance, location code : ${code}`, saveOpeningBalance.insertId, 'customer_opening_balance_master', null, 'success')

            let remark = spsnCode?.length > 0 ? (spsnId ? '' : 'Partner location onboarded, SPSN code not exist') : ''

            let returnUuid = await db.getReturnUuidByID(savePartnerLocation.insertId, 'partner_location_detail') 
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : { "uuid" : returnUuid[0].uuid, "remark" : remark},
                "status_name" : getCode.getStatus(200)
            })            
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Partner Location Not Created",
                "status_name" : getCode.getStatus(500)
            }) 
        } 
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Partner Location Not Created",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        })  
    }
})
