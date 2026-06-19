const PDFlib = require('pdf-lib');
const fs = require('fs');

let paymentAdviceCommonFunction = {}

paymentAdviceCommonFunction.createPDF = async(data, logoPath) => {
    return new Promise(async(resolve, reject) => 
        {
            try
            { 
                const doc = await PDFlib.PDFDocument.create();
                const pageSize = PDFlib.PageSizes.A4;
              
                // Add a page
                let page = doc.addPage(pageSize);
                const font = await doc.embedFont(PDFlib.StandardFonts.Helvetica);
                const fontSize = 10;
                const marginTop = 50;
                const marginBottom = 50;
                const pageWidth = page.getWidth();
                let y = page.getHeight() - marginTop;
              
                const drawText = (text, x, y, options = {}, fontSize = 10) => {
                  page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font,
                    ...options
                  });
                };
                  
                const wrapText = (text, x) => {
                    let maxWidth = pageWidth - x - 50;
                  const wrappedLines = [];
                  let currentLine = '';
                  for (let word of text.split(' ')) {
                    const testLine = currentLine + word + ' ';
                    const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);
                    if (testLineWidth <= maxWidth) {
                      currentLine = testLine;
                    } else {
                      wrappedLines.push(currentLine.trim());
                      currentLine = word + ' ';
                    }
                  }
                  wrappedLines.push(currentLine.trim());
                  return wrappedLines;
                };
              
                const addNewPage = () => {
                  page = doc.addPage(pageSize);
                  y = page.getHeight() - marginTop;
                };
              
                const checkPageSpace = (spaceNeeded) => {
                  if (y - spaceNeeded < marginBottom) {
                    addNewPage();
                  }
                };
              
                // Handle logo
                const imageBytes = fs.readFileSync(logoPath);
                let image = '';
              
                if (['.png'].some(ext => logoPath.endsWith(ext))) {
                  image = await doc.embedPng(imageBytes);
                } else if (['.jpg', '.jpeg'].some(ext => logoPath.endsWith(ext))) {
                  image = await doc.embedJpg(imageBytes);
                } else {
                  throw new Error('Client logo type error');
                }
              
                const { width: imageWidth, height: imageHeight } = image.scale(0.5);
              
                // Update y-axis after logo
                y = page.getHeight() - marginTop;
              
                // Draw a line for table borders
                const drawLine = (x1, y1, x2, y2) => {
                  page.drawLine({
                    start: { x: x1, y: y1 },
                    end: { x: x2, y: y2 },
                    thickness: 1,
                  });
                };
              
                // Draw borders for table
                const drawTableBorders = (x, y, width, height) => {
                  drawLine(x, y, x + width, y); // Top border
                  drawLine(x, y, x, y - height); // Left border
                  drawLine(x + width, y, x + width, y - height); // Right border
                  drawLine(x, y - height, x + width, y - height); // Bottom border
                };
              
                // Title
                checkPageSpace(50);
                drawText('Remittance Advice', page.getWidth() / 2 - 70, y, {}, 18);
                page.drawImage(image, {
                    x: 50, y: y - imageHeight + 10,
                    width: imageWidth - 30, height: imageHeight - 30,
                  });
                  y -= 25;
                  let clientX = pageWidth/2; //    390;
              
                // Wrapping client details
                const clientNameLines = wrapText(data.client.name, clientX);
                const clientAddressLines = wrapText(data.client.address, clientX);
                const referenceNumberLines = wrapText(`Reference Number: ${data.referenceNumber}`, clientX);
                const paymentDateLines = wrapText(`Payment Date: ${data.paymentDate}`, clientX);
                const totalPaidAmountLines = wrapText(`Total Paid Amount: ${data.totalPaidAmount}`, clientX);
                // Draw client details with wrapped lines
                clientNameLines.forEach((line) => {
                  checkPageSpace(15);
                  drawText(line, clientX, y);
                  y -= 10;
                });
                  y -= 7;
                clientAddressLines.forEach((line) => {
                  checkPageSpace(15);
                  drawText(line, clientX, y);
                  y -= 10;
                });
              
                  y -= 7;
                referenceNumberLines.forEach((line) => {
                  checkPageSpace(15);
                  drawText(line, clientX, y);
                  y -= 10;
                });
                  y -= 7;
              
                paymentDateLines.forEach((line) => {
                  checkPageSpace(15);
                  drawText(line, clientX, y);
                  y -= 10;
                });
                  y -= 7;
              
                totalPaidAmountLines.forEach((line) => {
                  checkPageSpace(15);
                  drawText(line, clientX, y);
                  y -= 10;
                });
              
                y -= 20;
              
                // Vendor details
                const vendorCodeLines = wrapText(`Vendor Code: ${data.vendor.code}`, 50);
                const vendorNameLines = wrapText(data.vendor.name, 50);
                const vendorAddressLines = wrapText(data.vendor.address, 50);
              
                vendorCodeLines.forEach((line) => {
                  checkPageSpace(15);
                  drawText(line, 50, y);
                  y -= 15;
                });
              
                vendorNameLines.forEach((line) => {
                  checkPageSpace(15);
                  drawText(line, 50, y);
                  y -= 15;
                });
              
                vendorAddressLines.forEach((line) => {
                  checkPageSpace(15);
                  drawText(line, 50, y);
                  y -= 15;
                });
              
                y -= 20;
              
                const tableColumnWidth = [100, 100, 100, 100, 100];
              
                // Table Headers
                let headerY = y - 5;
                drawText('Invoice Number', 55, headerY);
                drawText('Invoice Date', 155, headerY);
                drawText('Invoice Amount', 255, headerY);
                drawText('Deductions/TDS', 355, headerY);
                drawText('Net Amount Paid', 455, headerY);
              
                drawTableBorders(50, y + 5, tableColumnWidth[0], 30);
                drawTableBorders(150, y + 5, tableColumnWidth[1], 30);
                drawTableBorders(250, y + 5, tableColumnWidth[2], 30);
                drawTableBorders(350, y + 5, tableColumnWidth[3], 30);
                drawTableBorders(450, y + 5, tableColumnWidth[4], 30);
              
                y -= 30;
              
                // Table Data with Borders
                data.invoices.forEach((invoice, index) => {
                  checkPageSpace(25);
              
                  // Wrap each column's text if necessary
                  const invoiceNumberLines = wrapText(invoice.invoiceNumber, tableColumnWidth[0]);
                  const invoiceDateLines = wrapText(invoice.invoiceDate, tableColumnWidth[1]);
                  const invoiceAmountLines = wrapText(invoice.invoiceAmount, tableColumnWidth[2]);
                  const deductionsLines = wrapText(invoice.deductions, tableColumnWidth[3]);
                  const netAmountPaidLines = wrapText(invoice.netAmountPaid, tableColumnWidth[4]);
              
                  const rowHeight = Math.max(
                    invoiceNumberLines.length,
                    invoiceDateLines.length,
                    invoiceAmountLines.length,
                    deductionsLines.length,
                    netAmountPaidLines.length
                  ) * 15;
              
                  checkPageSpace(rowHeight + 25); // Adjust space for row
              
                  invoiceNumberLines.forEach((line, i) => drawText(line, 55, y - i * 15 + 7));
                  invoiceDateLines.forEach((line, i) => drawText(line, 155, y - i * 15 + 7));
                  invoiceAmountLines.forEach((line, i) => drawText(line, 255, y - i * 15 + 7));
                  deductionsLines.forEach((line, i) => drawText(line, 355, y - i * 15 + 7));
                  netAmountPaidLines.forEach((line, i) => drawText(line, 455, y - i * 15 + 7));
              
                  // Draw the table borders
                  drawTableBorders(50, y + 5, tableColumnWidth[0], -rowHeight);
                  drawTableBorders(150, y + 5, tableColumnWidth[1], -rowHeight);
                  drawTableBorders(250, y + 5, tableColumnWidth[2], -rowHeight);
                  drawTableBorders(350, y + 5, tableColumnWidth[3], -rowHeight);
                  drawTableBorders(450, y + 5, tableColumnWidth[4], -rowHeight);
              
                  y -= rowHeight;
                });
              
                // Serialize the PDFDocument to bytes (a Uint8Array)
                const pdfBytes = await doc.save();
              
                // Write the PDF to a file
                // fs.writeFileSync('output3.pdf', pdfBytes); 
            
                // Write the PDF to a file
                // fs.writeFileSync(outputFileName, pdfBytes);
                const base64String = Buffer.from(pdfBytes).toString('base64');
            
                // Create a Base64 downloadable URL
                const base64URL = `data:application/pdf;base64,${base64String}`;
              
                console.log('PDF generated successfully.');
                
                return resolve({ result: true, file: base64URL, 'fileBytes':pdfBytes});
            }
            catch (err)
            {
                console.log(err);
                return resolve({ result: false, error: err?.stack });
            }

        })
 
}

module.exports = paymentAdviceCommonFunction
