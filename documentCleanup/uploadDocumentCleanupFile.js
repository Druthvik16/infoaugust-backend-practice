const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const db = require('./dbQueryDocumentCleanup');
const router = express.Router();

const moment = require("moment");

const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let documentCleanupFileFolderPath = 'Document_Cleanup_Files';

const OUTPUT_DIR = path.join(__dirname, 'output');
let filePath = ''

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

router.post('/', async (req, res) => {
    try {
        const form = new formidable.IncomingForm({ multiples: false });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Form parse error:', err);
                return res.status(400).json({ message: 'Form parse error', error: err });
            }

            const { clientUuid, documentCategoryId, documentAttachmentId } = fields;
            const uploadedById = req.body.userId;
            const client = await db.getClient(clientUuid)

            if (!client || !documentCategoryId || !documentAttachmentId || !files.file || !uploadedById) {
                return res.status(400).json({ message: 'Missing required fields' });
            }
            
            const clientId = client.id

            const documentCategory = await db.getDocumentCategory(documentCategoryId)

            let fileObject = {};

            if(Object.keys(files).length > 0)
            {
                if(Array.isArray(files['file']) == true)
                {
                    fileObject['file'] = files['file'][0]
                }
                else
                {
                    fileObject = files
                }
            }

            const file = fileObject?.file;
            if (path.extname(file.originalFilename).toLowerCase() !== '.xlsx') {
                return res.status(400).json({ message: 'Only .xlsx files are allowed' });
            }

            filePath = file.filepath;

            let workbook;
            try {
                workbook = xlsx.readFile(file.filepath);
            } catch (readErr) {
                console.error('File read error:', readErr);
                return res.status(400).json({ message: 'Invalid Excel file', error: readErr });
            }

            const sheetName = workbook.SheetNames[0];
            const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

            const requiredColumns = ['Posting Date', 'Document No', 'Partner Location Code'];
            const hasAllColumns = requiredColumns.every(col => Object.keys(sheetData[0] || {}).includes(col));
            if (!hasAllColumns) {
                return res.status(400).json({ message: 'Missing required columns in Excel file' });
            }
            const totalRows = sheetData.length;
            const jobInsertResult = await db.insertDocumentCleanupJob({
                clientId,
                documentCategoryId,
                documentAttachmentId,
                uploadedById,
                totalRows,
                processingStatus : 'Pending'
            });

            const jobId = jobInsertResult.insertId;
            const fileName = `documentCleanupFile_${jobId}.xlsx`
            let foundCount = 0;
            let notFoundCount = 0;
            const batchSize = 500;
            const outputRows = [];

            for (let i = 0; i < sheetData.length; i += batchSize) {
                const batch = sheetData.slice(i, i + batchSize);

                const batchResults = await Promise.all(batch.map(async (row, index) => {
                    const postingDate = await parseDate(row['Posting Date']?.toString()?.trim()) 
                    //  new Date(row['Posting Date']);
                    const docNo = row['Document No'];
                    const partnerLocationCode = row['Partner Location Code'];

                    try {
                        const matchedData = await db.findInDocumentMaster(postingDate, docNo, partnerLocationCode, documentCategory.code, documentAttachmentId);
                        const remark = matchedData ? 'Found' : 'Not Found';

                        if (remark === 'Found') foundCount++;
                        else notFoundCount++;

                        const status = remark == 'Not Found' ? 'Rejected' : 'Pending'

                        await db.insertDocumentCleanupJobDetail({
                            jobId,
                            postingDate,
                            documentNumber: docNo,
                            partnerLocationId: matchedData?.partner_location_id || null,
                            remark,
                            matchedDocumentMasterId: matchedData?.document_master_id || null,
                            matchedDocumentDetailId: matchedData?.document_detail_id || null,
                            status
                        });

                        return {
                            'Posting Date': await parseDate(row['Posting Date']?.toString()?.trim()),
                            //  row['Posting Date'],
                            'Document No': docNo,
                            'Partner Location Code': partnerLocationCode,
                            'Remark': remark
                        };
                    } catch (e) {
                        console.error(`Error processing row ${i + index + 1}:`, e);
                        return {
                            'Posting Date': await parseDate(row['Posting Date']?.toString()?.trim()),
                            // row['Posting Date'],
                            'Document No': docNo,
                            'Partner Location Code': partnerLocationCode,
                            'Remark': e?.stack
                        };
                    }
                }));

                outputRows.push(...batchResults);
            }

            const resultFilename = fileName;
            const resultFilePath = path.join(OUTPUT_DIR, resultFilename);
            const newSheet = xlsx.utils.json_to_sheet(outputRows);
            const newWorkbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Result');
            xlsx.writeFile(newWorkbook, resultFilePath);

            
            // Read file as base64
            const fileBuffer = fs.readFileSync(resultFilePath);
            const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const base64DataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

            const s3Upload = await uniqueFunction.uploadFiles(fileBuffer, resultFilename, clientUuid, documentCleanupFileFolderPath)            

            await db.updateDocumentCleanupJobCounts(jobId, foundCount, notFoundCount, 
                fileName);

         //   await uniqueFunction.removeFileFromDirectory(resultFilePath)

            return res.status(200).json({
                message: 'File processed successfully',
                jobId,
                foundCount,
                notFoundCount,
                totalRows,
                fileName: resultFilename,
                file: base64DataUrl,
                s3Upload
            });
        });
    } catch (err) {
        console.error('Unhandled server error:', err);
        return res.status(500).json({
            message: 'Server error',
            error: err.message || err
        });
    }
    finally
    {
        if(fs.existsSync(filePath))
        {
            fs.unlinkSync(filePath)
        }
    }
});

module.exports = router;



async function parseDate(dateString) {
  try {
    console.log("dateString1", dateString);
    if (!dateString) return null;

    dateString = dateString.toString().trim();

    console.log("dateString2", dateString);

    // Handle Excel date serial numbers (e.g., 44923)
    if (!isNaN(dateString) && Number(dateString) > 59 && Number(dateString) < 60000) {
      // Excel date serial (days since 1899-12-31, but due to bug, 60 = 1900-02-29)
      const excelBaseDate = new Date(Date.UTC(1899, 11, 30)); // 1899-12-30 (Excel quirk)
      const serialDate = new Date(excelBaseDate.getTime() + Number(dateString) * 86400000);
      return moment(serialDate).format("YYYY-MM-DD");
    }

    // Try ISO 8601
    const isoParsedDate = moment(dateString, moment.ISO_8601, true);
    if (isoParsedDate.isValid()) {
      return isoParsedDate.format("YYYY-MM-DD");
    }

    // Try custom formats
    const formats = ["YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY/MM/DD"];
    const parsedDate = moment(dateString, formats, true);
    console.log("parseDate", parsedDate.isValid(), parsedDate.format("YYYY-MM-DD"));
    return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : null;

  } catch (error) {
    console.error("Error parsing date:", error);
    throw new Error("Invalid date format");
  }
}



// async function parseDate (dateString){
//   try {
//     console.log("dateString1 ",dateString)
//     if (!dateString) return null;
    
//     dateString = dateString?.toString();
    
//     console.log("dateString2 ",dateString)
    
//     // Trim extra spaces between date and time
//     dateString = dateString.replace(/\s+/g, " ").trim();

//     const isoParsedDate = moment(dateString, moment.ISO_8601, true);
//     if (isoParsedDate.isValid()) {
//       return isoParsedDate.format("YYYY-MM-DD"); // Convert to standard format
//     }
//     const formats = ["YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY/MM/DD"];
//     const parsedDate = moment(dateString, formats, true);
//     console.log(parseDate, parsedDate.isValid(), parsedDate.format("YYYY-MM-DD"))
//     return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : null;
//   } catch (error) {
//     console.error("Error parsing date:", error);
//     throw new Error("Invalid date format");
//   }
// };