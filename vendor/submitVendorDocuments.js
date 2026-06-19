let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let vendorCommonFunction = require('./vendorCommonFunction')
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let axios = require('axios');
let vendorMailsTemplate = require('./vendorMailsTemplate')

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        if(!req.body.vendor || !req.body.vendor?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let partnerUuid = req.body.vendor?.uuid
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
        let vendorDocState = vendor[0].docState;
        let partnerId = vendor[0].id
        let status = 'Document-Submitted'
        let docState = 'Vendor-Submitted'
        let isSubmitted = 2
        let date = new Date()

        let getInfomapAdmin = await db.getInfomapAdmin()
        
        let getVendorRegistrationForm = await db.getVendorRegistrationForm(partnerId)
        const {errors:validationErrors} = await vendorCommonFunction.validateVendorInfo(getVendorRegistrationForm[0]);

        let error = []
        let getVendorDocuments = await db.getVendorUploadDocuments(partnerId);
        console.log(getVendorDocuments)
        if(getVendorDocuments.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Upload vendor document",
                "status_name" : getCode.getStatus(400)
            });
        }

        getVendorDocuments.forEach((element) => 
        {
            if(element.isRequired == 1 && (!element?.fileName || element?.fileName?.length == 0))
            {
                validationErrors.push({ field: element.clientVendorAttachmentName, message : `File upload reqired for ${element.clientVendorAttachmentName}`})
            }
        })

        if(validationErrors.length > 0) 
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : validationErrors[0].message,
                "status_name" : getCode.getStatus(400)
            });
        }
        else
        {
            let submitVendorDocuments = await db.submitVendorDocuments(partnerId, date, status, docState, isSubmitted)
            if(submitVendorDocuments.affectedRows > 0)
            {
                let vendorTemp = {
                    mailTo : [{"email" : getVendorRegistrationForm[0].email, "name": getVendorRegistrationForm[0].name, "type" : "to"}],
                    name : getVendorRegistrationForm[0].name,
                    tempId : getVendorRegistrationForm[0].tempId,
                    clientName : getVendorRegistrationForm[0].clientName
                    //documentList
                }
                
                let adminTemp = {
                    mailTo : [{"email" : getInfomapAdmin[0].staffEmail, "name": getInfomapAdmin[0].staffName, "type" : "to"}],
                    name : getVendorRegistrationForm[0].name,
                    tempId : getVendorRegistrationForm[0].tempId,
                    clientName : getVendorRegistrationForm[0].clientName
                    //documentList
                }
            
                let clientTemp = {
                    mailTo : [{"email" : getVendorRegistrationForm[0].clientEmail, "name": getVendorRegistrationForm[0].clientName, "type" : "to"},...adminTemp.mailTo],
                    name : getVendorRegistrationForm[0].name,
                    tempId : getVendorRegistrationForm[0].tempId,
                    clientName : getVendorRegistrationForm[0].clientName
                    //documentList
                }
                let dataToSendVendor = await vendorMailsTemplate.vendorDocumentSubmissionTemplate(vendorTemp)
                // let dataToSendAdmin = await vendorMailsTemplate.vendorDocumentSubmissionInitimationToInfomapTemplate(adminTemp)
                let dataToSendClient = await vendorMailsTemplate.vendorDocumentSubmissionInitimationToClientTemplate(clientTemp)
                axios.post( api.serviceApi + api.common + api.sendMail, dataToSendVendor.data).then((sendMail) =>
                {
                    console.log("send to vendor")
    
                    // axios.post( api.serviceApi + api.common + api.sendMail, dataToSendAdmin.data).then((sendMail) =>
                    // {
                    //     console.log("send to admin")

                
    
                        axios.post( api.serviceApi + api.common + api.sendMail, dataToSendClient.data).then((sendMail) =>
                        {
                            console.log("send to client")
                        })
                        .catch(err => {
                            console.log("mail sent failed")
                            console.log(err.data)
                        })
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
                    "message" : "Vendor document submission failed",
                    "status_name" : getCode.getStatus(500)
                })
            }
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



