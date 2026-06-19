let pool = require('../databaseConnection/createconnection')
let db = {}

db.getActiveLogging = (clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
	(
		COUNT(u.id) + 
		(
			SELECT COUNT(p.id) 
            FROM partner p 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id
            WHERE 
            TIMESTAMPDIFF(MINUTE, p.last_logged_in, now()) < "120" 
            AND p.auth_token IS NOT NULL
            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
		)
        + 
		(
			SELECT COUNT(sp.id) 
            FROM secondary_partner sp 
            LEFT JOIN partner p ON p.id = sp.partner_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id
            WHERE 
            TIMESTAMPDIFF(MINUTE, sp.last_logged_in, now()) < "120" 
            AND sp.auth_token IS NOT NULL
            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
		)
        +
        (
			SELECT COUNT(sums.id) 
            FROM spsn_user_master sums 
            LEFT JOIN client c ON c.id = sums.client_id
            WHERE 
            TIMESTAMPDIFF(MINUTE, sums.last_logged_in, now()) < "120" 
            AND sums.auth_token IS NOT NULL
            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
		)
        +
        (
			SELECT COUNT(alu.id) 
            FROM additional_login_user alu 
	        LEFT JOIN role r ON alu.role_id = r.id
            LEFT JOIN client c ON c.id = alu.mapped_id AND r.code = 'CLNT'
            WHERE 
            TIMESTAMPDIFF(MINUTE, alu.last_logged_in, now()) < "120" 
            AND alu.auth_token IS NOT NULL
            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
		)
	) AS activeUsers
	FROM user u 
	LEFT JOIN role r ON u.role_id = r.id
    LEFT JOIN client c ON c.id = u.linked_to_id AND r.code = 'CLNT'
	WHERE TIMESTAMPDIFF(MINUTE, u.last_logged_in, now()) < '120'
	AND u.auth_token IS NOT NULL
	AND r.code != 'ADM'
    
            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
    `
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};

db.getDataTransactLogFileSizeCounts = (clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
            totalFileSize,
            todaysFileSize,
            CONCAT(
                ROUND(
                    totalFileSize / 
                    CASE 
                        WHEN totalFileSize >= POW(1024, 4) THEN POW(1024, 4) 
                        WHEN totalFileSize >= POW(1024, 3) THEN POW(1024, 3) 
                        WHEN totalFileSize >= POW(1024, 2) THEN POW(1024, 2) 
                        WHEN totalFileSize >= 1024 THEN 1024 
                        ELSE 1 
                    END,
                    2
                ),
                ' ',
                CASE 
                    WHEN totalFileSize >= POW(1024, 4) THEN 'TB' 
                    WHEN totalFileSize >= POW(1024, 3) THEN 'GB' 
                    WHEN totalFileSize >= POW(1024, 2) THEN 'MB' 
                    WHEN totalFileSize >= 1024 THEN 'KB' 
                    ELSE 'B' 
                END
            ) AS activeUsers,
        
            CONCAT(
                ROUND(
                    todaysFileSize / 
                    CASE 
                        WHEN todaysFileSize >= POW(1024, 4) THEN POW(1024, 4) 
                        WHEN todaysFileSize >= POW(1024, 3) THEN POW(1024, 3) 
                        WHEN todaysFileSize >= POW(1024, 2) THEN POW(1024, 2) 
                        WHEN todaysFileSize >= 1024 THEN 1024 
                        ELSE 1 
                    END,
                    2
                ),
                ' ',
                CASE 
                    WHEN todaysFileSize >= POW(1024, 4) THEN 'TB' 
                    WHEN todaysFileSize >= POW(1024, 3) THEN 'GB' 
                    WHEN todaysFileSize >= POW(1024, 2) THEN 'MB' 
                    WHEN todaysFileSize >= 1024 THEN 'KB' 
                    ELSE 'B' 
                END
            ) AS totaltodaysFileSizeCount
        FROM (
            SELECT 
                dlt.id,
                SUM(dlt.file_size) AS totalFileSize,
                SUM(CASE WHEN DATE(dlt.created_on) = CURDATE() THEN file_size ELSE 0 END) AS todaysFileSize
            FROM data_transact_log dlt
            LEFT JOIN client c ON c.id = dlt.client_id
            ${clientUuid?.length > 0 ? `WHERE c.uuid = '${clientUuid}'` : ''}
        ) AS subquery;`
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};

db.getDataTransactLogCounts = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = ` SELECT COUNT(ai.id) AS activeUsers 
            FROM data_transact_log ai
            `
            //  
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getLoggedInUsersHistoryCount = (clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT  count(lh.id) AS activeUsers
            FROM login_history lh`
            if(clientUuid?.length > 0)
            {
                sql = sql + ` 
                        WHERE (lh.user_type = 'Client' OR lh.user_type = 'User' OR lh.user_type = 'Client Admin') AND lh.user_id IN (SELECT u.id FROM user u 
                        JOIN role r ON r.id = u.role_id AND r.code = 'CLNT'
                        WHERE u.linked_to_id = (SELECT id FROM client WHERE uuid = '${clientUuid}'))
                        OR
                        (lh.user_type = 'Client User') AND lh.user_id IN (SELECT u.id FROM additional_login_user u 
                        JOIN role r ON r.id = u.role_id AND r.code = 'CLNT'
                        WHERE u.mapped_id = (SELECT id FROM client WHERE uuid = '${clientUuid}'))
                        OR
                        (lh.user_type = 'Partner') AND lh.user_id IN (SELECT p.id FROM partner p 
                        JOIN partner_client_mapping pcm ON pcm.partner_id = p.id AND pcm.client_id = (SELECT id FROM client WHERE 
                        uuid = '${clientUuid}'))
                        OR
                        (lh.user_type = 'SPSN-User') AND lh.user_id IN (SELECT sums.id FROM spsn_user_master sums 
                        WHERE sums.client_id = (SELECT id FROM client WHERE 
                        uuid = '${clientUuid}'))`
            }
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};

db.getLoggedInUsers = (clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                                email, 
                                last_logged_in AS loggedInOn, 
                                modify_on AS logoutOn, 
                                logged_on AS lastLogin, 
                                userType
                                FROM 
                                    (
                                        SELECT 
                                            IF(r.code = 'CLNT',c.email, s.email) AS email, 
                                            u.last_logged_in, 
                                            IF(u.auth_token IS NOT NULL,'', u.modify_on) AS modify_on, 
                                            u.logged_on,
                                            IF(r.code = 'CLNT','Client Admin', 'Infomap Admin') AS userType
                                        FROM user u 
                                        LEFT JOIN role r ON r.id = u.role_id
                                        LEFT JOIN staff s ON s.id = u.linked_to_id
                                        LEFT JOIN client c ON c.id = u.linked_to_id
                                        WHERE 
                                            TIMESTAMPDIFF(MINUTE, u.last_logged_in, now()) < '120' 
                                            AND r.code != 'ADM' 
                                            AND u.auth_token IS NOT NULL
                                            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
                                        UNION 
                                        SELECT 
                                            p.email, 
                                            p.last_logged_in, 
                                            IF(p.auth_token IS NOT NULL,'', p.modify_on) AS modify_on, 
                                            p.logged_on,
                                            IF(pc.code = 'C','Partner', 'Vendor') AS userType
                                        FROM partner p 
                                        LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
                                        LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
                                        LEFT JOIN client c ON c.id = pcm.client_id
                                        WHERE 
                                            TIMESTAMPDIFF(MINUTE, p.last_logged_in, now()) < '120' 
                                            AND p.auth_token IS NOT NULL 
                                            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
                                        UNION 
                                        SELECT 
                                            sums.email, 
                                            sums.last_logged_in, 
                                            IF(sums.auth_token IS NOT NULL,'', sums.modify_on) AS modify_on, 
                                            sums.logged_on,
                                            'SPSN User' AS userType
                                        FROM spsn_user_master sums 
                                        LEFT JOIN client c ON c.id = sums.client_id
                                        WHERE 
                                            TIMESTAMPDIFF(MINUTE, sums.last_logged_in, now()) < '120' 
                                            AND sums.auth_token IS NOT NULL
                                            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
										UNION 
                                        SELECT 
											alu.email, 
											alu.last_logged_in, 
                                            IF(alu.auth_token IS NOT NULL,'', alu.modify_on) AS modify_on, 
											alu.logged_on,
                                            IF(r.code = 'CLNT','Client User', 'Infomap User') AS userType
										FROM 
											additional_login_user alu 
										LEFT JOIN role r ON r.id = alu.role_id
										LEFT JOIN staff s ON s.id = alu.mapped_id AND s.is_active = 1 AND r.code != 'CLNT'
										LEFT JOIN client c ON c.id = alu.mapped_id AND c.is_active = 1 AND r.code = 'CLNT' 
                                        WHERE 
                                            TIMESTAMPDIFF(MINUTE, alu.last_logged_in, now()) < '120' 
                                            AND alu.auth_token IS NOT NULL
                                            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}
                                    
                                              UNION 
                                        SELECT 
                                            sp.email, 
                                            sp.last_logged_in, 
                                            IF(sp.auth_token IS NOT NULL,'', sp.modified_on) AS modify_on, 
                                            sp.logged_on,
                                            'Partner-User' AS userType
                                        FROM secondary_partner sp
                                        LEFT JOIN partner p ON p.id = sp.partner_id
                                        LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
                                        LEFT JOIN client c ON c.id = pcm.client_id
                                        WHERE 
                                            TIMESTAMPDIFF(MINUTE, sp.last_logged_in, now()) < '120' 
                                            AND sp.auth_token IS NOT NULL 
                                            ${clientUuid?.length > 0 ? `AND c.uuid = '${clientUuid}'` : ''}               
                                            ) as customTable;`
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};

db.getLoggedInUsersHistory = (clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            
// IF(r.code = 'CLNT','Client',lh.user_type))) AS userTypeName, 
            let sql = `SELECT  lh.id, lh.user_id AS userId, 
IF(pc.code IS NOT NULL AND pc.code = 'V','Vendor', 
IF(pc.code IS NOT NULL AND pc.code = 'C','Partner',
IF(r.code = 'CLNT','Client',lh.user_type))) AS userTypeName, 
lh.user_type AS userType, lh.logging_in AS loggingIn, 
lh.logged_out AS loggedOut, lh.logged_out_type AS loggedOutType, 
COALESCE(p.uuid, sp.uuid) AS partnerUuid, COALESCE(p.name ,sp.name) AS partnerName, COALESCE(p.email, sp.email) AS partnerEmail, 
sumt.uuid AS spsnUserUuid, sumt.name AS spsnName, sumt.email AS spsnEmail, sumt.code AS spsnCode, 
(SELECT IF(alur.code IS NULL, IF(r.code = 'CLNT' ,c.email, s.email),IF(alur.code = 'CLNT', alu.email, alu.email ))) AS email, 
(SELECT IF(alur.code IS NULL, IF(r.code = 'CLNT' ,c.name, s.name),IF(alur.code = 'CLNT', aluc.name, alus.name))) AS userName,
(SELECT IF(alur.code IS NULL, IF(r.code = 'CLNT' ,c.uuid, s.uuid),IF(alur.code = 'CLNT', aluc.uuid, alus.uuid))) AS userUuid 
FROM login_history lh
LEFT JOIN user u ON (lh.user_type = 'User' OR lh.user_type = 'Infomap Admin' OR lh.user_type = 'Client Admin') AND u.id = lh.user_id        
LEFT JOIN role r ON r.id = u.role_id
LEFT JOIN staff s ON s.id = u.linked_to_id AND r.code != 'CLNT'
LEFT JOIN client c ON c.id = u.linked_to_id AND r.code = 'CLNT'
LEFT JOIN additional_login_user alu ON (lh.user_type = 'Infomap User' OR lh.user_type = 'Client User') AND alu.id = lh.user_id        
LEFT JOIN role alur ON alur.id = alu.role_id
LEFT JOIN staff alus ON alus.id = alu.mapped_id AND alur.code != 'CLNT'
LEFT JOIN client aluc ON aluc.id = alu.mapped_id AND alur.code = 'CLNT'
LEFT JOIN partner p ON p.id = lh.user_id AND lh.user_type = 'Partner'
LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
LEFT JOIN client pcmc ON pcmc.id = pcm.client_id 
LEFT JOIN spsn_user_master sumt ON sumt.id = lh.user_id AND lh.user_type = 'SPSN-User'

LEFT JOIN secondary_partner sp ON sp.id = lh.user_id AND lh.user_type = 'Partner-User'
LEFT JOIN partner spp ON spp.id = sp.partner_id
LEFT JOIN partner_category sppc ON sppc.id = spp.partner_category_id
    LEFT JOIN partner_client_mapping sppcm ON sppcm.partner_id = spp.id
    LEFT JOIN client sppcmc ON sppcmc.id = sppcm.client_id

${clientUuid?.length > 0 ? ` WHERE (c.uuid = '${clientUuid}' OR aluc.uuid = '${clientUuid}'
 OR pcmc.uuid = '${clientUuid}'  OR sppcmc.uuid = '${clientUuid}' OR sumt.client_id = (SELECT id FROM client WHERE 
uuid = '${clientUuid}'))` : ''}

                        ORDER BY lh.logging_in DESC                        
            `
            // WHERE r.code IS NULL OR (r.code != 'ADM' AND r.code != 'HOA') 
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};

db.getMasterCounts = (actionInput, userTypeCode, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = ` SELECT COUNT(ai.id) AS activeUsers 
            FROM ${actionInput} ai
            `
            if (actionInput == 'staff') {
                sql = sql + `  LEFT JOIN user u ON u.id = ai.current_user_id 
                LEFT JOIN role r ON r.id = u.role_id`
            }

            if (actionInput == 'client') {
                sql = sql + `  LEFT JOIN user u ON u.id = ai.linked_user_id 
                LEFT JOIN role r ON r.id = u.role_id`
            }
            sql = sql + `  WHERE ai.is_active = 1  `

            if (actionInput == 'staff') {
                sql = sql + `  AND r.code != 'ADM'`
            }

            //  
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getVendors = (clientId, status) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT COUNT(p.id)  AS activeUsers
            FROM partner p
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client clnt ON clnt.id = pcm.client_id
            LEFT JOIN user u ON u.linked_to_id = clnt.id
              LEFT JOIN role r ON r.id = u.role_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.is_active = 1 
             AND r.code = 'CLNT' 
            AND pc.code = 'V'`

            if (clientId?.toString()?.length > 0) {
                sql = sql + ` AND u.id = '${clientId}'`
            }

            if (status?.toString()?.length > 0) {
                sql = sql + ` AND vs.name = '${status}'`
            }

            sql = sql + `  ORDER BY p.name`

            // console.log(sql)

            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getLastDocumentUploadDate = (clientUuid, documentName, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                        MAX(DATE_FORMAT(cudm.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn 
                        FROM 
                            client_uploaded_document_master cudm
                        JOIN 
                            client c ON c.id = cudm.client_id
                        JOIN 
                            document_category dc ON dc.id = cudm.document_category_id AND dc.name = '${documentName}'
                        JOIN 
                            partner_location_detail pld ON pld.spsn_user_id = '${userId}' AND pld.id = cudm.partner_location_detail_id
                        WHERE
                            cudm.partner_location_detail_id IS NOT NULL    
                        AND c.uuid = '${clientUuid}'
            `

            //  
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

// db.getMasterClientDocumentDataCounts = (clientUuid, documentName, currentDate, userId, userTypeCode) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT 
//                             COUNT(cudm.id) AS totalCount 
//                             FROM 
//                                 client_uploaded_document_master cudm
//                             JOIN 
//                                 client c ON c.id = cudm.client_id
//                             JOIN 
//                                 document_category dc ON dc.id = cudm.document_category_id AND dc.name = '${documentName}'
//                             JOIN 
//                                 partner_location_detail pld ON pld.spsn_user_id = '${userId}' AND pld.id = cudm.partner_location_detail_id
//                             WHERE
//                                 cudm.partner_location_detail_id IS NOT NULL    
//                             AND 
//                                 DATE(cudm.uploaded_on) = DATE(?)                            
//                             AND 
//                                 c.uuid = '${clientUuid}' 
                            
//                 `

//             if (documentName == 'Credit Note') {
//                 sql = sql + ` AND   
//                             ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2)`
//             }

//             // console.log(sql)
//             //  
//             pool.query(sql, [currentDate], (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         }
//         catch (e) {
//             throw e
//         }
//     })
// }

db.getMasterClientDocumentDataCounts = (
    clientUuid,
    documentName,
    currentDate,
    userId,
    userTypeCode = null
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT 
                COUNT(cudm.id) AS totalCount
            FROM client_uploaded_document_master cudm
            JOIN client c 
                ON c.id = cudm.client_id
            JOIN document_category dc 
                ON dc.id = cudm.document_category_id
                AND dc.name = '${documentName}'
            JOIN partner_location_detail pld 
                ON pld.id = cudm.partner_location_detail_id
            `;

            /* ---------- CASE 1 : ASM / RSM / NSM ---------- */
            if (['ASM', 'RSM', 'NSM'].includes(userTypeCode)) {

                sql += `
                INNER JOIN spsn_extended_user_partner_location_map euplm
                    ON euplm.partner_location_id = pld.id
                    AND euplm.extended_user_id = '${userId}'
                    AND euplm.designation_code = '${userTypeCode}'
                    AND euplm.is_active = 1
                `;

            }
            /* ---------- CASE 2 : EXISTING LOGIC ---------- */
            else {

                sql += `
                AND pld.spsn_user_id = '${userId}'
                `;

            }

            /* ---------- COMMON WHERE ---------- */
            sql += `
            WHERE
                cudm.partner_location_detail_id IS NOT NULL
            AND DATE(cudm.uploaded_on) = DATE(?)
            AND c.uuid = '${clientUuid}'
            `;

            if (documentName === 'Credit Note') {
                sql += `
                AND ((ABS(cudm.credit_amount) + ABS(cudm.debit_amount)) > 2)
                `;
            }

            pool.query(sql, [currentDate], (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};


db.getLastDocumentUploadDateSPSNClient = (clientUuid, documentName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                        MAX(DATE_FORMAT(cudm.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn 
                        FROM 
                            client_uploaded_document_master cudm
                        JOIN 
                            client c ON c.id = cudm.client_id
                        JOIN 
                            document_category dc ON dc.id = cudm.document_category_id AND dc.name = '${documentName}'
                        JOIN 
                            spsn_user_master sums ON sums.client_id = c.id 
                        JOIN 
                            partner_location_detail pld ON pld.spsn_user_id = sums.id AND pld.id = cudm.partner_location_detail_id
                        WHERE
                            cudm.partner_location_detail_id IS NOT NULL    
                        AND c.uuid = '${clientUuid}'
            `

            //  
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}



db.getMasterClientDocumentDataCountsSPSNClient = (clientUuid, documentName, currentDate, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                            COUNT(cudm.id) AS totalCount 
                            FROM 
                                client_uploaded_document_master cudm
                            JOIN 
                                client c ON c.id = cudm.client_id
                            JOIN 
                                document_category dc ON dc.id = cudm.document_category_id AND dc.name = '${documentName}'
                            JOIN 
                                spsn_user_master sums ON sums.client_id = c.id 
                            JOIN 
                                partner_location_detail pld ON pld.spsn_user_id = sums.id AND pld.id = cudm.partner_location_detail_id
                            WHERE
                                cudm.partner_location_detail_id IS NOT NULL    
                            AND 
                                DATE(cudm.uploaded_on) = DATE(?)                            
                            AND 
                                c.uuid = '${clientUuid}' 
                            
                `

            if (documentName == 'Credit Note') {
                sql = sql + ` AND   
                            ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2)`
            }

            // console.log(sql)
            pool.query(sql, [currentDate], (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getDataTransactLog = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, fileName, action1, activity, userType, storageType, uploadedOn) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
            id, 
            fileName, 
            activity, 
            user, 
            partnerId, 
            partnerLocationId, 
            totalFileSizes,
            CONCAT(
                ROUND(
                    totalFileSizes / 
                    CASE 
                        WHEN totalFileSizes >= POW(1024, 4) THEN POW(1024, 4) 
                        WHEN totalFileSizes >= POW(1024, 3) THEN POW(1024, 3) 
                        WHEN totalFileSizes >= POW(1024, 2) THEN POW(1024, 2) 
                        WHEN totalFileSizes >= 1024 THEN 1024 
                        ELSE 1 
                    END,
                    2
                ),
                ' ',
                CASE 
                    WHEN totalFileSizes >= POW(1024, 4) THEN 'TB' 
                    WHEN totalFileSizes >= POW(1024, 3) THEN 'GB' 
                    WHEN totalFileSizes >= POW(1024, 2) THEN 'MB' 
                    WHEN totalFileSizes >= 1024 THEN 'KB' 
                    ELSE 'B' 
                END
            ) AS totalFileSize,
            fileSizes,
            CONCAT(
                ROUND(
                    fileSizes / 
                    CASE 
                        WHEN fileSizes >= POW(1024, 4) THEN POW(1024, 4) 
                        WHEN fileSizes >= POW(1024, 3) THEN POW(1024, 3) 
                        WHEN fileSizes >= POW(1024, 2) THEN POW(1024, 2) 
                        WHEN fileSizes >= 1024 THEN 1024 
                        ELSE 1 
                    END,
                    2
                ),
                ' ',
                CASE 
                    WHEN fileSizes >= POW(1024, 4) THEN 'TB' 
                    WHEN fileSizes >= POW(1024, 3) THEN 'GB' 
                    WHEN fileSizes >= POW(1024, 2) THEN 'MB' 
                    WHEN fileSizes >= 1024 THEN 'KB' 
                    ELSE 'B' 
                END
            ) AS fileSize,
            apiName, 
            storageType, 
            createdOn, 
            clientId,
            clientUuid, 
            clientName,
            partnerUuid, 
            partnerName,
            partnerLocationUuid, 
            partnerLocationCode, 
            partnerLocationStoreName
        FROM (
            SELECT 
                dtl.id, 
                dtl.file_name AS fileName, 
                dtl.activity, 
                dtl.user, 
                dtl.partner_id AS partnerId, 
                dtl.location_id AS partnerLocationId, 
                SUM(dtl.file_size) OVER (PARTITION BY NULL) AS totalFileSizes,
                dtl.file_size AS fileSizes,
                CASE 
                    WHEN dtl.api_name LIKE '%downloadUploadedFile%' THEN 'View'
                    WHEN dtl.api_name LIKE '%viewUploadedFile%' THEN 'View'
                    WHEN dtl.api_name LIKE '%getUploadedPOOrInvoiceFile%' THEN 'View'
                    WHEN dtl.api_name LIKE '%getDocumentTimelineFile%' THEN 'View'
                    WHEN dtl.api_name LIKE '%mailDocumentFile%' THEN 'Mail'
                    WHEN dtl.api_name LIKE '%download%' AND dtl.api_name NOT LIKE '%downloadUploadedFile%'  THEN 'Download'
                    WHEN dtl.api_name LIKE '%get%' OR (dtl.api_name LIKE '%copy%' AND dtl.activity = 'DN' ) THEN 'Download'
                    ELSE 'Upload'
                END AS apiName, 
                dtl.storage_type AS storageType, 
                dtl.created_on AS createdOn, 
                dtl.client_id AS clientId,
                c.uuid AS clientUuid, 
                c.name AS clientName,
                p.uuid AS partnerUuid, 
                p.name AS partnerName,
                pld.uuid AS partnerLocationUuid, 
                pld.code AS partnerLocationCode, 
                pld.store_name AS partnerLocationStoreName
            FROM 
                data_transact_log dtl
            LEFT JOIN 
                client c ON c.id = dtl.client_id
            LEFT JOIN 
                partner p ON p.id = dtl.partner_id
            LEFT JOIN 
                partner_location_detail pld ON pld.id = dtl.location_id
            WHERE 
                dtl.file_name IS NOT NULL            
        `
            if (partnerUuid && partnerUuid?.length > 0) {
                sql = sql + ` AND p.uuid = '${partnerUuid}'`
            }

            if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid && clientUuid?.length > 0) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

            if (activity && activity?.length > 0) {
                sql = sql + ` AND UPPER(dtl.activity) = '${activity.toUpperCase()}'`
            }

            if (storageType && storageType?.length > 0) {
                sql = sql + ` AND UPPER(dtl.storage_type) = '${storageType.toUpperCase()}'`
            }

            if (userType && userType?.length > 0) {
                sql = sql + ` AND UPPER(dtl.user) = '${userType.toUpperCase()}'`
            }

            if (fileName && fileName?.length > 0) {
                sql = sql + ` AND UPPER(dtl.file_name) = '${fileName.toUpperCase()}'`
            }

            if (fromDate && fromDate?.length > 0) {
                sql = sql + ` AND DATE(dtl.created_on) >= '${fromDate}'`
            }

            if (toDate && toDate?.length > 0) {
                sql = sql + ` AND DATE(dtl.created_on) <= '${toDate}'`
            }

            if (action && action?.length > 0) {
                sql = sql + ` AND (dtl.api_name LIKE '%${action}%'`

                if (action1 && action1?.length > 0) {
                    sql = sql +  ` OR dtl.api_name LIKE '%${action1}%'`
                }
                sql = sql + ')'
            }

            if(!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0)
            {
                sql = sql +  ` AND DATE(dtl.created_on) = DATE('${uploadedOn}')`
            }

            sql = sql + ` ORDER by dtl.created_on DESC ) AS subquery;`
            //  
            // console.log(sql)
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                // console.log(result)      
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getLastDocumentUploadDateLog = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, fileName, action1, activity, userType, storageType) => {
    return new Promise((resolve, reject) => {
        try {
            // let sql = `SELECT 
            //                     MAX(DATE_FORMAT(dtl.created_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn 
            //                     FROM 
            //                         data_transact_log dtl;  
            //         `

            let sql = ` SELECT  MAX(DATE_FORMAT(dtl.created_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn 
            FROM 
                data_transact_log dtl
            LEFT JOIN 
                client c ON c.id = dtl.client_id
            LEFT JOIN 
                partner p ON p.id = dtl.partner_id
            LEFT JOIN 
                partner_location_detail pld ON pld.id = dtl.location_id
            WHERE 
                dtl.file_name IS NOT NULL            
        `
            if (partnerUuid && partnerUuid?.length > 0) {
                sql = sql + ` AND p.uuid = '${partnerUuid}'`
            }

            if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid && clientUuid?.length > 0) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

            if (activity && activity?.length > 0) {
                sql = sql + ` AND UPPER(dtl.activity) = '${activity.toUpperCase()}'`
            }

            if (storageType && storageType?.length > 0) {
                sql = sql + ` AND UPPER(dtl.storage_type) = '${storageType.toUpperCase()}'`
            }

            if (userType && userType?.length > 0) {
                sql = sql + ` AND UPPER(dtl.user) = '${userType.toUpperCase()}'`
            }

            if (fileName && fileName?.length > 0) {
                sql = sql + ` AND UPPER(dtl.file_name) = '${fileName.toUpperCase()}'`
            }

            if (fromDate && fromDate?.length > 0) {
                sql = sql + ` AND DATE(dtl.created_on) >= '${fromDate}'`
            }

            if (toDate && toDate?.length > 0) {
                sql = sql + ` AND DATE(dtl.created_on) <= '${toDate}'`
            }

            if (action && action?.length > 0) {
                sql = sql + ` AND dtl.api_name LIKE '%${action}%'`
                // sql = sql +  ` AND dtl.api_name NOT LIKE '%${action1}%'`
            }

            sql = sql + ` ORDER by dtl.created_on DESC`

            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getDataTransactLogTotalCounts = (storageType, clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                                totalFileSize,
                                todaysFileSize,
                                totalFileSizeForView,
                                totalFileSizeForMail,
                                totalFileSizeForDownload,
                                totalFileSizeForUpload,
                                todayFileSizeForView,
                                todayFileSizeForMail,
                                todayFileSizeForDownload,
                                todayFileSizeForUpload,
                                CONCAT(
                                    ROUND(
                                        totalFileSize / 
                                        CASE 
                                            WHEN totalFileSize >= POW(1024, 4) THEN POW(1024, 4) 
                                            WHEN totalFileSize >= POW(1024, 3) THEN POW(1024, 3) 
                                            WHEN totalFileSize >= POW(1024, 2) THEN POW(1024, 2) 
                                            WHEN totalFileSize >= 1024 THEN 1024 
                                            ELSE 1 
                                        END,
                                        2
                                    ),
                                    ' ',
                                    CASE 
                                        WHEN totalFileSize >= POW(1024, 4) THEN 'TB' 
                                        WHEN totalFileSize >= POW(1024, 3) THEN 'GB' 
                                        WHEN totalFileSize >= POW(1024, 2) THEN 'MB' 
                                        WHEN totalFileSize >= 1024 THEN 'KB' 
                                        ELSE 'B' 
                                    END
                                ) AS totalFileSizes,
                                CONCAT(
                                    ROUND(
                                        todaysFileSize / 
                                        CASE 
                                            WHEN todaysFileSize >= POW(1024, 4) THEN POW(1024, 4) 
                                            WHEN todaysFileSize >= POW(1024, 3) THEN POW(1024, 3) 
                                            WHEN todaysFileSize >= POW(1024, 2) THEN POW(1024, 2) 
                                            WHEN todaysFileSize >= 1024 THEN 1024 
                                            ELSE 1 
                                        END,
                                        2
                                    ),
                                    ' ',
                                    CASE 
                                        WHEN todaysFileSize >= POW(1024, 4) THEN 'TB' 
                                        WHEN todaysFileSize >= POW(1024, 3) THEN 'GB' 
                                        WHEN todaysFileSize >= POW(1024, 2) THEN 'MB' 
                                        WHEN todaysFileSize >= 1024 THEN 'KB' 
                                        ELSE 'B' 
                                    END
                                ) AS todaysFileSizes,
                                CONCAT(
                                ROUND(
                                    totalFileSizeForView / 
                                    CASE 
                                        WHEN totalFileSizeForView >= POW(1024, 4) THEN POW(1024, 4) 
                                        WHEN totalFileSizeForView >= POW(1024, 3) THEN POW(1024, 3) 
                                        WHEN totalFileSizeForView >= POW(1024, 2) THEN POW(1024, 2) 
                                        WHEN totalFileSizeForView >= 1024 THEN 1024 
                                        ELSE 1 
                                    END,
                                    2
                                ),
                                ' ',
                                CASE 
                                    WHEN totalFileSizeForView >= POW(1024, 4) THEN 'TB' 
                                    WHEN totalFileSizeForView >= POW(1024, 3) THEN 'GB' 
                                    WHEN totalFileSizeForView >= POW(1024, 2) THEN 'MB' 
                                    WHEN totalFileSizeForView >= 1024 THEN 'KB' 
                                    ELSE 'B' 
                                END
                                ) AS totalFileSizeForViews,
                                CONCAT(
                                ROUND(
                                    totalFileSizeForMail / 
                                    CASE 
                                        WHEN totalFileSizeForMail >= POW(1024, 4) THEN POW(1024, 4) 
                                        WHEN totalFileSizeForMail >= POW(1024, 3) THEN POW(1024, 3) 
                                        WHEN totalFileSizeForMail >= POW(1024, 2) THEN POW(1024, 2) 
                                        WHEN totalFileSizeForMail >= 1024 THEN 1024 
                                        ELSE 1 
                                    END,
                                    2
                                ),
                                ' ',
                                CASE 
                                    WHEN totalFileSizeForMail >= POW(1024, 4) THEN 'TB' 
                                    WHEN totalFileSizeForMail >= POW(1024, 3) THEN 'GB' 
                                    WHEN totalFileSizeForMail >= POW(1024, 2) THEN 'MB' 
                                    WHEN totalFileSizeForMail >= 1024 THEN 'KB' 
                                    ELSE 'B' 
                                END
                                ) AS totalFileSizeForMails,
                                CONCAT(
                                ROUND(
                                    totalFileSizeForDownload / 
                                    CASE 
                                        WHEN totalFileSizeForDownload >= POW(1024, 4) THEN POW(1024, 4) 
                                        WHEN totalFileSizeForDownload >= POW(1024, 3) THEN POW(1024, 3) 
                                        WHEN totalFileSizeForDownload >= POW(1024, 2) THEN POW(1024, 2) 
                                        WHEN totalFileSizeForDownload >= 1024 THEN 1024 
                                        ELSE 1 
                                    END,
                                    2
                                ),
                                ' ',
                                CASE 
                                    WHEN totalFileSizeForDownload >= POW(1024, 4) THEN 'TB' 
                                    WHEN totalFileSizeForDownload >= POW(1024, 3) THEN 'GB' 
                                    WHEN totalFileSizeForDownload >= POW(1024, 2) THEN 'MB' 
                                    WHEN totalFileSizeForDownload >= 1024 THEN 'KB' 
                                    ELSE 'B' 
                                END
                                ) AS totalFileSizeForDownloads,
                                CONCAT(
                                ROUND(
                                    totalFileSizeForUpload / 
                                    CASE 
                                        WHEN totalFileSizeForUpload >= POW(1024, 4) THEN POW(1024, 4) 
                                        WHEN totalFileSizeForUpload >= POW(1024, 3) THEN POW(1024, 3) 
                                        WHEN totalFileSizeForUpload >= POW(1024, 2) THEN POW(1024, 2) 
                                        WHEN totalFileSizeForUpload >= 1024 THEN 1024 
                                        ELSE 1 
                                    END,
                                    2
                                ),
                                ' ',
                                CASE 
                                    WHEN totalFileSizeForUpload >= POW(1024, 4) THEN 'TB' 
                                    WHEN totalFileSizeForUpload >= POW(1024, 3) THEN 'GB' 
                                    WHEN totalFileSizeForUpload >= POW(1024, 2) THEN 'MB' 
                                    WHEN totalFileSizeForUpload >= 1024 THEN 'KB' 
                                    ELSE 'B' 
                                END
                                ) AS totalFileSizeForUploads,
                                CONCAT(
                                ROUND(
                                    todayFileSizeForView / 
                                    CASE 
                                        WHEN todayFileSizeForView >= POW(1024, 4) THEN POW(1024, 4) 
                                        WHEN todayFileSizeForView >= POW(1024, 3) THEN POW(1024, 3) 
                                        WHEN todayFileSizeForView >= POW(1024, 2) THEN POW(1024, 2) 
                                        WHEN todayFileSizeForView >= 1024 THEN 1024 
                                        ELSE 1 
                                    END,
                                    2
                                ),
                                ' ',
                                CASE 
                                    WHEN todayFileSizeForView >= POW(1024, 4) THEN 'TB' 
                                    WHEN todayFileSizeForView >= POW(1024, 3) THEN 'GB' 
                                    WHEN todayFileSizeForView >= POW(1024, 2) THEN 'MB' 
                                    WHEN todayFileSizeForView >= 1024 THEN 'KB' 
                                    ELSE 'B' 
                                END
                                ) AS todayFileSizeForViews,
                                CONCAT(
                                ROUND(
                                    todayFileSizeForMail / 
                                    CASE 
                                        WHEN todayFileSizeForMail >= POW(1024, 4) THEN POW(1024, 4) 
                                        WHEN todayFileSizeForMail >= POW(1024, 3) THEN POW(1024, 3) 
                                        WHEN todayFileSizeForMail >= POW(1024, 2) THEN POW(1024, 2) 
                                        WHEN todayFileSizeForMail >= 1024 THEN 1024 
                                        ELSE 1 
                                    END,
                                    2
                                ),
                                ' ',
                                CASE 
                                    WHEN todayFileSizeForMail >= POW(1024, 4) THEN 'TB' 
                                    WHEN todayFileSizeForMail >= POW(1024, 3) THEN 'GB' 
                                    WHEN todayFileSizeForMail >= POW(1024, 2) THEN 'MB' 
                                    WHEN todayFileSizeForMail >= 1024 THEN 'KB' 
                                    ELSE 'B' 
                                END
                                ) AS todayFileSizeForMails,
                                CONCAT(
                                ROUND(
                                    todayFileSizeForDownload / 
                                    CASE 
                                        WHEN todayFileSizeForDownload >= POW(1024, 4) THEN POW(1024, 4) 
                                        WHEN todayFileSizeForDownload >= POW(1024, 3) THEN POW(1024, 3) 
                                        WHEN todayFileSizeForDownload >= POW(1024, 2) THEN POW(1024, 2) 
                                        WHEN todayFileSizeForDownload >= 1024 THEN 1024 
                                        ELSE 1 
                                    END,
                                    2
                                ),
                                ' ',
                                CASE 
                                    WHEN todayFileSizeForDownload >= POW(1024, 4) THEN 'TB' 
                                    WHEN todayFileSizeForDownload >= POW(1024, 3) THEN 'GB' 
                                    WHEN todayFileSizeForDownload >= POW(1024, 2) THEN 'MB' 
                                    WHEN todayFileSizeForDownload >= 1024 THEN 'KB' 
                                    ELSE 'B' 
                                END
                                ) AS todayFileSizeForDownloads,
                                CONCAT(
                                ROUND(
                                    todayFileSizeForUpload / 
                                    CASE 
                                        WHEN todayFileSizeForUpload >= POW(1024, 4) THEN POW(1024, 4) 
                                        WHEN todayFileSizeForUpload >= POW(1024, 3) THEN POW(1024, 3) 
                                        WHEN todayFileSizeForUpload >= POW(1024, 2) THEN POW(1024, 2) 
                                        WHEN todayFileSizeForUpload >= 1024 THEN 1024 
                                        ELSE 1 
                                    END,
                                    2
                                ),
                                ' ',
                                CASE 
                                    WHEN todayFileSizeForUpload >= POW(1024, 4) THEN 'TB' 
                                    WHEN todayFileSizeForUpload >= POW(1024, 3) THEN 'GB' 
                                    WHEN todayFileSizeForUpload >= POW(1024, 2) THEN 'MB' 
                                    WHEN todayFileSizeForUpload >= 1024 THEN 'KB' 
                                    ELSE 'B' 
                                END
                                ) AS todayFileSizeForUploads

                                FROM (
                                SELECT 
                                    SUM(file_size) AS totalFileSize,
                                    SUM(IF(DATE(created_on) = CURDATE(), file_size, 0)) AS todaysFileSize,
                                    SUM(IF(api_name LIKE '%downloadUploadedFile%' OR api_name LIKE '%getUploadedPOOrInvoiceFile%'
                                    OR api_name LIKE '%getDocumentTimelineFile%' OR api_name LIKE '%viewUploadedFile%', file_size, 0)) AS totalFileSizeForView,
                                    SUM(IF(api_name LIKE '%mailDocumentFile%', file_size, 0)) AS totalFileSizeForMail,
                                    SUM(IF(api_name LIKE '%download%' AND api_name NOT LIKE '%downloadUploadedFile%' 
                                        OR (api_name LIKE '%get%' OR (api_name LIKE '%copy%' AND activity = 'DN')), file_size, 0)) AS totalFileSizeForDownload,
                                    SUM(IF(api_name NOT LIKE '%downloadUploadedFile%' AND api_name NOT LIKE '%mailDocumentFile%' 
                                        AND (api_name NOT LIKE '%download%' OR api_name LIKE '%downloadUploadedFile%')
                                        AND (api_name NOT LIKE '%get%' OR (api_name LIKE '%copy%' AND activity = 'DN')), file_size, 0)) AS totalFileSizeForUpload,

                                    SUM(IF((api_name LIKE '%downloadUploadedFile%' OR api_name LIKE '%viewUploadedFile%') AND DATE(created_on) = CURDATE() OR ((api_name LIKE '%getUploadedPOOrInvoiceFile%'
                                    OR api_name LIKE '%getDocumentTimelineFile%') AND DATE(created_on) = CURDATE()), file_size, 0)) AS todayFileSizeForView,
                                    SUM(IF(api_name LIKE '%mailDocumentFile%' AND DATE(created_on) = CURDATE(), file_size, 0)) AS todayFileSizeForMail,
                                    SUM(IF(api_name LIKE '%download%' AND api_name NOT LIKE '%downloadUploadedFile%' AND DATE(created_on) = CURDATE()
                                        OR ((api_name LIKE '%get%' OR (api_name LIKE '%copy%' AND activity = 'DN')) AND DATE(created_on) = CURDATE()), file_size, 0))
                                        AS todayFileSizeForDownload,
                                    SUM(IF(api_name NOT LIKE '%downloadUploadedFile%' AND api_name NOT LIKE '%viewUploadedFile%' AND api_name NOT LIKE '%mailDocumentFile%' 
                                        AND (api_name NOT LIKE '%download%' OR api_name LIKE '%downloadUploadedFile%')
                                        AND (api_name NOT LIKE '%get%' OR (api_name LIKE '%copy%' AND activity = 'DN')) AND DATE(created_on) = CURDATE(), file_size, 0))
                                        AS todayFileSizeForUpload
                                FROM 
                                    data_transact_log
                                WHERE 
                                    file_name IS NOT NULL
                       
            `
            if (storageType && storageType?.length > 0) {
                sql = sql + ` AND UPPER(storage_type) = '${storageType.toUpperCase()}'`
            }
            if (clientUuid && clientUuid?.length > 0) {
                sql = sql + ` AND client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}')`
            }

            sql = sql + ` ORDER by created_on DESC ) AS subquery;`
            //  
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                // console.log(result)      
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getLastDocumentUploadDatePartner = (clientUuid, documentName, userId, partnerLocationUuid, loggedUserType) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                               MAX(DATE_FORMAT(cudm.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn 
                                FROM 
                                    client_uploaded_document_master cudm
                                JOIN 
                                    client c ON c.id = cudm.client_id
                                JOIN 
                                    document_category dc ON dc.id = cudm.document_category_id AND dc.name = '${documentName}'

                                `

                                if (loggedUserType == 'Partner-User') {
                                    sql = sql + ` 
                                JOIN 
                                    secondary_partner_location_detail spld ON spld.partner_location_detail_id = cudm.partner_location_detail_id
                                JOIN 
                                    secondary_partner sp ON sp.id = spld.secondary_partner_id AND sp.id = '${userId}'
                                JOIN 
                                    partner p ON p.id = sp.partner_id 
                                JOIN 
                                    partner_location_detail pld ON pld.id = spld.partner_location_detail_id
                                    
                                    `
                                }
                                else {
                                    sql = sql +  `

                                    JOIN 
                                        partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                                    LEFT JOIN 
                                        partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
                                    JOIN 
                                        partner p ON p.id = psgm.partner_id AND p.id = '${userId}'
                                        `
                                }



                               
                sql = sql +     ` 
                                WHERE
                                    cudm.partner_location_detail_id IS NOT NULL    
                                AND c.uuid = '${clientUuid}'
                    `

            if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            //  
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getMasterClientDocumentDataCountsPartner = (clientUuid, documentName, currentDate, userId, partnerLocationUuid, loggedUserType) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                                COUNT(cudm.id) AS totalCount 
                                FROM 
                                    client_uploaded_document_master cudm
                                JOIN 
                                    client c ON c.id = cudm.client_id
                                JOIN 
                                    document_category dc ON dc.id = cudm.document_category_id AND dc.name = '${documentName}'

                                    `

                                    if (loggedUserType == 'Partner-User') {
                                        sql = sql + ` 
                                    JOIN 
                                        secondary_partner_location_detail spld ON spld.partner_location_detail_id = cudm.partner_location_detail_id
                                    JOIN 
                                        secondary_partner sp ON sp.id = spld.secondary_partner_id AND sp.id = '${userId}'
                                    JOIN 
                                        partner p ON p.id = sp.partner_id 
                                    JOIN 
                                        partner_location_detail pld ON pld.id = spld.partner_location_detail_id
                                        
                                        `
                                    }
                                    else {
                                        sql = sql +   `
                                
                                        JOIN 
                                            partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                                        LEFT JOIN 
                                            partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
                                        JOIN 
                                            partner p ON p.id = psgm.partner_id AND p.id = '${userId}'
        
                                            `
                                    }
                                    
                                   

                sql = sql +  `
                                WHERE
                                    cudm.partner_location_detail_id IS NOT NULL    
                                AND 
                                    DATE(cudm.uploaded_on) = DATE(?)                            
                                AND 
                                    c.uuid = '${clientUuid}' 
                                
                    `

            if (documentName == 'Credit Note') {
                sql = sql + ` AND   
                                ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2)`
            }

            if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            //  
            pool.query(sql, [currentDate], (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}





db.selectClient = (clientUuid) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT id FROM client WHERE uuid = '${clientUuid}'; `
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
            console.log(e)
        }
    });
};

module.exports = db
