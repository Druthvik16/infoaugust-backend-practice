let pool = require('../../databaseConnection/createconnection')
let db = {}

db.saveState = (name, createdOn, createdById, countryId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO state (name, created_on, created_by_id, country_id) VALUES (?,  ?, ?, ?)`
            pool.query(sql,[name, createdOn, createdById, countryId],(error, result) => 
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

db.updateState = (name, modifyOn, modifyById, id, countryId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE state SET name = ?, modify_on = ?, modify_by_id = ? WHERE id = ? AND country_id = ?`
            pool.query(sql,[name, modifyOn, modifyById, id, countryId],(error, result) => 
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

db.getStates = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT s.id, s.name, c.name AS countryName, c.id AS countryId
            FROM state s 
            LEFT JOIN country c ON c.id = s.country_id
            WHERE c.id = (SELECT id FROM country WHERE UPPER(name) = UPPER('India'))
            ORDER BY s.name`
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

db.getStatesOfCountry = (countryId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT s.id, s.name, c.name AS countryName, c.id AS countryId
            FROM state s 
            LEFT JOIN country c ON c.id = s.country_id
            WHERE c.id = '${countryId}'
            ORDER BY s.name`
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

db.getUnallocatedStates = (countryId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT s.id, s.name
            FROM state s
            WHERE s.country_id = '${countryId}'
            AND s.id NOT IN (SELECT state_id FROM zone_state)
            ORDER BY s.name`
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

db.getStatesByCountryCode = (countryCode) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT s.id, s.name
            FROM state s
            WHERE s.country_id = (SELECT id FROM country WHERE code = '${countryCode}')
            ORDER BY s.name`
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

db.deleteState = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `DELETE FROM state WHERE id = ${id}`
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

db.countryIsExist = (countryId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT name FROM country WHERE id = ?;`
            pool.query(sql,[countryId],(error, result) => 
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

db.countryIsExistByCode = (countryCode) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT name FROM country WHERE code = ?;`
            pool.query(sql,[countryCode],(error, result) => 
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


db.checkUsedState = (id) => 
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            pool.query(`SELECT IF(COUNT(v.id)> 0,1,(SELECT IF(COUNT(p.id)> 0,1, (SELECT IF(COUNT(cl.id)> 0,1, 0) 
            FROM client cl WHERE cl.state_id = ?)) 
            FROM plant p WHERE p.state_id = ?)) AS isExist
            FROM vendor v
            WHERE v.state_id = ?`, [id, id, id], (error, result) => 
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