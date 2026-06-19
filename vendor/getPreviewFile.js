let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let vendorCommonFunction = require('./vendorCommonFunction')
let createPdf = require('./vendorRegistrationPdfMaker')
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let userId = req.body.userId
        let getVendorRegistrationForm = await db.getVendorRegistrationForm(userId)
        if(getVendorRegistrationForm?.length == 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Fill vendor registration form",
                "status_name" : getCode.getStatus(500)
            });
        }
        let partnerUuid = getVendorRegistrationForm[0].uuid
        let getVendorDocuments = await db.getVendorUploadDocuments(userId);
        console.log("     ******************        ",getVendorDocuments, "   ****************")
        if(getVendorDocuments.length == 0) 
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Upload vendor document",
                "status_name" : getCode.getStatus(500)
            });            
        }
        // let response = await getAttachmentList(getVendorDocuments, 0, getVendorDocuments.length, [], partnerUuid)
        // console.log(response)
        // if(!response.results)
        // {
        //     res.status(500)
        //     return res.json({
        //         "status_code" : 500,
        //         "message"     : response.error,
        //         "status_name" : getCode.getStatus(500)
        //     });
        // }
        let attachmentList = getVendorDocuments.map(data => ({
            id: data.id,
            filepath: data.filePath,
            attachmentName: data.clientVendorAttachmentName,
            encryptionKey : data.encryptionKey,
            encryptionIV : data.encryptionIV,
            fileName : data.fileName,
            apiName : req.baseUrl,
            clientId : data.clientId,
            clientUuid : data?.filePath?.split('/')[2],
            userType : 'SU'
        }));
        // let attachmentList = response.attachmentList
        let dataToPass = getVendorRegistrationForm[0]
        dataToPass['temporaryCode'] = dataToPass.tempId
        // delete dataToPass.uuid
        // delete dataToPass.bankId
        // delete dataToPass.countryId
        // delete dataToPass.stateId
        // delete dataToPass.cityId
        // delete dataToPass.isSubmitted
        // delete dataToPass.isFormValidated
        // delete dataToPass.formMode
        // delete dataToPass.tempId
        // delete dataToPass.vendorStatusName
        // delete dataToPass.vendorStatusId
        let dataForPdf = setTempData(dataToPass, attachmentList)
        let pdf = await createPdf.generatePDF(dataForPdf)
        console.log(pdf)
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
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
})

async function getAttachmentList(documents, start, end, attachmentList, partnerUuid)
{
    try
    {
        if(start < end)
        {
            let doc = documents[start];

            if(doc.fileName)
            {
                let filepath = await vendorCommonFunction.getFilePath(getPath.getName('vendor'), doc.fileName, partnerUuid + '/' + getPath.getName('vendor/uploadDocuments'), '' )
    
                attachmentList.push({id : doc.id, filepath : filepath, attachmentName : doc.clientVendorAttachmentName, fileName : doc.fileName})
            }
            start++
            return getAttachmentList(documents, start, end, attachmentList, partnerUuid)
        }
        else
        {
            return {results: true, "attachmentList": attachmentList}
        }
    }
    catch (e)
    {
        console.log(e)
        return {results: false, error: e?.stack || e?.message || e}
    }
}

function setTempData(data, attachments)
{
    let tempAttachs = []
    attachments.forEach(attach => {
        tempAttachs.push({attachmentName : attach.attachmentName || "", fileName : attach.fileName || ''})
    })
    return {
            name : data.name,
            clientName: data.clientName,
            clientAddress: data.clientFullAddress,
            clientPAN: data.clientPan,
            registrationNumber: data.tempId,
            clientShortLogoPath : data.clientShortLogoPath,
            addressDetails: {
              name: data.name,
              name2: data.name2 || '',
              address1: data.address1,
              address2: data.address2 || '',
              pinCode: data.postalCode,
              city: data.cityName,
              country: data.countryName,
              state: data.stateName,
            },
            contactDetails: {
              mobile: data.mobile,
              landline: data.landlineNo || '',
              email: data.email,
              email2: data.email2 || '',
            },
            taxationDetails: {
              gstin: data.gstin,
              pan: data.pan,
              cin: data.cin || '',
            },
            bankDetails: {
              bankName: data.bankName,
              branchName: data.branchName,
              accountNumber: data.bankAccountNumber,
              ifscCode: data.ifscCode,
              bankAddress: data.bankAddress,
            },
            documentsRequired:tempAttachs,
            declaration: `We hereby confirm and acknowledge that (i) bank details and other information provided by me to ${data.clientName} having its address at ${data.clientFullAddress} (hereinafter “${data.clientName}”) are true and correct and grant my consent to utilise the same for processing of payment or for any other lawful purposes in relation to my dealing with ${data.clientName}(ii) I further authorise ${data.clientName}to share Information with such other agency as may be necessary for processing of payments and for any other lawful purposes. I understand that in case I require details related to such agency I may write to ${data.clientName} and request for such information (iii) I understand that I have provided Information voluntarily and have option to review modify information or withdraw my consent any time by writing to ${data.clientName}(iv) I confirm that I am competent and duly authorised to provide this declaration.`
    }

}