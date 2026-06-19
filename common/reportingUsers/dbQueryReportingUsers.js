let pool = require('../../databaseConnection/createconnection')
let db = {}

db.saveReportingUser = (name, email, type, createdOn, createdById, clientUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO reporting_user (name, email, type, created_on, created_by_id, client_id) VALUES ('${name}','${email}','${type}',?, '${createdById}', (SELECT id FROM client WHERE uuid = '${clientUuid}'))`
            pool.query(sql,[createdOn],(error, result) => 
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

db.updateReportingUser = (name, email, type, modifyOn, modifyById, clientUuid,id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE reporting_user SET name = '${name}', email = '${email}', type = '${type}', modify_on = ?, modified_by_id = '${modifyById}', client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}') WHERE id = ${id}`
            pool.query(sql,[modifyOn],(error, result) => 
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

db.getReportingUsers = (clientUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT ru.id, ru.name, ru.email, ru.type, c.uuid AS clientUuid, c.name AS clientName  
                        FROM reporting_user  ru
                        LEFT JOIN client c ON c.id = ru.client_id
                        WHERE c.uuid = '${clientUuid}'
                        ORDER BY ru.name`
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

db.deleteCountry = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `DELETE FROM country WHERE id = ${id}`
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

db.checkUsedCountry = (id) => 
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            pool.query(`SELECT IF(COUNT(v.id)> 0,1,(SELECT IF(COUNT(p.id)> 0,1, (SELECT IF(COUNT(c.id)> 0,1, 0) 
            FROM client c WHERE c.country_id = ?)) 
            FROM plant p WHERE p.country_id = ?)) AS isExist
            FROM vendor v
            WHERE v.country_id = ?`, [id, id, id], (error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e){ console.log(e)}
        
    });
}

module.exports = db