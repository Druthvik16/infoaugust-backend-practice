let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let axios = require('axios')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let emailTemplate = require('../common/emailFormatsForOtpNDocs')
const bucketName = process.env.Bucket_Name;
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let getFilePath;
        let clientUploadedDocumentDetailId;
        let subject;
        let billNoOrRefNo;
        let toUser;
        let bodyMsg;
        let action;
        let monthPeriod;
        let encriptionKey;
        let encriptionIV;
        let apiName = ''
        if(!req.body.subject || !req.body.toUser || !req.body.clientUploadedDocumentDetail || !req.body.clientUploadedDocumentDetail?.id)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        clientUploadedDocumentDetailId = req.body.clientUploadedDocumentDetail?.id
        subject = req.body.subject
        billNoOrRefNo = req.body.billNoOrRefNo
        toUser = req.body.toUser
        action = req.body.action
        monthPeriod = req.body.monthPeriod
        bodyMsg = ''
        apiName = req.baseUrl
        let roleCode = req.body.roleCode || ""
        let sendingTo = req.body.sendingTo || ""
        let sendToUser = req.body.sendToUser || ""
        getFilePath = await db.getUploadedFilePath(clientUploadedDocumentDetailId)
        if(getFilePath.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Provide valid Data",
                "status_name" : getCode.getStatus(500)
            });
        }
        else
        {
            let clientId = getFilePath[0].clientId;
            let emailformatData = await db.getClientSftpMasterData(clientId)
            if(emailformatData?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Client master data is not available",
                    "status_name" : getCode.getStatus(500)
                });
            }
            const params = {
                Bucket: bucketName,
                Key: getFilePath[0].filePath
            };
            let fileName = getFilePath[0].fileName
            let fileExtension = fileName.split('.')[1]
            let mimeType = await db.getMimeType(fileExtension)
            let encryptKey = getFilePath
            if(encryptKey?.length == 0)
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Encription key not found for file",
                    "status_name" : getCode.getStatus(500)
                })
            }
            else
            {
                encriptionKey = encryptKey[0].encryption_key
                encriptionIV = encryptKey[0].encryption_iv
            }
            console.log(params)
            s3.getObject(params, async function(err, data) 
            {
                if (err) 
                {
                    console.log('Error list:', err);
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message"     : "File Not Found",
                        "status_name" : getCode.getStatus(500)
                    });
                } 
                else 
                {
                    let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', getFilePath[0]?.partnerId, getFilePath[0]?.locationId, data?.ContentLength, apiName, 'S3', new Date(), getFilePath[0].filePath.split('/')[1], fileName)
                    let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName,encriptionKey, encriptionIV)
                    if(decryptedData?.result)
                    {
                        let attachment = [{
                            content : decryptedData?.file.toString('base64'),
                            type : mimeType[0].mime,
                            name : fileName
                        }]

                        let tempJson = {
                            mailTo : [{"email" : toUser?.email, "name": toUser?.name, "type" : "to"}],
                            subject : subject,
                            billNoOrRefNo : billNoOrRefNo,
                            monthPeriod : monthPeriod,
                            attachment : attachment,
                            action : action,
                            toUser : toUser,
                            ...emailformatData[0]
                        }

                        let tempJson2 = {
                            mailTo : [{"email" : sendToUser?.email, "name": sendToUser?.name, "type" : "to"}],
                            subject : subject,
                            billNoOrRefNo : billNoOrRefNo,
                            monthPeriod : monthPeriod,
                            attachment : attachment,
                            sendToUser : sendToUser,
                            partnerCode : getFilePath[0].partnerCode,
                            action : action,
                            toUser : toUser,
                            ...emailformatData[0]
                        }

                        // let dataToSend = {
                        //     "to":[{"email" : toUser?.email, "name": toUser?.name, "type" : "to"}],
                        //     "subject": subject,
                        //     "text": "",
                        //     "attachment" : attachment
                        // }

                        let result = null;
                        let result2 = null;

                        let bodyMsg = ``

                        if(subject == "Credit Note Summary")
                        {
                            // bodyMsg = `Credit Note Summary ${action} for ${billNoOrRefNo}</div>`
                            result = await emailTemplate.creditNoteSummaryTemplate(tempJson)
                            if(roleCode && roleCode?.length > 0 && roleCode != undefined && sendingTo == 'partner')
                            {
                                result2 = await emailTemplate.creditNoteSummaryTemplateClientADM(tempJson2)
                            }
                        }
                        else if(subject == "Invoice Information")
                        {
                            // bodyMsg = `Invoice ${action} for ${billNoOrRefNo}</div>`
                            result = await emailTemplate.invoiceSummaryTemplate(tempJson)
                            if(roleCode && roleCode?.length > 0 && roleCode != undefined && sendingTo == 'partner')
                            {
                                result2 = await emailTemplate.invoiceSummaryTemplateClientADM(tempJson2)
                            }
                        }
                        else if(subject == "Ledger Information")
                        {
                            // bodyMsg = `Ledger for ${monthPeriod}</div>`
                            result = await emailTemplate.ledgerSummaryTemplate(tempJson)
                            if(roleCode && roleCode?.length > 0 && roleCode != undefined && sendingTo == 'partner')
                            {
                                result2 = await emailTemplate.ledgerSummaryTemplateClientADM(tempJson2)
                            }
                        }
                        else if(subject == "Monthly Transaction Information")
                        {
                            // bodyMsg = `Monthly Transactions for ${monthPeriod}</div>`
                            result = await emailTemplate.monthlyTransactionSummaryTemplate(tempJson)
                            if(roleCode && roleCode?.length > 0 && roleCode != undefined && sendingTo == 'partner')
                            {
                                result2 = await emailTemplate.monthlyTransactionSummaryTemplateClientADM(tempJson2)
                            }
                        }

                        if(result.result)
                        {

                            let dataToSend = result.data
    
                            // dataToSend['text'] = `<div>Hello,</div><br/><br/><div>Please find attachment of ${bodyMsg}</div>`
                            axios.post( api.serviceApi + api.common + api.sendMail, dataToSend).then((sendMail) =>
                            {
                                if(sendMail?.data) 
                                {
                                    if(sendingTo == 'partner')  
                                    {
                                        axios.post( api.serviceApi + api.common + api.sendMail, result2.data).then((sendMail1) =>
                                        {
                                            console.log("send to client")
                                        })
                                        .catch(err => {
                                            console.log("mail sent failed")
                                            console.log(err.data)
                                        })
                                    }
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
                                        "message"       :   "Mail not sent",
                                        "status_name"   :   getCode.getStatus(500)
                                    }) 
                                }
                            }).catch(err => {
                                console.log(err)
                                res.status(500)
                                return res.json({
                                    "status_code" : 500,
                                    "message"     : "Mail not sent",
                                    "status_name" : getCode.getStatus(500),
                                    "error"       : err
                                });
                            })
                        }
                        else
                        {
                            res.status(500)
                            return res.json({
                                "status_code"   :   500,
                                "message"       :   "Mail not sent",
                                "status_name"   :   getCode.getStatus(500)
                            }) 
                        }
                    }
                    else
                    {
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message"     : "File Not Decrypted",
                            "status_name" : getCode.getStatus(500)
                        });
                    }
                }
            })
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Mail not sent",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})