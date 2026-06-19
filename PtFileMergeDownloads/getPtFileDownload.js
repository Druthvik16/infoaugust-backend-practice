const express = require('express');
const router = express.Router();
const pool = require('../databaseConnection/createconnection');
const s3 = require('../awsS3BucketConfig/s3BucketConnection');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const XLSX = require('xlsx');

const bucketName = process.env.Bucket_Name;

router.post('/', async (req, res) => {
    try {
        const { clientUuid, partnerLocationUuids, date } = req.body;

        if (!clientUuid || !Array.isArray(partnerLocationUuids) || !partnerLocationUuids.length || !date) {
            return res.status(400).json({
                status_code: 400,
                message: 'clientUuid, partnerLocationUuids and date are required'
            });
        }

        const postingDate = new Date(date);
        if (isNaN(postingDate)) {
            return res.status(400).json({
                status_code: 400,
                message: 'Invalid date format'
            });
        }

        const month = postingDate.getMonth() + 1;
        const year = postingDate.getFullYear();

        const placeholders = partnerLocationUuids.map(() => '?').join(',');

        const query = `
            SELECT DISTINCT
                cudd3.document_file_name AS fileName,
                cudd3.document_file_path AS filePath,
                cudd3.encryption_key,
                cudd3.encryption_iv,
                pld.code AS partnerLocationCode
            FROM client_uploaded_document_master cudm
            JOIN client c ON c.id = cudm.client_id
            JOIN partner_location_detail pld 
                ON pld.id = cudm.partner_location_detail_id
            JOIN document_category dc 
                ON dc.id = cudm.document_category_id
                AND dc.name = 'Invoice'
            JOIN client_uploaded_document_detail cudd3 
                ON cudd3.client_uploaded_document_master_id = cudm.id
                AND cudd3.document_attachment_id = 4
            WHERE
                c.uuid = ?
                AND pld.uuid IN (${placeholders})
                AND MONTH(cudm.posting_date) = ?
                AND YEAR(cudm.posting_date) = ?
            ORDER BY cudm.posting_date DESC
        `;

        const [rows] = await pool.promise().query(query, [
            clientUuid,
            ...partnerLocationUuids,
            month,
            year
        ]);

        if (!rows.length) {
            return res.status(404).json({
                status_code: 404,
                message: 'No PT files found'
            });
        }

        let combinedData = [];
        let headerWritten = false;

        for (const file of rows) {
            try {
                const s3Object = await s3.getObject({
                    Bucket: bucketName,
                    Key: file.filePath
                }).promise();

                const decryptedData = await uniqueFunction.decryptFileBuffer(
                    s3Object.Body,
                    file.fileName,
                    file.encryption_key,
                    file.encryption_iv
                );

                if (!decryptedData?.result) continue;

                const workbook = XLSX.read(decryptedData.file, {
                    type: 'buffer'
                });

                const sheetName = workbook.SheetNames[0];
                if (!sheetName) continue;

                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,   // array of arrays
                    raw: true,
                    defval: ''
                });

                if (!jsonData.length) continue;

                jsonData.forEach((row, index) => {
                    if (index === 0) {
                        if (!headerWritten) {
                            combinedData.push(row);
                            headerWritten = true;
                        }
                    } else {
                        combinedData.push(row);
                    }
                });

            } catch (fileError) {
                console.error(`Error processing file: ${file.fileName}`, fileError.message);
                continue; // skip corrupted file, continue others
            }
        }

        if (!combinedData.length) {
            return res.status(404).json({
                status_code: 404,
                message: 'No valid data found in PT files'
            });
        }

        const newWorkbook = XLSX.utils.book_new();
        const newSheet = XLSX.utils.aoa_to_sheet(combinedData);
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Combined');

        const finalBuffer = XLSX.write(newWorkbook, {
            type: 'buffer',
            bookType: 'xlsx'
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Combined_PT_${month}_${year}.xlsx`
        );

        return res.send(finalBuffer);

    } catch (error) {
        console.error('Combined PT API Error:', error);
        return res.status(500).json({
            status_code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
