let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let axios = require('axios');
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let vendorCommonFunction = require('./vendorCommonFunction')
let vendorMailsTemplate = require('./vendorMailsTemplate')
let apiUrl = require('../apiUrl')
let api = new apiUrl()


module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        if(!req.body.vendor || !req.body.vendor?.uuid || !req.body.sapCode)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let partnerUuid = req.body.vendor?.uuid
        let sapCode = req.body.sapCode
        let status = 'On-Boarded'
        let date = new Date()
        let vendor = await db.getPartner(partnerUuid)
        if(vendor?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor not found",
                "status_name" : getCode.getStatus(400)
            });
        }
        if(vendor[0]?.isFormValidated == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor registration form not validated.",
                "status_name" : getCode.getStatus(400)
            });
        }
        let vendorDocState = vendor[0].docState;
        if(vendorDocState?.toString()?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor documents submission are pending",
                "status_name" : getCode.getStatus(400)
            });
        }
        let vendorStatusId = vendor[0].vendorStatusId;
        let vendorStatusName = vendor[0].vendorStatusName;
        if(vendorStatusName == 'Registration-Initiated')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor registration process is incomplete",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'On-Boarded')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor already on-boarded.",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'Document-Validated')
        {
            let userId = req.body.userId;
            let partnerId = vendor[0].id 
            let isClientVerified = 1;
            let uniqueSapCodeInVendor = await uniqueFunction.unquieName('partner_additional_info', ['sap_code'],{  "sap_code" : sapCode }, 0, '')
            if(uniqueSapCodeInVendor != 0)
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"     : `Sap code '${sapCode}' is already assigned to another vendor`,
                    "status_name" : getCode.getStatus(400)
                });                
            }
            else
            {
                let getVendorRegistrationForm = await db.getVendorRegistrationForm(partnerId)
                let getInfomapAdmin = await db.getInfomapAdmin()
                let submitVendorApproval = await db.submitVendorApproval(partnerId, date, status, sapCode, userId)
                if(submitVendorApproval.affectedRows > 0)
                {
                    let validateVendorDocument = await db.validateVendorDocumentByClient(partnerId, new Date(), isClientVerified, userId)
                    
                    let adminTemp = {
                        mailTo : [{"email" : getInfomapAdmin[0].staffEmail, "name": getInfomapAdmin[0].staffName, "type" : "to"}],
                        name : getVendorRegistrationForm[0].name,
                        tempId : getVendorRegistrationForm[0].tempId,
                        clientName : getVendorRegistrationForm[0].clientName,
                        sapCode:sapCode
                        //documentList
                    }
                
                    let clientTemp = {
                        mailTo : [{"email" : getVendorRegistrationForm[0].clientEmail, "name": getVendorRegistrationForm[0].clientName, "type" : "to"}],
                        name : getVendorRegistrationForm[0].name,
                        tempId : getVendorRegistrationForm[0].tempId,
                        clientName : getVendorRegistrationForm[0].clientName
                        //documentList 
                    }
                    
                    let vendorTemp = {
                        mailTo : [{"email" : getVendorRegistrationForm[0].email, "name": getVendorRegistrationForm[0].name, "type" : "to"},...adminTemp.mailTo],
                        name : getVendorRegistrationForm[0].name,
                        tempId : getVendorRegistrationForm[0].tempId,
                        clientName : getVendorRegistrationForm[0].clientName,
                        sapCode:sapCode
                        //documentList
                    }
                    let dataToSendVendor = await vendorMailsTemplate.vendorOnboardedIntimationToVendorTemplate(vendorTemp)
                    // let dataToSendAdmin = await vendorMailsTemplate.vendorOnboardedIntimationToInfomapTemplate(adminTemp)
                    // let dataToSendClient = await vendorMailsTemplate.vendorOnboardedIntimationToClientTemplate(clientTemp)
                    axios.post( api.serviceApi + api.common + api.sendMail, dataToSendVendor.data).then((sendMail) =>
                    {
                        console.log("send to vendor")
        
                        // axios.post( api.serviceApi + api.common + api.sendMail, dataToSendAdmin.data).then((sendMail) =>
                        // {
                        //     console.log("send to admin")
            
                        //     axios.post( api.serviceApi + api.common + api.sendMail, dataToSendClient.data).then((sendMail) =>
                        //     {
                        //         console.log("send to client")
                        //     })
                        //     .catch(err => {
                        //         console.log("mail sent failed")
                        //         console.log(err.data)
                        //     })
                        // })
                        // .catch(err => {
                        //     console.log("mail sent failed")
                        //     console.log(err.data)
                        // }) 
                    })
                    .catch(err => {
                        console.log("mail sent failed")
                        console.log(err.data)
                    })

                    const getRegisteredVendorRegistrationForm = await db.getRegisteredVendorRegistrationForm(partnerId)

                    const registredVendor = getRegisteredVendorRegistrationForm[0]

                    // let saveClientApProcess = await apProcessHandler.saveVendor(sapCode, registredVendor.name, registredVendor.address1, registredVendor.address2, null, registredVendor.email, registredVendor.email2, registredVendor.mobile, null, registredVendor.countryName, registredVendor.stateName, registredVendor.cityName, registredVendor.gstin, registredVendor.pan, registredVendor.clientCode, registredVendor.postalCode, null, null)

                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message"     : "success",
                        "status_name" : getCode.getStatus(200),
                    });
                }
                else
                {
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message" : "Vendor on-boarding failed",
                        "status_name" : getCode.getStatus(500)
                    })
                }
            }            
        }        
        else  if(vendorStatusName == 'Document-Submitted')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor validation is pending.",
                "status_name" : getCode.getStatus(400)
            });
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



