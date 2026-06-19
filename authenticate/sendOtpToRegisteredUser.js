let db = require('./dbQueryAuthenticate')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let axios = require('axios')
let emailTemplate = require('../common/emailFormatsForOtpNDocs')

module.exports = require('express').Router().get('/:userId/:optValidTime',async(req,res) =>  {
    try
    {
        let getRegisteredUserId;
        let userId;
        let optValidTime;
        let msTime = 60000;
        let otpSenderName = process.env.mobileOtpSender
        let mobileApikey = process.env.mobileApikey   

        console.log("called", req.params, msTime)
        msTime = 60000;
        userId = req.params.userId
        optValidTime = parseInt(req.params.optValidTime)
        msTime = msTime * optValidTime
        let deleteOtp = await db.deleteOtp(userId)
        getRegisteredUserId = await db.getRegisteredUserId(userId)
        if(getRegisteredUserId?.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code"   :   500,
                "message"       :   "User not registered with Infoaugust",
                "status_name"   :   getCode.getStatus(500)
            }) 
        }
        console.log('Registered user',getRegisteredUserId)
        let registerUser = getRegisteredUserId[0]
        let email = registerUser?.email
        let name = registerUser?.name
        let mobile = registerUser?.mobile
        let otpSended = generateRandomNumber()

        if(email?.toLowerCase() == userId?.toLowerCase())
        {
            let tempJson = {
                mailTo : [{"email" : email, "name": name, "type" : "to"}],
                otpSended : otpSended
            }
            let result = await emailTemplate.otpTemplate(tempJson)
            if(result.result)
            {
                let dataToSend = result.data
                let send = await axios.post(api.serviceApi + api.common + api.sendMail, dataToSend)
                console.log("sended :", send?.data, dataToSend)
                if(send?.data) 
                {
                    let saveOtp = await db.saveOtp(userId, otpSended)
                    console.log(msTime)
                    setTimeout(async() => {
                        let deleteOtp = await db.deleteOtp(userId)
                    }, msTime)
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message"     : 'success',
                        "status_name"   : getCode.getStatus(200)
                    })
                }
                else
                {
                    res.status(500)
                    return res.json({
                        "status_code"   :   500,
                        "message"       :   "Otp not sent",
                        "status_name"   :   getCode.getStatus(500)
                    }) 
                }

            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code"   :   500,
                    "message"       :   "Otp not sent",
                    "status_name"   :   getCode.getStatus(500)
                }) 
            }
        }
        else if(mobile == userId)
        {
            // let text = `Your OTP is ${otpSended} to login infoaugust.com application by Infomap.`

            // let url = `https://api.textlocal.in/send?apikey=${mobileApikey}=&numbers=${mobile}&sender=${otpSenderName}&message=${text}`

            // let config = 
            // {
            //     method: 'post',
            //     maxBodyLength: Infinity,
            //     url: url,
            //     headers: { }
            // };


            let text = `Your OTP is ${otpSended} to login infoaugust.com application by Infomap.&route=1&DLTtemplateid=1007999011019183672`

            let url = `http://103.241.136.228/api/mt/SendSMS?APIKey=${mobileApikey}&senderid=${otpSenderName}&channel=2&DCS=0&flashsms=0&number=${mobile}&text=${text}`

            let config = 
            {
                method: 'get',
                maxBodyLength: Infinity,
                url: url,
                headers: { }
            };

            console.log(url)
            axios.request(config).then(async(response) => 
            {
                // console.log(response)
                // if(response.data?.status == "success")
                if(response?.statusText == "OK")
                {
                    let saveOtp = await db.saveOtp(userId, otpSended)
                    console.log(msTime)
                    setTimeout(async() => {
                        let deleteOtp = await db.deleteOtp(userId)
                    }, msTime)
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message"     : 'success',
                        "status_name"   : getCode.getStatus(200)
                    })
                }
                else
                {
                    res.status(500)
                    return res.json({
                        "status_code"   :   500,
                        "message"       :   "Otp not sent",
                        "status_name"   :   getCode.getStatus(500)
                    }) 
                }
            })
            .catch((error) => 
            {
                console.log(error);
                res.status(500)
                return res.json({
                    "status_code"   :   500,
                    "message"       :   "Otp not sent",
                    "error" : error?.stack,
                    "status_name"   :   getCode.getStatus(500)
                }) 
            });
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code"   :   500,
                "message"       :   "Otp not sent",
                "status_name"   :   getCode.getStatus(500)
            }) 
        }
    } 
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code"   :   500,
            "message"       :   "User not found",
            "status_name"   :   getCode.getStatus(500),
            "error"         :   e.sqlMessage
        })     
    }
})


function generateRandomNumber()
{
    return Math.floor(100000 + Math.random() * 900000)
}