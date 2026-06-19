let pool = require('../databaseConnection/createconnection')
let db = {}

db.getSecondaryPartners = (userTypeCode, fromDate, toDate, userId) => {
    return new Promise((resolve, reject) => {
        try {
            // COUNT(pld.id) AS totalLocations
            // let sql = `SELECT   sp.uuid AS partnerUuid,
            //                     sp.name AS partnerName,
            //                     sp.email AS partnerEmail,
            //                     sp.mobile AS partnerMobile,
            //                     sp.is_active AS partnerIsActive,
            //                     sp.created_on AS createdOn,
            //                     sp.created_by_id AS createdById,
            //                     sp.modified_on AS modifiedOn,
            //                     sp.modified_by_id AS modifiedById,
            //                     p.uuid AS masterPartnerUuid, 
            //                     p.name AS masterPartnerName,
            //                     p.pan AS partnerPan, 
            //                     p.is_active AS masterPartnerIsActive,
            //                     p.email AS masterPartnerEmail, 
            //                     p.mobile AS masterPartnerMobile, 
            //                     SUM(
            //                             CASE 
            //                                 WHEN '${userTypeCode}' = 'ADM' THEN 1
            //                                 WHEN '${userTypeCode}' != 'ADM' AND pld.is_active = 1 THEN 1
            //                                 ELSE 0
            //                             END
            //                         ) AS totalLocations, 
            //                     psgm.gstin AS partnerGSTIn, 
            //                     pc.id AS partnerCategoryId, 
            //                     pc.name AS partnerCategoryName, 
            //                     pc.code AS partnerCategoryCode,
            //                     s.id AS stateId, 
            //                     s.name AS stateName 
            // FROM secondary_partner sp
            // LEFT JOIN partner p ON p.id = sp.partner_id
            // LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            // LEFT JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id 
            // LEFT JOIN partner_location_detail pld ON pld.partner_statewise_gst_master_id = psgm.id 
            // LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            // LEFT JOIN state s ON s.id = psgm.state_id 
            // WHERE p.is_active = 1 
            // AND sp.is_active = 1 `

            let sql = `SELECT   
    sp.uuid AS partnerUuid,
    sp.name AS partnerName,
    sp.email AS partnerEmail,
    sp.mobile AS partnerMobile,
    sp.is_active AS partnerIsActive,
    IFNULL(loc.totalLocations, 0) AS totalLocations,
    sp.created_on AS createdOn,
    sp.created_by_id AS createdById,
    sp.modified_on AS modifiedOn,
    sp.modified_by_id AS modifiedById,
    p.uuid AS masterPartnerUuid, 
    p.name AS masterPartnerName,
    p.pan AS partnerPan, 
    p.is_active AS masterPartnerIsActive,
    p.email AS masterPartnerEmail, 
    p.mobile AS masterPartnerMobile,
    psgm.gstin AS partnerGSTIn, 
    pc.id AS partnerCategoryId, 
    pc.name AS partnerCategoryName, 
    pc.code AS partnerCategoryCode,
    s.id AS stateId, 
    s.name AS stateName 

FROM secondary_partner sp

LEFT JOIN partner p ON p.id = sp.partner_id
LEFT JOIN partner_category pc ON pc.id = p.partner_category_id

-- 👇 Subquery for location counts
LEFT JOIN (
    SELECT 
        spld.secondary_partner_id,
        COUNT(*) AS totalLocations
    FROM secondary_partner_location_detail spld
    JOIN partner_location_detail pld 
        ON pld.id = spld.partner_location_detail_id
    WHERE ('${userTypeCode}' = 'ADM' OR pld.is_active = 1)
    GROUP BY spld.secondary_partner_id
) AS loc ON loc.secondary_partner_id = sp.id

LEFT JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id
LEFT JOIN state s ON s.id = psgm.state_id 

WHERE 
    p.is_active = 1 
   
    `

            // if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`    
            
            if(userId && userId?.toString().length > 0 && (!userTypeCode || userTypeCode?.length == 0) ) sql = sql + `  AND p.id = ${userId}`

            if(fromDate && fromDate?.toString()?.length > 0 )
            {
                sql = sql +  ` AND DATE(sp.created_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(sp.created_on) <= DATE('${toDate}')`
            }

            sql = sql + `  GROUP BY 
                                    sp.name, p.name `

            sql = sql + `  ORDER BY sp.name`

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

db.getSecondaryPartnerLocations = (secondaryPartnerUuid, stateId, userTypeCode, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.uuid AS partnerLocationUuid, 
            pld.code AS partnerLocationCode, 
            pld.store_name AS partnerLocationStoreName, 
            pld.store_location AS partnerLocationStoreLocation, 
            pld.mobile AS partnerLocationMobile, 
            pld.email AS partnerLocationEmail, 
            pld.tan AS partnerLocationTan, 
            pld.address_line1 AS partnerLocationAddressLine1, 
            pld.address_line2 AS partnerLocationAddressLine2, 
            pld.address_line3 AS partnerLocationAddressLine3, 
            pld.city AS partnerLocationCity, 
            pld.pincode AS partnerLocationPincode,
            pld.msme_number AS partnerLocationMsmeNumber, 
            pld.is_active AS partnerLocationIsActive, 
            pld.created_on AS partnerLocationCreatedOn, 
            IF(pld.code IS NOT NULL, CONCAT(pld.code, '-',  IF(CHAR_LENGTH(pld.store_name) > 10, CONCAT(LEFT(pld.store_name, 10), '...'), pld.store_name), ' - ', pld.customer_type, ' (', pld.store_location, ')'), '') AS partnerLabel, 
            pld.customer_type AS customerType, 
            cb.name AS partnerLocationCreatedByName, 
            cb.uuid AS partnerLocationCreatedByUuid,
            s.id AS stateId, s.name AS stateName, 
            sums.uuid AS spsnUuid, sums.name AS spsnName, sums.spsn_code AS spsnCode, 
            psgm.id AS partnerStateWiseGstMasterId, psgm.gstin AS partnerStateWiseGstMasterGstIn
            FROM secondary_partner_location_detail spld
            LEFT JOIN secondary_partner sp ON sp.id = secondary_partner_id
            LEFT JOIN partner_location_detail pld ON pld.id = spld.partner_location_detail_id
            LEFT JOIN state s ON s.id = pld.state_id
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id AND p.id = sp.partner_id
            LEFT JOIN user cb ON cb.id = spld.created_by_id 
            LEFT JOIN spsn_user_master sums ON sums.id = pld.spsn_user_id 
            WHERE sp.uuid = '${secondaryPartnerUuid}' `

            if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

            if (stateId) {
                sql = sql + ` AND s.id = '${stateId}'`
            }

            sql = sql + ` ORDER BY pld.store_name`
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

db.getSecondaryPartnerWithLocations = (userTypeCode, fromDate, toDate, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sp.uuid, sp.name, sp.email, sp.mobile, 
            pld.uuid AS locationUuid, pld.code AS code, pld.store_name AS storeName, pld.email AS locationEmail, pld.mobile AS locationMobile,
            pc.id AS partnerCategoryId, pc.name AS partnerCategoryName,  sums.uuid AS spsnUuid, sums.name AS spsnName, sums.spsn_code AS spsnCode, pc.code AS partnerCategoryCode
            FROM secondary_partner sp
           LEFT JOIN partner p ON p.id = sp.partner_id
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN secondary_partner_location_detail spld ON spld.secondary_partner_id = sp.id
            LEFT JOIN partner_location_detail pld ON pld.id = spld.partner_location_detail_id 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id 
            LEFT JOIN spsn_user_master sums ON sums.id = pld.spsn_user_id 
            WHERE p.is_active = 1 
             `

            
            if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`  

            if(userId && userId?.toString().length > 0 && (!userTypeCode || userTypeCode?.length == 0) ) sql = sql + `  AND p.id = ${userId}`    

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(sp.created_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(sp.created_on) <= DATE('${toDate}')`
            }

            sql = sql + `  ORDER BY sp.name`

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

db.getSecondaryPartner = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sp.uuid AS partnerUuid, sp.name AS partnerName, p.pan AS partnerPan, 
            p.is_active AS partnerIsActive, sp.created_on AS partnerCreatedOn, sp.email AS partnerEmail, sp.mobile AS partnerMobile, 
            cb.name AS partnerCreatedByName, cb.uuid AS partnerCreatedByUuid,
            pc.id AS partnerCategoryId, pc.name AS partnerCategoryName, pc.code AS partnerCategoryCode,
            c.uuid AS clientUuid, c.short_name AS clientShortName, c.name AS clientName, c.code AS clientCode, c.email AS clientEmail, c.mobile AS clientMobile 
            FROM secondary_partner sp 
            LEFT JOIN partner p ON p.id = sp.partner_id
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner cb ON cb.id = sp.created_by_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id
            WHERE sp.uuid = '${uuid}'`

            sql = sql + ` ORDER BY sp.name`
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

db.getPartnerLocations = (uuidArray) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id FROM partner_location_detail WHERE uuid IN (?)`
            pool.query(sql, [uuidArray], (error, result) => {
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

db.saveSecondaryPartner = (partnerId, name, email, mobile) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO secondary_partner 
        (uuid, partner_id, name, email, mobile, created_by_id)
       VALUES (UUID(), ?, ?, ?, ?, ?)`
            pool.query(sql,[partnerId, name, email, mobile, partnerId], (error, result) => {
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

db.updateSecondaryPartner = (uuid, name, email, mobile, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE secondary_partner 
            SET name = ?, email = ?, mobile = ?, modified_by_id = ?
            WHERE uuid = ?
        `;
        pool.query(sql, [name, email, mobile, userId, uuid], (error, result) => {
            if (error) {
                console.error("Error updating secondary partner:", error);
                return reject(error);
            }
            resolve(result);
        });
    });
};

db.deleteSecondaryPartnerMappedLocations = (partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `DELETE FROM secondary_partner_location_detail WHERE secondary_partner_id = '${partnerId}'`
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

db.saveSecondaryPartnerLocation = (locationId, secondaryPartnerId, createdById) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO secondary_partner_location_detail 
                    (partner_location_detail_id, secondary_partner_id, created_by_id)
                    VALUES (?, ?, ?)`
            pool.query(sql,[locationId, secondaryPartnerId, createdById], (error, result) => {
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


db.getSecondaryPartnerByUuid = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT * FROM secondary_partner
                        WHERE uuid = '${uuid}'`
                        
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

db.changeStatusSecondaryPartner = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE secondary_partner
                        SET is_active = IF(is_active = 1, 0, 1)
                        WHERE uuid = '${uuid}'`
                        
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

module.exports = db