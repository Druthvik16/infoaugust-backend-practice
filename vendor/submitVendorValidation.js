let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let axios = require('axios');
let vendorMailsTemplate = require('./vendorMailsTemplate')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let vendorCommonFunction = require('./vendorCommonFunction')
let apiUrl = require('../apiUrl')
let api = new apiUrl()

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
        let status = 'Document-Validated'
        let docState = 'Infomap-Modified' // ASK if infomap modified any thing then I have to pass this or else in every condition.
        let isSubmitted = 2
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
        else  if(vendorStatusName == 'Document-Validated')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor documents validation already completed.",
                "status_name" : getCode.getStatus(400)
            });
        }
        else  if(vendorStatusName == 'On-Boarded')
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor is already on-boarded.",
                "status_name" : getCode.getStatus(400)
            });
        }        
        else  if(vendorStatusName == 'Document-Submitted')
        {
            let userId = req.body.userId;
            let partnerId = vendor[0].id            
            let getVendorRegistrationForm = await db.getVendorRegistrationForm(partnerId)
            if(getVendorRegistrationForm?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Fill vendor registration form",
                    "status_name" : getCode.getStatus(500)
                });
            }

            let error = []
            let getVendorDocuments = await db.getVendorUploadDocuments(partnerId);
            if(getVendorDocuments.length == 0) 
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Uploaded vendor document",
                    "status_name" : getCode.getStatus(500)
                });            
            }

            getVendorDocuments.forEach((element) => 
            {
                if(element.isRequired == 1 && (!element?.fileName || element?.fileName?.length == 0))
                {
                    error.push({ field: element.clientVendorAttachmentName, message : `File upload reqired for ${element.clientVendorAttachmentName}`})
                }
                if(element.fileName?.toString()?.length > 0 && element.isInfomapVerified == 0)
                {
                    error.push({ field: element.clientVendorAttachmentName, message : `File validation pending for ${element.clientVendorAttachmentName}`})
                }
            })

            if(error.length > 0) 
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"     : error[0].message,
                    "status_name" : getCode.getStatus(400)
                });
            }
            else
            {

                let getInfomapAdmin = await db.getInfomapAdmin()
                let submitVendorValidation = await db.submitVendorValidation(partnerId, date, status, docState, userId)
                if(submitVendorValidation.affectedRows > 0)
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
                        mailTo : [{"email" : getVendorRegistrationForm[0].clientEmail, "name": getVendorRegistrationForm[0].clientName, "type" : "to"}],
                        name :  getVendorRegistrationForm[0].name,
                        tempId : getVendorRegistrationForm[0].tempId,
                        clientName : getVendorRegistrationForm[0].clientName
                        //documentList
                    }
                    let dataToSendVendor = await vendorMailsTemplate.vendorDocumentVerifiedInitimationToVendorTemplate(vendorTemp)
                   // // let dataToSendAdmin = await vendorMailsTemplate.vendorDocumentSubmissionInitimationToInfomapTemplate(adminTemp)
                    let dataToSendClient = await vendorMailsTemplate.vendorDocumentVerifiedInitimationToClientTemplate(clientTemp)
                    axios.post( api.serviceApi + api.common + api.sendMail, dataToSendVendor.data).then((sendMail) =>
                    {
                        console.log("send to vendor")
        
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
        
                   // // axios.post( api.serviceApi + api.common + api.sendMail, dataToSendAdmin).then((sendMail) =>
                  //  // {
                  //  //     console.log("send to admin")
                  //  // })
                  //  // .catch(err => {
                   // //     console.log("mail sent failed")
                   // //     console.log(err.data)
                    //// })
    
                    
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
                        "message" : "Vendor document validation failed",
                        "status_name" : getCode.getStatus(500)
                    })
                }
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



