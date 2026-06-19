const pool = require('../databaseConnection/createconnection.js');
let db = {}
db.getS3FileDetails =  (financialYear, clientUuid) => {
    return new Promise((resolve, reject) => {
    try {
        const sql = `SELECT file_name , file_path, encryption_key, encryption_iv FROM ledger_json_file_master  
        JOIN financial_year fy ON fy.id = ledger_json_file_master.financial_year_id
        WHERE fy.name = '${financialYear}' 
        AND client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}')
        LIMIT 1`;
         pool.query(sql, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    } catch (error) {
        throw error;
    }
});
}
db.getS3FileDetailsCA =  (financialYear, clientUuid) => {
    return new Promise((resolve, reject) => {
    try {
        const sql = `SELECT document_file_name as file_name , document_file_path as file_path, encryption_key, encryption_iv FROM client_spsn_upload_document spsnud
        JOIN spsn_document_category spsnd ON spsnd.id = spsnud.document_category_id
        JOIN financial_year fy ON fy.id = spsnud.financial_year_id
        WHERE spsnd.code = 'CA'
        AND fy.name = '${financialYear}' 
        AND spsnud.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}')
        LIMIT 1`;
         pool.query(sql, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    } catch (error) {
        throw error;
    }
});
}
module.exports = db;