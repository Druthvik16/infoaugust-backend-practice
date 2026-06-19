let db = require('./dbQueryAuthenticate')
let axios = require('axios')
let errorCode = require('../common/errorCode/errorCode')
let getCode = new errorCode()
let generate_token = require('./tokenGenerate')

module.exports = require('express').Router().post('/',async(req,res)=>
{
    let email;
    let resetUrl;
    let user;
    let baseUrl;
    baseUrl = req.protocol + '://' + req.get('host')
    try
    {
        if(!req.body.email || !req.body.resetUrl)
        {
            res.status(404)
            return res.json({
                "status_code" : 404,
                "message"     : "Provide All Values",
                "status_name"   : getCode.getStatus(404)
            })
        }
        email = req.body.email;
        resetUrl = req.body.resetUrl;
        user = await db.checkResetLinkEmail(email);
        if(user.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Email Not Registered",
                "status_name" : getCode.getStatus(500)
            })
        }
        let checkIfAlreadyExist = await db.checkMailExist(email)
        if(checkIfAlreadyExist[0].emailExist == 1)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Link Already Sent, Check You Email",
                "status_name" : getCode.getStatus(500)
            })
        }
        if(user.length > 0)
        {
            let imageUrl = resetUrl.split('/#')[0]
            const code = generate_token(10)
            if(code != null || code != undefined)
            {
                // [button]

                // Or copy and paste the url into your browser : 
                let link = resetUrl + code
                let mailContent = `<p>Hi ${user[0].fullName},</p>

                <p> You recently requested to reset the password for your account. Click the url below to proceed.</p>
                
                <p></p>
                
                <p> <a href = "${link}">${link} </a></p>
                
                <p></p>
                
                <p>If you did not request a password reset, please ignore this email.</p>
                
                <p>This password reset link is only valid for the next 10 minutes.</p>
                
                <p></p>
                
                <p>Thanks,</p>
                <p>Infomap Solutions Private Limited</p>
                <p><a href="#"><img src="` + imageUrl + `/assets/images/logo-infomap.jpg" style="width: 200px;"/></a></p>                
                `
                let params = {
                    "to":[{"email" :email, "name": user[0].fullName, "type" : "to"}],
                    "fromEmail":"bprism@infomapglobal.com",
                    "fromName":"Infomap",
                    "subject": "Reset Password Link",
                    "text": mailContent,
                    "clientKey":"bprsm-2wbNZbLIe8wR5AeXLDhKKA82hcXpyu"
                }
                let mailUrl = baseUrl + '/api/auth/sendMail'
                let send = await axios.post(mailUrl, params)
                if(send.data == true)
                {
                    let insert_lastLogin = await db.saveResetLink(email, code, new Date())
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "status_name" : 'ok'
                    })
                }
                else
                {
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message": "Link Not Sent",
                        "status_name" : getCode.getStatus(500)
                    });
                }
            } 
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message": "Email Not Registered",
                    "status_name" : getCode.getStatus(500)
                });
            } 
        }  
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message": "Email Not Registered",
                "status_name" : getCode.getStatus(500)
            });
        } 
    } 
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Email Not Registered",
            "status_name" : getCode.getStatus(500),
            "errror"      : e.sqlMessage
        });
    }
})
