let db = require('./dbQueryAuthenticate')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let userObject = require('../model/login')
let useUser = new userObject()
let generate_token = require('./tokenGenerate')

module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        let email;
        let password;
        let userId
        let user
        let userClients
        let userClientPartner
        let passKey;
        let partner;
        let partnerClients;
        let partnerId;
        if (!req.body.userId || !req.body.password) {
            res.status(404)
            return res.json({
                "status_code": 404,
                "message": "Provide All Values",
                "status_name": getCode.getStatus(404)
            })
        }
        email = req.body.userId?.trim();
        password = req.body.password.trim();
        passKey = process.env.PASS_SECRET_KEY
        console.log(email, password, passKey)
        let getOtp = await db.getOtp(email)
        let otp = '';
        console.log("getOtp", getOtp)
        if (getOtp?.length == 0) {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "Otp Exipired",
                "status_name": getCode.getStatus(500)
            })
        }
        else {
            otp = getOtp.filter(data => data.otp == password)
            console.log("otp", otp)
            if (otp?.length == 0) {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": "Invalid OTP",
                    "status_name": getCode.getStatus(500)
                })
            }
            else {
                let deleteOtp = await db.deleteOtp(email)
                let userData = await db.getUserData(email, password, passKey);
                console.log("userData************ ", userData)
                if (userData.length == 0) {
                    res.status(500)
                    return res.json({
                        "status_code": 500,
                        "message": "Invalid Email Or Password",
                        "status_name": getCode.getStatus(500)
                    })
                }
                let uuid = userData[0].uuid
                userId = userData[0].id
                if (userData[0]?.roleCode) {
                    user = await db.getUser(uuid)
                    console.log("user************ ", user)
                    user[0] = { ...user[0], ...userData[0] }
                }
                else {
                    if (userData[0].userType == 'Partner')
                        partner = await db.getPartner(uuid)
                    else
                        partner = await db.getSecondaryPartner(uuid)
                }

                if (user?.length > 0) {
                    user[0]['time'] = new Date()

                    userClients = []
                    userClients = user.filter(client => {
                        return (client.userClientId != null)
                    })
                    if ((user[0].roleCode == 'MGR' || user[0].roleCode == 'EXE') && userClients.length == 0) {
                        res.status(500)
                        return res.json({
                            "status_code": 500,
                            "message": "User Not Mapped With Any Client Or Partner",
                            "status_name": getCode.getStatus(500)
                        })
                    }
                    let mysqlDatetime = new Date()
                    const jsontoken = generate_token(56)
                    if (jsontoken != null || jsontoken != undefined) {
                        user[0]['authToken'] = jsontoken
                        let getTableName = await db.getTableName(email)

                        if (getTableName[0].userType == 'AdditionalUser') {
                            let insert_lastLogin = await db.insertLastLoginAndAuthTokenAdditionalUser(mysqlDatetime, userId, jsontoken, new Date())
                        }
                        else {
                            let insert_lastLogin = await db.insertLastLoginAndAuthToken(mysqlDatetime, userId, jsontoken, new Date())
                        }
                        let userType = userData[0]['userType']
                        let updateLoginHistory = await db.updateLoginHistory(userId, userType, new Date(), 'SYSTEM')
                        let saveLoginHistory = await db.saveLoginHistory(userId, userType, new Date())
                        userClientPartner = []
                        userZoneList = []
                        userClients.forEach(client => {
                            useUser.setUserClientPartner(client)
                            userClientPartner.push(useUser.getUserClientPartner())
                        })
                        user[0]['userClientPartner'] = userClientPartner
                        useUser.setDataAll(user[0])
                        res.status(200)
                        return res.json({
                            "status_code": 200,
                            "message": "success",
                            "user": useUser.getDataAll(),
                            "status_name": getCode.getStatus(200)
                        });
                    }
                }
                else if (partner?.length > 0) {
                    partner[0]['time'] = new Date()
                    partnerId = partner[0].partnerId
                    partnerClients = []
                    partnerClients = partner.filter(client => {
                        return (client.clientId != null)
                    })
                    let mysqlDatetime = new Date()
                    const jsontoken = generate_token(56)
                    if (jsontoken != null || jsontoken != undefined) {
                        partner[0]['authToken'] = jsontoken
                        if (userData[0].userType == 'Partner') {
                            let insert_lastLogin = await db.insertLastLoginAndAuthTokenPartner(mysqlDatetime, partnerId, jsontoken, new Date())
                        }
                        else {
                            let insert_lastLogin = await db.insertLastLoginAndAuthTokenPartnerSecondary(mysqlDatetime, partnerId, jsontoken, new Date())
                        }
                        
                        let updateLoginHistory = await db.updateLoginHistory(partnerId, userData[0]['userType'], new Date(), 'SYSTEM')
                        let saveLoginHistory = await db.saveLoginHistory(partnerId, userData[0]['userType'], new Date())
                        userClientPartner = []
                        partnerClients.forEach(client => {
                            useUser.setClient(client)
                            userClientPartner.push(useUser.getClient())
                        })
                        partner[0]['userType'] = userData[0].userType
                        partner[0]['clients'] = userClientPartner
                        useUser.setPartner(partner[0])
                        res.status(200)
                        return res.json({
                            "status_code": 200,
                            "message": "success",
                            "user": useUser.getPartner(),
                            "status_name": getCode.getStatus(200)
                        });
                    }
                }
            }
        }
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "Invalid Email Or Password",
            "status_name": getCode.getStatus(500),
            "errror": e.sqlMessage
        });
    }
})
