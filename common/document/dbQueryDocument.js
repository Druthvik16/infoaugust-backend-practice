let pool = require('../../databaseConnection/createconnection')
let db = {}

db.saveDocument = (name, documentCategoryId, documentAttachmentIds, createdOn, createdById, isActive, code) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO document (name, document_category_id, document_attachment_ids, created_on, created_by_id, is_active, code) VALUES ('${name}', '${documentCategoryId}', '${documentAttachmentIds}', ?, '${createdById}', '${isActive}', '${code}')`
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

db.updateDocument = (id, name, documentCategoryId, documentAttachmentIds, code) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE document SET name = '${name}', document_category_id = '${documentCategoryId}', document_attachment_ids = '${documentAttachmentIds}', code = '${code}' WHERE id = '${id}'`
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

db.getDocuments = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT d.id, d.name, d.code,  
            dc.id AS documentCategoryId, dc.name AS documentCategoryName, dc.code AS documentCategoryCode, 
            da.id AS documentAttachmentId, da.name AS documentAttachmentName 
            FROM document d
            LEFT JOIN  document_category dc ON dc.id = d.document_category_id
            LEFT JOIN document_attachment da ON FIND_IN_SET(da.id,d.document_attachment_ids) > 0
            WHERE d.is_active = 1
            ORDER BY d.name, da.id`
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