const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const fs = require('fs');
let vendorTemplate = {}
let apiUrl = require('../apiUrl')
let api = new apiUrl()

vendorTemplate.vendorRegistrationInitiatedTemplate = async(vendor) =>
{
    try
    {
        // let dataToSend = 
        // {
        //     "to": vendor?.mailTo,
        //     "subject": "Vendor Registration Process Initiated",
        //     "text": `<p>Dear ${vendor?.name},</p>
        //             <p>We are delighted to welcome you to our vendor registration process!</p>
        //             <p>Please click on the link below to proceed with the vendor registration process.</p>
        //             <p><a href="${api?.domainUrl}">infoAugust link to vendor portal</a></p>
        //             <p>If you have any questions regarding the next steps, please do not hesitate to reach out to us.</p>
        //             <p>infoAugust support email Id (yet to be shared)<br>
        //                 +91-9364102912</p>
        //             <p>Regards,<br>infoAugust Support Team</p>`,
        //     "rawFiles": ""
        // }
        let dataToSend = 
        {
            "to": vendor?.mailTo,
            "subject": "Vendor Registration Process Initiated",
            "text": `<p>Dear Sir/Madam,</p>
                    <p>Welcome to vendor registration process!</p>
                    <p>Please click on below link for vendor registration.</p>
                    <p><a href="${api?.domainUrl}">infoAugust link to vendor portal</a></p>
                    <p>User id: ${vendor.vendor?.email}/${vendor.vendor?.mobile} </p>
                    <p> Enter the OTP shared to your email id and login, </p>
                    <p> <b>(Enter the user id email/mobile number and login with otp shared to that email id/Mobile No)</b> </p>
                    <p> 
                        Contact infoAugust support team for any further assistance <br/>
                        InfoAugust Support <br/>
                        email ID (yet to be shared) <br/>
                        +91-9364102912 <br/>
                    </p>
                    <p>Regards,<br>InfoAugust Pvt ltd</p>`,
            "rawFiles": ""
        }
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.clientRegistrationInitiatedTemplate = async(vendor) =>
{
    try
    {
        // let dataToSend = {
        //     "to": vendor?.mailTo,
        //     "subject": "Vendor Registration Notification",
        //     "text": `<p>Dear Client / infoAugust Team,</p>
        //              <p>We are pleased to inform you that your vendor registration has been initiated. Should you have any questions or require further assistance, please feel free to contact us at infoAugust support team contact information.</p>
        //              <p>Best regards,<br>infoAugust Team</p>`,
        //     "rawFiles": ""
        // }

        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Vendor Registration Notification",
            "text": `<p>Dear InfoAugust support Team,</p>
                     <p>InfoAugust Pvt Ltd has initiated for vendor registration.</p>
                     <p>Best regards,<br>InfoAugust Pvt ltd</p>`,
            "rawFiles": ""
        }
        
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorDocumentSubmissionTemplate = async(vendor) =>
{
    try
    {
        // let dataToSend = {
        //     "to": vendor?.mailTo,
        //     "subject": "Acknowledgment of Receipt of VRF",
        //     "text": `<p>Dear ${vendor?.name},</p>
        //              <p>We acknowledge receipt of your vendor registration form (VRF), your onboarding status is subject to validation and verification by the infoAugust team. Please find your temporary registration code below.</p>
        //              <p>${vendor?.tempId}</p>
        //              <p>Kindly use this code for all future communications.</p>
        //              <p>In case of any queries/clarifications, the infoAugust team will get in touch with you. You can get in touch with our team on this number: infoAugust Contact Number.</p>
        //              <p>Regards,<br>Infomap Team</p>`,
        //     "rawFiles": ""
        // }  
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Acknowledgment of Receipt of VRF",
            "text": `<p>Dear Sir/Madam,</p>
                     <p>We acknowledge receipt of your vendor registration form (VRF). <br>Validation is in process.<br>Please find your temporary registration code below.</p>
                     <p>${vendor?.tempId}</p>
                     <p>Kindly use this code for further communication with infoAugust support team untill validation is complete.</p>
                     <p>InfoAugust support team:email Id (yet to be shared) and  +91-9364102912 </p>
                     <p> InfoAugust support team will get in touch with you for any query/clarification </p>
                     <p>Regards,<br>Infomap Solutions Pvt ltd<br>Validation team</p>`,
            "rawFiles": ""
        }       
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorDocumentSubmissionInitimationToInfomapTemplate = async(vendor) =>
{
    try
    {
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Vendor Registration Notification",
            "text": `<p>Dear Admin,</p>
                     <p>We are pleased to inform you that the vendor registration process for ${vendor?.name} has been completed successfully with documents in the infoAugust Portal. Verification and validation are pending from your end.</p>
                     <p>Please find the generated temporary registration code below:</p>
                     <p>${vendor?.tempId}</p>
                     <p>Best regards,<br>infoAugust Support Team</p>`,
            "rawFiles": ""
        }
              
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorDocumentSubmissionInitimationToClientTemplate = async(vendor) =>
{
    try
    {
        // let dataToSend = {
        //     "to": vendor?.mailTo,
        //     "subject": "Vendor Registration Notification",
        //     "text": `<p>Dear Client,</p>
        //              <p>We are pleased to inform you that the vendor registration process for ${vendor?.name} has been completed successfully with documents in the infoAugust Portal. Infomap verification and validation are in progress.</p>
        //              <p>Best regards,<br>infoAugust Support Team</p>`,
        //     "rawFiles": ""
        // }  
        
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Vendor Registration Notification",
            "text": `<p>Dear Client/Admin team,</p>
                     <p>Please be informed that the VRF is duly filled and all documents are attached by vendor.</p>
                     <p>Documents verification and validation process is due.</p>
                     <p>Best regards</p>`,
            "rawFiles": ""
        }         
              
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorDocumentVerifiedInitimationToVendorTemplate = async(vendor) =>
{
    try
    {
        // let dataToSend = {
        //     "to": vendor?.mailTo,
        //     "subject": "Infomap Verification Completed",
        //     "text": `<p>Dear ${vendor?.name},</p>
        //              <p>The verification of your documents has been successfully completed. The infoAugust team has thoroughly reviewed all the necessary paperwork, and everything is in order.</p>
        //              <p>If you have any further questions or require additional information, please feel free to reach out to us directly. We are here to assist you in any way we can.</p>
        //              <p>Thank you for your cooperation throughout this process.</p>
        //              <p>Regards,<br>Infomap Support Team<br>+91-9364102912</p>`,
        //     "rawFiles": ""
        // }
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Infomap Verification Completed",
            "text": `<p>Dear Sir/Madam,</p>
                     <p>We wish to inform you that vendor registration document vaildation process is successfull.</p>
                     <p>ERP Vendor code generation is in process.</p>
                     <p>Thanks for your Cooperation.</p>
                     <p>Regards,<br>Infomap Solutions Pvt ltd<br>Validation team</p>`,
            "rawFiles": ""
        }
                
              
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorDocumentVerifiedInitimationToClientTemplate = async(vendor) =>
{
    try
    {
        // let dataToSend = {
        //     "to": vendor?.mailTo,
        //     "subject": "Infomap Verification Completed",
        //     "text": `<p>Dear ${vendor?.clientName},</p>
        //             <p>The verification of vendor documents for ${vendor?.name} has been successfully completed. The infoAugust team has thoroughly reviewed all the necessary paperwork, and everything is in order.</p>
        //             <p>If you have any further questions or require additional information, please feel free to reach out to us directly. We are here to assist you in any way we can.</p>
        //             <p>Thank you for your cooperation throughout this process.</p>
        //             <p>Regards,<br>Infomap Support Team<br>+91-9364102912</p>`,
        //     "rawFiles": ""
        // }

        
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Infomap Verification Completed",
            "text": `<p>Dear Sir/Madam,</p>
                    <p>The verification and validation of document for temp vendor code ${vendor?.tempId} is completed.</p>
                    <p>Request you to approve and generate ERP Vendor code.</p>
                    <p>Regards,<br>Infomap Solutions Pvt ltd<br>Validation team</p>`,
            "rawFiles": ""
        }
                
              
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorDocumentVerifiedInitimationToInfomapTemplate = async(vendor) =>
{
    try
    {
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Infomap Verification Completed",
            "text": `<p>Dear ${vendor.clientName},</p>
                    <p>The verification of vendor documents for ${vendor?.name} has been successfully completed. The infoAugust team has thoroughly reviewed all the necessary paperwork, and everything is in order.</p>
                    <p>If you have any further questions or require additional information, please feel free to reach out to us directly. We are here to assist you in any way we can.</p>
                    <p>Thank you for your cooperation throughout this process.</p>
                    <p>Regards,<br>Infomap Support Team<br>+91-9364102912</p>`,
            "rawFiles": ""
        }
                
              
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorDocumentErrorInfoToVendorTemplate = async(vendor) =>
{
    try
    {
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Request to Resend the Documents",
            "text": `<p>Dear ${vendor?.name},</p>
                     <p>During our verification process, the following documents state the error. Kindly resend the below list of documents.</p>
                     <p>${vendor?.documentList}</p>
                     <p>If you have any further questions or require additional information, please feel free to reach out to us directly. We are here to assist you in any way we can.</p>
                     <p>Regards,<br>Infomap Team<br>+91-9364102912</p>`,
            "rawFiles": ""
        }               
              
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorOnboardedIntimationToClientTemplate = async(vendor) =>
{
    try
    {
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Vendor Onboarding Completed",
            "text": `<p>Dear Client,</p>
                     <p>We are pleased to inform you that the vendor onboarding for ${vendor?.name} has been completed successfully in the infoAugust Portal.</p>
                     <p>Regards,<br>infoAugust Support Team<br>+91-9364102912</p>`,
            "rawFiles": ""
        }               
              
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorOnboardedIntimationToInfomapTemplate = async(vendor) =>
{
    try
    {
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Vendor Onboarding Completed",
            "text": `<p>Dear Infomap Admin,</p>
                     <p>We are pleased to inform you that the vendor onboarding for ${vendor?.name} has been completed successfully in the infoAugust Portal. Please find the ERP code below:</p>
                     <p>${vendor?.sapCode}</p>
                     <p>Regards,<br>infoAugust Support Team<br>+91-9364102912</p>`,
            "rawFiles": ""
        }               
              
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

vendorTemplate.vendorOnboardedIntimationToVendorTemplate = async(vendor) =>
{
    try
    {
        // let dataToSend = {
        //     "to": vendor?.mailTo,
        //     "subject": "Vendor Onboarding Completed",
        //     "text": `<p>Dear Vendor,</p>
        //              <p>We are pleased to inform you that your vendor onboarding has been completed successfully in the infoAugust Portal. Please find the ERP code below:</p>
        //              <p>${vendor?.sapCode}</p>
        //              <p>Regards,<br>infoAugust Support Team<br>+91-9364102912</p>`,
        //     "rawFiles": ""
        // }  
        
        let dataToSend = {
            "to": vendor?.mailTo,
            "subject": "Vendor Onboarding Completed",
            "text": `<p>Dear Sir/Madam,</p>
                     <p>We are pleased to inform you that vendor onboarding is completed. <br>Pleae find below the ERP Vendor Code.</p>
                     <p>${vendor?.sapCode}</p>
                     <p>Regards,<br>infoAugust Support Team</p>`,
            "rawFiles": ""
        }                 
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

module.exports = vendorTemplate







