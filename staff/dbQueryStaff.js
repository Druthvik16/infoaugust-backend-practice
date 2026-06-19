let pool = require('../databaseConnection/createconnection')
let db = {}

db.saveStaff = (uuid, name, currentUserId, email, mobile, address, createdById, createdOn, isActive) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO staff (uuid, name, current_user_id, email, mobile, address, created_on, created_by_id, is_active) VALUES ('${uuid}', '${name}', '${currentUserId}', '${email}', '${mobile}','${address}', ?, ${createdById}, ${isActive})`
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

db.updateStaff = (uuid, name, currentUserId, email, mobile, address, modifyById, modifyOn, isActive) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE staff SET name = '${name}', current_user_id = '${currentUserId}', email = '${email}', mobile = '${mobile}', address = '${address}', modify_on = ?, modify_by_id = ${modifyById}, is_active = ${isActive} 
            WHERE uuid = '${uuid}'`
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

db.getUnallocatedStaffs = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT s.uuid, s.name 
            FROM staff s
            WHERE s.current_user_id = 0
            AND s.is_active = 1 `
            
            sql = sql + ` ORDER BY s.name`
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

db.getLinkedUserId = (allocatedToUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.id, u.linked_to_id, r.code 
            FROM user u
            LEFT JOIN role r ON r.id = u.role_id
            WHERE u.uuid = '${allocatedToUuid}'`
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

db.getReturnUuid = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT uuid
            FROM staff
            WHERE id = ${id}`
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

db.getStaffs = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.name AS userName, u.uuid AS userUuid, 
            s.id AS staffId, s.name AS staffName, s.email AS staffEmail, s.mobile AS staffMobile, s.address AS staffAddress, s.is_active AS staffIsActive, 
                s.current_user_id AS staffCurrentUserId, s.uuid AS staffUuid,
                s.created_on AS userCreatedOn, s.modify_on AS userModifyOn,
                cb.name AS userCreatedByName, cb.uuid AS userCreatedByUuid, mb.name AS userModifyByName, mb.uuid AS userModifyByUuid
                    FROM staff s 		
                    LEFT JOIN user u ON u.id = s.current_user_id AND u.is_active = 1 
                    LEFT JOIN role r ON r.id = u.role_id 
                    LEFT JOIN user cb ON cb.id = s.created_by_id
                    LEFT JOIN user mb ON mb.id = s.modify_by_id
                    WHERE IF(s.current_user_id > 0, r.code != 'ADM', s.id != 0)
                    `
            //  
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

db.getStaff = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.name AS userName, u.uuid AS userUuid, 
            s.id AS staffId, s.name AS staffName, s.email AS staffEmail, s.mobile AS staffMobile, s.address AS staffAddress, s.is_active AS staffIsActive, 
                s.current_user_id AS staffCurrentUserId, s.uuid AS staffUuid,
                s.created_on AS userCreatedOn, s.modify_on AS userModifyOn,
                cb.name AS userCreatedByName, cb.uuid AS userCreatedByUuid, mb.name AS userModifyByName, mb.uuid AS userModifyByUuid
                    FROM staff s 		
                    LEFT JOIN user u ON u.id = s.current_user_id AND u.is_active = 1 
                    LEFT JOIN role r ON r.id = u.role_id 
                    LEFT JOIN user cb ON cb.id = s.created_by_id
                    LEFT JOIN user mb ON mb.id = s.modify_by_id
                    WHERE IF(s.current_user_id > 0, r.code != 'ADM' AND s.uuid = '${uuid}', s.uuid = '${uuid}')
                    `
            //  
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

db.updateStatus = (uuid, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE staff SET is_active = IF(is_active = 1,0,1), modify_on = ?, modify_by_id = '${modifyById}' WHERE uuid = '${uuid}'`
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

db.staffAllocationHistoy = (staffId, userId, allocatedOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO staff_user_allocation_history (staff_id, user_id, allocated_on) VALUES ('${staffId}', '${userId}', ?)`
            pool.query(sql, [allocatedOn], (error, result) => 
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

db.staffDeallocationHistoy = (staffId, userId, deAllocatedOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE staff_user_allocation_history SET deallocated_on = ? 
            WHERE deallocated_on IS NULL 
            AND user_id = '${userId}'
            AND staff_id = '${staffId}'`
            pool.query(sql, [deAllocatedOn], (error, result) => 
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

db.allocateStaffToUser = (id, staffId, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE user SET linked_to_id = '${staffId}', modify_on = ?, modify_by_id = '${modifyById}' 
            WHERE id = '${id}'`
            pool.query(sql, [modifyOn],(error, result) => 
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

db.getUserData = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.id, u.uuid, u.linked_to_id AS linkedToId, r.code 
            FROM user u
            LEFT JOIN role r ON r.id = u.role_id
            WHERE u.linked_to_id = (SELECT id FROM staff WHERE uuid = '${uuid}') 
            AND u.is_active = 1`
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

db.getStaffData = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT s.id, s.current_user_id
            FROM staff s
            WHERE s.uuid = '${uuid}'
            AND s.is_active = 1`
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

db.deallocateStaffFromUser = (id, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE user SET linked_to_id = null, modify_on = ?, modify_by_id = '${modifyById}'
            WHERE id = '${id}'`
            pool.query(sql, [modifyOn],(error, result) => 
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