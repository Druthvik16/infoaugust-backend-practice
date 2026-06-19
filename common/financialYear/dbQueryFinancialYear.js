let pool = require('../../databaseConnection/createconnection')
let db = {}


db.getFinancialYears = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, name, start_date AS startDate, end_date AS endDate, is_current AS isCurrent 
                        FROM financial_year  
                        WHERE is_active = 1        
                        ORDER BY name`
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
db.saveFinancialYear = (name, start_date, end_date, is_current, is_active) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            const sql = `INSERT INTO financial_year (name, start_date, end_date, is_current, is_active)
               VALUES (?, ?, ?, ?, ?)`;

               const values = [name, start_date, end_date, is_current, is_active];
            pool.query(sql,values,(error, result) => 
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

db.updateFinancialYearIsCurrent = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            const sql = `UPDATE financial_year SET is_current = 0`;
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

db.saveOpeningBalance = (fyId,) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            const sql = `INSERT INTO customer_opening_balance_master (
                                    partner_location_id,
                                    partner_location_code,
                                    opening_balance,
                                    created_on,
                                    financial_year_id
                                )
                                SELECT
                                    pld.id,
                                    pld.code,
                                    0.00,
                                    NOW(),
                                    '${fyId}'
                                FROM partner_location_detail pld
                                WHERE NOT EXISTS (
                                    SELECT 1
                                    FROM customer_opening_balance_master cobm
                                    WHERE cobm.partner_location_id = pld.id AND cobm.financial_year_id = '${fyId}'
                                );
`;
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