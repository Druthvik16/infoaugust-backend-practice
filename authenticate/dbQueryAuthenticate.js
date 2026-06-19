let pool = require('../databaseConnection/createconnection')
let db = {}


db.getUserClients = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode 
            FROM user_client uc
            LEFT JOIN client c ON c.id = uc.client_id
            WHERE uc.user_id = '${id}' AND uc.is_active =1`
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

db.getUserData = (email, password, passKey) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, uuid, name, email, mobile, roleCode, mappedId, userType, authToken FROM (
			SELECT u.id, s.uuid, s.name, s.email, s.mobile, r.code AS roleCode, null AS mappedId, 'Infomap Admin' AS userType, u.auth_token AS authToken
            FROM staff s 
            LEFT JOIN user u ON u.id = s.current_user_id
            LEFT JOIN role r ON r.id = u.role_id
			where UPPER(s.email) = '${email.toUpperCase()}' OR s.mobile = '${email}'
            UNION 
            SELECT u.id, c.uuid, c.name, c.email, c.mobile, r.code AS roleCode, null AS mappedId, 'Client Admin' AS userType,
            u.auth_token AS authToken 
            FROM client c 
            LEFT JOIN user u ON u.id = c.linked_user_id
            LEFT JOIN role r ON r.id = u.role_id
            where UPPER(c.email) = '${email.toUpperCase()}' OR c.mobile = '${email}'
            UNION 
            SELECT p.id, p.uuid, p.name, p.email, p.mobile, null AS roleCode, null AS mappedId, 'Partner' AS userType, p.auth_token AS authToken  
            FROM partner p  
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id 
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id
            LEFT JOIN partner_location_detail pld ON pld.partner_statewise_gst_master_id = psgm.id AND pld.is_active = 1  AND pc.code = 'C' 
            where (UPPER(p.email) = '${email?.toUpperCase()}' OR p.mobile = '${email}') AND IF(pc.code = 'C', pld.is_active != 0, true) 
            UNION 
            SELECT alu.id, IF(s.uuid IS NULL, c.uuid, s.uuid) AS uuid, IF(s.name IS NULL, c.name, s.name) AS name, alu.email, alu.mobile, r.code AS roleCode, alu.mapped_id AS mappedId, 
            IF(r.code = 'CLNT', 'Client User', IF((r.code IS NOT NULL && r.code != 'CLNT'), 'Infomap User', null)) AS userType, 
            alu.auth_token AS authToken 
            FROM additional_login_user alu 
            LEFT JOIN role r ON r.id = alu.role_id
			LEFT JOIN staff s ON s.id = alu.mapped_id AND s.is_active = 1 AND r.code != 'CLNT'
			LEFT JOIN client c ON c.id = alu.mapped_id AND c.is_active = 1 AND r.code = 'CLNT'
            where UPPER(alu.email) = '${email.toUpperCase()}' OR alu.mobile = '${email}'

            UNION 
            SELECT sp.id, sp.uuid, sp.name, sp.email, sp.mobile, null AS roleCode, null AS mappedId, 'Partner-User' AS userType, sp.auth_token AS authToken  
            FROM secondary_partner sp  
            LEFT JOIN secondary_partner_location_detail spld ON spld.secondary_partner_id = sp.id
            LEFT JOIN partner_location_detail pld ON pld.id = spld.partner_location_detail_id AND pld.is_active = 1 
            where (UPPER(sp.email) = '${email?.toUpperCase()}' OR sp.mobile = '${email}') AND pld.is_active != 0 
            ) as customTable`
            //  
            //AND u.password = HEX(AES_ENCRYPT('${password}', '${passKey}')) 
            console.log(sql)
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

db.getUser = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.id AS userId, u.name AS userName, u.linked_to_id AS userLinkedToId, u.role_id AS userRoleId, u.password AS userPassword, u.last_logged_in AS userLastLogin, u.is_active AS userIsActive, u.assigned_manager_id AS userAssignedManagerId, 
            c.id AS clientId, c.short_name AS clientShortName, c.code AS clientCode, c.gstin AS clientGstIn, c.pan AS clientPan, c.full_logo_file_path AS clientFullLogoPath, c.short_logo_file_path AS clientShortLogoPath, c.company_name AS clientCompanyName, 
            c.tan AS clientTan, c.city AS clientCity, c.state_id AS clientStateId, c.pincode AS clientPinCode, c.linked_user_id AS clientLinkedUserId, 
            c.is_active AS clientIsActive, CONCAT(TRIM(CONCAT(c.address_line1, ' ', c.address_line2, ' ', c.address_line3)), ' - ', c.mobile) AS clientFullAddress, cst.id AS serviceTypeId, cst.name AS serviceTypeName, 
            s.id AS staffId, s.address AS staffAddress, s.is_active AS staffIsActive, 
            s.current_user_id AS staffCurrentUserId,
            ucp.id AS userClientPartnerId, ucp.user_id AS userClientPartnerUserId, ucp.client_id AS userClientPartnerClientId, 
            ucp.partner_id AS userClientPartnerPartnerId, ucp.is_active AS userClientPartnerIsActive,
            ucp.uuid AS userClientPartnerUuid,
            ucpc.id AS userClientId, ucpc.name AS userClientName, ucpc.short_name AS userClientShortName,
            ucpc.code AS userClientCode, ucpc.email AS userClientEmail, ucpc.mobile AS userClientMobile,
            ucpc.gstin AS userClientGstIn, ucpc.pan AS userClientPan, ucpc.tan AS userClientTan, ucpc.city AS userClientCity, 
            ucpc.state_id AS userClientStateId, ucpc.pincode AS userClientPinCode, ucpc.linked_user_id AS userClientLinkedUserId, 
            ucpc.is_active AS userClientIsActive, ucpc.uuid AS userClientUuid, 
            uam.name AS assignedManagerName, uam.uuid AS assignedManagerUuid, 
            r.id AS roleId, r.code AS roleCode, r.name AS roleName 
                FROM user u
                JOIN role r ON r.id = u.role_id
                LEFT JOIN staff s ON s.id = u.linked_to_id AND s.is_active = 1 AND r.code != 'CLNT'
                LEFT JOIN client c ON c.id = u.linked_to_id AND c.is_active = 1 AND r.code = 'CLNT'
                LEFT JOIN client_service_type cst ON cst.id = c.service_type_id AND c.is_active = 1 AND r.code = 'CLNT'
                LEFT JOIN user_client_partner ucp ON ucp.user_id = u.id AND ucp.is_active = 1 AND (r.code = 'MGR' OR r.code = 'EXE')
                LEFT JOIN client ucpc ON ucpc.id = ucp.client_id AND ucpc.is_active = 1 AND (r.code = 'MGR' OR r.code = 'EXE')
                LEFT JOIN user uam ON uam.id = u.assigned_manager_id AND uam.is_active = 1 AND (r.code = 'EXE')
                WHERE u.is_active = 1
                AND (s.uuid = '${uuid}' OR c.uuid = '${uuid}')`
            //  
            //AND u.password = HEX(AES_ENCRYPT('${password}', '${passKey}')) 
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

db.getPartner = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT p.id AS partnerId, p.last_logged_in AS partnerLastLogin, p.uuid AS partnerUuid, p.name AS partnerName,
            p.email AS partnerEmail, p.mobile AS partnerMobile, p.pan AS partnerPan, p.is_active AS partnerIsActive, p.password AS partnerPassword, 
            c.id AS clientId, c.name AS clientName, c.uuid AS clientUuid, c.code AS clientCode, c.email AS clientEmail, c.mobile AS clientMobile, c.gstin AS clientGST, c.short_name AS clientShortName, c.pan AS clientPan, c.tan AS clientTan,  c.full_logo_file_path AS clientFullLogoPath, c.short_logo_file_path AS clientShortLogoPath, CONCAT(TRIM(CONCAT(c.address_line1, ' ', c.address_line2, ' ', c.address_line3)), ' - ', c.mobile) AS clientFullAddress,  c.company_name AS clientCompanyName, 
            s.id AS stateId, s.name AS stateName, 
            pc.id AS partnerCategoryId, pc.code AS partnerCategoryCode, pc.name AS partnerCategoryName,
            vs.id AS vendorStatusId, vs.name AS vendorStatusName  
            FROM partner p 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id AND c.is_active = 1
            LEFT JOIN state s ON s.id = c.state_id 
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id AND pc.is_active = 1
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id AND pc.code = 'V'
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.is_active = 1 
            AND p.uuid = '${uuid}'`
            //  
            // AND p.password = HEX(AES_ENCRYPT('${password}', '${passKey}'))

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


db.getSecondaryPartner = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT sp.id AS partnerId, sp.last_logged_in AS partnerLastLogin, sp.uuid AS partnerUuid, sp.name AS partnerName,
            sp.email AS partnerEmail, sp.mobile AS partnerMobile, p.pan AS partnerPan, sp.is_active AS partnerIsActive, p.password AS partnerPassword, 
            c.id AS clientId, c.name AS clientName, c.uuid AS clientUuid, c.code AS clientCode, c.email AS clientEmail, c.mobile AS clientMobile, c.gstin AS clientGST, c.short_name AS clientShortName, c.pan AS clientPan, c.tan AS clientTan,  c.full_logo_file_path AS clientFullLogoPath, c.short_logo_file_path AS clientShortLogoPath, CONCAT(TRIM(CONCAT(c.address_line1, ' ', c.address_line2, ' ', c.address_line3)), ' - ', c.mobile) AS clientFullAddress,  c.company_name AS clientCompanyName, 
            s.id AS stateId, s.name AS stateName, 
            pc.id AS partnerCategoryId, pc.code AS partnerCategoryCode, pc.name AS partnerCategoryName,
            vs.id AS vendorStatusId, vs.name AS vendorStatusName  
            FROM secondary_partner sp
            LEFT JOIN partner p ON p.id = sp.partner_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id AND c.is_active = 1
            LEFT JOIN state s ON s.id = c.state_id 
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id AND pc.is_active = 1
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id AND pc.code = 'V'
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.is_active = 1 
            AND sp.is_active = 1
            AND sp.uuid = '${uuid}'`
            //  
            // AND p.password = HEX(AES_ENCRYPT('${password}', '${passKey}'))

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




db.getTableName = (email) => 
    {
        return new Promise((resolve, reject) => 
        {
            try
            {
                let sql = `SELECT userId, authTime, authToken, uuid, name, roleId, roleCode, roleName, userType, mappedId 
                FROM (	 
                
                SELECT u.id AS userId, u.last_logged_in AS authTime, u.auth_token AS authToken, u.uuid, u.name, r.id AS roleId, r.code AS roleCode, r.name AS roleName, 'User' AS userType, null AS mappedId 
                                FROM user u 
                                LEFT JOIN role r ON r.id = u.role_id
                                LEFT JOIN staff s ON s.id = u.linked_to_id
                                LEFT JOIN client c ON c.id = u.linked_to_id
                                WHERE (s.email = '${email}' OR c.email = '${email}'  OR c.mobile = '${email}'  OR s.mobile = '${email}') AND u.is_active = 1
                        UNION 	
                    SELECT p.id AS userId, p.last_logged_in AS authTime, p.auth_token AS authToken, p.uuid AS uuid, p.name AS name, null AS roleId, null AS roleCode, null AS roleName, 'Partner' AS userType, null AS mappedId 
                            FROM partner p 
                            WHERE (p.email = '${email}' OR p.mobile = '${email}') AND p.is_active = 1            
                    UNION 
                    SELECT alu.id AS userId, alu.last_logged_in AS authTime, alu.auth_token AS authToken,  
                    IF(s.uuid IS NULL, c.uuid, s.uuid) AS uuid, IF(s.name IS NULL, c.name, s.name) AS name,
                    null AS roleId, null AS roleCode, null AS roleName,  'AdditionalUser' AS userType, alu.mapped_id AS mappedId 
                            FROM additional_login_user alu  LEFT JOIN role r ON r.id = alu.role_id
                            LEFT JOIN staff s ON s.id = alu.mapped_id AND s.is_active = 1 AND r.code != 'CLNT'
                            LEFT JOIN client c ON c.id = alu.mapped_id AND c.is_active = 1 AND r.code = 'CLNT'
                            WHERE ((alu.email = '${email}' OR alu.mobile = '${email}') AND alu.is_active = 1 )) AS customTable;`
                pool.query(sql,[email],(error, result) => 
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


db.getSpsnUser = (email, password, passKey) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `
            (
                SELECT DISTINCT 
                    sumt.id AS id,
                    sumt.last_logged_in AS lastLoggedIn,
                    sumt.uuid AS uuid,
                    sumt.name,
                    sumt.code,
                    sumt.spsn_code AS spsnCode,
                    sumt.email,
                    sumt.mobile,
                    sumt.is_active AS isActive,
                    sumt.password,
                    'SPSN-User' AS userType,

                    c.id AS clientId,
                    c.name AS clientName,
                    c.uuid AS clientUuid,
                    c.code AS clientCode,
                    c.email AS clientEmail,
                    c.mobile AS clientMobile,
                    c.gstin AS clientGST,
                    c.short_name AS clientShortName,
                    c.pan AS clientPan,
                    c.tan AS clientTan,
                    c.full_logo_file_path AS clientFullLogoPath,
                    c.short_logo_file_path AS clientShortLogoPath,
                    CONCAT(
                        TRIM(CONCAT(c.address_line1, ' ', c.address_line2, ' ', c.address_line3)),
                        ' - ',
                        c.mobile
                    ) AS clientFullAddress,
                    c.company_name AS clientCompanyName,

                    s.id AS stateId,
                    s.name AS stateName
                FROM spsn_user_master sumt
                JOIN partner_location_detail pld 
                    ON pld.spsn_user_id = sumt.id 
                   AND pld.is_active = 1
                LEFT JOIN client c ON c.id = sumt.client_id
                LEFT JOIN state s ON s.id = c.state_id
                WHERE sumt.is_active = 1
                  AND (sumt.email = '${email}' OR sumt.mobile = '${email}')
            )

            UNION

            (
                SELECT DISTINCT
                    seu.id AS id,
                    seu.last_logged_in AS lastLoggedIn,
                    seu.uuid AS uuid,
                    seu.name,
                    NULL AS code,
                    NULL AS spsnCode,
                    seu.email,
                    seu.mobile,
                    seu.is_active AS isActive,
                    seu.password,
                    seu.designation_code AS userType,

                    c.id AS clientId,
                    c.name AS clientName,
                    c.uuid AS clientUuid,
                    c.code AS clientCode,
                    c.email AS clientEmail,
                    c.mobile AS clientMobile,
                    c.gstin AS clientGST,
                    c.short_name AS clientShortName,
                    c.pan AS clientPan,
                    c.tan AS clientTan,
                    c.full_logo_file_path AS clientFullLogoPath,
                    c.short_logo_file_path AS clientShortLogoPath,
                    CONCAT(
                        TRIM(CONCAT(c.address_line1, ' ', c.address_line2, ' ', c.address_line3)),
                        ' - ',
                        c.mobile
                    ) AS clientFullAddress,
                    c.company_name AS clientCompanyName,

                    s.id AS stateId,
                    s.name AS stateName
                FROM spsn_extended_user seu                
                JOIN spsn_extended_user_partner_location_map seupld ON seupld.extended_user_id = seu.id                         
                JOIN partner_location_detail pld ON pld.id = seupld.partner_location_id AND pld.is_active = 1 
                LEFT JOIN client c ON c.id = seu.client_id
                LEFT JOIN state s ON s.id = c.state_id
                WHERE seu.is_active = 1
                  AND (seu.email = '${email}' OR seu.mobile = '${email}')
            )
            `;

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
            throw e;
        }
    });
};


db.detectUser = (email) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, uuid, name, email, mobile, roleCode, mappedId, userType, authToken FROM (

                SELECT u.id, s.uuid, s.name, s.email, s.mobile, r.code AS roleCode, null AS mappedId, 'Infomap Admin' AS userType, u.auth_token AS authToken
                FROM staff s 
                LEFT JOIN user u ON u.id = s.current_user_id
                LEFT JOIN role r ON r.id = u.role_id
                where UPPER(s.email) = '${email.toUpperCase()}' OR s.mobile = '${email}' AND r.code != 'CLNT'

                UNION 

                SELECT u.id, c.uuid, c.name, c.email, c.mobile, r.code AS roleCode, null AS mappedId, 'Client Admin' AS userType, u.auth_token AS authToken
                FROM client c 
                LEFT JOIN user u ON u.id = c.linked_user_id
                LEFT JOIN role r ON r.id = u.role_id
                where UPPER(c.email) = '${email.toUpperCase()}' OR c.mobile = '${email}' AND r.code = 'CLNT'

                UNION 

                SELECT alu.id, s.uuid, s.name, alu.email, alu.mobile, r.code AS roleCode, alu.mapped_id AS mappedId, 
                'Infomap User' AS userType, alu.auth_token AS authToken 
                FROM additional_login_user alu 
                LEFT JOIN role r ON r.id = alu.role_id
                JOIN staff s ON s.id = alu.mapped_id AND s.is_active = 1 AND r.code != 'CLNT'
                where UPPER(alu.email) = '${email.toUpperCase()}' OR alu.mobile = '${email}'

                UNION 

                SELECT alu.id, c.uuid, c.name, alu.email, alu.mobile, r.code AS roleCode, alu.mapped_id AS mappedId, 
                'Client User' AS userType, alu.auth_token AS authToken 
                FROM additional_login_user alu 
                LEFT JOIN role r ON r.id = alu.role_id
                JOIN client c ON c.id = alu.mapped_id AND c.is_active = 1 AND r.code = 'CLNT'
                where UPPER(alu.email) = '${email.toUpperCase()}' OR alu.mobile = '${email}'


                UNION 
                SELECT distinct sumt.id AS id, sumt.uuid AS uuid, sumt.name , sumt.email , sumt.mobile, 'SPSN' AS roleCode, null AS mappedId, 'SPSN' AS userType, sumt.auth_token AS authToken 
                        FROM spsn_user_master sumt 
                    JOIN partner_location_detail pld ON pld.spsn_user_id = sumt.id AND pld.is_active = 1 
                            where UPPER(sumt.email) = '${email.toUpperCase()}' OR sumt.mobile = '${email}'
                        AND  sumt.is_active = 1 


                UNION 
                    SELECT distinct sxdu.id AS id, sxdu.uuid AS uuid, sxdu.name , sxdu.email , sxdu.mobile, 'SPSN' AS roleCode, null AS mappedId, sxdu.designation_code AS userType, sxdu.auth_token AS authToken 

                    FROM spsn_extended_user sxdu 
                    JOIN spsn_extended_user_partner_location_map seupld ON seupld.extended_user_id = sxdu.id
                    JOIN partner_location_detail pld ON pld.id = seupld.partner_location_id AND pld.is_active = 1 
                    WHERE UPPER(sxdu.email) = '${email.toUpperCase()}' OR sxdu.mobile = '${email}'
                    AND  sxdu.is_active = 1 
                ) as customTable;`
            //  
            // AND p.password = HEX(AES_ENCRYPT('${password}', '${passKey}'))

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


    db.selectToken = (token) => 
        {
            return new Promise((resolve, reject) => 
            {
                try
                {
                    let sql = `SELECT userId, authTime, authToken, uuid, name, roleId, roleCode, roleName, userType, mappedId 
                    FROM (
                        SELECT u.id AS userId, u.last_logged_in AS authTime, u.auth_token AS authToken, u.uuid, u.name, r.id AS roleId, r.code AS roleCode, r.name AS roleName, 'User' AS userType, null AS mappedId 
                                FROM user u 
                                LEFT JOIN role r ON r.id = u.role_id
                                WHERE u.auth_token = '${token}' AND u.is_active = 1
                        UNION 		
                        SELECT p.id AS userId, p.last_logged_in AS authTime, p.auth_token AS authToken, p.uuid AS uuid, p.name AS name, null AS roleId, null AS roleCode, null AS roleName, 'Partner' AS userType, null AS mappedId 
                                FROM partner p 
                                WHERE p.auth_token = '${token}' AND p.is_active = 1            
                        UNION 
                        SELECT sumt.id AS userId, sumt.last_logged_in AS authTime, sumt.auth_token AS authToken, sumt.uuid AS uuid, sumt.name AS name, null AS roleId, null AS roleCode, null AS roleName, 'SpsnUser' AS userType, null AS mappedId 
                                FROM spsn_user_master sumt 
                                WHERE sumt.auth_token = '${token}' AND sumt.is_active = 1 
                        UNION 
                        SELECT alu.id AS userId, alu.last_logged_in AS authTime, alu.auth_token AS authToken,  
                        IF(s.uuid IS NULL, c.uuid, s.uuid) AS uuid, IF(s.name IS NULL, c.name, s.name) AS name,
                        null AS roleId, null AS roleCode, null AS roleName,  'AdditionalUser' AS userType, alu.mapped_id AS mappedId 
                                FROM additional_login_user alu  LEFT JOIN role r ON r.id = alu.role_id
                                LEFT JOIN staff s ON s.id = alu.mapped_id AND s.is_active = 1 AND r.code != 'CLNT'
                                LEFT JOIN client c ON c.id = alu.mapped_id AND c.is_active = 1 AND r.code = 'CLNT'
                                WHERE alu.auth_token = '${token}' AND alu.is_active = 1 
                                
                         UNION 		
                        SELECT sp.id AS userId, sp.last_logged_in AS authTime, sp.auth_token AS authToken, sp.uuid AS uuid, sp.name AS name, null AS roleId, null AS roleCode, null AS roleName, 'Partner-User' AS userType, null AS mappedId 
                                FROM secondary_partner sp 
                                WHERE sp.auth_token = '${token}' AND sp.is_active = 1 
                        
                        UNION 
                        SELECT seu.id AS userId, seu.last_logged_in AS authTime, seu.auth_token AS authToken, seu.uuid AS uuid, seu.name AS name, null AS roleId, null AS roleCode, null AS roleName, seu.designation_code AS userType, null AS mappedId 
                                FROM spsn_extended_user seu 
                                WHERE seu.auth_token = '${token}' AND seu.is_active = 1 
                                
                        ) AS customTable;`
                    pool.query(sql,[token],(error, result) => 
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

// db.selectToken = (token) => 
// {
//     return new Promise((resolve, reject) => 
//     {
//         try
//         {
//             let sql = `SELECT u.id AS userId, u.last_logged_in AS authTime, u.auth_token AS authToken, u.uuid, u.name, 
//             r.id AS roleId, r.code AS roleCode, r.name AS roleName 
//             FROM user u 
//             LEFT JOIN role r ON r.id = u.role_id
//             WHERE u.auth_token = ? AND u.is_active = 1`
//             pool.query(sql,[token],(error, result) => 
//             {
//                 if(error)
//                 {
//                     return reject(error);
//                 }          
//                 return resolve(result);
//             });
//         }
//         catch(e)
//         {
//             throw e
//         }
//     })
// }

db.selectPartnerToken = (token) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT p.id AS partnerId, p.last_logged_in AS authTime, p.auth_token AS authToken, p.uuid AS uuid, p.name AS name
            FROM partner p 
            WHERE p.auth_token = ? AND p.is_active = 1`
            pool.query(sql,[token],(error, result) => 
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

db.selectSpsnUser = (token) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT sumt.id AS userId, sumt.last_logged_in AS authTime, sumt.auth_token AS authToken, sumt.uuid AS uuid, sumt.name AS name
            FROM spsn_user_master sumt 
            WHERE sumt.auth_token = ? AND sumt.is_active = 1`
            //  
            pool.query(sql,[token],(error, result) => 
            {
                if(error)
                {
                    console.log(error);
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

db.matchPassword = (userId, password, passKey) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.id AS userId, u.name AS userName, u.uuid AS userUuid
                FROM user u
                WHERE u.is_active = 1
                AND u.password = HEX(AES_ENCRYPT('${password}', '${passKey}')) 
                AND u.id = '${userId}'`
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

db.matchPasswordPartner = (partnerId, password, passKey) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT p.id AS partnerId, p.name AS partnerName, p.uuid AS partnerUuid
                FROM partner p
                WHERE p.is_active = 1
                AND p.password = HEX(AES_ENCRYPT('${password}', '${passKey}')) 
                AND p.id = '${partnerId}'`
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

db.matchPasswordSpsnUser = (partnerId, password, passKey) => 
    {
        return new Promise((resolve, reject) => 
        {
            try
            {
                let sql = `SELECT sumt.id, sumt.name, sumt.uuid
                    FROM spsn_user_master sumt
                    WHERE sumt.is_active = 1
                    AND sumt.password = HEX(AES_ENCRYPT('${password}', '${passKey}')) 
                    AND sumt.id = '${partnerId}'`
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


db.insertLastLoginAndAuthToken = (authTime, userId, authToken, loggedOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE user SET last_logged_in = ?, auth_token = ? 
            `
            if(loggedOn)
            {
                sql = sql + ` , logged_on = ? `
            }

            sql = sql + ` WHERE id = ${userId}`

            pool.query(sql, [authTime, authToken, loggedOn], (error, result) => 
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
};

db.insertLastLoginAndAuthTokenAdditionalUser = (authTime, userId, authToken, loggedOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE additional_login_user SET last_logged_in = ?, auth_token = ? 
            `
            if(loggedOn)
            {
                sql = sql + ` , logged_on = ? `
            }

            sql = sql + ` WHERE id = ${userId}`

            pool.query(sql, [authTime, authToken, loggedOn], (error, result) => 
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
};

db.insertLastLoginAndAuthTokenPartner = (authTime, partnerId, authToken, loggedOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            // let sql = `UPDATE partner SET last_logged_in = ?, auth_token = ? WHERE id = ${partnerId}`

            let sql = `UPDATE partner SET last_logged_in = ?, auth_token = ? 
            `
            if(loggedOn)
            {
                sql = sql + ` , logged_on = ? `
            }
            
            sql = sql + ` WHERE id = ${partnerId}`

            pool.query(sql, [authTime, authToken, loggedOn], (error, result) => 
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
};

db.insertLastLoginAndAuthTokenPartnerSecondary = (authTime, id, authToken, loggedOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE secondary_partner SET last_logged_in = ?, auth_token = ? 
            `
            if(loggedOn)
            {
                sql = sql + ` , logged_on = ? `
            }
            
            sql = sql + ` WHERE id = ${id}`

            pool.query(sql, [authTime, authToken, loggedOn], (error, result) => 
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
};

db.insertLastLoginAndAuthTokenSpsnUser = (authTime, userId, authToken, loggedOn) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {    
                let sql = `UPDATE spsn_user_master SET last_logged_in = ?, auth_token = ? 
                `
                if(loggedOn)
                {
                    sql = sql + ` , logged_on = ? `
                }
                
                sql = sql + ` WHERE id = ${userId}`
    
                pool.query(sql, [authTime, authToken, loggedOn], (error, result) => 
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
    };



db.insertLastLoginAndAuthTokenSpsnExtendedUser = (authTime, userId, authToken, loggedOn) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {    
                let sql = `UPDATE spsn_extended_user SET last_logged_in = ?, auth_token = ? 
                `
                if(loggedOn)
                {
                    sql = sql + ` , logged_on = ? `
                }
                
                sql = sql + ` WHERE id = ${userId}`
    
                pool.query(sql, [authTime, authToken, loggedOn], (error, result) => 
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
    };

db.deleteToken = (userId, modifyOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE user SET auth_token = null, modify_on = ?, modify_by_id = '${userId}' WHERE id = '${userId}'`
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
            console.log(e)
        }
    });
};

db.deleteTokenAddOn = (userId, modifyOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE additional_login_user SET auth_token = null, modify_on = ?, modify_by_id = '${userId}' WHERE id = '${userId}'`
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
            console.log(e)
        }
    });
};

db.deleteTokenPartner = (partnerId, modifyOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE partner SET auth_token = null, modify_on = ?, modify_by_id = '${partnerId}'   WHERE id = '${partnerId}'`
            pool.query(sql, [modifyOn] ,(error, result) =>
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
};

db.deleteTokenPartnerSecondary = (id, modifyOn) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE secondary_partner SET auth_token = null, modify_on = ?, modify_by_id = '${id}'   WHERE id = '${id}'`
            pool.query(sql, [modifyOn] ,(error, result) =>
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
};

db.deleteTokenSpsnUser = (userId, modifyOn) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                let sql = `UPDATE spsn_user_master SET auth_token = null, modify_on = ?, modify_by_id = '${userId}'   WHERE id = '${userId}'`
                pool.query(sql, [modifyOn] ,(error, result) =>
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
    };

db.updateUser = (userId,password, passKey) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            pool.query(`UPDATE user SET password = HEX(AES_ENCRYPT('${password}', '${passKey}')) WHERE id = ?`, [userId], (error, result) => 
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
};

db.updatePartner = (partnerId,password, passKey) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            pool.query(`UPDATE partner SET password = HEX(AES_ENCRYPT('${password}', '${passKey}')) WHERE id = ?`, [partnerId], (error, result) => 
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
};

db.updateSpsnUser = (partnerId,password, passKey) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            pool.query(`UPDATE spsn_user_master SET password = HEX(AES_ENCRYPT('${password}', '${passKey}')) WHERE id = ?`, [partnerId], (error, result) => 
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
};

db.checkResetLinkEmail = (email) => {
    return new Promise((resolve, reject)=>{
        try{pool.query(`SELECT uuid, fullName 
        FROM user 
        WHERE is_active = 1 AND
        UPPER(email) LIKE UPPER(?)`, [email], (error, result)=>{
            if(error){
            return reject(error);
             }          
            return resolve(result);
            });
        }
        catch(e){ console.log(e)}
        
        });
}

db.checkMailExist = (email) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `SELECT IF(COUNT(email) > 0,1,0) AS emailExist 
            FROM reset_link 
            WHERE email = '${email}' 
            AND  TIMEDIFF(NOW(),generated_on) <= '00:10:00'`
            pool.query(sql, (error, result)=>{
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
};

db.saveResetLink = (email, code, generatedOn) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `INSERT INTO reset_link (email, code, generated_on) VALUES ('${email}', '${code}', ?)`
            pool.query(sql, [generatedOn], (error, result)=>{
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
};

db.checkMailLinkExist = (email) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `SELECT IF(COUNT(email) > 0,1,0) AS isExist 
            FROM reset_link 
            WHERE email = '${email}'`
            pool.query(sql, (error, result)=>{
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
};

db.updateUserPassword = (email, password, modifyOn) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `UPDATE user SET password = '${password}', modify_on = ?  WHERE email = '${email}'`
            pool.query(sql, [modifyOn], (error, result)=>{
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
};

db.deleteResetLinkData = (email) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `DELETE 
            FROM reset_link 
            WHERE email = '${email}' `
            pool.query(sql, (error, result)=>{
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
};

db.getResetLinkData = (code) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `SELECT email 
            FROM reset_link 
            WHERE code = '${code}' `
            pool.query(sql, (error, result)=>{
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
};


db.getRegisteredUserId = (userId) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = ` SELECT DISTINCT name, email, mobile FROM (SELECT s.name, s.email, s.mobile FROM staff s where UPPER(s.email) = '${userId?.toUpperCase()}' OR s.mobile = '${userId}'
            UNION 
            SELECT c.name, c.email, c.mobile FROM client c where UPPER(c.email) = '${userId?.toUpperCase()}' OR c.mobile = '${userId}'
            UNION 
            SELECT p.name, p.email, p.mobile FROM partner p  
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id
            LEFT JOIN partner_location_detail pld ON pld.partner_statewise_gst_master_id = psgm.id AND pld.is_active = 1 AND pc.code = 'C'
            where (UPPER(p.email) = '${userId?.toUpperCase()}' OR p.mobile = '${userId}') AND IF(pc.code = 'C', pld.is_active != 0, true)  
            UNION 
            SELECT IF(s.name IS NOT NULL, s.name, c.name) AS name, alu.email, alu.mobile 
            FROM additional_login_user alu 
            LEFT JOIN staff s ON s.id = alu.mapped_id
            LEFT JOIN client c ON c.id = alu.mapped_id
            where UPPER(alu.email) = '${userId?.toUpperCase()}' OR alu.mobile = '${userId}'

            UNION 
            SELECT sp.name, sp.email, sp.mobile FROM secondary_partner sp  
            LEFT JOIN secondary_partner_location_detail spld ON spld.secondary_partner_id = sp.id
            LEFT JOIN partner_location_detail pld ON pld.id = spld.partner_location_detail_id AND pld.is_active = 1 
            where (UPPER(sp.email) = '${userId?.toUpperCase()}' OR sp.mobile = '${userId}') AND pld.is_active != 0
            ) as customTable`
            pool.query(sql, (error, result)=>{
                if(error)
                {
                    console.log(error)
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
};

db.getRegisteredSpsnUserId = (userId) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            // let sql = ` SELECT DISTINCT sums.name, sums.email, sums.mobile FROM spsn_user_master sums         JOIN partner_location_detail pld ON pld.spsn_user_id = sums.id AND pld.is_active = 1 where  UPPER(sums.email) = '${userId?.toUpperCase()}' OR sums.mobile = '${userId}'`

            let sql = `SELECT DISTINCT name, email, mobile FROM (SELECT s.name, s.email, s.mobile FROM staff s    
                        where UPPER(s.email) = '${userId?.toUpperCase()}' OR s.mobile = '${userId}'
                        UNION 
                            SELECT c.name, c.email, c.mobile FROM client c    
                            where UPPER(c.email) = '${userId?.toUpperCase()}' OR c.mobile = '${userId}'
                        UNION 
                            SELECT  sums.name, sums.email, sums.mobile FROM spsn_user_master sums  
                            JOIN partner_location_detail pld ON pld.spsn_user_id = sums.id AND pld.is_active = 1 
                            where  UPPER(sums.email) = '${userId?.toUpperCase()}' OR sums.mobile = '${userId}'

                        UNION 
                            SELECT IF(ss.name IS NOT NULL, ss.name, cc.name) AS name, alu.email, alu.mobile 
                            FROM additional_login_user alu 
                            LEFT JOIN staff ss ON ss.id = alu.mapped_id
                            LEFT JOIN client cc ON cc.id = alu.mapped_id
                            where UPPER(alu.email) = '${userId?.toUpperCase()}' OR alu.mobile = '${userId}'
                        UNION 

                            SELECT  sxdu.name, sxdu.email, sxdu.mobile 
                            FROM spsn_extended_user sxdu 
                            JOIN spsn_extended_user_partner_location_map seupld ON seupld.extended_user_id = sxdu.id
                            JOIN partner_location_detail pld ON pld.id = seupld.partner_location_id AND pld.is_active = 1 
                            where  UPPER(sxdu.email) = '${userId?.toUpperCase()}' OR sxdu.mobile = '${userId}'
                        
                            ) as customTable;`
              
            pool.query(sql, (error, result)=>{
                if(error)
                {
                    console.log(error)
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
};

db.saveOtp = (userId, otp) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `INSERT INTO auth_data (userId, otp) VALUES ('${userId}', '${otp}')`
            pool.query(sql, (error, result)=>{
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
};

db.saveSpsnOtp = (userId, otp) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `INSERT INTO spsn_auth_data (userId, otp) VALUES ('${userId}', '${otp}')`
            pool.query(sql, (error, result)=>{
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
};

db.deleteOtp = (userId) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `DELETE FROM auth_data WHERE userId = '${userId}'`
            pool.query(sql, (error, result)=>{
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
};

db.deleteSpsnOtp = (userId) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `DELETE FROM spsn_auth_data WHERE userId = '${userId}'`
            pool.query(sql, (error, result)=>{
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
};

db.getOtp = (userId) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `SELECT otp FROM auth_data WHERE userId = '${userId}'`
            pool.query(sql, (error, result)=>{
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
};

db.getSpsnOtp = (userId) =>
{
    return new Promise((resolve, reject)=>
    {
        try
        {
            let sql = `SELECT otp FROM spsn_auth_data WHERE userId = '${userId}'`
            pool.query(sql, (error, result)=>{
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
};

db.saveLoginHistory = (userId,userType,loggingIn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO login_history (user_id, user_type, logging_in)  VALUES ('${userId}','${userType}',?)`
            pool.query(sql, [loggingIn], (error, result) => 
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

db.updateLoginHistory = (userId,userType,loggedOut, loggedOutType) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE login_history SET logged_out_type = '${loggedOutType}',logged_out = ? WHERE user_id = '${userId}' AND user_type = '${userType}' AND logged_out IS NULL`
            pool.query(sql, [loggedOut], (error, result) => 
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

db.getSpsnUserPartnerLocations = (userId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `
            (
                SELECT 
                    pld.uuid,
                    pld.code,
                    pld.store_name AS storeName,
                    pld.store_location AS storeLocation,
                    pld.mobile,
                    pld.email,
                    pld.tan,
                    pld.address_line1 AS addressLine1,
                    pld.address_line2 AS addressLine2,
                    pld.address_line3 AS addressLine3,
                    pld.city,
                    pld.pincode,
                    pld.msme_number AS msmeNumber,
                    pld.is_active AS isActive,
                    pld.created_on AS createdOn,
                    cb.name AS createdByName,
                    cb.uuid AS createdByUuid,
                    s.id AS stateId,
                    s.name AS stateName,
                    psgm.id AS partnerStateWiseGstMasterId,
                    psgm.gstin AS partnerStateWiseGstMasterGstIn
                FROM partner_location_detail pld
                LEFT JOIN state s 
                    ON s.id = pld.state_id
                LEFT JOIN partner_statewise_gst_master psgm 
                    ON psgm.id = pld.partner_statewise_gst_master_id
                LEFT JOIN partner p 
                    ON p.id = psgm.partner_id
                LEFT JOIN user cb 
                    ON cb.id = pld.created_by_id
                WHERE pld.spsn_user_id = '${userId}'
            )

            UNION

            (
                SELECT 
                    pld.uuid,
                    pld.code,
                    pld.store_name AS storeName,
                    pld.store_location AS storeLocation,
                    pld.mobile,
                    pld.email,
                    pld.tan,
                    pld.address_line1 AS addressLine1,
                    pld.address_line2 AS addressLine2,
                    pld.address_line3 AS addressLine3,
                    pld.city,
                    pld.pincode,
                    pld.msme_number AS msmeNumber,
                    pld.is_active AS isActive,
                    pld.created_on AS createdOn,
                    cb.name AS createdByName,
                    cb.uuid AS createdByUuid,
                    s.id AS stateId,
                    s.name AS stateName,
                    psgm.id AS partnerStateWiseGstMasterId,
                    psgm.gstin AS partnerStateWiseGstMasterGstIn
                FROM spsn_extended_user_partner_location_map euplm
                JOIN partner_location_detail pld 
                    ON pld.id = euplm.partner_location_id
                   AND euplm.is_active = 1
                LEFT JOIN state s 
                    ON s.id = pld.state_id
                LEFT JOIN partner_statewise_gst_master psgm 
                    ON psgm.id = pld.partner_statewise_gst_master_id
                LEFT JOIN partner p 
                    ON p.id = psgm.partner_id
                LEFT JOIN user cb 
                    ON cb.id = pld.created_by_id
                WHERE euplm.extended_user_id = '${userId}'
            )
            `;

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
            throw e;
        }
    });
};


module.exports = db