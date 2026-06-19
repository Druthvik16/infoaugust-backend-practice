let pool = require('../../databaseConnection/createconnection')
let db = {}

db.saveCountry = (code, name, createdOn, createdById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO country (code, name, created_on, created_by_id) VALUES (?, ?,  ?, ?)`
            pool.query(sql,[code, name, createdOn, createdById],(error, result) => 
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

db.updateCountry = (code ,name, modifyOn, modifyById, id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE country SET code = ?, name = ?, modify_on = ?, modify_by_id = ? WHERE id = ?`
            pool.query(sql,[code, name, modifyOn, modifyById, id],(error, result) => 
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

db.getPartnerCategories = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT pc.id, pc.name, pc.is_active
                        FROM partner_category pc           
                        ORDER BY pc.name`
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