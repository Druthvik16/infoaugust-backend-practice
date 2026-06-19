let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let getCode = new errorCode()
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
let fs = require('fs')
let paymentAdviceCommonFunction = require('./paymentAdvicePdfCreator')
module.exports = require('express').Router().get('/:id',async(req,res) => 
{
    try
    {
        let getFilePath;
        let id;
        let encriptionKey;
        let encriptionIV;
        let apiName = ''
        id = req.params.id
        apiName = req.baseUrl
        getFilePath = await db.getUploadedFilePath(id)
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
            s3.getObject(params,async function(err, data) 
            {
                if (err) 
                {
                    console.error('Error list:', err);
                    res.status(500)
                    return res.json({
                        "status_code" : 500,
                        "message"     : "File Not Found",
                        "status_name" : getCode.getStatus(500)
                    });
                } 
                else 
                {
                    let saveDataTransactLog = await db.saveDataTransactLog('DN', 'EU', getFilePath[0]?.partnerId, getFilePath[0]?.locationId, data?.ContentLength, apiName, 'S3', new Date(), getFilePath[0].filePath.split('/')[2], fileName)
                    let decryptedData = await uniqueFunction.decryptFileBuffer(data?.Body, fileName,encriptionKey, encriptionIV)
                    if(decryptedData?.result)
                    {
                        // let tempPath = './vendor/' + fileName
                        // fs.writeFileSync(tempPath, decryptedData?.file)
                        // Load dummy data from JSON
                        let dataToSend = {}
                        const data = JSON.parse(decryptedData?.file);
                        let transformedData = data.map((invoice, index) => {
                            return {
                              invoiceNumber: invoice['Invoice Number']?.toString(),
                              invoiceDate: invoice["Invoice Date"]?.split('-')[2] + '-' + invoice['Invoice Date']?.split('-')[1] + '-' + invoice['Invoice Date']?.split('-')[0],
                              invoiceAmount: invoice["Invoice Amount"]?.toString(),
                              deductions: invoice["Deduction\/TDS"]?.toString(),
                              netAmountPaid: invoice["Net Amount Paid"]?.toString()
                            };
                          });
                        
                        dataToSend['invoices'] = transformedData
                        dataToSend['referenceNumber'] = getFilePath[0].billNoOrRefNo
                        dataToSend['paymentDate'] = getFilePath[0].paidDate
                        dataToSend['totalPaidAmount'] = getFilePath[0].totalAmountPaid
                        dataToSend['client'] = {
                            "name": getFilePath[0].clientName,
                            "address": getFilePath[0].clientFullAddress
                          }
                        dataToSend['vendor'] = {
                            "code": getFilePath[0].partnerCode,
                            "name": getFilePath[0].partnerName,
                            "address": getFilePath[0].vendorFullAddress
                          }

                          let pdf = await paymentAdviceCommonFunction.createPDF(dataToSend, getFilePath[0].clientShortLogoPath)

                          if(!pdf.result)
                            {
                                res.status(500)
                                return res.json({
                                    "status_code" : 500,
                                    "message"     : pdf.error,
                                    "status_name" : getCode.getStatus(500)
                                });
                            }
                            else
                            {
                                res.status(200)
                                return res.json({
                                    "status_code" : 200,
                                    "message"     : "success",
                                    "data" : {"file": pdf.file},
                                    "status_name" : getCode.getStatus(200)
                                });
                            }

                        // let base64data = "data:" + mimeType[0].mime + ";base64," + decryptedData?.file.toString('base64');
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
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})
