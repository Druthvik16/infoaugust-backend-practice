let pool = require('../../databaseConnection/createconnection')
let db = {}

db.getLogProcesses = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, code, name FROM vendor_hmtl_log_process       
                        ORDER BY id`
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

db.getLogDocumentType = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, code, name 
                        FROM vendor_hmtl_log_doc_file_type       
                        ORDER BY id`
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

db.getPdfBotLogs = () => 
    {
        return new Promise((resolve, reject) => 
        {
            try
            {
                let sql = `SELECT id, bot_name AS botName, is_bill_number_exist AS isBillNumber, is_bot_execute AS isBotExecute, is_pdf_file_exist AS isPdfFile, 
                last_active_on AS lastActiveOn, bot_status AS botStatus, is_summary_file_exist AS isSummaryFile   
                FROM vendor_pdf_bot_process_log;`
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

db.getPdfBotLogDetails = (date, botName) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, bot_name AS botName, started_on AS startedOn, completed_on AS completedOn 
            FROM vendor_pdf_bot_process_log_detail 
            WHERE bot_name = '${botName}'
            AND DATE(started_on) >= '${date}';`
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

db.getDailyActivityLogDetails = (date) => 
    {
        return new Promise((resolve, reject) => 
        {
            try
            {
                let sql = `SELECT dal.activity_date AS activityDate, dad.activity_name AS activityName, dad.activity_type AS activityType, dad.opening_remark AS openingRemark, 
                dad.closing_remark AS closingRemark, dad.started_on AS startedOn, dad.end_on AS endOn,
                c.uuid AS clientUuid, c.name AS clientName 
                FROM vendor_daily_activity_detail dad 
                JOIN vendor_daily_activity_log dal ON dal.id = dad.vendor_daily_activity_detail_id AND DATE(dal.activity_date) =  '${date}'
                LEFT JOIN client c ON c.id = dad.client_id; `
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

module.exports = db