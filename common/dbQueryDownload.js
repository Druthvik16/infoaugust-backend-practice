let pool = require('../databaseConnection/createconnection')
let db = {}

db.getOpeningBalanceCustomer = (financialYearId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            const sql = ` SELECT   cobm.partner_location_code AS code, 
                                    cobm.opening_balance,
                                    fy.name AS financial_year
                            FROM customer_opening_balance_master cobm
                            LEFT JOIN financial_year fy ON fy.id = cobm.financial_year_id
                            WHERE cobm.financial_year_id = '${financialYearId}'
                            AND cobm.opening_balance = 0
`
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