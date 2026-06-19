let db = require('./dbQueryVendor')
let generate_token = require('../authenticate/tokenGenerate')
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let axios = require('axios');
let vendorMailsTemplate = require('./vendorMailsTemplate')
let userId;
let vendorCategories;
let clientUuid;
let vendorCode = 'V'
module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        if(!req.body.name?.trim() || !req.body.email?.trim() || !req.body.mobile?.trim() || !req.body.client || !req.body.client?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let name = uniqueFunction.manageSpecialCharacter(req.body.name?.trim());   
        let email = uniqueFunction.manageSpecialCharacter(req.body.email?.trim());   
        let mobile = req.body.mobile?.trim();   
        clientUuid = req.body.client?.uuid; 
        userId = req.body.userId 
        let adminUser = await db.getAdminUser()
        let adminMailTo = adminUser.map((user) => { return {"email" : user.email, "name": user.name, "type" : "to"}})
        let client = await db.getClient(clientUuid)
        if(client?.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Client not exist",
                "status_name" : getCode.getStatus(500)
            });            
        }
        if(client[0].clientServiceTypeName != 'Vendor Portal' && client[0].clientServiceTypeName != 'Customer/Vendor Portal')
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Client not provide 'Vendor Portal or Customer/Vendor Portal' service ",
                "status_name" : getCode.getStatus(500)
            });
        }
        let clientId = client[0].id
        let clientName = client[0].name
        let clientCode = client[0].code
        vendorCategories = await db.getCategory(1, vendorCode)
        let validateName1 = validateName(name)
        let validateEmail1 = validateEmail(email)
        let validateMobile1 = validateMobile(mobile)

        let remark = ''

        if(!validateName1 && validateName1 != null)
            remark = remark ? `${remark}, Invalid name ` : `Invalid name  `;

        if(!validateEmail1 && validateEmail1 != null)
            remark = remark ? `${remark}, Invalid email ` : `Invalid email  `;
        
        if(!validateMobile1 && validateMobile1 != null)
            remark = remark ? `${remark}, Invalid mobile ` : `Invalid mobile  `;
        

        if(remark.length > 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : remark,
                "status_name" : getCode.getStatus(500)
            });
        }
        let vendor = {
                "name" : name,
                "email" : email,
                "mobile" : mobile,
                "code" : vendorCategories[0].id
            }
        
        let result = await saveMasterData(vendor, userId, clientName, clientCode, clientId)
        if(result?.result)
        {
            let vendorTemp = {
                mailTo : [{"email" : email, "name": name, "type" : "to"}],
                name : name,
                tempId : result?.tempId,
                clientName : clientName,
                vendor
                //documentList
            }
            
            let clientTemp = {
                mailTo : [{"email" : client[0].email, "name": clientName, "type" : "to"},...adminMailTo],
                name : name,
                tempId : result?.tempId,
                clientName : clientName
                //documentList
            }
            console.log(clientTemp)

            let dataToSendVendor = await vendorMailsTemplate.vendorRegistrationInitiatedTemplate(vendorTemp)
            let dataToSendClient = await vendorMailsTemplate.clientRegistrationInitiatedTemplate(clientTemp)
            console.log("dataToSendVendor", dataToSendClient)
            if(!dataToSendVendor?.result)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : getCode.getStatus(200),
                    "data"     :    result
                })
            }
            if(!dataToSendClient?.result)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "status_name" : getCode.getStatus(200),
                    "data"     :    result
                })
            }
            axios.post( api.serviceApi + api.common + api.sendMail, dataToSendVendor.data).then((sendMail) =>
            {
                axios.post( api.serviceApi + api.common + api.sendMail, dataToSendClient.data).then((sendMail) =>
                    {
                        console.log("send to client")
                    })
                    .catch(err => {
                        console.log("mail sent failed")
                        console.log(err.data)
                    })
            })
            .catch(err => {
                console.log("mail sent failed")
                console.log(err.data)
            })

            
            console.log(dataToSendVendor)

            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : getCode.getStatus(200),
                "data"     :    result
            })
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : result?.error,
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
            "message" : e?.stack || e.message || e,
            "status_name" : getCode.getStatus(500)
        }) 
    }
})




async function saveMasterData(vendor, userId, clientName, clientCode, clientId)
{
    try
    {
        let name = uniqueFunction.manageSpecialCharacter(vendor.name?.trim());
        let email = uniqueFunction.manageSpecialCharacter(vendor.email)
        let mobile = vendor.mobile
        let vendorCategoryId = vendor.code
        let uuid = createUuid.v1()
        let createdOn =  new Date()
        let createdById = userId;
        let isActive = 1
        let password = 'admin'
        let passKey = process.env.PASS_SECRET_KEY
        let id = 0;
        let additionalInfo = 1;
        let status = 'Registration-Initiated'
        let tempId = createTempId(clientCode, clientId)
        
        let uniqueCheckEmailInClient = await uniqueFunction.unquieName('client', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInClient != 0)
            return { error : `Email address ${email} already exist in client  `, result : false};

        let uniqueCheckMobileInClient = await uniqueFunction.unquieName('client', ['mobile'],{  "mobile" : mobile }, id, 0)
        if(uniqueCheckMobileInClient != 0)
            return { error : `Mobile ${mobile} already exist in client    `, result : false};

        let uniqueCheckEmailInAddOnUser = await uniqueFunction.unquieName('additional_login_user', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInAddOnUser != 0)
            return { error : `Email address ${email} already exist in additional user    `, result : false};
        
        let uniqueCheckMobileInAddOnUser = await uniqueFunction.unquieName('additional_login_user', ['mobile'],{  "mobile" : mobile }, id, 0)
        if(uniqueCheckMobileInAddOnUser != 0)
            return { error : `Mobile ${mobile} already exist in additional user    `, result : false};

        let uniqueCheckEmailInStaff = await uniqueFunction.unquieName('staff', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInStaff != 0)
            return { error : `Email address ${email} already exist in staff    `, result : false};

        let uniqueCheckMobileInStaff = await uniqueFunction.unquieName('staff', ['mobile'],{  "mobile" : mobile }, id, 0)
        if(uniqueCheckMobileInStaff != 0)
            return { error : `Mobile ${mobile} already exist in staff    `, result : false};

        let uniqueCheckEmailInPartner = await uniqueFunction.unquieName('partner', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInPartner != 0)
            return { error : `Email address ${email} already exist in vendor/partner `, result : false};

        let uniqueCheckMobileInPartner = await uniqueFunction.unquieName('partner', ['mobile'],{  "mobile" : mobile }, id, 0)
        if(uniqueCheckMobileInPartner != 0)
            return { error : `Mobile ${mobile} already exist in vendor/partner `, result : false};

        let uniqueCheckEmailInPartnerSecondary = await uniqueFunction.unquieName('secondary_partner', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInPartnerSecondary != 0)
            return { error : `Email address ${email} already exist in partner user `, result : false};

        let uniqueCheckMobileInPartnerSecondary = await uniqueFunction.unquieName('secondary_partner', ['mobile'],{  "mobile" : mobile }, id, 0)
        if(uniqueCheckMobileInPartnerSecondary != 0)
            return { error : `Mobile ${mobile} already exist in partner user`, result : false};

        let uniqueCheckEmailInSPSN = await uniqueFunction.unquieName('spsn_user_master', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInSPSN != 0)
            return { error : `Email address ${email} already exist in SPSN `, result : false};

        let uniqueCheckMobileInSPSN = await uniqueFunction.unquieName('spsn_user_master', ['mobile'],{  "mobile" : mobile }, id, 0)
        if(uniqueCheckMobileInSPSN != 0)
            return { error : `Mobile ${mobile} already exist in SPSN`, result : false};

        let saveVendor = await db.saveVendor(uuid, name, vendorCategoryId, isActive, createdOn, createdById, email, mobile, password, passKey, additionalInfo)

        if(saveVendor?.affectedRows > 0)
        {
            let uniqueCheckPartnerClientMapping = await uniqueFunction.unquieName('partner_client_mapping', ['partner_id','client_id'],{  "partner_id" : saveVendor?.insertId, "client_id" : clientId }, 0, 0)
            if(uniqueCheckPartnerClientMapping == 0)
            {
                let saveClientPartnerMapping = await db.saveClientPartnerMapping(saveVendor?.insertId, clientId)
            }
            let saveInfo = await db.saveVendorAddiInfo(saveVendor?.insertId, status, createdOn, createdById, tempId)

            let getClientVendorDocumentMappings = await db.getClientVendorDocumentMappings(clientId)
            if(getClientVendorDocumentMappings?.length > 0)
            {
                let saveDocs = await saveVendorDocuments(getClientVendorDocumentMappings, 0,  getClientVendorDocumentMappings.length, userId, saveVendor?.insertId)
                return  { "uuid" : uuid, documentResponse : saveDocs, result : true, tempId : tempId}
            }
            else
                return { "uuid" : uuid, result : true, tempId : tempId};
        }
        else
            return { error : "Vendor not saved", result : false};
    }
    catch (e)
    {
        return { error : e?.stack || e.message || e, result : false};
    }
}

async function saveVendorDocuments(getClientVendorDocumentMappings,start, end, userId, vendorId)
{
    try
    { 
        if(start < end)
        {  
            let doc = getClientVendorDocumentMappings[start]
            let clientVendorDocId = doc.id
            let saveDoc = await db.saveVendorDocument(vendorId, clientVendorDocId, new Date(), userId)
            start++;
            return saveVendorDocuments(getClientVendorDocumentMappings,start, end, userId, vendorId)            
        }
        else
        {
            console.log(new Date())
            return ({
                "result" : true
            })
        }
    }
    catch (e)
    {
        console.log(e)
        return ({
            "result" : false,
            "error" : e?.stack || e.message || e
        }) 
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
  
function generateRandomNumber()
{
    return Math.floor(100000 + Math.random() * 900000)
}

function createTempId(clientCode, clientId)
{
    return clientCode + generateRandomNumber()
}