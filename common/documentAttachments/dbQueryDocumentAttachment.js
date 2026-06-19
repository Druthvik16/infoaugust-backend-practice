let pool = require('../../databaseConnection/createconnection')
let db = {}

db.getDocumentAttachemnts = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT da.id, da.name, da.created_on, da.created_by_id, 
            mt.name AS mimeTypeName, mt.id AS mimeTypeId, mt.mime AS mimeTypeMime,  
			cb.name AS createdName, cb.uuid AS createdUuid 
            FROM document_attachment da 
            LEFT JOIN user cb ON cb.id = da.created_by_id
            LEFT JOIN mime_type mt ON FIND_IN_SET(mt.id,da.mime_type_ids) > 0
            ORDER BY da.name`
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

module.exports = db