const PDFlib = require('pdf-lib');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

let paymentAdviceCommonFunction = {}

paymentAdviceCommonFunction.createPDFBCL = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const clientLogoBytes = fs.readFileSync(data.clientLogoPath);

            // Create a new PDF document
            const pdfDoc = await PDFDocument.create();
            const fontSize = 12;
            const padding = 55;
            let contentFont, font;

            // Load fonts and logo
            contentFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const clientLogo = await pdfDoc.embedPng(clientLogoBytes);
            const logoDims = clientLogo.scale(0.5);

            // Start creating pages and adding content
            let page = pdfDoc.addPage();
            const maxWidth = page.getWidth() - 2 * padding;
            let yPosition = addLetterhead(page);
            addFooter(page)
            function wrapText(line) {
                const words = line.split(" ");
                let wrappedLines = [];
                let currentLine = "";
                words.forEach((word) => {
                    const testLine = currentLine + word + " ";
                    const textWidth = contentFont.widthOfTextAtSize(testLine, fontSize);
                    if (textWidth > maxWidth) {
                        wrappedLines.push(currentLine);
                        currentLine = word + " ";
                    } else {
                        currentLine = testLine;
                    }
                });
                wrappedLines.push(currentLine.trim());
                return wrappedLines;
            }

            // Function to wrap text lines to fit page width

            // Define reusable function to add letterhead
            function addLetterhead(page) {
                const { height } = page.getSize();
                page.drawImage(clientLogo, {
                    x: page.getWidth() - padding - logoDims.width,
                    y: height - padding - logoDims.height,
                    width: logoDims.width,
                    height: logoDims.height,
                });
                // page.drawText(data.clientName, {
                //     x: padding + logoDims.width + 10 + 60,
                //     y: height - padding - fontSize,
                //     size: fontSize + 4,
                //     font: font,
                //     color: rgb(0, 0, 0.8),
                // });
                return height - padding - logoDims.height - fontSize * 2;
            }

            function addFooter(page) {
                const { width } = page.getSize();
                let footerY = padding + 10; // Position at the bottom of the page
            
                // Draw horizontal line
                page.drawLine({
                    start: { x: padding, y: footerY + 20 },
                    end: { x: width - padding, y: footerY + 20 },
                    thickness: 1,
                    color: rgb(0, 0, 0),
                });
            
                // Calculate centered position for client name
                const clientNameWidth = font.widthOfTextAtSize(data.clientName, fontSize);
                const clientNameX = (width - clientNameWidth) / 2;
            
                // Draw client name centered
                page.drawText(data.clientName, {
                    x: clientNameX,
                    y: footerY + 5,
                    size: 10,
                    font: font,
                    color: rgb(0, 0, 0),
                });
            
                // Calculate centered position for client address
            
                // Draw client address centered below the client name
           

                
            const clientAddress = data.clientAddress.replace(/\t/g, '    ').split('\n');
            for (let line of clientAddress) {
                const wrappedLines = wrapText(line);
                let fontSizeAddress = 8;
                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSizeAddress) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                        addFooter(page)
                    }
                    let clientAddressWidth = contentFont.widthOfTextAtSize(wrappedLine, 10);
                    let clientAddressX = (width - clientAddressWidth) / 2;
                    page.drawText(wrappedLine, {
                        x: clientAddressX,
                        y: footerY - fontSizeAddress,
                        size: fontSizeAddress,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    footerY -= fontSizeAddress + 5;
                }
            }
        }

            function drawTable(page, rows, startY) {
                const colWidths = [maxWidth / 2, maxWidth / 2];
                let y = startY;

                rows.forEach((row, rowIndex) => {
                    const isHeader = rowIndex === 0;
                    const rowHeight = isHeader ? fontSize + 8 : fontSize + 5; // Smaller height for data rows to reduce gap

                    row.forEach((cell, colIndex) => {
                        // Calculate x and y positions for the cell
                        const x = padding + colIndex * colWidths[colIndex];

                        // Draw text inside the cell
                        page.drawText(cell, {
                            x: x + 10, // Add padding for text within the cell
                            y: y - 8, // Uniform padding within cells
                            size: fontSize,
                            font: isHeader ? font : contentFont,
                            color: rgb(0, 0, 0),
                        });

                        // Draw a rectangle (border) for each cell
                        page.drawRectangle({
                            x,
                            y: y - rowHeight + 5, // Adjusted to minimize space
                            width: colWidths[colIndex],
                            height: rowHeight, // Reduced height for tighter rows
                            borderWidth: 1,
                            borderColor: rgb(0, 0, 0),
                        });
                    });

                    // Move the y position down for the next row, reduced spacing for compactness
                    y -= rowHeight;
                });

                return y;
            }

            page.drawText(data.cutOffDate, {
                x: padding,
                y: yPosition - 15,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });

            // Process content with letterhead on each page
            const pdfContentLines = data.pdfContent1.replace(/\t/g, '    ').split('\n');
            for (let line of pdfContentLines) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                        addFooter(page)
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }



            page.drawText(data.subject, {
                x: padding,
                y: yPosition,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });


            // Process content with letterhead on each page
            const pdfContentLines2 = data.pdfContent2.replace(/\t/g, '    ').split('\n');
            for (let line of pdfContentLines2) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                        addFooter(page)
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }

            yPosition = drawTable(page, data.tableData1, yPosition - 10);


            // Process content with letterhead on each page
            const pdfContentLines3 = data.pdfContent3.replace(/\t/g, '    ').split('\n');
            for (let line of pdfContentLines3) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                        addFooter(page)
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }


            page.drawText(data.comfirmationSlip, {
                x: padding,
                y: yPosition,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });
            // Process content with letterhead on each page
            const pdfContentLines4 = data.pdfContent4.replace(/\t/g, '    ').split('\n');
            for (let line of pdfContentLines4) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                        addFooter(page)
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }
            yPosition = drawTable(page, data.tableData3, yPosition - 10);

            const pdfContentLines6 = data.pdfContent6.replace(/\t/g, '    ').split('\n');
            for (let line of pdfContentLines6) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                        addFooter(page)
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }
            yPosition = drawTable(page, data.tableData2, yPosition - 10);


            // Process content with letterhead on each page
            const pdfContentLines5 = data.pdfContent5.replace(/\t/g, '    ').split('\n');
            for (let line of pdfContentLines5) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                        addFooter(page)
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }

            // Save the PDF
            const pdfBytes = await pdfDoc.save();

            // Write the PDF to a file
            // fs.writeFileSync('output3.pdf', pdfBytes); 

            // Write the PDF to a file
            // fs.writeFileSync(outputFileName, pdfBytes);
            const base64String = Buffer.from(pdfBytes).toString('base64');

            // Create a Base64 downloadable URL
            const base64URL = `data:application/pdf;base64,${base64String}`;

            console.log('PDF generated successfully.');

            return resolve({ result: true, file: base64URL, 'fileBytes': pdfBytes });
        }
        catch (err) {
            console.log(err);
            return resolve({ result: false, error: err?.stack });
        }

    })

}
paymentAdviceCommonFunction.createPDFNDC = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Create a new PDF document
            const pdfDoc = await PDFDocument.create();
            const fontSize = 12;
            const padding = 80;
            let contentFont, font;

            // Load fonts and logo
            contentFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            // const logoDims = clientLogo.scale(0.3);

            // Define reusable function to add letterhead
            function addLetterhead(page) {
                const { height } = page.getSize();
                // page.drawText(data.clientName, {
                //     x: padding  + 10 + 60,
                //     y: height - padding - fontSize,
                //     size: fontSize + 4,
                //     font: font,
                //     color: rgb(0, 0, 0.8),
                // });
                return height - padding - fontSize * 2;
            }

            // Start creating pages and adding content
            let page = pdfDoc.addPage();
            let yPosition = addLetterhead(page);

            // Function to wrap text lines to fit page width
            const maxWidth = page.getWidth() - 2 * padding;
            function wrapText(line) {
                const words = line.split(" ");
                let wrappedLines = [];
                let currentLine = "";
                words.forEach((word) => {
                    const testLine = currentLine + word + " ";
                    const textWidth = contentFont.widthOfTextAtSize(testLine, fontSize);
                    if (textWidth > maxWidth) {
                        wrappedLines.push(currentLine);
                        currentLine = word + " ";
                    } else {
                        currentLine = testLine;
                    }
                });
                wrappedLines.push(currentLine.trim());
                return wrappedLines;
            }

            page.drawText(data.cutOffDate, {
                x: padding,
                y: yPosition - 15,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });

            // Process content with letterhead on each page
            const pdfContentLines = data.pdfContent1.replace(/\t/g, '    ').split('\n');
            for (let line of pdfContentLines) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }


            const subjects = data.subject.replace(/\t/g, '    ').split('\n');
            for (let line of subjects) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: font,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }


            // Process content with letterhead on each page
            const pdfContentLines2 = data.pdfContent2.replace(/\t/g, '    ').split('\n');
            for (let line of pdfContentLines2) {
                const wrappedLines = wrapText(line);

                for (let wrappedLine of wrappedLines) {
                    if (yPosition < padding + fontSize) {
                        // Add a new page with letterhead if out of vertical space
                        page = pdfDoc.addPage();
                        yPosition = addLetterhead(page);
                    }
                    page.drawText(wrappedLine, {
                        x: padding,
                        y: yPosition,
                        size: fontSize,
                        font: contentFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= fontSize + 5;
                }
            }


            page.drawText(data.comfirmation, {
                x: padding,
                y: yPosition + 40,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });

            // Save the PDF
            const pdfBytes = await pdfDoc.save();

            // Write the PDF to a file
            // fs.writeFileSync('output3.pdf', pdfBytes); 

            // Write the PDF to a file
            // fs.writeFileSync(outputFileName, pdfBytes);
            const base64String = Buffer.from(pdfBytes).toString('base64');

            // Create a Base64 downloadable URL
            const base64URL = `data:application/pdf;base64,${base64String}`;

            console.log('PDF generated successfully.');

            return resolve({ result: true, file: base64URL, 'fileBytes': pdfBytes });
        }
        catch (err) {
            console.log(err);
            return resolve({ result: false, error: err?.stack });
        }

    })

}



module.exports = paymentAdviceCommonFunction
