const express = require('express');
const router = express.Router();
const db = require('./dbQueryPTDowunload');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const XLSX = require('xlsx');
const pool = require('../databaseConnection/createconnection');


router.post('/', async (req, res) => {
    try {
        const { clientUuid, partnerLocationUuids, date, portal, financialYearId, userId, loggedUserType, portalUuid, roleCode } = req.body;

        if (!clientUuid || !Array.isArray(partnerLocationUuids) || !partnerLocationUuids.length || !date) {
            return res.status(400).json({
                status_code: 400,
                message: 'clientUuid, partnerLocationUuids and date are required'
            });
        }

        const client = await db.getData(clientUuid, 'client');

        if (!client.length) {
            return res.status(400).json({
                status_code: 400,
                message: 'Client not found'
            });
        }

        const clientId = client[0]?.id

        const portalData = portal == 'Partner' ? await db.getData(portalUuid, 'partner') : await db.getData(portalUuid, 'spsn_user_master');

         if (!portalData.length) {
            return res.status(400).json({
                status_code: 400,
                message: `${portal} not found`
            });
        }

        const portalId = portalData[0]?.id

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

        const saveQueue = await db.savePTDownloadQueue(postingDate, userId, loggedUserType, portal, portalId, JSON.stringify(partnerLocationUuids), clientId, financialYearId, roleCode);



        return res.status(200).json({ status_code: 200, message: "success" });

    } catch (error) {
        console.error('Combined PT API Error:', error);
        return res.status(500).json({
            status_code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
