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

db.getClientUploadedDocDetail = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = ` SELECT 
                           *
                        FROM client_uploaded_document_detail
                        WHERE id = '${id}' `
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
db.deleteClientUploadedDetail = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = ` DELETE FROM client_uploaded_document_detail
                        WHERE id = '${id}' `
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
            return reject(e);
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
                            dj.id ,
                            djd.id AS detail_id,
                            djd.matched_document_master_id,
                            djd.matched_document_detail_id
                        FROM 
                            document_cleanup_job dj
                        JOIN 
                            document_cleanup_job_detail djd ON djd.document_cleanup_job_id = dj.id
                        WHERE 
                            djd.status = 'Pending'
                            AND dj.status = 'Approved'
                        LIMIT 300
                            ;
                        `

                // dj.status = 'Approved'
                //     AND 
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

db.updateDocumentCleanupQueueStatus = (sql, date) =>
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


db.checkAndMarkJobAsComplete = async (jobId) => {
    try {
        const sql = `
            SELECT COUNT(*) AS pendingCount
            FROM document_cleanup_job_detail
            WHERE document_cleanup_job_id = ${jobId}
              AND status IN ('Queued', 'Processing', 'Pending')`;

        const [rows] = await pool.promise().query(sql);

        if (rows[0].pendingCount == 0) {
            const sqlUpdate = `UPDATE document_cleanup_job SET processing_status = 'Finished' WHERE id = ${jobId}`;
            await pool.promise().query(sqlUpdate);
        }
    } catch (e) {
        console.log("checkAndMarkJobAsComplete error", e);
    }
}

db.checkAndMarkAllApprovedJobsAsComplete = async () => {
    try {
        // First, get all approved jobs
        const getJobsSql = `
            SELECT id FROM document_cleanup_job 
            WHERE status = 'Approved'
        `;
        const [jobs] = await pool.promise().query(getJobsSql);

        for (const job of jobs) {
            const jobId = job.id;

            // Check if any details are still pending for this job
            const checkPendingSql = `
                SELECT COUNT(*) AS pendingCount
                FROM document_cleanup_job_detail
                WHERE document_cleanup_job_id = ${jobId}
                  AND status IN ('Queued', 'Processing', 'Pending')
            `;
            const [pendingRows] = await pool.promise().query(checkPendingSql);

            // If no pending items, mark the job as Finished
            if (pendingRows[0].pendingCount === 0) {
                const updateSql = `
                    UPDATE document_cleanup_job 
                    SET processing_status = 'Finished' 
                    WHERE id = ${jobId}
                `;
                await pool.promise().query(updateSql);
            }
        }
    } catch (e) {
        console.log("checkAndMarkAllApprovedJobsAsComplete error:", e);
    }
};



module.exports = db
