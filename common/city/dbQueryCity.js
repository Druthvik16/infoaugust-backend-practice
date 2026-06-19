let pool = require('../../databaseConnection/createconnection')
let db = {}

db.saveCity = (name, createdOn, createdById, countryId, stateId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO city (name, created_on, created_by_id, country_id, state_id) VALUES ('${name}', ?, ${createdById}, ${countryId}, ${stateId})`
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

db.updateCity = (name, modifyOn, modifyById, id, countryId, stateId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE city SET name = '${name}', modify_on = ?, modify_by_id = ${modifyById} WHERE id = ${id} AND country_id = ${countryId} AND state_id = ${stateId}`
            pool.query(sql, [modifyOn], (error, result) => 
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

db.getCities = (stateId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT c.id, c.name, 
            s.name AS stateName, s.id AS stateId
            FROM city c 
            LEFT JOIN state s ON s.id = c.state_id
            WHERE c.state_id = '${stateId}' 
            ORDER BY c.name`
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

db.deleteCity = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `DELETE FROM city WHERE id = ${id}`
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
            let sql = `SELECT name FROM country WHERE id = ${countryId};`
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

db.stateIsExist = (stateId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT name FROM state WHERE id = ${stateId}`
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

db.checkUsedCity = (id) => 
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            pool.query(`SELECT IF(COUNT(v.id)> 0,1,(SELECT IF(COUNT(p.id)> 0,1, (SELECT IF(COUNT(c.id)> 0,1, 0) 
            FROM client c WHERE c.city_id = ?)) 
            FROM plant p WHERE p.city_id = ?)) AS isExist
            FROM vendor v
            WHERE v.city_id = ?`, [id, id, id], (error, result) => 
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