const uniqueFunction = require('./commonFunction/uniqueSearchFunction');
const fs = require('fs');
let emailTemplate = {}
let apiUrl = require('../apiUrl')
let api = new apiUrl()

let temp1 = `<p>Regards<br>
                    infoAugust Support Team<br>
                    infoAugust support email Id(yet to be shared)<br>
                    +91-9364102912</p>`

let temp2 = `<p>Regards<br>
                    BlackBerrys</p>`

emailTemplate.otpTemplate = async(data) =>
{
    try
    {
        // "Your OTP for <strong>" + email +"</strong> is <strong>"+ otpSended +"</strong> for sign-in." + `This otp is valid for <strong>  ${optValidTime} minutes </strong> .`
        let text = `<p>Dear Sir/Madam,</p>
            <p>Your OTP (one-time password) to login is <strong> ${data.otpSended} </strong>. The password will expire in 5 minutes. If your password has expired, you can always request for another. </p> 
            

            <p>Warm Regards,</p>
            <p>Team infoAugust</p>
            

            <p>*** This is an automatically generated email, please do not reply to this email ***</p>
            
            <p>Disclaimer:</p>
            
            <p>This is a system generated mail for general information purposes only and unless otherwise specifically mentioned therein should not be construed as an acknowledgement, authentication and/or approval of any kind about the correctness of the information/data successfully submitted by you.</p>
            
            <p>If you are not the intended recipient of this mail or information contained therein, please forthwith, contact the sender and delete the material completely from your computer/s and/or the device/s wherein the contents/information of this mail may have been stored.</p>
            

            <p>WARNING:</p>
            
            <p>Computer viruses can be transmitted via email. The recipient should check this email and any attachments for the presence of viruses. Infomap accepts no liability for any damage caused as a result of any virus or other malware transmitted by this e-mail. </p>

            <p>Recipient should carry out own virus checks before opening the e-mail or attachment. E-mail transmission cannot be guaranteed to be secure or error-free as information could be intercepted, corrupted, lost, destroyed, arrive late or incomplete, or contain viruses. The sender therefore does not accept liability for any errors or omissions in the contents of this message, which arise as a result of e-mail transmission</p>
            `
        let dataToSend = 
        {
            "to": data?.mailTo,
            "subject": "Sign-In Otp",
            "text": text
        }
        return {'result':true, 'data' : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

emailTemplate.creditNoteSummaryTemplate = async(data) =>
{
    try
    {
        let text = `<p>Hello ${data.toUser?.name},</p>
                    <p>PFA Credit Note Summary ${data.action} for ${data.billNoOrRefNo}</p>
                    <p>Regards<br>
                    ${data.supportTeam}<br>
                    ${data.supportEmail}<br>
                    ${data.supportContactNo}</p>
                    `
        let dataToSend = {
            "to": data?.mailTo,
            "subject": data.subject,
            "text": text,
            "attachment": data.attachment,
            "fromName": data.fromName,
            "fromEmail": data.fromEmail
        }
        
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

emailTemplate.invoiceSummaryTemplate = async(data) =>
{
    try
    {
        let text = `<p>Hello ${data.toUser?.name},</p>
                    <p>PFA Invoice copy  for ${data.billNoOrRefNo}</p>
                    <p>Regards<br>
                    ${data.supportTeam}<br>
                    ${data.supportEmail}<br>
                    ${data.supportContactNo}</p>
                    `
        let dataToSend = {
            "to": data?.mailTo,
            "subject": data.subject,
            "text": text,
            "attachment": data.attachment,
            "fromName": data.fromName,
            "fromEmail": data.fromEmail
        }
        
        return {result:true, data : dataToSend}  
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

emailTemplate.ledgerSummaryTemplate = async(data) =>
{
    try
    {
        let text = `<p>Hello ${data.toUser?.name},</p>
                
                    <p>PFA Ledger for the month of ${data.monthPeriod}</p>
                
                    <p>Regards<br>
                    ${data.supportTeam}<br>
                    ${data.supportEmail}<br>
                    ${data.supportContactNo}</p>
                    `
        let dataToSend = {
            "to": data?.mailTo,
            "subject": data.subject,
            "text": text,
            "attachment": data.attachment,
            "fromName": data.fromName,
            "fromEmail": data.fromEmail
        }
        
        return {result:true, data : dataToSend}  
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

emailTemplate.monthlyTransactionSummaryTemplate = async(data) =>
{
    try
    {
        let text = `<p>Hello ${data.toUser?.name},</p>
                   
                    <p>PFA summary of monthly transaction for the month of ${data.monthPeriod}</p>
                   
                    <p>Regards<br>
                    ${data.supportTeam}<br>
                    ${data.supportEmail}<br>
                    ${data.supportContactNo}</p>
                    `
        let dataToSend = {
            "to": data?.mailTo,
            "subject": data.subject,
            "text": text,
            "attachment": data.attachment,
            "fromName": data.fromName,
            "fromEmail": data.fromEmail
        }
        
        return {result:true, data : dataToSend}  
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

emailTemplate.creditNoteSummaryTemplateClientADM = async(data) =>
{
    try
    {
        let text = `<p>Hello ${data.sendToUser?.name},</p>
                    <p>Credit Note ${data.action} for ${data.billNoOrRefNo} submitted to ${data.toUser?.name} (${data.partnerCode}).</p>
                   <p>Regards<br>
                    ${data.supportTeam}<br>
                    ${data.supportEmail}<br>
                    ${data.supportContactNo}</p>
                    `
        let dataToSend = {
            "to": data?.mailTo,
            "subject": data.subject,
            "text": text,
            "attachment": "",
            "fromName": data.fromName,
            "fromEmail": data.fromEmail
        }
        
        return {result:true, data : dataToSend}    
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

emailTemplate.invoiceSummaryTemplateClientADM = async(data) =>
{
    try
    {
        let text = `<p>Hello ${data.sendToUser?.name},</p>
                    <p>Invoice  for ${data.billNoOrRefNo} submitted to ${data.toUser?.name} (${data.partnerCode}).</p>
                    <p>Regards<br>
                    ${data.supportTeam}<br>
                    ${data.supportEmail}<br>
                    ${data.supportContactNo}</p>
                    `
        let dataToSend = {
            "to": data?.mailTo,
            "subject": data.subject,
            "text": text,
            "attachment": '',
            "fromName": data.fromName,
            "fromEmail": data.fromEmail
        }
        
        return {result:true, data : dataToSend}  
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

emailTemplate.ledgerSummaryTemplateClientADM = async(data) =>
{
    try
    {
        let text = `<p>Hello ${data.sendToUser?.name},</p>
                
                    <p>Ledger for the month of ${data.monthPeriod} submitted to ${data.toUser?.name} (${data.partnerCode}).</p>
                
                    <p>Regards<br>
                    ${data.supportTeam}<br>
                    ${data.supportEmail}<br>
                    ${data.supportContactNo}</p>
                    `
        let dataToSend = {
            "to": data?.mailTo,
            "subject": data.subject,
            "text": text,
            "attachment": '',
            "fromName": data.fromName,
            "fromEmail": data.fromEmail
        }
        
        return {result:true, data : dataToSend}  
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

emailTemplate.monthlyTransactionSummaryTemplateClientADM = async(data) =>
{
    try
    {
        let text = `<p>Hello ${data.sendToUser?.name},</p>
                   
                    <p>Monthly transaction for the month of ${data.monthPeriod} submitted to ${data.toUser?.name} (${data.partnerCode}).</p>
                   
                    <p>Regards<br>
                    ${data.supportTeam}<br>
                    ${data.supportEmail}<br>
                    ${data.supportContactNo}</p>
                    `
        let dataToSend = {
            "to": data?.mailTo,
            "subject": data.subject,
            "text": text,
            "attachment": "",
            "fromName": data.fromName,
            "fromEmail": data.fromEmail
        }
        
        return {result:true, data : dataToSend}  
    }
    catch (e)
    {
        console.log(e);
        return {result:false, error: e?.stack || e?.message || e}
    }
}

module.exports = emailTemplate







