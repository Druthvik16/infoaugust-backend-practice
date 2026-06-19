let db = require('./dbQueryVendor')
let commondb = require('../common/commonFunction/dbQueryCommonFuntion')
let path = require('path')
let fs = require('fs');
let axios = require('axios');
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let scannedVendors = [];
let userId;
let totalItems = 0;
let totalVendors = 0;
let vendorCategories;
let clientUuid;
let clientId;

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        if (!req.body.scannedVendors || req.body.scannedVendors?.length == 0 || !req.body.client || !req.body.client?.uuid) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "Provide all values",
                "status_name": getCode.getStatus(400)
            });
        }
        scannedVendors = req.body.scannedVendors;
        clientUuid = req.body.client?.uuid;
        userId = req.body.userId
        console.log(userId)
        totalItems = 0;
        clientId = await db.getClientId(clientUuid)
        if (clientId?.length == 0) {
            {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Client not exist",
                    "status_name": getCode.getStatus(500)
                });
            }
        }
        clientId = clientId[0].id
        vendorCategories = await db.getCategories(1)
        scannedVendors = checkUniqueAndMarkDuplicates(scannedVendors, ['name', 'email', 'mobile'])
        let result = await scanEveryValue(scannedVendors, 0, scannedVendors.length, [], [], totalItems, userId, totalVendors, res)
        res.status(200)
        return res.json({
            "status_code": 200,
            "message": "success",
            "status_name": getCode.getStatus(200),
            "data": result
        })
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "Vendors not saved",
            "status_name": getCode.getStatus(500),
            "error": e
        })
    }
})

async function scanEveryValue(scannedVendors, start, end, accepted, rejected, totalItems, userId, totalVendors, res) {
    try {
        if (start < end) {
            let vendor = scannedVendors[start];
            if (!vendor?.remark || vendor?.remark?.length == 0) {
                let name = uniqueFunction.manageSpecialCharacter(vendor.name?.trim());
                let email = uniqueFunction.manageSpecialCharacter(vendor.email)
                let mobile = vendor.mobile
                let vendorCategoryId = vendorCategories.find(category => category.code == vendor.category).id
                let uuid = createUuid.v1()
                let createdOn = new Date()
                let createdById = userId;
                let isActive = 1
                let password = 'admin'
                let passKey = process.env.PASS_SECRET_KEY
                let id = 0;
                let additionalInfo = 1;
                let status = 'Created'

                let uniqueCheckEmailInClient = await uniqueFunction.unquieName('client', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInClient != 0) {
                    vendor.remark = vendor.remark ? `${vendor.remark}, Email address ${email} already exist in client  ` : `Email address ${email} already exist in client  `;
                }

                let uniqueCheckMobileInClient = await uniqueFunction.unquieName('client', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInClient != 0) {
                    vendor.remark = vendor.remark ? `${vendor.remark}, Mobile address ${mobile} already exist in client  ` : `Mobile address ${mobile} already exist in client  `;
                }

                let uniqueCheckEmailInStaff = await uniqueFunction.unquieName('staff', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInStaff != 0) {
                    vendor.remark = vendor.remark ? `${vendor.remark}, Email address ${email} already exist in staff  ` : `Email address ${email} already exist in staff  `;
                }
                let uniqueCheckMobileInStaff = await uniqueFunction.unquieName('staff', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInStaff != 0) {
                    vendor.remark = vendor.remark ? `${vendor.remark}, Mobile address ${mobile} already exist in staff  ` : `Mobile address ${mobile} already exist in staff  `;
                }

                let uniqueCheckEmailInPartner = await uniqueFunction.unquieName('partner', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInPartner != 0) {
                    vendor.remark = vendor.remark ? `${vendor.remark}, Email address ${email} already exist in vendor/customer  ` : `Email address ${email} already exist in vendor/customer  `;
                }

                let uniqueCheckMobileInPartner = await uniqueFunction.unquieName('partner', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInPartner != 0) {
                    vendor.remark = vendor.remark ? `${vendor.remark}, Mobile address ${mobile} already exist in vendor/customer  ` : `Mobile address ${mobile} already exist in vendor/customer  `;
                }

                let uniqueCheckEmailInPartnerSecondary = await uniqueFunction.unquieName('secondary_partner', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInPartnerSecondary != 0)
                    vendor.remark = vendor.remark ? `${vendor.remark}, Email address ${email} already exist in partner user ` : `Email address ${email} already exist in partner user `;

                let uniqueCheckMobileInPartnerSecondary = await uniqueFunction.unquieName('secondary_partner', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInPartnerSecondary != 0)
                    vendor.remark = vendor.remark ? `${vendor.remark}, Mobile ${mobile} already exist in partner user` : `Mobile ${mobile} already exist in partner user`;

                let uniqueCheckEmailInAddOnUser = await uniqueFunction.unquieName('additional_login_user', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInAddOnUser != 0)
                    vendor.remark = vendor.remark ? `${vendor.remark}, Email address ${email} already exist in additional user   ` : `Email address ${email} already exist in additional user    `;

                let uniqueCheckMobileInAddOnUser = await uniqueFunction.unquieName('additional_login_user', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInAddOnUser != 0)
                    vendor.remark = vendor.remark ? `${vendor.remark}, Mobile ${mobile} already exist in additional user ` : `Mobile ${mobile} already exist in additional user    `

                let uniqueCheckEmailInSPSN = await uniqueFunction.unquieName('spsn_user_master', ['email'], { "email": email }, id, 0)
                if (uniqueCheckEmailInSPSN != 0)
                    vendor.remark = vendor.remark ? `${vendor.remark}, Email address ${email} already exist in SPSN   ` : `Email address ${email} already exist in SPSN    `;

                let uniqueCheckMobileInSPSN = await uniqueFunction.unquieName('spsn_user_master', ['mobile'], { "mobile": mobile }, id, 0)
                if (uniqueCheckMobileInSPSN != 0)
                    vendor.remark = vendor.remark ? `${vendor.remark}, Mobile ${mobile} already exist in SPSN ` : `Mobile ${mobile} already exist in SPSN    `



                if (vendor?.remark?.length > 0) {
                    rejected.push(vendor)
                    start++;
                    return scanEveryValue(scannedVendors, start, end, accepted, rejected, totalItems, userId, totalVendors, res)
                }
                else {
                    let saveVendor = await db.saveVendor(uuid, name, vendorCategoryId, isActive, createdOn, createdById, email, mobile, password, passKey, additionalInfo)
                    if (saveVendor?.result) {
                        vendor.remark = saveVendor?.error?.stack
                        rejected.push(vendor)
                    }
                    let uniqueCheckPartnerClientMapping = await uniqueFunction.unquieName('partner_client_mapping', ['partner_id', 'client_id'], { "partner_id": saveVendor?.insertId, "client_id": clientId }, 0, 0)
                    if (uniqueCheckPartnerClientMapping == 0) {

                        let saveClientPartnerMapping = await db.saveClientPartnerMapping(saveVendor?.insertId, clientId)
                    }
                    let saveInfo = await db.saveVendorAddiInfo(saveVendor?.insertId, status, createdOn, createdById)
                    start++;
                    return scanEveryValue(scannedVendors, start, end, accepted, rejected, totalItems, userId, totalVendors, res)
                }
            }
            else {
                rejected.push(vendor);
                start++;
                return scanEveryValue(scannedVendors, start, end, accepted, rejected, totalItems, userId, totalVendors, res)
            }
        }
        else {
            console.log(new Date())
            return ({
                "totalVendors": scannedVendors?.length,
                "rejectedVendors": rejected,
                "acceptedVendors": accepted,
            })
        }
    }
    catch (e) {
        console.log(e)
    }
}

const validateName = (name) => {
    // const nameRegex = /^[A-Za-z]+((['_.-][A-Za-z])?[A-Za-z]*)*$/;
    const nameRegex = /^[A-Za-z]+([ _.-]?[A-Za-z])*$/;
    return name && nameRegex.test(name);
};

const validateEmail = (email) => {
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // console.log(email, emailRegex.test(email))
    return email && emailRegex.test(email);
};

const validateMobile = (mobile) => {
    // const mobileRegex = /^\d{10}$/;
    const mobileRegex = /^(?!0{10}$)[0-9]{10}$/;
    return mobile && mobileRegex.test(mobile) && new Set(mobile).size > 1;
};

function checkUniqueAndMarkDuplicates(data, uniqueColumns) {
    const seen = {};
    data.forEach(row => {
        if (!row.category) {
            row.remark = row.remark ? `${row.remark}, Category is missing ` : `Category is missing  `;
        }
        if (!row.email) {
            row.remark = row.remark ? `${row.remark}, Email is missing ` : `Email is missing  `;
        }
        if (!row.name) {
            row.remark = row.remark ? `${row.remark}, Name is missing ` : `Name is missing  `;
        }
        if (!row.mobile) {
            row.remark = row.remark ? `${row.remark}, Mobile is missing ` : `Mobile is missing  `;
        }
        if (row.category != 'V') {
            row.remark = row.remark ? `${row.remark}, Empty or invalid category ` : `Empty or invalid category `;
        }
        uniqueColumns.forEach(col => {
            if (!seen[col]) seen[col] = new Set();
            let validate = (col == 'name' && row[col]?.length > 0) ? validateName(row[col]) : (col == 'email' && row[col]?.length > 0) ? validateEmail(row[col]) : (col == 'mobile' && row[col]?.toString().length > 0) ? validateMobile(row[col]) : null;

            if (!validate && validate != null) {
                row.remark = row.remark ? `${row.remark}, Empty or invalid ${col} format ` : `Empty or invalid ${col} format`;
            }

            if (seen[col].has(row[col])) {
                row.remark = row.remark ? `${row.remark}, Duplicate ${col}` : `Duplicate ${col}`;
            } else {
                seen[col].add(row[col]);
            }
        });
    });
    return data;
}

