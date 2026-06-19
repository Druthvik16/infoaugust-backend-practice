let db = require('./dbQueryAuthenticate')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let generate_token = require('./tokenGenerate')
let userObject = require('../model/login')
let useUser = new userObject()
module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        let userCred;
        let email;
        let password;
        let userId
        let user
        let passKey;
        ////  For Spsn User Role Set (Static)
        let role = "SPSN"
        if(!req.body.userId || !req.body.password)
        {
            res.status(404)
            return res.json({
                "status_code" : 404,
                "message"     : "Provide All Values",
                "status_name"   : getCode.getStatus(404)
            })
        }
        userCred = req.body.userId;
        password = req.body.password.trim();
        passKey = process.env.PASS_SECRET_KEY        
        let getOtp = await db.getSpsnOtp(userCred)
        let otp = '';
        console.log("getOtp",getOtp)
        if(getOtp?.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Otp Exipired",
                "status_name" : getCode.getStatus(500)
            })
        }
        else
        {
            otp = getOtp.filter(data => data.otp == password)
            console.log("otp",otp)
            if(otp?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Invalid OTP",
                    "status_name" : getCode.getStatus(500)
                })
            }
            else
            {
                let deleteSpsnOtp = await db.deleteSpsnOtp(userCred)
                const detectUser = await db.detectUser(userCred)
                if(detectUser.length == 0)
                {
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message"     : "Invalid Email Or Password",
                        "status_name" : getCode.getStatus(500)
                    })
                }
                else
                {
                    let detectedRole = detectUser[0].roleCode;
                    if(detectedRole == 'SPSN')
                    {
                        user = await db.getSpsnUser(userCred, password, passKey);
                        console.log(user)
                        if(user.length == 0)
                        {
                            res.status(500)
                            return res.json({
                                "status_code" : 500,
                                "message"     : "Invalid Email Or Password",
                                "status_name" : getCode.getStatus(500)
                            })
                        }
                        else
                        {
                            user[0]['time'] = new Date()
                            userId = user[0].id
                            let mysqlDatetime = new Date()
                            const jsontoken = generate_token(56)
                            
                            if(jsontoken != null || jsontoken != undefined)
                            {
                                user[0]['accessToken']=jsontoken
                                user[0]['role'] = role
                                const spsnUserType = user[0]?.userType
                                if(spsnUserType == 'SPSN-User')
                                {
                                    let insert_lastLogin = await db.insertLastLoginAndAuthTokenSpsnUser(mysqlDatetime, userId, jsontoken, new Date())
                                }
                                else
                                {
                                    let insert_lastLogin = await db.insertLastLoginAndAuthTokenSpsnExtendedUser(mysqlDatetime, userId, jsontoken, new Date())
                                }
                                
                                let updateLoginHistory = await db.updateLoginHistory(userId, spsnUserType, new Date(), 'SYSTEM')
                                let saveLoginHistory = await db.saveLoginHistory(userId, spsnUserType, new Date())
                                let getSpsnUserPartnerLocations = await db.getSpsnUserPartnerLocations(userId) 
                                user[0]['partnerLocations'] = getSpsnUserPartnerLocations   
                                useUser.setClient(user[0])  
                                user.forEach(element => {
                                    delete element['clientId']
                                    delete element['clientUuid']
                                    delete element['clientName']
                                    delete element['clientCode']
                                    delete element['clientEmail']
                                    delete element['clientMobile']
                                    delete element['clientGST']
                                    delete element['clientShortName']
                                    delete element['clientPan']
                                    delete element['clientTan']
                                    delete element['clientFullLogoPath']
                                    delete element['clientShortLogoPath']
                                    delete element['clientFullAddress']
                                    delete element['clientCompanyName']
                                }); 
                                user[0]['client'] = useUser.getClient()     
                                res.status(200)
                                return res.json({
                                    "status_code" : 200,
                                    "message"     : "success",
                                    "user" : user[0],
                                    "status_name" : getCode.getStatus(200)
                                });                        
                            } 
                            else
                            {
                                res.status(500)
                                return res.json({
                                    "status_code" : 500,
                                    "message": "Something went wrong",
                                    "status_name" : getCode.getStatus(500)
                                });
                            } 
                        }
                    }
                    else
                    { 
                        email = userCred;
                        let uuid = detectUser[0].uuid 
                        userId = detectUser[0].id
                        let user = await db.getUser(uuid)
                        console.log("user************ ",user)
                        user[0] = {...user[0], ...detectUser[0]} 
                        user[0]['time'] = new Date()
                        
                        let mysqlDatetime = new Date()
                        const jsontoken = generate_token(56)
                        if(jsontoken != null || jsontoken != undefined)
                        {
                            user[0]['authToken']=jsontoken
                            let getTableName = await db.getTableName(email)
                            
                            if(getTableName[0].userType == 'AdditionalUser')
                            {
                                let insert_lastLogin = await db.insertLastLoginAndAuthTokenAdditionalUser(mysqlDatetime, userId, jsontoken, new Date())
                            }
                            else
                            {
                                let insert_lastLogin = await db.insertLastLoginAndAuthToken(mysqlDatetime, userId, jsontoken, new Date())
                            }
                            let userType = detectUser[0]['userType']
                            let updateLoginHistory = await db.updateLoginHistory(userId, userType, new Date(), 'SYSTEM')
                            let saveLoginHistory = await db.saveLoginHistory(userId, userType, new Date())      
                            useUser.setDataAll(user[0])
                            res.status(200)
                            return res.json({
                                "status_code" : 200,
                                "message"     : "success",
                                "user" : useUser.getDataAll(),
                                "status_name" : getCode.getStatus(200)
                            });
                        } 
                    }
                }
            }
        }
    } 
    catch(e)
    {
        console.log(e);
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Invalid email or password",
            "status_name" : getCode.getStatus(500),
            "errror"      : e.sqlMessage
        });
    }
})
