let pool = require('../../databaseConnection/createconnection')
let db = {}

db.getRoles = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, code, name FROM role 
                        WHERE code != 'ADM'   
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

module.exports = db