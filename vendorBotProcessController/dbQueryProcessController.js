let pool = require('../databaseConnection/createconnection')
let db = {}

db.checkBillNoExistCreditNote = (documentAttachmentId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT IF(COUNT(cudm.id) > 0, 1, 0) AS isBillNoExist 
            FROM client_uploaded_document_master cudm 
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = '${documentAttachmentId}'
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Credit Note'
            WHERE cudd.client_uploaded_document_master_id IS NULL;`
            pool.query(sql,(error, result) => 
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
            throw e
        }
    })
}

db.checkBillNoExistInvoice = (documentAttachmentId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT IF(COUNT(cudm.id) > 0, 1, 0) AS isBillNoExist 
            FROM client_uploaded_document_master cudm 
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = '${documentAttachmentId}'
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Invoice'
            WHERE cudd.client_uploaded_document_master_id IS NULL;`
            pool.query(sql,(error, result) => 
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
            throw e
        }
    })
}

db.getDocumentAttachmentId = (name) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT da.id
            FROM document_attachment da 
            WHERE da.name = '${name}'`
            pool.query(sql,(error, result) => 
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
            throw e
        }
    })
}

db.getClientsUuid = () =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT uuid
                                    FROM client
                                    WHERE is_doc_folder = 1 
                                    AND is_active = 1
                                    AND (service_type_id = 2 OR service_type_id = 3)
                                    AND (linked_user_id IS NOT NULL OR linked_user_id != '')`
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

db.updatePdfBotProcessLog = (botName, isBillNoExist, isExecuteBot, isSummaryFileExist, isPdfFileExist, botStatus) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE pdf_bot_process_log SET is_bot_execute = '${isExecuteBot}', is_bill_number_exist = '${isBillNoExist}', is_summary_file_exist = '${isSummaryFileExist}', is_pdf_file_exist = '${isPdfFileExist}', bot_status = '${botStatus}'
            WHERE bot_name = '${botName}'; `
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

db.updatePdfBotProcessLogStatus = (botName, botStatus, isBillNoExist, isSummaryFileExist, isPdfFileExist, isExecuteBot, lastActiveOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE vendor_pdf_bot_process_log SET bot_status = '${botStatus}', is_bill_number_exist = '${isBillNoExist}',
            is_summary_file_exist = '${isSummaryFileExist}', 
            is_pdf_file_exist = '${isPdfFileExist}', 
            is_bot_execute = '${isExecuteBot}', 
            last_active_on = ? 
            WHERE bot_name = '${botName}'; `
            pool.query(sql, [lastActiveOn], (error, result) => 
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

db.insertPdfBotProcessLogDetail = (botName, startedOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `INSERT INTO vendor_pdf_bot_process_log_detail (bot_name, started_on) VALUES ('${botName}', ?); `
            pool.query(sql, [startedOn], (error, result) => 
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

db.updatePdfBotProcessLogDetail = (detailId, completedOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE vendor_pdf_bot_process_log_detail SET completed_on = ? WHERE id = '${detailId}' `
            pool.query(sql, [completedOn], (error, result) => 
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

db.checkBotStatus = (botName) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT is_bot_execute AS isExecuteBot, is_bill_number_exist AS isBillNumber, is_summary_file_exist AS isSummaryFile, is_pdf_file_exist AS isPDFFile, bot_status AS botStatus   
                                    FROM vendor_pdf_bot_process_log
                                    WHERE bot_name = '${botName}'`
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

db.updateDailyActivityLogDetail = (activityType, activityName, closingRemark, date) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                let sql = `UPDATE vendor_daily_activity_detail 
                SET closing_remark = '${closingRemark}', end_on = ?
                WHERE id IN (
                    SELECT id FROM (
                        SELECT dad.id 
                        FROM vendor_daily_activity_detail AS dad 
                        JOIN vendor_daily_activity_log AS dal ON dad.vendor_daily_activity_detail_id = dal.id 
                        WHERE dad.activity_type = '${activityType}' 
                            AND dad.activity_name = '${activityName}' 
                            AND DATE(dal.activity_date) = DATE(?)
                        ORDER BY dad.id DESC 
                        LIMIT 1
                    ) AS tmp
                );`
                pool.query(sql, [date, date], (error, result) => 
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

module.exports = db