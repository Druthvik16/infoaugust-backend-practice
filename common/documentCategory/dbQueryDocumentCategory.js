let pool = require('../../databaseConnection/createconnection')
let db = {}

db.saveDocumentCategory = (name, createdOn, createdById, isActive, code) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO document_category (name, created_on, created_by_id, is_active, code) VALUES ('${name}', ?, '${createdById}', '${isActive}', '${code}')`
            pool.query(sql, [createdOn], (error, result) => 
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

db.updateDocumentCategory = (id, name, code) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE document_category SET name = '${name}', code = '${code}' WHERE id = '${id}'`
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
            throw e
        }
    })
}

db.getDocumentCategories = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT dc.id, dc.name, dc.code, 
            1 AS isExist
            FROM document_category dc
            WHERE dc.is_active = 1
            ORDER BY dc.name`
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

db.deleteDocumentCategory = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `DELETE FROM document_category WHERE id = ${id}`
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