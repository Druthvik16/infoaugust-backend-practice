let pool = require('../databaseConnection/createconnection')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const { id } = require('date-fns/locale');
let db = {}

db.saveLedgerQueue = (fromDate, toDate, clientId, createdOn, createdById, status, customerCodes, userType) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO ledger_download_queue (from_date, to_date, status, created_on, created_by_id, partner_location_codes, client_id, user_type) VALUES (?, ?, '${status}', ?, '${createdById}', ?, '${clientId}', '${userType}')`
            pool.query(sql, [fromDate, toDate, createdOn, customerCodes], (error, result) => {
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

db.updateLedgerQueue = (id, status, fileName, filePath, encryptionKey, encryptionIV, modifyById, completedOn, modifyOn, remark) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE ledger_download_queue SET status = '${status}', file_name = '${fileName}', file_path = '${filePath}', completed_on = ?, modify_on = ?, modify_by_id = ?, encryption_key = '${encryptionKey}', encryption_iv = '${encryptionIV}', remark = '${remark}' 
            WHERE id = '${id}'`
            pool.query(sql, [completedOn, modifyOn, modifyById], (error, result) => {
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

db.getLedgerMaster = (clientId, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = ` SELECT 
                            id AS id,
                            client_id AS clientId,
                            file_name AS fileName,
                            file_path AS filePath,
                            encryption_key AS encryptionKey,
                            encryption_iv AS encryptionIV
                        FROM ledger_json_file_master
                        WHERE client_id = '${clientId}' 
                        AND financial_year_id = '${financialYearId}'`
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

db.getLedgerDownloadQueue = (clientUuid, createdByUuid, status, fromDate, toDate) => {
    return new Promise((resolve, reject) => {
        try {
                let sql = `SELECT 
                                ldq.id AS id,
                                ldq.from_date AS fromDate,
                                ldq.to_date AS toDate,
                                ldq.status AS status,
                                ldq.created_on AS createdOn,
                                ldq.created_by_id AS createdById,
                                ldq.user_type AS userType,
                                ldq.file_name AS fileName,
                                ldq.partner_location_codes AS partnerLocationCodes,
                                ldq.client_id AS clientId,
                                ldq.started_on AS startedOn,
                                ldq.completed_on AS completedOn,
                                ldq.remark AS remark,
                                ldq.modify_on AS modifyOn,
                                ldq.modify_by_id AS modifyById,
                                c.uuid AS clientUuid,
                                c.name AS clientName,
                                IF(ldq.user_type = 'ADM', s.uuid, sums.uuid) AS createdByUuid,
                                IF(ldq.user_type = 'ADM', s.name, sums.name) AS createdByName,                                
                                IF(ldq.user_type = 'ADM', 'ADM', 'SPSN') AS createdByRole,,
                                JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'locationUuid', pld.uuid,
                                        'locationCode', pld.code,
                                        'locationStoreName', pld.store_name
                                    )
                                ) AS partnerLocations

                            FROM 
                                ledger_download_queue AS ldq
                            LEFT JOIN client c AS c.id = ldq.client_id
                            LEFT JOIN user u ON u.id = ldq.created_by_id AND ldq.user_type = 'ADM'
                            LEFT JOIN staff s ON s.current_user_id = u.id
                            LEFT JOIN spsn_user_master sums ON sums.id = ldq.created_by_id AND ldq.user_type IS NULL 
                            LEFT JOIN partner_location_detail pld 
                            ON FIND_IN_SET(pld.location_code, ldq.partner_location_codes) > 0

                            WHERE c.uuid = '${clientUuid}'
 `

            if(createdByUuid?.length > 0)
            {
                sql = sql + ` AND (sums.uuid = '${createdByUuid}' OR u.uuid = '${createdByUuid}' )`
            }

            if(status?.length > 0)
            {
                sql = sql + ` AND ldq.status = '${status}' `
            }  
            
            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(ldq.created_on) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(ldq.created_on) <= DATE('${toDate}')`
            }

            sql = sql + `   ORDER BY ldq.created_on DESC;`

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

db.checkLogStatusesPending = () =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT 
                            ldq.id,
                            ldq.from_date AS fromDate,
                            ldq.to_date AS toDate,
                            ldq.status AS status,
                            ldq.created_on AS createdOn,
                            ldq.created_by_id AS createdById,
                            ldq.user_type AS userType,
                            ldq.file_name AS fileName,
                            ldq.file_path AS filePath,
                            ldq.partner_location_codes AS partnerLocationCodes,
                            ldq.client_id AS clientId,
                            ldq.started_on AS startedOn,
                            ldq.completed_on AS completedOn,
                            ldq.remark AS remark,
                            ldq.encryption_key AS encryptionKey,
                            ldq.encryption_iv AS encryptionIv,
                            ldq.modify_on AS modifyOn,
                            ldq.modify_by_id AS modifyById,
                            ldq.financial_year_id AS financialYearId, 
                            c.uuid AS clientUuid
                        FROM 
                            ledger_download_queue AS ldq
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

db.updateLedgerDownloadQueueStatus = (sql, date) =>
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


db.getOpeningBalance = (codes, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                            id, 
                            partner_location_id AS customerId,  
                            partner_location_code AS customerCode, 
                            opening_balance AS openingBalance, 
                            created_on AS createdOn, 
                            modify_on AS modifiedOn
                        FROM 
                            customer_opening_balance_master
                        WHERE 
                            partner_location_code IN ('${codes}')
                        AND financial_year_id = '${financialYearId}';
                        `


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

module.exports = db
