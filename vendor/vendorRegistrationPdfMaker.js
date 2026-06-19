const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs');
let createPdf = {}
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let db = require('./dbQueryVendor')
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const { start } = require('repl');


const s3BucketName = process.env.Bucket_Name;
const s3FolderName = process.env.currentFolder

//////////////////////////////////////////

createPdf.generatePDF = async (data) => 
{
    return new Promise(async(resolve, reject) => 
    {
        try
        {
            let fileName =  data.name + '_' + new Date().toISOString().slice(0, 19).replace('T', '_') + '.pdf'
            let outputFileName = './' + fileName
            const imageBytes = fs.readFileSync(data.clientShortLogoPath);
            let logoPath = data.clientShortLogoPath
            const pdfDoc = await PDFDocument.create();
            let page = pdfDoc.addPage([595, 842]); // A4 size
            let image = ''
            if(['.png'].some(ext => logoPath.endsWith(ext)))
            {
                image = await pdfDoc.embedPng(imageBytes);
            }
            else  if(['.jpg', '.jpeg'].some(ext => logoPath.endsWith(ext)))
            {
                image = await pdfDoc.embedJpg(imageBytes);
            } 
            else 
            {
                return resolve({ result: false, error: 'Client logo type error' });  
            }
            const { width: imageWidth, height: imageHeight } = image.scale(0.3);
          
            const fontSize = 10;
            const margin = 40;
            const lineHeight = 12;
            let yPosition = 800;
            let halfPosition = 200;
            let totalWidth = 515;
            let totalheight = 150;
            let leftWidth = 200;
          
            const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
          
            const drawText = (text, x, y, options = {}, font = timesRomanFont) => {
              page.drawText(text, {
                x,
                y,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
                ...options
              });
            };
          
            const drawBorder = (x, y, width, height, color = rgb(1,1,1)) => {
              page.drawRectangle({
                x,
                y,
                width,
                height,
                borderColor: rgb(0.6, 0.6, 0.6),
                borderWidth: 1,
                color : color
              });
            };


            let clientAddressLabel = "Client Address:  "
            let clientAddressLines = wrapText(data.clientAddress, timesRomanFont, 10, totalWidth - (margin + halfPosition + clientAddressLabel.length + 20 ))
          
            // Header Section
            drawBorder(margin, yPosition - totalheight - (clientAddressLines.length * 15), totalWidth, totalheight + (clientAddressLines.length * 15));
            yPosition -= 40;
          //   drawText('<Client Logo Here>', margin + 10, yPosition);
            
            page.drawImage(image, {
              x:margin+50, y: yPosition - 60,
              width: imageWidth-30, height: imageHeight-30,
            });
            drawBorder(margin + halfPosition, yPosition+10, totalWidth - halfPosition, 30, rgb(0.7725490196078432, 0.7019607843137254, 0.9019607843137255));
            drawText('VENDOR REGISTRATION FORM', margin + halfPosition + 20, yPosition+20, { size: 17},timesRomanBoldFont);

            drawBorder(margin + halfPosition, yPosition-totalheight+40 -(clientAddressLines.length * 15) , totalWidth - halfPosition, totalheight - 30 + (clientAddressLines.length * 15));
            yPosition -= 12;
            drawText('To', margin + halfPosition + 20, yPosition);
            yPosition -= 15;
            drawText(`Client Name: ${data.clientName}`, margin + halfPosition + 20, yPosition);
            yPosition -= 15;
            drawText(clientAddressLabel, margin + halfPosition + 20, yPosition);
            clientAddressLines.forEach(line => {
              drawText(line, margin + halfPosition + (clientAddressLabel.length * 5), yPosition, { maxWidth: 230 , lineHeight: 1.2 });
              yPosition -= 15;
            })
            // drawText(`Client Address: ${data.clientAddress}`, margin + halfPosition + 20, yPosition);
            // yPosition -= 15;
            drawText(`Client PAN No.: ${data.clientPAN}`, margin + halfPosition + 20, yPosition);
            yPosition -= 40;
          
            // Registration Number Section
            drawBorder(margin + halfPosition, yPosition-13, totalWidth - halfPosition, totalheight - 120);
            yPosition -= 20;
            drawBorder(margin + halfPosition, yPosition + 7, totalWidth - halfPosition - 170, totalheight - 120);
            drawText('Registration Number', margin + halfPosition + 20, yPosition + 20, {},timesRomanBoldFont);
            drawText(`${data.registrationNumber}`,  margin + halfPosition + 200, yPosition+20);
          
            // Address Details Section
            drawBorder(margin, yPosition - totalheight * 2 + 10, totalWidth, totalheight * 2);
            drawBorder(margin, yPosition-20, totalWidth, 30, rgb(0.8862745098039215, 0.8509803921568627, 0.9529411764705882));
            drawText('Address Details:', margin + 10, yPosition - 8, {},timesRomanBoldFont);
            yPosition -= 30;

            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Name: `, margin + 10, yPosition, {}, timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.addressDetails.name}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Name 2: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.addressDetails.name2}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            
            
            let address1Lines = wrapText(data.addressDetails.address1, timesRomanFont, 10, totalWidth - (margin + halfPosition + 50 ))
            // console.log(address1Lines)
            drawBorder(margin, yPosition - 20 - (address1Lines?.length * 15), leftWidth, 30 + (address1Lines?.length * 15));
            drawText(`Address 1: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20 - (address1Lines?.length * 15) , totalWidth - halfPosition, 30 + (address1Lines?.length * 15));
            address1Lines.forEach(line => {
              drawText(line, margin + halfPosition + 20, yPosition, { maxWidth: 270 , lineHeight: 1.2 });
              yPosition -= 15;
            })
            // drawText(`${data.addressDetails.address1}`, margin + halfPosition + 20, yPosition);
            // yPosition -= 30;
            yPosition -= 15;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Address 2: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.addressDetails.address2}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Pin Code: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.addressDetails.pinCode}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`City: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.addressDetails.city}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Country: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.addressDetails.country}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`State: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.addressDetails.state}`, margin + halfPosition + 20, yPosition);
            yPosition -= 20;
          
            // Contact Details Section
            drawBorder(margin, yPosition - totalheight, totalWidth, totalheight);
            drawBorder(margin, yPosition-20, totalWidth, 30, rgb(0.8862745098039215, 0.8509803921568627, 0.9529411764705882));
            drawText('Contact Details:', margin + 10, yPosition - 8, {},timesRomanBoldFont);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Mobile: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.contactDetails.mobile}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Landline No: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.contactDetails.landline}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Email: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.contactDetails.email}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Email 2: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.contactDetails.email2}`, margin + halfPosition + 20, yPosition);
            yPosition -= 20;
          
            // Taxation Details Section
            drawBorder(margin, yPosition - totalheight, totalWidth, totalheight);
            drawBorder(margin, yPosition-20, totalWidth, 30, rgb(0.8862745098039215, 0.8509803921568627, 0.9529411764705882));
            drawText('Taxation Details:', margin + 10, yPosition - 8, {},timesRomanBoldFont);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`GSTIN No.: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.taxationDetails.gstin}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`PAN No.: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.taxationDetails.pan}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Corporate Identity Number (CIN): `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.taxationDetails.cin}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            page = pdfDoc.addPage([595, 842]);
            yPosition = 800
          
            // Bank Details Section
            drawBorder(margin, yPosition - totalheight/3, totalWidth, totalheight/3);
            drawBorder(margin, yPosition-20, totalWidth, 30, rgb(0.8862745098039215, 0.8509803921568627, 0.9529411764705882));
            drawText('Bank Details:', margin + 10, yPosition - 8, {},timesRomanBoldFont);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Bank Name: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.bankDetails.bankName}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Branch Name: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.bankDetails.branchName}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            // page = pdfDoc.addPage([595, 842]);
            // yPosition = 800
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Account Number: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.bankDetails.accountNumber}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`IFSC Code: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.bankDetails.ifscCode}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
            drawBorder(margin, yPosition - 20, leftWidth, 30);
            drawText(`Bank Address: `, margin + 10, yPosition, {},timesRomanBoldFont);
            drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
            drawText(`${data.bankDetails.bankAddress}`, margin + halfPosition + 20, yPosition);
            yPosition -= 30;
          
            // Documents Required Section
            drawBorder(margin, yPosition - (30 * data.documentsRequired.length), totalWidth, (30 * data.documentsRequired.length));
            drawBorder(margin, yPosition-20, totalWidth, 30, rgb(0.8862745098039215, 0.8509803921568627, 0.9529411764705882));
            drawText('Documents Required (List of Attachments):', margin + 10, yPosition - 8, {},timesRomanBoldFont);
            yPosition -= 30;
          
            data.documentsRequired.forEach((doc, index) => {
              drawBorder(margin, yPosition - 20, leftWidth, 30);
              drawText(doc.attachmentName, margin + 10, yPosition, {},timesRomanBoldFont);
              drawBorder(margin + halfPosition, yPosition- 20, totalWidth - halfPosition, 30);
              drawText(doc.fileName, margin + halfPosition + 20, yPosition);
              yPosition -= 30;
            });
          
            // Declaration Section
            let lines = wrapText(data.declaration, timesRomanFont, 12, 320 )
            drawBorder(margin, yPosition - (15 * (lines.length + 3)) - 40, totalWidth, (15 * (lines.length + 3)) + 40);
            drawBorder(margin, yPosition-20, totalWidth, 30, rgb(0.8862745098039215, 0.8509803921568627, 0.9529411764705882));
            drawText('Declaration:', margin + 10, yPosition - 8, {},timesRomanBoldFont);
            yPosition -= 30;
            drawBorder(margin + halfPosition, yPosition- (15 * (lines.length + 3)) - 10, totalWidth - halfPosition, (20 * (lines.length + 3))- 85);
            lines.forEach(line => {
              drawText(line, margin + halfPosition + 20, yPosition - 5, { maxWidth: 270, lineHeight: 1.2 });
              yPosition -= 15;
            })

            page.drawLine({start : { x : margin + halfPosition + 20 , y : yPosition - 10}, end : { x : totalWidth , y : yPosition - 10}, thickness : 1})
            yPosition -= 20;
            
            drawText(`   Authorised Signatory (Vendor) `, margin + halfPosition + 80, yPosition - 5, { maxWidth: 270, lineHeight: 1.2 });
            yPosition -= 15;

            drawText(`       Sign & Stamp		`, margin + halfPosition + 100, yPosition - 5, { maxWidth: 270, lineHeight: 1.2 });
            yPosition -= 15;
          
            const pdfBytes = await pdfDoc.save();
            // fs.writeFileSync('Vendor_Registration_Form.pdf', pdfBytes);
            const base64String = Buffer.from(pdfBytes).toString('base64');
    
            // Create a Base64 downloadable URL
            const base64URL = `data:application/pdf;base64,${base64String}`;
    
            return resolve({ result: true, file: base64URL, 'fileName': fileName, 'fileBytes':pdfBytes});
    
        }
        catch (e)
        {
            console.log(e);
            return resolve({ result: false, error: e?.stack });
        }
    })
};

function wrapText(text, font, fontSize, maxWidth) 
{
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

/////////////////////////////////////////

createPdf.createPdfFormWithDummyValues = async (data, attachments, clientData, clientLogoPath) => {
    return new Promise(async (resolve, reject) => {
        try 
        {
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
                page.drawText(createPdf.camelCaseToTitleCase(field), { x, y, size: 12, font, color: rgb(0, 0, 0) });

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

createPdf.camelCaseToTitleCase = (input) =>
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
        page = pdfDoc.addPage([600, 850]);
        y = 800 - imageHeight - 10;
        const dummyPdfBytes = fs.readFileSync(attachment.filepath);

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

        const x = 3;
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
        const imageBytes = fs.readFileSync(attachment.filepath);
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

// function wrapText(text, font, fontSize, maxWidth) {
//     const lines = [];
//     let line = '';
//     let words = text.split(' ');

//     words.forEach(word => {
//         const testLine = line + word + ' ';
//         const testWidth = font.widthOfTextAtSize(testLine, fontSize);
//         if (testWidth > maxWidth && line !== '') {
//             lines.push(line.trim());
//             line = word + ' ';
//         } else {
//             line = testLine;
//         }
//     });

//     lines.push(line.trim());
//     return lines;
// }

module.exports = createPdf







