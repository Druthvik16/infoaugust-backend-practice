let pool = require('../../databaseConnection/createconnection')
let db = {}

db.getLogProcesses = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, code, name FROM spsn_hmtl_log_process       
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
                        FROM spsn_hmtl_log_doc_file_type       
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

db.getDailyActivityLogDetails = (date) => 
    {
        return new Promise((resolve, reject) => 
        {
            try
            {
                let sql = `SELECT dal.activity_date AS activityDate, dad.activity_name AS activityName, dad.activity_type AS activityType, dad.opening_remark AS openingRemark, 
                dad.closing_remark AS closingRemark, dad.started_on AS startedOn, dad.end_on AS endOn,
                c.uuid AS clientUuid, c.name AS clientName 
                FROM spsn_daily_activity_detail dad 
                JOIN spsn_daily_activity_log dal ON dal.id = dad.spsn_daily_activity_detail_id AND DATE(dal.activity_date) =  '${date}'
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