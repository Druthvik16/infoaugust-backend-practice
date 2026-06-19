let axios = require('axios');
let mailApiUrl = "https://mqm.infomap.in/saveMailMaster"
module.exports = require('express').Router().post("/",async(req,res) => 
{
    try
    {
        
        // "from_email": req.body.attachment?.length > 0 ? process.env.FROM_EMAIL_DOC : process.env.FROM_EMAIL,
        // "from_name": req.body.attachment?.length > 0 ? process.env.FROM_NAME_DOC : process.env.FROM_NAME,
        let mailDetails = {
            "to":   req.body.to,
            "from_email": (req.body.attachment?.length > 0 && req.body.fromEmail) ? req.body.fromEmail : process.env.FROM_EMAIL,
            "from_name": (req.body.attachment?.length > 0 && req.body.fromName) ? req.body.fromName : process.env.FROM_NAME,
            "subject": req.body.subject,
            "text": req.body.text,
            "clientKey": process.env.CLIENTKEY
        };   
        if(req.body.attachment?.length > 0)
        {
            mailDetails['attachments'] = req.body.attachment
        }
        else if(req.body.rawFiles?.length > 0)
        {
            mailDetails['attachments'] = req.body.rawFiles
        }
        console.log("mailDetails", mailDetails)
        axios.post(mailApiUrl, mailDetails).then(sendMail => {
            // console.log(sendMail.data);
            if(sendMail?.data?.status_code == 200)
            {
                console.log('Email sent successfully  ');
                res.send(true)
            }  
            else
            {
                console.log('Error Occurs ', sendMail.data);
                res.send(false)
            }
        })}
    catch(e)
    {
        console.log(e)
        res.send(false)
    }
})