let pool = require('../databaseConnection/createconnection')
let db = {}

db.insertUser = (uuid,name,linkedToId,roleId,createdById,password,createdOn, isActive, passKey, managerUserId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO user (uuid, name, linked_to_id, password, role_id, created_on, created_by_id, is_active, assigned_manager_id) VALUES ('${uuid}', '${name}', '${linkedToId}', HEX(AES_ENCRYPT('${password}', '${passKey}')), '${roleId}', ?, ${createdById}, ${isActive}, '${managerUserId}')`
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
db.insertAddonUser = (email,mobile,linkedToId,roleId,createdById,createdOn, isActive) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO additional_login_user (email, mobile, mapped_id, role_id, created_on, created_by_id, is_active) VALUES ('${email}', '${mobile}', '${linkedToId}', '${roleId}', ?, ${createdById}, ${isActive})`
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

db.getUsers = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            // let sql = `SELECT distinct u.id AS userId, u.name AS userName, u.linked_to_id AS userLinkedToId, u.role_id AS userRoleId, u.uuid AS userUuid, 
            // u.last_logged_in AS userLastLogin, u.is_active AS userIsActive, u.created_on AS userCreatedOn, u.modify_on AS userModifyOn,
            // cb.name AS userCreatedByName, cb.uuid AS userCreatedByUuid, mb.name AS userModifyByName, mb.uuid AS userModifyByUuid, 
            // c.id AS clientId, c.name AS clientName, c.short_name AS clientShortName, c.code AS clientCode, c.email AS clientEmail, c.mobile AS clientMobile, c.gstin AS clientGstIn, c.pan AS clientPan, c.tan AS clientTan, c.city AS clientCity, c.state_id AS clientStateId, 
            // c.pincode AS clientPinCode, c.linked_user_id AS clientLinkedUserId, c.is_active AS clientIsActive, c.uuid AS clientUuid,
            // s.id AS staffId, s.name AS staffName, s.email AS staffEmail, s.mobile AS staffMobile, s.address AS staffAddress, s.is_active AS staffIsActive, 
            //             s.current_user_id AS staffCurrentUserId, s.uuid AS staffUuid,
            //             r.id AS roleId, r.code AS roleCode, r.name AS roleName,
            //             (select IF(((r.code = 'CLNT') && ((SELECT COUNT(id) FROM partner_client_mapping WHERE client_id = u.linked_to_id)>0)),1,0)) AS isExist
            //                 FROM user u
            //                 JOIN role r ON r.id = u.role_id
            //                 LEFT JOIN staff s ON s.id = u.linked_to_id AND s.is_active = 1 AND r.code != 'CLNT'
            //                 LEFT JOIN client c ON c.id = u.linked_to_id AND c.is_active = 1 AND r.code = 'CLNT'
            //                 LEFT JOIN user cb ON cb.id = u.created_by_id
            //                 LEFT JOIN user mb ON mb.id = u.modify_by_id
            //                 WHERE r.code != 'ADM'`
            //  

            let sql = `SELECT userId, userName, userLinkedToId, userRoleId, userUuid, userLastLogin, userIsActive, 
userCreatedOn, userModifyOn, userCreatedByName, userCreatedByUuid, userModifyByName, userModifyByUuid, clientId, clientName,
 clientShortName, clientCode, clientEmail, clientMobile, clientGstIn, clientPan, clientTan, clientCity, clientStateId, clientPinCode,
 clientLinkedUserId, clientIsActive, clientUuid,staffId, staffName, staffEmail, staffMobile, staffAddress, staffIsActive,
 staffCurrentUserId, staffUuid, roleId, roleCode, roleName, isExist FROM (
SELECT distinct 
u.id AS userId,
 u.name AS userName, 
 u.linked_to_id AS userLinkedToId, 
 u.role_id AS userRoleId, 
 u.uuid AS userUuid, 
		u.last_logged_in AS userLastLogin, 
        u.is_active AS userIsActive, 
        u.created_on AS userCreatedOn, 
		u.modify_on AS userModifyOn,
		cb.name AS userCreatedByName, 
        cb.uuid AS userCreatedByUuid, 
        mb.name AS userModifyByName, 
        mb.uuid AS userModifyByUuid, 
		c.id AS clientId, 
        c.name AS clientName, 
        c.short_name AS clientShortName, 
        c.code AS clientCode, 
        c.email AS clientEmail, 
		c.mobile AS clientMobile, 
        c.gstin AS clientGstIn, 
        c.pan AS clientPan, 
        c.tan AS clientTan, 
        c.city AS clientCity, 
		c.state_id AS clientStateId, 
		c.pincode AS clientPinCode, 
        c.linked_user_id AS clientLinkedUserId, 
        c.is_active AS clientIsActive, 
        c.uuid AS clientUuid,
		s.id AS staffId, 
        s.name AS staffName, 
        s.email AS staffEmail, 
        s.mobile AS staffMobile, 
        s.address AS staffAddress,
		s.is_active AS staffIsActive, 
					s.current_user_id AS staffCurrentUserId, 
                    s.uuid AS staffUuid,
					r.id AS roleId, 
                    r.code AS roleCode, 
                    r.name AS roleName,
					(select IF(((r.code = 'CLNT') && ((SELECT COUNT(id) FROM partner_client_mapping
					WHERE client_id = u.linked_to_id)>0)),1,0)) AS isExist
						FROM user u
						JOIN role r ON r.id = u.role_id
						LEFT JOIN staff s ON s.id = u.linked_to_id AND s.is_active = 1 AND r.code != 'CLNT'
						LEFT JOIN client c ON c.id = u.linked_to_id AND c.is_active = 1 AND r.code = 'CLNT'
						LEFT JOIN user cb ON cb.id = u.created_by_id
						LEFT JOIN user mb ON mb.id = u.modify_by_id
						WHERE r.code != 'ADM'
                        UNION 
                        
SELECT distinct 
u.id AS userId,
 u.email AS userName, 
 u.mapped_id AS userLinkedToId, 
 u.role_id AS userRoleId, 
 u.id AS userUuid, 
		u.last_logged_in AS userLastLogin, 
        u.is_active AS userIsActive, 
        u.created_on AS userCreatedOn, 
		u.modify_on AS userModifyOn,
		cb.name AS userCreatedByName, 
        cb.uuid AS userCreatedByUuid, 
        mb.name AS userModifyByName, 
        mb.uuid AS userModifyByUuid, 
		c.id AS clientId, 
        c.name AS clientName, 
        c.short_name AS clientShortName, 
        c.code AS clientCode, 
        c.email AS clientEmail, 
		c.mobile AS clientMobile, 
        c.gstin AS clientGstIn, 
        c.pan AS clientPan, 
        c.tan AS clientTan, 
        c.city AS clientCity, 
		c.state_id AS clientStateId, 
		c.pincode AS clientPinCode, 
        c.linked_user_id AS clientLinkedUserId, 
        c.is_active AS clientIsActive, 
        c.uuid AS clientUuid,
		s.id AS staffId, 
        s.name AS staffName, 
        s.email AS staffEmail, 
        s.mobile AS staffMobile, 
        s.address AS staffAddress,
		s.is_active AS staffIsActive, 
					s.current_user_id AS staffCurrentUserId, 
                    s.uuid AS staffUuid,
					r.id AS roleId, 
                    r.code AS roleCode, 
                    r.name AS roleName,
					(select IF(((r.code = 'CLNT') && ((SELECT COUNT(id) FROM partner_client_mapping
					WHERE client_id = u.mapped_id)>0)),1,0)) AS isExist
						FROM additional_login_user u
						JOIN role r ON r.id = u.role_id
						LEFT JOIN staff s ON s.id = u.mapped_id AND s.is_active = 1 AND r.code != 'CLNT'
						LEFT JOIN client c ON c.id = u.mapped_id AND c.is_active = 1 AND r.code = 'CLNT'
						LEFT JOIN user cb ON cb.id = u.created_by_id
						LEFT JOIN user mb ON mb.id = u.modify_by_id
						WHERE r.code != 'ADM'
                        ) AS customTable
	`
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

db.getUser = (userUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.id AS userId, u.name AS userName, u.linked_to_id AS userLinkedToId, u.role_id AS userRoleId, u.uuid AS userUuid, 
            u.last_logged_in AS userLastLogin, u.is_active AS userIsActive, u.created_on AS userCreatedOn, u.modify_on AS userModifyOn,
            cb.name AS userCreatedByName, cb.uuid AS userCreatedByUuid, mb.name AS userModifyByName, mb.uuid AS userModifyByUuid, 
            c.id AS clientId, c.name AS clientName, c.short_name AS clientShortName, c.code AS clientCode, c.email AS clientEmail, c.mobile AS clientMobile, c.gstin AS clientGstIn, c.pan AS clientPan, c.tan AS clientTan, c.city AS clientCity, c.state_id AS clientStateId, 
            c.pincode AS clientPinCode, c.linked_user_id AS clientLinkedUserId, c.is_active AS clientIsActive, c.uuid AS clientUuid,
            s.id AS staffId, s.name AS staffName, s.email AS staffEmail, s.mobile AS staffMobile, s.address AS staffAddress, s.is_active AS staffIsActive, 
                        s.current_user_id AS staffCurrentUserId, s.uuid AS staffUuid,
                        ucp.id AS userClientPartnerId, ucp.user_id AS userClientPartnerUserId, ucp.client_id AS userClientPartnerClientId, 
                        ucp.partner_id AS userClientPartnerPartnerId, ucp.is_active AS userClientPartnerIsActive,
                        ucp.uuid AS userClientPartnerUuid,
                        ucpc.id AS userClientId, ucpc.name AS userClientName, ucpc.short_name AS userClientShortName,
                        ucpc.code AS userClientCode, ucpc.email AS userClientEmail, ucpc.mobile AS userClientMobile, 
                        ucpc.gstin AS userClientGstIn, ucpc.pan AS userClientPan, ucpc.tan AS userClientTan, ucpc.city AS userClientCity, 
                        ucpc.state_id AS userClientStateId, ucpc.pincode AS userClientPinCode, ucpc.linked_user_id AS userClientLinkedUserId, 
                        ucpc.is_active AS userClientIsActive, ucpc.uuid AS userClientUuid, 
                        uam.name AS assignedManagerName, uam.uuid AS assignedManagerUuid, 
                        r.id AS roleId, r.code AS roleCode, r.name AS roleName,
                        (select IF(((r.code = 'CLNT') && ((SELECT COUNT(id) FROM partner_client_mapping WHERE client_id = u.linked_to_id)>0)),1,0)) AS isExist
                            FROM user u
                            JOIN role r ON r.id = u.role_id
                            LEFT JOIN staff s ON s.id = u.linked_to_id AND s.is_active = 1 AND r.code != 'CLNT'
                            LEFT JOIN client c ON c.id = u.linked_to_id AND c.is_active = 1 AND r.code = 'CLNT'
                            LEFT JOIN user_client_partner ucp ON ucp.user_id = u.id AND ucp.is_active = 1 AND (r.code = 'MGR' OR r.code = 'EXE')
                            LEFT JOIN client ucpc ON ucpc.id = ucp.client_id AND ucpc.is_active = 1 AND (r.code = 'MGR' OR r.code = 'EXE')
                            LEFT JOIN user uam ON uam.id = u.assigned_manager_id AND uam.is_active = 1 AND (r.code = 'EXE')
                            LEFT JOIN user cb ON cb.id = u.created_by_id
                            LEFT JOIN user mb ON mb.id = u.modify_by_id
                            WHERE u.uuid = '${userUuid}'`
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

db.getAddonUser = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.id AS userId, u.email AS userName, u.mapped_id AS userLinkedToId, u.role_id AS userRoleId, u.id AS userUuid, 
            u.last_logged_in AS userLastLogin, u.is_active AS userIsActive, u.created_on AS userCreatedOn, u.modify_on AS userModifyOn,
            cb.name AS userCreatedByName, cb.uuid AS userCreatedByUuid, mb.name AS userModifyByName, mb.uuid AS userModifyByUuid, 
            c.id AS clientId, c.name AS clientName, c.short_name AS clientShortName, c.code AS clientCode, c.email AS clientEmail, 
            c.mobile AS clientMobile, c.gstin AS clientGstIn, c.pan AS clientPan, c.tan AS clientTan, c.city AS clientCity, 
            c.state_id AS clientStateId, c.pincode AS clientPinCode, c.linked_user_id AS clientLinkedUserId, c.is_active AS clientIsActive, 
            c.uuid AS clientUuid,
            s.id AS staffId, s.name AS staffName, s.email AS staffEmail, s.mobile AS staffMobile, s.address AS staffAddress, 
            s.is_active AS staffIsActive, s.current_user_id AS staffCurrentUserId, s.uuid AS staffUuid,
            r.id AS roleId, r.code AS roleCode, r.name AS roleName,
            (select IF(((r.code = 'CLNT') && ((SELECT COUNT(id) FROM partner_client_mapping WHERE client_id = u.mapped_id)>0)),1,0)) AS isExist
            FROM additional_login_user u
            JOIN role r ON r.id = u.role_id
            LEFT JOIN staff s ON s.id = u.mapped_id AND s.is_active = 1 AND r.code != 'CLNT'
            LEFT JOIN client c ON c.id = u.mapped_id AND c.is_active = 1 AND r.code = 'CLNT'
            LEFT JOIN user cb ON cb.id = u.created_by_id
            LEFT JOIN user mb ON mb.id = u.modify_by_id
            WHERE u.id = '${id}'`
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

db.getUserClientPartners = (userUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT ucp.id AS userClientPartnerId, ucp.user_id AS userClientPartnerUserId, ucp.client_id AS userClientPartnerClientId,
            ucp.partner_id AS userClientPartnerPartnerId,
            ucp.is_active AS userClientPartnerIsActive, ucp.uuid AS userClientPartnerUuid,
            ucpc.id AS userClientId, ucpc.name AS userClientName, ucpc.short_name AS userClientShortName,
            ucpc.code AS userClientCode, ucpc.email AS userClientEmail, ucpc.mobile AS userClientMobile, 
            ucpc.gstin AS userClientGstIn, ucpc.pan AS userClientPan, ucpc.tan AS userClientTan, ucpc.city AS userClientCity,
            ucpc.state_id AS userClientStateId, ucpc.pincode AS userClientPinCode, ucpc.linked_user_id AS userClientLinkedUserId,
            ucpc.is_active AS userClientIsActive, ucpc.uuid AS userClientUuid,
            p.name AS userClientPartnerPartnerName, p.pan AS userClientPartnerPartnerPan, p.partner_category_id AS userClientPartnerPartnerPartnerCategoryId,
            p.is_active AS userClientPartnerPartnerIsActive, p.uuid AS userClientPartnerPartnerUuid,
            pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationName 
                    FROM user_client_partner ucp
                    LEFT JOIN client ucpc ON ucpc.id = ucp.client_id AND ucpc.is_active = 1        
                    LEFT JOIN partner p ON p.id = ucp.partner_id AND p.is_active = 1 
                    LEFT JOIN partner_location_detail pld ON pld.id = ucp.partner_location_detail_id AND pld.is_active = 1
                    WHERE ucp.user_id = (SELECT id FROM user WHERE uuid = '${userUuid}')`
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
// getAllocatedManagerUsers
db.getAllocatedManagerUsers = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT distinct u.id,u.uuid, u.name 
            FROM user u
            JOIN role r ON r.id = u.role_id
            JOIN user_client_partner ucp ON ucp.user_id = u.id AND ucp.partner_location_detail_id 
				NOT IN (SELECT ucpl.partner_location_detail_id 
				FROM user_client_partner ucpl
                LEFT JOIN user ucplu ON ucpl.user_id = ucplu.id
                LEFT JOIN role ur ON ur.id = ucplu.role_id AND ur.code = 'EXE'
				WHERE ucpl.user_id IN (SELECT id FROM user WHERE assigned_manager_id = u.id)) AND ucp.partner_location_detail_id != 0
            WHERE u.is_active = 1
            AND r.code = 'MGR'`
            
            sql = sql + ` ORDER BY u.name;`
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

db.getUnallocatedUsers = (role) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.uuid, u.name 
            FROM user u
            JOIN role r ON r.id = u.role_id
            WHERE (u.linked_to_id IS NULL OR u.linked_to_id = 0) 
            AND u.is_active = 1
            `

            if(role == 'client')
            {
                sql = sql + ` AND r.code = 'CLNT'`
            }
            else
            {
                sql = sql + ` AND r.code != 'CLNT'`
            }
            
            sql = sql + ` ORDER BY u.name`
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

db.deleteUserClientPartner = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `DELETE FROM user_client_partner WHERE uuid = '${uuid}'`
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

db.deleteUserClientPartnerByUser = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `DELETE FROM user_client_partner WHERE user_id = (SELECT id FROM user WHERE uuid = '${uuid}')`
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

db.deleteUserClientPartnerByUserAndClient = (userId, clientId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `DELETE FROM user_client_partner WHERE user_id = '${userId}' AND client_id = '${clientId}'`
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

db.getReturnUuid = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT uuid
            FROM user
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

db.getRole = (roleId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT code  
            FROM role 
            WHERE id = '${roleId}'`
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

db.getLinkedUserId = (roleCode, allocatedToUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id  
            FROM ${roleCode == 'CLNT'? 'client' : 'staff'} 
            WHERE uuid = '${allocatedToUuid}'`
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

db.getManagerUserData = (managerUserUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id  
            FROM user 
            WHERE uuid = '${managerUserUuid}'`
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

db.changeUserStatus = (uuid, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE user SET is_active = IF(is_active = 1,0,1), modify_on = ?, modify_by_id = '${modifyById}' WHERE uuid = '${uuid}'`
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

db.updateUserAssignedManager = (uuid, managerUserId, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE user SET assigned_manager_id = '${managerUserId}', modify_on = ?, modify_by_id = '${modifyById}' WHERE uuid = '${uuid}'`
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

db.changeUserClientPartnerStatus = (uuid, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE user_client_partner SET is_active = IF(is_active = 1,0,1), modify_on = ?, modify_by_id = '${modifyById}' WHERE uuid = '${uuid}'`
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

db.updateStaffOrClient = (sql, date) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            pool.query(sql,date,(error, result) => 
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

db.checkStaffExist = (staffUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id  
            FROM staff
            WHERE uuid = '${staffUuid}'`
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

db.checkClientExist = (clientUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id  
            FROM client
            WHERE uuid = '${clientUuid}'`
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

db.getUserData = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.id, u.linked_to_id AS linkedToId, r.code, IF(COUNT(pcm.id) > 0,1,0) AS isExist, ua.uuid AS assignedManagerUuid  
            FROM user u
            LEFT JOIN role r ON r.id = u.role_id
            LEFT JOIN partner_client_mapping pcm ON pcm.client_id = u.linked_to_id
            LEFT JOIN user ua ON ua.id = u.assigned_manager_id
            WHERE u.uuid = '${uuid}'`
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

db.deallocateStaffFromUser = (uuid, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE user SET linked_to_id = null, modify_on = ?, modify_by_id = '${modifyById}'
            WHERE uuid = '${uuid}'`
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

db.deallocateUserFromStaff = (id, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE staff SET current_user_id = null, modify_on = ?, modify_by_id = '${modifyById}'
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

db.allocateStaffToUser = (uuid, staffId, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE user SET linked_to_id = '${staffId}', modify_on = ?, modify_by_id = '${modifyById}' 
            WHERE uuid = '${uuid}'`
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

db.allocateClientToUser = (uuid, clientId, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE user SET linked_to_id = '${clientId}', modify_on = ?, modify_by_id = '${modifyById}' 
            WHERE uuid = '${uuid}'`
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

db.deallocateUserFromClient = (id, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE client SET linked_user_id = null, modify_on = ?, modify_by_id = '${modifyById}'
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

db.saveDataUserClientPartner = (uuid, userId, clientId, createdOn, createdById, isActive, partnerId, partnerLocationId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO user_client_partner (uuid, user_id, client_id, partner_id, created_on, created_by_id, is_active, partner_location_detail_id) VALUES ('${uuid}', '${userId}', '${clientId}','${partnerId}', ?, ${createdById}, ${isActive}, '${partnerLocationId}')`
            //  
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

db.getPartnerData = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT p.id AS partnerId, pld.id AS partnerLocationId 
            FROM partner p
            JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id
            JOIN partner_location_detail pld ON pld.partner_statewise_gst_master_id = psgm.id
            WHERE pld.uuid = '${uuid}' 
            AND p.is_active = 1
            AND pld.is_active = 1`
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