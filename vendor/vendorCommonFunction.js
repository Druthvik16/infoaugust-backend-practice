const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs');
let vendorCommonFunction = {}
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let db = require('./dbQueryVendor')
const s3 = require('../awsS3BucketConfig/s3BucketConnection')


const s3BucketName = process.env.Bucket_Name;
const s3FolderName = process.env.currentFolder

vendorCommonFunction.validateName = (name) => {
    // const nameRegex = /^[A-Za-z]+((['_.-][A-Za-z])?[A-Za-z]*)*$/;
    const nameRegex = /^[A-Za-z]+([ _.-]?[A-Za-z])*$/;    
    return name && nameRegex.test(name);
};

vendorCommonFunction.validateEmail = (email) => {
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // console.log(email, emailRegex.test(email))
    return email && emailRegex.test(email);
};

vendorCommonFunction.isValidLandline = (landlineNo) => {
    const landlineRegex = /^[0-9]{3,15}$/;
    return landlineRegex.test(landlineNo);
}

vendorCommonFunction.isValidGSTIN = (gstin) => {
    const gstinRegex = /^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9a-zA-Z]{1})$/;
    // "^[0-9]{2}[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9A-Za-z]{1}[Z]{1}[0-9a-zA-Z]{1}$"
    return gstinRegex.test(gstin);
}

vendorCommonFunction.isValidPAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
}
  
vendorCommonFunction.validateRequestBody = async(body) => {
    const errors = [];
    const validBody = {}

    if (!body.bankAccountNumber || body.bankAccountNumber.length > 16) {
        errors.push({ field: 'Bank account number', message: 'Bank account number is required and max length is 16' });
    }
    else
    {
        validBody.bankAccountNumber = uniqueFunction.manageSpecialCharacter(body.bankAccountNumber?.toString()?.trim())
    }

    if (!body.branchName || !vendorCommonFunction.validateName(body.branchName)) {
        errors.push({ field: 'Branch Name', message: 'Branch Name is required' });
    }
    else
    {
        validBody.branchName = uniqueFunction.manageSpecialCharacter(body.branchName?.toString()?.trim())
    }

    if (body.name2 && (body.name2.length > 15 || !vendorCommonFunction.validateName(body.name2))) 
    {
        errors.push({ field: 'Name2', message: 'Name2 must be a valid format and max length is 15' });
    }
    else
    {
        if(body.name2)
            validBody.name2 = uniqueFunction.manageSpecialCharacter(body.name2?.trim())
        else
            validBody.name2 = null;
    }

    if (body.email2 && (body.email2.length > 45 || !vendorCommonFunction.validateEmail(body.email2))) {
        errors.push({ field: 'Email2', message: 'Email2 must be a valid email address with max length 45' });
    }
    else
    {
        if(body.email2)
            validBody.email2 = uniqueFunction.manageSpecialCharacter(body.email2?.trim());
        else
            validBody.email2 = null;
    }

    // && !vendorCommonFunction.isValidLandline(body.landlineNo)
    if (body.landlineNo && body.landlineNo?.trim()?.length == 0 ) {
        errors.push({ field: 'Landline No.', message: 'Landline No. must be in valid format' });
    }
    else 
    {
        if(body.landlineNo?.toString()?.length > 0)
            validBody.landlineNo = uniqueFunction.manageSpecialCharacter(body.landlineNo?.toString()?.trim());
        else
            validBody.landlineNo = null;
    }

    if (!body.gstin || (body.gstin.length > 15) || !vendorCommonFunction.isValidGSTIN(body.gstin)) {
        errors.push({ field: 'GSTIN', message: 'GSTIN is required and max length is 15' });
    }
    else
    {
        validBody.gstin = uniqueFunction.manageSpecialCharacter(body.gstin?.trim())
    }

    if (body?.cin && (body?.cin?.length > 21)) {
        errors.push({ field: 'cin', message: 'CIN max length is 21' });
    }
    else
    {
        validBody.cin = uniqueFunction.manageSpecialCharacter(body?.cin?.trim())
    }

    if (!body.pan || (body.pan.length > 15) || !vendorCommonFunction.isValidPAN(body.pan)) {
        errors.push({ field: 'Pan', message: 'Pan is required and max length is 10' });
    }
    else
    {
        validBody.pan = uniqueFunction.manageSpecialCharacter(body.pan?.trim());
    }

    if (!body.bankName || !body.bankName.id) {
        errors.push({ field: 'Bank Name', message: 'Bank Name is required' });
    }
    else
    {
        validBody.bankName = body.bankName
    }

    if (!body.bankAddress || body.bankAddress.length > 100) {
        errors.push({ field: 'Bank Address', message: 'Bank Address is required and max length is 100' });
    }
    else
    {
        validBody.bankAddress = uniqueFunction.manageSpecialCharacter(body.bankAddress?.trim())
    }

    if (!body.ifscCode || body.ifscCode.length > 12) {
        errors.push({ field: 'IFSC Code', message: 'IFSC Code is required and max length is 12' });
    }
    else
    {
        validBody.ifscCode = uniqueFunction.manageSpecialCharacter(body.ifscCode?.trim())
    }

    if (!body.address1 || body.address1.length > 200) {
        errors.push({ field: 'Address1', message: 'Address1 is required and max length is 200' });
    }
    else
    {
        validBody.address1 = uniqueFunction.manageSpecialCharacter(body.address1?.trim())
    }

    if (body.address2 && body.address2.length > 200) {
        errors.push({ field: 'Address2', message: 'Address2 is max length is 200' });
    }
    else
    {
        if(body.address2)
            validBody.address2 = uniqueFunction.manageSpecialCharacter(body.address2?.trim())
        else
            validBody.address2 = null;
    }

    if (!body.country || !body.country.id) {
        errors.push({ field: 'Country', message: 'Country is required' });
    }
    else
    {
        validBody.country = body.country
    }

    if (!body.state || !body.state.id) {
        errors.push({ field: 'State', message: 'State is required' });
    }
    else
    {
        validBody.state = body.state
    }

    if (!body.city || !body.city.id) {
        errors.push({ field: 'City', message: 'City is required' });
    }
    else
    {
        validBody.city = body.city
    }

    if (!body.postalCode || body.postalCode.toString().trim().length != 6) {
        errors.push({ field: 'Postal Code', message: 'Postal Code is required and must be a number with length 6' });
    }
    else
    {
        validBody.postalCode = uniqueFunction.manageSpecialCharacter(body.postalCode?.toString()?.trim())
    }
    return {errors, validBody};
}

vendorCommonFunction.validateVendorInfo = async(body) => {
    const errors = [];

    if (!body.bankAccountNumber) {
        errors.push({ field: 'Bank account number', message: 'Bank account number is required'});
    }

    if (!body.branchName) {
        errors.push({ field: 'Branch Name', message: 'Branch Name is required' });
    }

    if (!body.gstin) {
        errors.push({ field: 'GSTIN', message: 'GSTIN is required' });
    }

    if (!body.pan) {
        errors.push({ field: 'Pan', message: 'Pan is required' });
    }

    if (!body.bankId) {
        errors.push({ field: 'Bank Name', message: 'Bank Name is required' });
    }

    if (!body.bankAddress) {
        errors.push({ field: 'Bank Address', message: 'Bank Address is required' });
    }

    if (!body.ifscCode) {
        errors.push({ field: 'IFSC Code', message: 'IFSC Code is required and max length is 12' });
    }

    if (!body.address1) {
        errors.push({ field: 'Address1', message: 'Address1 is required and max length is 200' });
    }

    if (!body.countryId) {
        errors.push({ field: 'Country', message: 'Country is required' });
    }

    if (!body.stateId) {
        errors.push({ field: 'State', message: 'State is required' });
    }

    if (!body.cityId) {
        errors.push({ field: 'City', message: 'City is required' });
    }

    if (!body.postalCode) {
        errors.push({ field: 'Postal Code', message: 'Postal Code is required' });
    }

    if(body.isSubmitted != 1 && body.isSubmitted != 2)
    {
        errors.push({ field: 'isSubmitted', message: 'Complete registration process, document upload is pending' });        
    }

    return {errors};
}

vendorCommonFunction.uniqueCheckEmail = async (email, partnerAdditionalInfoId) =>
{
    try
    {
        let id = 0;
        let uniqueCheckEmailInClient = await uniqueFunction.unquieName('client', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInClient != 0)
            return { error : `Email address ${email} already exist in client  `, result : false};

        let uniqueCheckEmailInAddOnUser = await uniqueFunction.unquieName('additional_login_user', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInAddOnUser != 0)
            return { error : `Email address ${email} already exist in additional user    `, result : false};
        
        let uniqueCheckMobileInAddOnUser = await uniqueFunction.unquieName('additional_login_user', ['mobile'],{  "mobile" : mobile }, id, 0)
        if(uniqueCheckMobileInAddOnUser != 0)
            return { error : `Mobile ${mobile} already exist in additional user    `, result : false};

        let uniqueCheckEmailInStaff = await uniqueFunction.unquieName('staff', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInStaff != 0)
            return { error : `Email address ${email} already exist in staff    `, result : false};

        let uniqueCheckEmailInPartner = await uniqueFunction.unquieName('partner', ['email'],{ "email" : email }, id, 0)
        if(uniqueCheckEmailInPartner != 0)
            return { error : `Email address ${email} already exist in partner `, result : false};


        let uniqueCheckEmailInVendor1 = await uniqueFunction.unquieName('partner_additional_info', ['email2'],{ "email2" : email}, partnerAdditionalInfoId, 0)
        if(uniqueCheckEmailInVendor1 != 0)
            return { error : `Email address ${email} already exist in vendor`, result : false};

        return { result : true};
    }
    catch (e)
    {
        return { error : e?.stack || e.message || e, result : false};
    }
}

vendorCommonFunction.uniqueCheckBankAccountNo = async(bankAccountNumber, partnerAdditionalInfoId) =>
{
    try
    {
        let uniqueCheckBankAccountNumberInVendor = await uniqueFunction.unquieName('partner_additional_info', ['bank_account_number'],{ "bank_account_number" : bankAccountNumber}, partnerAdditionalInfoId, 0)
        if(uniqueCheckBankAccountNumberInVendor != 0)
            return { error : `Bank account number  ${bankAccountNumber} already exist in vendor`, result : false}

        return { result : true};
    }
    catch (e)
    {
        return { error : e?.stack || e.message || e, result : false};
    }
}

vendorCommonFunction.uniqueCheckGstNo = async(gstin, partnerAdditionalInfoId) =>
{
    try
    {
        let uniqueCheckBankAccountNumberInVendor = await uniqueFunction.unquieName('partner_additional_info', ['gstin'],{ "gstin" : gstin}, partnerAdditionalInfoId, 0)
        if(uniqueCheckBankAccountNumberInVendor != 0)
            return { error : `GST number  ${gstin} already exist in vendor`, result : false}

        return { result : true};
    }
    catch (e)
    {
        return { error : e?.stack || e.message || e, result : false};
    }
}

vendorCommonFunction.uniqueCheckCINNo = async(cin, partnerAdditionalInfoId) =>
{
    try
    {
        let uniqueCheckCINInVendor = await uniqueFunction.unquieName('partner_additional_info', ['cin'],{ "cin" : cin}, partnerAdditionalInfoId, 0)
        if(uniqueCheckCINInVendor != 0)
            return { error : `CIN number  ${cin} already exist in vendor`, result : false}

        return { result : true};
    }
    catch (e)
    {
        return { error : e?.stack || e.message || e, result : false};
    }
}

vendorCommonFunction.uniqueCheckPan = async(pan, partnerId)=>
{
    try
    {
        let uniqueCheckBankAccountNumberInVendor = await uniqueFunction.unquieName('partner', ['pan'],{ "pan" : pan}, partnerId, 0)
        if(uniqueCheckBankAccountNumberInVendor != 0)
            return { error : `Pan number  ${pan} already exist in vendor/partner`, result : false}

        return { result : true};
    }
    catch (e)
    {
        return { error : e?.stack || e.message || e, result : false};
    }
}

vendorCommonFunction.createPdfFormWithDummyValues = async (data, attachments, clientData, clientLogoPath) => {
    return new Promise(async (resolve, reject) => {
        try 
        {
            // .toISOString().slice(0, 10).replace('T', ' ')
            let fileName =  data.name + '_' + new Date().toISOString().slice(0, 19).replace('T', '_') + '.pdf'
            let outputFileName = './' + fileName
            const footerY = 30;
            const footerText = `${data.clientName}`;
            const footerText1 = `${data.clientFullAddress}`;
            let footerBoxHeight = 10;
            const pdfDoc = await PDFDocument.create();
            let page = pdfDoc.addPage([600, 850]);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const imageBytes = fs.readFileSync(data.clientShortLogoPath);
            let logoPath = data.clientShortLogoPath
            let image = ''
            if(['.png'].some(ext => data.clientShortLogoPath.endsWith(ext)))
            {
                image = await pdfDoc.embedPng(imageBytes);
            }
            else  if(['.jpg', '.jpeg'].some(ext => data.clientShortLogoPath.endsWith(ext)))
            {
                image = await pdfDoc.embedJpg(imageBytes);
            } 
            else 
            {
                return resolve({ result: false, error: 'Client logo type error' });  
            }
            const { width: imageWidth, height: imageHeight } = image.scale(0.2);

            // delete unreuired fields from data
            
                delete data.clientName
                delete data.clientFullAddress
                delete data.clientShortLogoPath

            const footerX = page.getSize().width - 100 - footerText.length
            const headerY = page.getSize().height - 40;
            const headerX = page.getSize().width - 100 - imageWidth;


            const x = 50; // X coordinate for all fields
            let y = 800 - imageHeight - 10; // Starting Y coordinate
            const lineHeight = 30; // Line height for fields
            const rectWidth = 380; // Width of the input box

            
            headerResponse = await setHeader(page, imageWidth, imageHeight, headerY, image, headerX);
            if(!headerResponse.result)
            { 
                return resolve({ result: false, error: headerResponse.error });         
            }
            page = headerResponse.page
            let footerResponse = await setFooter(page,footerText, 160, lineHeight, footerX, footerY, font, footerText1)
        
            if(!footerResponse.response.result)
            {
                return { response : { result : false, error: footerResponse.response.error}, page, x, y };                  
            }

            page = footerResponse.page
            footerBoxHeight = footerResponse.footerBoxHeight

           

            for (const field in data) {
                // Check if there's enough space on the current page
                if (y - (footerBoxHeight + 10) < 50) {
                    // Add a new page if current page is full
                    page = pdfDoc.addPage([600, 850]);
                    y = 800  - imageHeight - 10; // Reset Y coordinate for the new page

                    headerResponse = await setHeader(page, imageWidth, imageHeight, headerY, image, headerX)
                    if(!headerResponse.result)
                    {     
                        return resolve({ result: false, error: headerResponse.error });  
                    }
                    page = headerResponse.page
                    const footerResponse = await setFooter(page,footerText, 160, lineHeight, footerX, footerY, font, footerText1)
        
                    if(!footerResponse.response.result)
                    {
                        return { response : { result : false, error: footerResponse.response.error}, page, x, y };                  
                    }
                    page = footerResponse.page
                }

                // Draw the field name
                page.drawText(vendorCommonFunction.camelCaseToTitleCase(field), { x, y, size: 12, font, color: rgb(0, 0, 0) });

                // Wrap the text for the field value
                const text = data[field] ? data[field].toString() : '';
                const wrappedLines = wrapText(text, font, 12, rectWidth - 10); // Subtract padding from width

                // Calculate the height of the input box based on the number of wrapped lines
                const inputBoxHeight = 20 + (lineHeight * (wrappedLines.length - 1));

                // Draw the input box for the field value
                page.drawRectangle({
                    x: x + 160, y: y - 5 - (inputBoxHeight - 20), width: rectWidth, height: inputBoxHeight,
                    borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1
                });

                // Draw the wrapped value inside the input box
                wrappedLines.forEach((line, index) => {
                    page.drawText(line, {
                        x: x + 165,
                        y: y - (lineHeight * index),
                        size: 12,
                        font,
                        color: rgb(0, 0, 0),
                    });
                });

                y -= lineHeight * wrappedLines.length; // Move to the next line
            }
            let attachmentPages = await addAttachmentIntoPdf(attachments, 0, attachments.length, page, x, y, PDFDocument, pdfDoc, lineHeight, footerText, footerY, font, imageBytes, headerX, footerX, headerY, footerText1, logoPath);

            if(!attachmentPages.result)
            {
                return resolve({ result: false, error: attachmentPages?.error });
            }

            // Serialize the PDFDocument to bytes
            const pdfBytes = await pdfDoc.save();

            // Write the PDF to a file
            // fs.writeFileSync(outputFileName, pdfBytes);
            const base64String = Buffer.from(pdfBytes).toString('base64');

            // Create a Base64 downloadable URL
            const base64URL = `data:application/pdf;base64,${base64String}`;
            
            console.log('PDF form with dummy values created successfully!'); 
            const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Download PDF</title>
            </head>
            <body>
                <a id="downloadLink" download='${outputFileName}'>Download PDF</a>
                <script>
                    const base64URL = '${base64URL}';
                    document.getElementById('downloadLink').href = base64URL;
                </script>
            </body>
            </html>
            `;
        
            // fs.writeFileSync('./index.html', htmlContent);

            return resolve({ result: true, file: base64URL, 'fileName': fileName, 'fileBytes':pdfBytes});

        } catch (err) {
            console.log(err);
            return resolve({ result: false, error: err?.stack });
        }
    });
};


vendorCommonFunction.getFilePath = (destinationBaseFolder, fileName, addiFolder, action, isDeleteFolder = 0) =>
{
    return new Promise((resolve, reject)=>{
        try{
            let newpath = destinationBaseFolder
            // if(addiFolder != '')
            // {
            //     let folders = addiFolder.split('/')
            //     let i = 0
            //     for(; i < folders.length; i++)
            //     {
            //         try 
            //         {
            //             let generatedFilePath = ''
            //             if(action.length == 0)
            //             {
            //                 generatedFilePath = newpath + '/' + folders[i] + '/' + fileName
            //             }
            //             else
            //             {
            //                 generatedFilePath = newpath + '/' + folders[i] + '/' + action + '/' + fileName
            //             }
            //         } 
            //         catch (err) 
            //         {
            //             console.error(err);
            //         }
            //     }

                
            //     return resolve(generatedFilePath)
            // }

            if(addiFolder != '')
            {
                let folders = addiFolder?.split('/')
                let i = 0
                for(; i < folders?.length; i++)
                {
                    try 
                    {
                        let generatedFilePath = ''
                        if(action.length == 0)
                        {
                            generatedFilePath = newpath + '/' + folders[i] + '/' + fileName
                        }
                        else
                        {
                            generatedFilePath = newpath + '/' + folders[i] + '/' + action + '/' + fileName
                        }
                        if (fs.existsSync(generatedFilePath)) 
                        {                            
                            newpath = generatedFilePath
                            // return resolve(generatedFilePath)
                        }
                        else
                        {
                            newpath = newpath + '/' + folders[i]
                            // return resolve(newpath)
                        }                        
                    } 
                    catch (err) 
                    {
                        console.error(err);
                    }
                }
                return resolve(newpath)
            }
            else
            {
                return resolve(newpath + '/' + fileName)
            }
        }
        catch(e)
        { 
            console.log(e)
        }
    });
}

vendorCommonFunction.camelCaseToTitleCase = (input) =>
{
    if(input)
    {
        let words = input.split(/(?=[A-Z])/);
        let titleCase = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return titleCase;
    }
    else
    {   
        return ''
    }
}

async function addAttachmentIntoPdf(attachments, start, end, page, x, y, PDFDocument, pdfDoc, lineHeight, footerText, footerY, font, imageBytes, headerX, footerX, headerY, footerText1, logoPath) 
{
    try
    {
        console.log("called", start)
        if (start < end)
        {
            let attachment = attachments[start];
            console.log("attachment", attachment)
            // const headerImage = await pdfDoc.embedPng(imageBytes);
            let headerImage = ''
           
            if(['.png'].some(ext => logoPath.endsWith(ext)))
            {
                headerImage = await pdfDoc.embedPng(imageBytes);
            }
            else  if(['.jpg', '.jpeg'].some(ext => logoPath.endsWith(ext)))
            {
                headerImage = await pdfDoc.embedJpg(imageBytes);
            } 
            else 
            {
                throw 'Client logo type error'
            }
            const { width: imageWidth, height: imageHeight } = headerImage.scale(0.2);

            if(attachment?.filepath?.length > 0)
            {    
                if (attachment.filepath.endsWith('.pdf')) 
                {
                    ({ response, page, x, y } = await addPdfAttachment(attachment, page, x, y, PDFDocument, pdfDoc, lineHeight, footerText, footerY, font, headerImage, imageWidth, imageHeight, headerX, footerX, headerY, footerText1,logoPath));
                    if(!response.result)
                    {
                        throw response.error
                    }
                } 
                else if (['.png', '.jpg', '.jpeg'].some(ext => attachment.filepath.endsWith(ext))) 
                {
                    ({ response, page, x, y } = await addImageAttachment(attachment, page, x, y, PDFDocument, pdfDoc, lineHeight, footerText, footerY, font, headerImage, imageWidth, imageHeight, headerX, footerX, headerY,footerText1, logoPath));
                    if(!response.result)
                    {
                        throw response.error
                    }
                }

            }
            
            start++;
            return addAttachmentIntoPdf(attachments, start, end, page, x, y, PDFDocument, pdfDoc, lineHeight, footerText, footerY, font, imageBytes, headerX, footerX, headerY, footerText1, logoPath);
        }
        else
        {
            console.log("response", start)
            return { result: true, page, x, y, PDFDocument, pdfDoc, lineHeight, footerText, footerY, footerText1 };
        }
    }
    catch (e)
    {
        console.log(e)
        return { result: false, error: e?.stack || e?.message || e };
    }
}

async function addPdfAttachment(attachment, page, x, y, PDFDocument, pdfDoc, lineHeight, footerText, footerY, font, headerImage, imageWidth, imageHeight, headerX, footerX, headerY, footerText1,logoPath) {
    try 
    {
        console.log("x", x, y, font)
        page = pdfDoc.addPage([600, 850]);
        y = 800 - imageHeight - 10;
        // const dummyPdfBytes = fs.readFileSync(attachment.filepath);

        let attachFiles = await uniqueFunction.getVendorModuleFile(attachment.filepath, attachment.fileName, attachment.userType, attachment.vendorId, attachment.apiName, attachment.clientUuid, attachment.encryptionKey, attachment.encryptionIV);
        console.log("After await : ",attachFiles);
        // attachFiles = attachFiles?.file
        if(!attachFiles?.result)
        {
            return { response : { result : false, error: attachFiles.error}, page, x, y };    
        }
        const dummyPdfBytes = attachFiles?.file;

        const embeddedPdfDoc = await PDFDocument.load(dummyPdfBytes);
        const numberOfPages = embeddedPdfDoc.getPageCount();
        
        const [americanFlag] = await pdfDoc.embedPdf(dummyPdfBytes)
        
        const americanFlagDims = americanFlag.scale(0.95)

        let headerResponse = await setHeader(page, imageWidth, imageHeight, headerY - 10, headerImage, headerX);
        if(!headerResponse.result)
        {
            return { response : { result : false, error: headerResponse.error}, page, x, y };                  
        }
        page = headerResponse.page
        let footerResponse = await setFooter(page, footerText, 160, lineHeight, footerX, footerY, font, footerText1);
        
        if(!footerResponse.response.result)
        {
            return { response : { result : false, error: footerResponse.response.error}, page, x, y };                  
        }
        page = footerResponse.page;
        let footerBoxHeight = footerResponse.footerBoxHeight;

        // console.log("pageCount", attachment.attachmentName,americanFlag['pageCount'], americanFlag.doc.pageCount, numberOfPages)

        // page.drawPage(americanFlag, {
        //     ...americanFlagDims,
        //     x: x-50,
        //     y: 40,
        // })
    
        // if (y - footerBoxHeight + 10 < 50) {
        //     // Finish current page
        //     // Add a new page to main document
        //     page = pdfDoc.addPage([600, 850]);
        //     y = 800 - imageHeight; // Adjust starting y for new page
        //     page = await setHeader(page, imageWidth, imageHeight, headerY, headerImage, headerX);
        //     footerResponse = await setFooter(page, footerText, 160, lineHeight, footerX, footerY, font);
        //     page = footerResponse.page;
        // }

        // const x = 3;
         x = 3;
        let currentY = 102;

        // Iterate through each page of the embedded PDF
        for (let pageNumber = 0; pageNumber < numberOfPages; pageNumber++) {
            const [embeddedPage] = await pdfDoc.embedPages([embeddedPdfDoc.getPage(pageNumber)]);
            const embeddedPageDims = embeddedPage.scale(0.90);

            console.log(pageNumber < numberOfPages - 1, pageNumber , numberOfPages)

            let dim = {width: embeddedPageDims.width, height: embeddedPageDims.height - footerY - lineHeight - 10}
            
                // ...embeddedPageDims,
            page.drawPage(embeddedPage, {
                x: x,
                y: currentY,
                ...dim
            });

            // If there are more pages to draw, add a new page to the main PDF document
            if (pageNumber < numberOfPages - 1) {
                page = pdfDoc.addPage([600, 850]);

                // Update header and footer for the new page if needed
                headerResponse = await setHeader(page, imageWidth, imageHeight, headerY - 10, headerImage, headerX);
                if(!headerResponse.result)
                {
                    return { response : { result : false, error: headerResponse.error}, page, x, y };                 
                }
                page = headerResponse.page
                footerResponse = await setFooter(page, footerText, 160, lineHeight, footerX, footerY, font, footerText1);        
                if(!footerResponse.response.result)
                {
                    return { response : { result : false, error: footerResponse.response.error}, page, x, y };                  
                }
                page = footerResponse.page;
                footerBoxHeight = footerResponse.footerBoxHeight;

                // Reset the position for the new page
                currentY = 102;
            }
        }

        return { response : { result : true}, page, x, y };

    } 
    catch (e) 
    {
        console.log(e);
        return { response : { result : false, error: e?.stack}, page, x, y };
    }
}

async function addImageAttachment(attachment, page, x, y, PDFDocument, pdfDoc, lineHeight, footerText, footerY, font, headerImage, imageWidth, imageHeight, headerX, footerX, headerY, footerText1, logoPath) 
{
    try
    {
        const attachFiles = await uniqueFunction.getVendorModuleFile(attachment.filepath, attachment.fileName, attachment.userType, attachment.vendorId, attachment.apiName, attachment.clientUuid, attachment.encryptionKey, attachment.encryptionIV);
        if(!attachFiles?.result)
        {
            return { response : { result : false, error: attachFiles.error}, page, x, y };    
        }
        const imageBytes = attachFiles?.file;
        // const imageBytes = fs.readFileSync(attachment.filepath);
        let image = ''
        let dd = ['.png','.jpg','.jpeg']
        dd.some(ext => { 
            console.log(ext, attachment.filepath.endsWith(ext), attachment.filepath)
           return attachment.filepath.endsWith(ext)

        })
        if(['.png'].some(ext => attachment.filepath.endsWith(ext)))
        {
            image = await pdfDoc.embedPng(imageBytes);
        }
        else  if(['.jpg', '.jpeg'].some(ext => attachment.filepath.endsWith(ext)))
        {
            image = await pdfDoc.embedJpg(imageBytes);
        } 
        else 
        {  
            return { response : { result : false, error: 'Attached image file type not supported'}, page, x, y };
        }
        let { width: imgWidth, height: imgHeight } = image;
        page = pdfDoc.addPage([600, 850]);
    
        y = 800 - imageHeight;
    
        headerResponse = await setHeader(page, imageWidth, imageHeight, headerY, headerImage, headerX);
        if(!headerResponse.result)
        {
            return { response : { result : false, error: headerResponse.error}, page, x, y };                  
        }
        page = headerResponse.page
        let footerResponse = await setFooter(page,footerText, 160, lineHeight, footerX, footerY, font, footerText1)
        
        if(!footerResponse.response.result)
        {
            return { response : { result : false, error: footerResponse.response.error}, page, x, y };                  
        }
        console.log(x)
        page = footerResponse.page
        let footerBoxHeight = footerResponse.footerBoxHeight   
    
        // Get the dimensions of the PDF page
        const pageWidth = page.getSize().width;
        const pageHeight = page.getSize().height;
    
        // Scale the image to fit within the PDF page if it is too large
        const scale = Math.min((pageWidth - 2 * x) / imgWidth, (pageHeight - 2 * lineHeight) / imgHeight, 0.5);
        imgWidth *= scale;
        imgHeight *= scale;
    
        // Check if there's enough space for the image on the current page
        if (y - imgHeight < 50) 
        {
            page = pdfDoc.addPage([600, 850]);
            y = 800 - imageHeight;
        }
    
        page.drawImage(image, 
        {
            x : x+10, y: y - imageHeight - imgHeight, width: imgWidth - 20, height: imgHeight,
        });
    
        y -= (imgHeight + lineHeight);
        return { response : { result : true}, page, x, y };
    }
    catch (e)
    {
        console.log(e)
        return { response : { result : false, error: e?.stack}, page, x, y };
    }
}

async function setHeader(page, imageWidth, imageHeight, headerY, image, headerX)
{
    try
    {
        page.drawImage(image, {
            x: headerX, y: headerY - 5,
            width: imageWidth-30, height: imageHeight-30,
        });
        return { result : true, page :page};
    }
    catch (e)
    {
        return { result : true, error :e?.stack};
    }
}

async function setFooter(page,footerText, footerBoxWidth, lineHeight, footerX, footerY, font, footerText1)
{
    try
    {
        footerText = footerText + ','
        footerX = footerX - 45
        const wrappedLines = wrapText(footerText, font, 12, footerBoxWidth-5); // Subtract padding from width
        const wrappedLines1 = wrapText(footerText1, font, 12, footerBoxWidth-5);
        const footerLineHeight = lineHeight - 10
        // Calculate the height of the input box based on the number of wrapped lines
        const inputBoxHeight = 15 + (footerLineHeight * ((wrappedLines.length + wrappedLines1.length) - 1));
         // Draw the input box for the field value
         let footerBoxYStart = footerY - (inputBoxHeight - 70)
         
        // console.log(footerBoxYStart, footerY, inputBoxHeight, ((wrappedLines.length + wrappedLines1.length) + 1) * 10)
         let footerTextYStart = footerY + 50
        page.drawRectangle({
            x: footerX, y: footerBoxYStart, width: footerBoxWidth - 15, height: inputBoxHeight,
            borderColor: rgb(1, 1, 1), borderWidth: 1
        });
    
        // Draw the wrapped value inside the input box for client name
        wrappedLines.forEach((line, index) => {
        // console.log(line, inputBoxHeight, footerLineHeight, index, footerY - (footerLineHeight * index))
    
            page.drawText(line, {
                x: footerX + 5,
                y: footerTextYStart + 10 - ((footerLineHeight) * index),
                size: 12,
                font,
                color: rgb(0, 0, 0),
            });
        });
    
        // Draw the wrapped value inside the input box for client address
        let footerTextYStart1 = footerTextYStart - wrappedLines.length - 20
        wrappedLines1.forEach((line, index) => {
        // console.log(line, inputBoxHeight, footerLineHeight, index, footerY - (footerLineHeight * index))
    
            page.drawText(line, {
                x: footerX + 5,
                y: footerTextYStart1 + 10 - ((footerLineHeight) * index),
                size: 12,
                font,
                color: rgb(0.4, 0.4, 0.4),
            });
        });
    
        return {response: {result:true}, page: page, footerBoxHeight: inputBoxHeight};
    }
    catch (e)
    {
        return {response:{ result : true, error :e?.stack}};
    }    
}

function wrapText(text, font, fontSize, maxWidth) {
    const lines = [];
    let line = '';
    let words = text.split(' ');

    words.forEach(word => {
        const testLine = line + word + ' ';
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth && line !== '') {
            lines.push(line.trim());
            line = word + ' ';
        } else {
            line = testLine;
        }
    });

    lines.push(line.trim());
    return lines;
}


vendorCommonFunction.uploadFileToS3Bucket = (file, fileFormat, fileName, encriptionKey, encriptionIV, s3DocumentFolderNewPath, apiName, vendorUuid, filePath, fileSize) =>
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {   
            let encryptedData = await uniqueFunction.encryptFileBuffer(file, fileName,encriptionKey, encriptionIV, fileFormat)
            if(encryptedData?.result)
            {
                let uploadFileToS3Bucket = await vendorCommonFunction.uploadFiles(encryptedData?.file, fileName, vendorUuid, s3DocumentFolderNewPath)

                if(uploadFileToS3Bucket && uploadFileToS3Bucket?.result)
                {
       
                    let saveDataTransactLog = await db.saveDataTransactLog('UP', 'SU', '', '', fileSize, apiName, 'S3', new Date(), vendorUuid, fileName)
    
                    //log
                    // let sql = `UPDATE partner_onboarding_log SET status = 'Processed',  
                    // completed_on = ?, processed_file_path = '${uploadFileToS3Bucket?.s3FilePath}' 
                    // WHERE UPPER(file_name) = '${fileObject.partnerFile.originalFilename?.toUpperCase()}'`
                    // let updateLog = await db.updatePartnerLogMaster(sql, [new Date()])
                    
                    return resolve({result: true, path: uploadFileToS3Bucket?.s3FilePath, encryptedData:encryptedData});

                }
                else
                {                    
                    return resolve({result: false, error: 'Failed document timeline updation to s3 bucket' });
                }
            }
            else
            {
                uniqueFunction.removeFileFromDirectory(filePath)
                return resolve({result: false, error: 'File not uploaded ' + encryptedData });
            }
        }
        catch (err)
        {
            console.log(err);
            return resolve({result: false, error: err?.stack || err?.message || err?.toString()});
        }
    })
}

vendorCommonFunction.uploadFiles = (fileBuffer, fileName, vendorUuid, inputFolder) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            console.log("File upload to s3 bucket started : ", fileName)
            var base64data = new Buffer.from(fileBuffer);
            let s3FilePath = s3FolderName + vendorUuid + "/" + inputFolder + "/" + fileName
            s3.putObject(
            {
                'Bucket': s3BucketName,
                'Key': s3FilePath,
                'Body': base64data
            }, (error,data1) => 
            {
                if(error)
                {
                    console.log(error)
                    return resolve(false)
                }
                else
                {
                    return resolve({"result" : true, "s3FilePath" : s3FilePath})
                }
            })
        }
        catch(e)
        {
            console.log(e)
            return resolve(false)
        }
    })
}

vendorCommonFunction.documentTimelineUploadToLocal = (fileBytes, destinationBaseFolder, addiFolder, fileName) =>
{
    return new Promise((resolve, reject)=>{
        try{
            let addiFolderCreated = 1
            let newpath = destinationBaseFolder
            if(addiFolder != '')
            {
                let folders = addiFolder.split('/')
                let i = 0
                for(; i < folders.length; i++)
                {
                    try 
                    {
                        if (!fs.existsSync(newpath + '/' + folders[i])) 
                        {
                            fs.mkdirSync(newpath + '/' + folders[i]);
                            newpath = newpath + '/' + folders[i]
                        }
                        else
                        {
                            newpath = newpath + '/' + folders[i]
                        }
                    } 
                    catch (e) 
                    {
                        console.error(e);
                        return resolve({result : false, error: e?.stack || e?.message || e})
                    }
                }
                if(parseInt(i) != folders.length)
                {
                    for( ; i < folders.length; i++)
                    {
                        try 
                        {
                            if (!fs.existsSync(folders[i])) 
                            {
                                fs.rmdirSync(folders[i]);
                            }
                        } 
                        catch (e) 
                        {
                            console.error(e);
                            return resolve({result : false, error: e?.stack || e?.message || e})
                        }
                    }
                    addiFolderCreated = 0
                }
            }
            if(addiFolderCreated == 1)
            {
                try
                {
                    newpath = newpath + '/' + fileName
                    // newpath = newpath + '/' + 'tempFile.pdf'
                    fs.writeFileSync(newpath, fileBytes)
                    return resolve({result : true, filePath : newpath})
                }
                catch(e)
                {
                    console.log(e)
                    return resolve({result : false, error: e?.stack || e?.message || e})
                }
            }
        }
        catch(e)
        { 
            console.log(e)
            return resolve({result : false, error: e?.stack || e?.message || e})
        }
    });
}




module.exports = vendorCommonFunction







