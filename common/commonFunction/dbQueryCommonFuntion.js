let pool = require('../../databaseConnection/createconnection')
let db = {}

db.getUnique = (sql) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
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

db.getUserById = (userId) =>
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            pool.query(`SELECT u.uuid, u.password, u.id, u.fullName,
            u.user_type_id, u.last_logged_in, ut.name AS user_type_name, ut.code AS user_type_code
            FROM user u
            LEFT JOIN user_type ut ON ut.id = u.user_type_id
            WHERE u.id = ? AND u.is_active = 1`, [userId], (error, users) => 
            {
                if(error)
                {
                    return reject(error);
                }
                return resolve(users);
            });
        }
        catch(e)
        { 
            console.log(e)
        }
    });
};

db.getIdByUUId = (tableName, Uuid) =>
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            pool.query(`SELECT id
            FROM ${tableName}
            WHERE uuid = ?`, [Uuid], (error, results) => 
            {
                if(error)
                {
                    return reject(error);
                }
                return resolve(results);
            });
        }
        catch(e)
        { 
            console.log(e)
        }
    });
};

db.removeMasterAssociatedClient = (tableName, Uuid, id) =>
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE ${tableName} SET client_id = 0
            WHERE ` 
            if(Uuid != '')
            {
                sql = sql + `uuid = '${Uuid}'`
            }
            else
            {
                sql = sql + `id = ${id}`
            }
            
            pool.query(sql, (error, results) => 
            {
                if(error)
                {
                    return reject(error);
                }
                return resolve(results);
            });
        }
        catch(e)
        { 
            console.log(e)
        }
    });
};

db.dupEmail = (email, tableName) => {
    return new Promise((resolve, reject)=>{
        try{pool.query(`SELECT uuid FROM ${tableName} WHERE UPPER(email) LIKE UPPER(?)`, [email], (error, result)=>{
            if(error){
            return reject(error);
             }          
            return resolve(result);
            });
        }
        catch(e){ console.log(e)}
        
        });
}

db.dupMobile = (mob, tableName) => {
    return new Promise((resolve, reject)=>{
        try{pool.query(`SELECT uuid FROM ${tableName} WHERE mobile LIKE ?`, [mob], (error, result)=>{
            if(error){
            return reject(error);
             }          
            return resolve(result);
            });
        }
        catch(e){ console.log(e)}
        
        });
}

db.updateClientDocStatus = (uuid) => {
    return new Promise((resolve, reject)=>
    {
        try
        {
            pool.query(`UPDATE client SET is_doc_folder = 1 WHERE uuid = '${uuid}'`, (error, result)=>
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
            console.log(e)
        }
    });
}

db.saveDataTransactLog = (activity,user,partnerUuid,locationUuid,fileSize,apiName,storageType,createdOn, clientUuid, fileName) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}','${partnerUuid}','${locationUuid}','${fileSize}','${apiName}','${storageType}',?, (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${fileName}')`
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
db.saveInfoaugustActivityLog = (createdById, userType, userTypeTable, activityTag, activityText, objectId, objectTable, additionalInfo, status) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO infoaugust_activity_log (created_by_id,  user_type,  user_type_table,  activity_tag,  activity_text,  object_id,  object_table,  additional_info,  status) VALUES ( '${createdById}',  ?,  ?,  '${activityTag}',  '${activityText}',  '${objectId}',  '${objectTable}', ?,  ?);`
            pool.query(sql, [userType, userTypeTable, additionalInfo, status], (error, result) => 
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