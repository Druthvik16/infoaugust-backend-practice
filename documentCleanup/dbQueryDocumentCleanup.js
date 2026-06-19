const pool = require('../databaseConnection/createconnection');
const db = {};

// Insert a new job record
db.insertDocumentCleanupJob = ({ clientId, documentCategoryId, documentAttachmentId, uploadedById, totalRows, processingStatus }) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO document_cleanup_job 
            (client_id, uploaded_by_id, document_category_id, document_attachment_id, total_rows, processing_status)
            VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [clientId, uploadedById, documentCategoryId, documentAttachmentId, totalRows, processingStatus];

        pool.query(sql, params, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

// Find in master table
db.findInDocumentMaster = (postingDate, documentNumber, partnerLocationCode, documentCategoryCode, documentAttachmentId) => {
    return new Promise((resolve, reject) => {
        let sql = `
            SELECT 
                dm.id AS document_master_id,
                dd.id AS document_detail_id,
                pl.id AS partner_location_id
            FROM client_uploaded_document_master dm
            JOIN client_uploaded_document_detail dd ON dd.client_uploaded_document_master_id = dm.id AND dd.document_attachment_id = '${documentAttachmentId}'
            JOIN partner_location_detail pl ON pl.id = dm.partner_location_detail_id
            WHERE pl.code = ?`;

        let params = [partnerLocationCode];

        if (documentCategoryCode === 'CN') {
            if (documentAttachmentId == 3) {
                sql += ` AND dm.bill_no_or_ref_no = ? AND DATE(dm.posting_date) = DATE(?)`;
                params.push(documentNumber, postingDate);

            }
            else {
                sql += ` AND dm.document_number = ? AND DATE(dm.posting_date) = DATE(?)`;
                params.push(documentNumber, postingDate);
            }
        } else if (documentCategoryCode === 'INV') {
            sql += ` AND dm.bill_no_or_ref_no = ? AND DATE(dm.posting_date) = DATE(?)`;
            params.push(documentNumber, postingDate);
        } else if (documentCategoryCode === 'LGR' || documentCategoryCode === 'TRNS') {
            sql += ` AND MONTH(dm.posting_date) = MONTH(?) AND YEAR(dm.posting_date) = YEAR(?)`;
            params.push(postingDate, postingDate);
        }

        sql += ` LIMIT 1`;

        console.log(sql, params)

        pool.query(sql, params, (error, result) => {
            if (error) return reject(error);
            resolve(result[0] || null); // return null if not found
        });
    });
};

// Insert into document_cleanup_job_detail
db.insertDocumentCleanupJobDetail = ({ jobId, postingDate, documentNumber, partnerLocationId, remark, matchedDocumentMasterId, matchedDocumentDetailId, status }) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO document_cleanup_job_detail 
            (document_cleanup_job_id, posting_date, document_number, partner_location_id, remark, matched_document_master_id, matched_document_detail_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [jobId, postingDate, documentNumber, partnerLocationId, remark, matchedDocumentMasterId, matchedDocumentDetailId, status];
        pool.query(sql, params, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

// Update job counts
db.updateDocumentCleanupJobCounts = (jobId, foundCount, notFoundCount, fileName) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE document_cleanup_job 
            SET found_count = ?, not_found_count = ?, file_name = ? 
            WHERE id = ?`;
        const params = [foundCount, notFoundCount, fileName, jobId];

        pool.query(sql, params, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};
// Update job status
db.updateDocumentCleanupJobStatus = (jobId, status) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE document_cleanup_job 
            SET status = ?
            WHERE id = ?`;
        const params = [status, jobId];

        pool.query(sql, params, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};


db.getClient = (clientUuid) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
               *
            FROM client 
            WHERE uuid = '${clientUuid}'`;

        pool.query(sql, (error, result) => {
            if (error) return reject(error);
            resolve(result[0] || null); // return null if not found
        });
    });
};


db.getDocumentCategory = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
               *
            FROM document_category 
            WHERE id = '${id}'`;

        pool.query(sql, (error, result) => {
            if (error) return reject(error);
            resolve(result[0] || null); // return null if not found
        });
    });
};

db.getDocumentCleanupJob = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
               dcj.*,
               c.uuid AS client_uuid
            FROM document_cleanup_job dcj
            LEFT JOIN client c ON c.id = dcj.client_id  
            WHERE dcj.id = '${id}'`;

        pool.query(sql, (error, result) => {
            if (error) return reject(error);
            resolve(result[0] || null); // return null if not found
        });
    });
};

db.saveDataTransactLog = (activity, user, partnerUuid, locationUuid, fileSize, apiName, storageType, createdOn, clientUuid, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}',${partnerUuid ? `'${partnerUuid}'` : null},${locationUuid ? `'${locationUuid}'` : null},'${fileSize}','${apiName}','${storageType}',?, (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${fileName}')`
            pool.query(sql, [createdOn], (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}



db.getDocumentCleanupJobs = (clientUuid) => {
    return new Promise((resolve, reject) => {
        const sql = `
                    SELECT
                        dcj.id,
                        dcj.client_id AS clientId,
                        dcj.file_name AS fileName,
                        dcj.uploaded_by_id AS uploadedById,
                        dcj.uploaded_on AS uploadedOn,
                        dcj.modify_by_id AS modifyById,
                        dcj.modify_on AS modifyOn,
                        dcj.status AS status,
                        dcj.processing_status AS processingStatus,
                        dcj.found_count AS foundCount,
                        dcj.not_found_count AS notFoundCount,
                        dcj.total_rows AS totalRows,
                        dcj.document_category_id AS documentCategoryId,
                        dcj.document_attachment_id AS documentAttachmentId,
                        dcj.document_id AS documentId,

                        u.id AS userId,
                        u.uuid AS userUuid,
                        u.name AS userName,
                        s.id AS staffId,
                        s.name AS staffName,
                        s.email AS staffEmail,
                        s.mobile AS staffMobile,
                        s.uuid AS staffUuid,

                        
                        c.name AS clientName,
                        c.email AS clientEmail,
                        c.mobile AS clientMobile,
                        c.uuid AS clientUuid,

                        -- document_category
                        dc.id AS documentCategoryId,
                        dc.code AS documentCategoryCode,
                        dc.name AS documentCategoryName,
                        
                        -- document_attachment
                        da.id AS documentAttachmentId,
                        da.name AS documentAttachmentName,

                        r.id AS roleId,
                        r.name AS roleName,
                        r.code AS roleCode

                    FROM document_cleanup_job dcj

                    LEFT JOIN user u ON u.id = dcj.uploaded_by_id
                    LEFT JOIN staff s ON s.current_user_id = u.id
                    LEFT JOIN client c ON c.id = dcj.client_id
                    LEFT JOIN document_category dc ON dc.id = dcj.document_category_id
                    LEFT JOIN document_attachment da ON da.id = dcj.document_attachment_id
                    LEFT JOIN role r ON r.id = u.role_id 

                    ${clientUuid ? ` WHERE c.uuid = '${clientUuid}'` : ''}

                    ORDER BY dcj.uploaded_on DESC
                    `;

        pool.query(sql, (error, result) => {
            if (error) return reject(error);
            resolve(result || null); // return null if not found
        });
    });
};

module.exports = db;
