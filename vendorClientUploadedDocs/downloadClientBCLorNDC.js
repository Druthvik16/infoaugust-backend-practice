let db = require('./dbQueryClientUploadedDocs')
let errorCode = require('../common/error/errorCode')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let getCode = new errorCode()
let formatDate = require('date-fns')
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
const bucketName = process.env.Bucket_Name;
let createPdfBCLorNDC = require('./createPdfBCLorNDC');
const { enUS, enIN } = require('date-fns/locale');
module.exports = require('express').Router().get('/:id/:action', async (req, res) => {
    try {
        let encriptionKey;
        let encriptionIV;
        let id = req.params.id
        let action = req.params.action
        let apiName = req.baseUrl || ""
        let getClientUploadedBCLorNDC = await db.getClientUploadedBCLorNDC(id, action)
        if (getClientUploadedBCLorNDC.length == 0) {
            res.status(500)
            return res.json({
                "status_code": 500,
                "message": "Provide valid Data",
                "status_name": getCode.getStatus(500)
            });
        }
        else {

            let [year, month, day] = new Date().toISOString().slice(0, 10).replace('T', ' ').split('-')
            let cutOffDate = `${day}-${month}-${year}`
            let fileName = getClientUploadedBCLorNDC[0].vendorCode + "_" + cutOffDate + "_" + action + '.pdf'
            let dataToSend = ''
            let pdf  = ''
            let date = cutOffDate
            if (action == 'BCL')
            {                
                let balanceConfirmationDate = getClientUploadedBCLorNDC[0].postingDate;
                let cutOffDate = formatDate.format(balanceConfirmationDate, 'dd-MM-yyyy', { locale: enIN});

                dataToSend = {
                    clientName: getClientUploadedBCLorNDC[0].clientName,
                    clientLogoPath: getClientUploadedBCLorNDC[0].clientShortLogoPath,
                    clientAddress: getClientUploadedBCLorNDC[0].clientFullAddress,
                    amount: getClientUploadedBCLorNDC[0].amount,
                    vendorName: getClientUploadedBCLorNDC[0].vendorName,
                    cutOffDate: `Date : ${date}`,
                    subject : `Sub: Balance confirmation as on ${cutOffDate}.`,
    tableData1 : [
    ["Confirming Party Name", "Amount in INR"],
    [getClientUploadedBCLorNDC[0].vendorName, getClientUploadedBCLorNDC[0].amount.toString()]
    ],  
    tableData3 : [
    ["Confirming Party Name", "Amount in INR"],
    [getClientUploadedBCLorNDC[0].clientName, getClientUploadedBCLorNDC[0].amount.toString()]
    ],
    tableData2 : [
    ["Confirming Party Name", "Amount in INR"],
    [getClientUploadedBCLorNDC[0].clientName, ""]
    ],
    pdfContent1: `
    
    ${getClientUploadedBCLorNDC[0].vendorCode}
    ${getClientUploadedBCLorNDC[0].vendorName}
    ${getClientUploadedBCLorNDC[0].vendorFullAddress}
    
    Dear Sir/Madam`,
    pdfContent2 :    `
    
    With reference to the above subject, our books of account show a credit/debit balance in your account as per below as on ${cutOffDate}.
    `,
    pdfContent3 :`
    
    Please sign the confirmation slip below and attach if the balances match.
    
    If your books of account are not in full agreement with the above balance(s), please provide with the amount(s) shown in your books of account together with details of all differences, including balances on any accounts not listed above.
    
    In case you need any further assistance including statement of account to reconcile the differences if any please do write to us.
    
    We would be grateful if you would give this request your earliest attention.
    
    If we do not receive your confirmation within 15 days, we would treat the above balance is correct.
    
    Yours faithfully,
    For InfoAugust Private Limited
    
    
    ...................................
    (Name Designation and Signature of responsible person sending this letter)




    `,
    comfirmationSlip : `
    
Confirmation Slip`,
    pdfContent4 :`
    
    
    


We confirm that we are in agreement with the above-mentioned balance(s) in your favour at Cut of date ${cutOffDate}.
`,
    pdfContent6 :    `
    OR:
    
    We are not in agreement with the above-mentioned balance(s) of INR .................
    Balance as per our books of accounts is as below
    `,
    pdfContent5 :`
        
    Statement of Account attached for your kind reference.
    
    
    ........................................	                                              ........................................
    (Name and job title of Vendor official) 		                        (Name of the Vendor)
    
    ........................................	                                              ........................................
    (Signature)		                                                                                   (Date)
    
    Official Seal
    `
    };
            pdf = await createPdfBCLorNDC.createPDFBCL(dataToSend)
            }
            else
            {
                let balanceConfirmationDate = getClientUploadedBCLorNDC[0].postingDate;
                let cutOffDate = formatDate.format(balanceConfirmationDate, 'dd-MM-yyyy', { locale: enIN});
            dataToSend = {
                clientName: getClientUploadedBCLorNDC[0].clientName,
                clientLogoPath: getClientUploadedBCLorNDC[0].clientShortLogoPath,
                clientAddress: getClientUploadedBCLorNDC[0].clientFullAddress,
                amount: getClientUploadedBCLorNDC[0].amount,
                vendorName: getClientUploadedBCLorNDC[0].vendorName,
                cutOffDate: `Date : ${date}`,
                subject : `Sub: No Due Confirmation for the transactions / supplies / Services made up to ${cutOffDate}. For ${getClientUploadedBCLorNDC[0].vendorCode}.`,
pdfContent1: `


To 
Commercial Finance Department, 
InfoAugust Private Limited
No.20, 3rdFloor, 5thCross, 
1stMain, Garden Layout 
Bangalore-560112, Karnataka

Dear Sir/Madam
`,
pdfContent2 :    `


We hereby agree and confirm that there are no dues for the supplies made till ${cutOffDate} and undertake that we shall not, make any claim on you of whatsoever nature in respect of transactions up to ${cutOffDate}.


Yours faithfully, 
`,
comfirmation : `
For ${getClientUploadedBCLorNDC[0].vendorName}


Authorised Signatory 


(Seal & Stamp)
`
};


                 pdf = await createPdfBCLorNDC.createPDFNDC(dataToSend)
            }

            if (!pdf.result) {
                res.status(500)
                return res.json({
                    "status_code": 500,
                    "message": pdf.error,
                    "status_name": getCode.getStatus(500)
                });
            }
            else {
                res.status(200)
                return res.json({
                    "status_code": 200,
                    "message": "success",
                    "data": { "file": pdf.file, "fileName": fileName },
                    "status_name": getCode.getStatus(200)
                });
            }
        }
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "No Data Found",
            "status_name": getCode.getStatus(500),
            "error": e
        });
    }
})