let pool = require('../databaseConnection/createconnection')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const { id } = require('date-fns/locale');
let db = {}

db.savePTDownloadQueue = (month, userId, userType, portal, portalId, partnerLocationUuids, clientId, financialYearId, roleCode) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `INSERT INTO pt_ondemand_download_queue
                        (
                            month, created_by_id, user_type, portal, partner_location_uuids, client_id, financial_year_id, portal_id, user_type_code
                        )
                        VALUES
                        (
                            ?, ?, ?, ?, ?, ?, ?, ?, ?
                        );`


                        // '2026-03-05', 'queued', NOW(), 101, 'ADMIN', 'SPSN', 'ledger_march_2026.xlsx', '/files/ledger/client5/ledger_march_2026.xlsx', 'uuid1,uuid2', 5, NOW(), NULL, 'Queue created', 'abc123key', 'xyz456iv', NULL, NULL, 3

            pool.query(sql, [month, userId, userType, portal, partnerLocationUuids, clientId, financialYearId, portalId, roleCode], (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};

db.updatePTDownloadQueue = (id, status, fileName, filePath, encryptionKey, encryptionIV, remark) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE pt_ondemand_download_queue SET status = '${status}', file_name = '${fileName}', file_path = '${filePath}', completed_on = NOW(), encryption_key = '${encryptionKey}', encryption_iv = '${encryptionIV}', remark = '${remark}' 
            WHERE id = '${id}'`
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};


db.getPTMasterFiles = (clientUuid, partnerLocationUuids, month, year) => {
    return new Promise((resolve, reject) => {
        try {

             const placeholders = partnerLocationUuids.map(() => '?').join(',');``

            let sql = ` SELECT DISTINCT
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
            `
            pool.query(sql, [
            clientUuid,
            ...partnerLocationUuids,
            month,
            year
        ], (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};

db.checkLogStatusesPending = () =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT 
                            ldq.*, 
                            c.uuid AS client_uuid
                        FROM 
                            pt_ondemand_download_queue AS ldq
                        LEFT JOIN client c ON c.id = ldq.client_id
                        WHERE 
                            ldq.status = 'pending';`
            pool.query(sql, (error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch(e)
        { 
            console.log(e)
        }
    });
};

db.updatPTDownloadQueueStatus = (sql, date) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {           
            pool.query(sql, [date], (error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch(e)
        { 
            console.log(e)
        }
    });
};


db.getPartnerLocation = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                           *
                        FROM 
                            partner_location_detail
                        WHERE 
                            uuid = ?
                        `


            pool.query(sql, [uuid], (error, result) => {
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



db.getLedgerDownloadQueue = (
    clientUuid,
    createdByUuid,
    status,
    fromDate,
    toDate,
    userTypeCode,
    financialYearId,
    portal,
    userId,
    loggedUserType
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT 
                ldq.*,
                c.uuid AS client_uuid,
                c.name AS client_name,

                CASE
                    WHEN ldq.user_type = 'User' THEN s.uuid 
                    WHEN ldq.user_type = 'CLNT' THEN uc.uuid
                    WHEN ldq.user_type = 'AdditionalUser' THEN aluc.uuid
                    WHEN ldq.user_type = 'SpsnUser' THEN sums.uuid
                    WHEN ldq.user_type = 'SpsnExtendedUser' THEN seu.uuid
                    ELSE NULL
                END AS createdByUuid,

                CASE
                    WHEN ldq.user_type = 'ADM' THEN s.name
                    WHEN ldq.user_type = 'CLNT' THEN uc.name
                    WHEN ldq.user_type = 'AdditionalUser' THEN aluc.name
                    WHEN ldq.user_type = 'SpsnUser' THEN sums.name
                    WHEN ldq.user_type = 'SpsnExtendedUser' THEN seu.name
                    ELSE NULL
                END AS createdByName,

                CASE
                    WHEN ldq.user_type = 'ADM' THEN 'ADM'
                    WHEN ldq.user_type = 'CLNT' THEN 'Client'
                    WHEN ldq.user_type = 'AdditionalUser' THEN 'Client User'
                    WHEN ldq.user_type = 'SpsnUser' THEN 'Spsn User'
                    WHEN ldq.user_type = 'SpsnExtendedUser' THEN 'Extended SPSN User'
                    ELSE 'Unknown'
                END AS createdByRole,

                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'locationUuid', pld.uuid,
                        'locationCode', pld.code,
                        'locationStoreName', pld.store_name
                    )
                ) AS partnerLocations,

                p.uuid AS partner_uuid,
                p.name AS partner_name,
                sumss.uuid AS spsn_uuid,
                sumss.name AS spsn_name

            FROM pt_ondemand_download_queue ldq
            LEFT JOIN client c ON c.id = ldq.client_id
            LEFT JOIN user u ON u.id = ldq.created_by_id AND ldq.user_type = 'User'
            LEFT JOIN staff s ON s.current_user_id = u.id AND ldq.user_type_code = 'ADM'
            LEFT JOIN client uc ON uc.linked_user_id = u.id AND ldq.user_type_code = 'CLNT'
            LEFT JOIN additional_login_user alu 
                ON alu.id = ldq.created_by_id AND ldq.user_type = 'AdditionalUser'
            LEFT JOIN client aluc ON aluc.id = alu.mapped_id AND ldq.user_type = 'AdditionalUser'
            LEFT JOIN spsn_user_master sums 
                ON sums.id = ldq.created_by_id AND ldq.user_type = 'SpsnUser'
            LEFT JOIN spsn_extended_user seu
                ON seu.id = ldq.created_by_id AND ldq.user_type = 'SpsnExtendedUser'

          --  LEFT JOIN partner_location_detail pld ON FIND_IN_SET(pld.uuid, ldq.partner_location_uuids) > 0

          LEFT JOIN partner_location_detail pld
ON JSON_CONTAINS(ldq.partner_location_uuids, JSON_QUOTE(pld.uuid))
            
            
            LEFT JOIN partner p ON p.id = ldq.portal_id AND ldq.portal = 'Partner'
            LEFT JOIN spsn_user_master sumss ON sumss.id = ldq.portal_id AND ldq.portal = 'Spsn'
            `;

            /* ---------- ASM / RSM / NSM VISIBILITY ---------- */
            if (['ASM', 'RSM', 'NSM'].includes(userTypeCode)) {

                sql += `
                INNER JOIN spsn_extended_user_partner_location_map euplm
                    ON euplm.partner_location_id = pld.id
                    AND euplm.is_active = 1
                    AND euplm.designation_code = '${userTypeCode}'
                INNER JOIN spsn_extended_user seu_filter
                    ON seu_filter.id = euplm.extended_user_id
                    AND seu_filter.uuid = '${createdByUuid}'
                `;

            }

            /* ---------- COMMON WHERE ---------- */
            sql += `
            WHERE c.uuid = '${clientUuid}'
            AND ldq.user_type IS NOT NULL
            AND ldq.portal = '${portal}'
            AND ldq.created_by_id = '${userId}'
            AND ldq.user_type = '${loggedUserType}'
            `;

            if (financialYearId?.toString()?.length > 0) {
                sql += ` AND ldq.financial_year_id = '${financialYearId}'`;
            }

            /* ---------- CREATED BY FILTER ---------- */
            if (
                createdByUuid?.length > 0 &&
                !['ASM', 'RSM', 'NSM'].includes(userTypeCode)
            ) {
                const uuidConditionsMap = {
                    'ADM': ['s.uuid'],
                    'CLNT': ['uc.uuid'],
                    'AdditionalUser': ['aluc.uuid'],
                    'SpsnUser': ['sums.uuid']
                };
                const cols = uuidConditionsMap[userTypeCode] || ['sums.uuid'];
                const cond = cols.map(col => `${col} = '${createdByUuid}'`).join(' OR ');
                sql += ` AND (${cond})`;
            }

            if (status?.length > 0) {
                sql += ` AND ldq.status = '${status}'`;
            }

            sql += `
            GROUP BY ldq.id
            ORDER BY ldq.created_on DESC
            `;

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};


db.getUploadedFilePath = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT ldq.id, ldq.file_name AS fileName, ldq.file_path AS filePath, ldq.encryption_key AS encryptionKey, ldq.encryption_iv AS encryptionIV, c.uuid AS clientUuid  
            FROM pt_ondemand_download_queue ldq
            LEFT JOIN client c ON ldq.client_id = c.id
            WHERE FIND_IN_SET(ldq.id,'${id}') > 0`

            pool.query(sql, (error, result) => {
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


db.getData = (uuid, tableName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT *
            FROM ${tableName} 
            WHERE uuid = ?`

            pool.query(sql, [uuid], (error, result) => {
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


db.saveDataTransactLog = (activity, user, partnerUuid, locationUuid, fileSize, apiName, storageType, createdOn, clientUuid, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}','${partnerUuid}','${locationUuid}','${fileSize}','${apiName}','${storageType}',?, (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${fileName}')`
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

module.exports = db
