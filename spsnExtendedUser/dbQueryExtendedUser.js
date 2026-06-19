let pool = require('../databaseConnection/createconnection')
let db = {}

/* =========================
   CREATE EXTENDED USER
========================= */
db.createExtendedUser = (data) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO spsn_extended_user
        (uuid, name, email, mobile, designation_code, password, client_id, created_by_id)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
        `
        pool.query(sql, [
            data.name,
            data.email,
            data.mobile,
            data.designationCode,
            data.password,
            data.clientId,
            data.createdById
        ], (err, res) => {
            if (err) return reject(err)
            resolve(res.insertId)
        })
    })
}

/* =========================
   FETCH EXTENDED USERS LIST
========================= */
db.getExtendedUsers = (clientId) => {
    return new Promise((resolve, reject) => {
        const params = [1]
        let sql = `
        SELECT 
            eu.id,
            eu.uuid,
            eu.name,
            eu.email,
            eu.mobile,
            eu.designation_code,
            eu.is_active,

            COUNT(DISTINCT esm.spsn_user_id) AS spsnCount,
            COUNT(DISTINCT est.store_type) AS storeTypeCount,
            GROUP_CONCAT(DISTINCT est.store_type ORDER BY est.store_type SEPARATOR ', ') AS storeTypes,
            COUNT(DISTINCT epl.partner_location_id) AS locationCount

        FROM spsn_extended_user eu
        LEFT JOIN spsn_extended_user_spsn_map esm 
            ON esm.extended_user_id = eu.id AND esm.is_active = 1
        LEFT JOIN extended_user_store_type_map est 
            ON est.extended_user_id = eu.id AND est.is_active = 1
        LEFT JOIN spsn_extended_user_partner_location_map epl 
            ON epl.extended_user_id = eu.id AND epl.is_active = 1
        WHERE 1 = ? 

        `

        if(clientId)
        {
            sql += ` AND eu.client_id = ?`
            params.push(clientId)
        }

        sql += ` 
        GROUP BY eu.id
        ORDER BY eu.created_on DESC`

        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}

/* =========================
   FETCH EXTENDED USER DETAIL
========================= */
db.getExtendedUserDetail = (uuid) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT * FROM spsn_extended_user WHERE uuid = ?
        `
        pool.query(sql, [uuid], (err, rows) => {
            if (err) return reject(err)
            resolve(rows[0])
        })
    })
}

db.getExtendedUser = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT * FROM spsn_extended_user WHERE id = ?
        `
        pool.query(sql, [id], (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}

// db.getUserMappings = (userId) => {
//     return new Promise((resolve, reject) => {
//         const sql = `
//         SELECT 
//             (SELECT JSON_ARRAYAGG(spsn_user_id) 
//              FROM spsn_extended_user_spsn_map 
//              WHERE extended_user_id = ? AND is_active = 1) AS spsnIds,

//             (SELECT JSON_ARRAYAGG(store_type)
//              FROM extended_user_store_type_map
//              WHERE extended_user_id = ? AND is_active = 1) AS storeTypes,

//             (SELECT JSON_ARRAYAGG(partner_location_id)
//              FROM spsn_extended_user_partner_location_map
//              WHERE extended_user_id = ? AND is_active = 1) AS partnerLocations
//         `
//         pool.query(sql, [userId, userId, userId], (err, rows) => {
//             if (err) return reject(err)
//             resolve(rows)
//         })
//     })
// }

/* =========================
   RESET + SAVE MAPPINGS
========================= */
db.resetMappings = async (conn, userId) => {
    await conn.query(`DELETE FROM spsn_extended_user_spsn_map WHERE extended_user_id = ?`, [userId])
    await conn.query(`DELETE FROM extended_user_store_type_map WHERE extended_user_id = ?`, [userId])
    await conn.query(`DELETE FROM spsn_extended_user_partner_location_map WHERE extended_user_id = ?`, [userId])
}


db.getClient = (uuid) => {
    return new Promise((resolve, reject) => {

        let sql = `
        SELECT 
            c.*
        FROM client c
        WHERE c.uuid = ?
        `
        
        pool.query(sql, [uuid], (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}


db.getPartnerLocation = (uuid) => {
    return new Promise((resolve, reject) => {

        let sql = `
        SELECT 
            pld.*
        FROM partner_location_detail pld
        WHERE pld.uuid = ?
        `
        
        pool.query(sql, [uuid], (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}

db.getSpsn = (uuid) => {
    return new Promise((resolve, reject) => {

        let sql = `
        SELECT 
            sumt.*
        FROM spsn_user_master sumt
        WHERE sumt.uuid = ?
        `
        
        pool.query(sql, [uuid], (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}

db.getExtendedUserByUuid = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            const sql = `
                SELECT * FROM spsn_extended_user WHERE uuid = ?
            `;
            pool.query(sql, [uuid], (err, rows) => {
                if (err) return reject(err);
                resolve(rows[0]);
            });
        } catch (e) {
            reject(e);
        }
    });
};

db.getUserMappings = (userId) => {
    return new Promise((resolve, reject) => {
        try {
            const result = {};

            //    COALESCE(sums.id, null)        AS spsnId,
            //         COALESCE(sums.uuid, null)      AS spsnUuid,
            //         COALESCE(sums.name, 'None')      AS spsnName,
            //         COALESCE(sums.spsn_code, 'None') AS spsnCode

            const spsnSql = `
                SELECT COALESCE(sumt.uuid, null) AS uuid, COALESCE(sumt.name, 'None') as name
                FROM spsn_extended_user_spsn_map m
                LEFT JOIN spsn_user_master sumt ON sumt.id = m.spsn_user_id
                WHERE m.extended_user_id = ?
            `;

            const storeSql = `
                SELECT store_type
                FROM extended_user_store_type_map
                WHERE extended_user_id = ?
            `;

            const locationSql = `
                SELECT pld.uuid, pld.store_name, pld.code, pld.store_location, pld.customer_type
                FROM spsn_extended_user_partner_location_map m
                JOIN partner_location_detail pld ON pld.id = m.partner_location_id
                WHERE m.extended_user_id = ?
            `;

            pool.query(spsnSql, [userId], (e1, spsn) => {
                if (e1) return reject(e1);
                result.spsns = spsn;

                pool.query(storeSql, [userId], (e2, stores) => {
                    if (e2) return reject(e2);
                    result.storeTypes = stores;

                    pool.query(locationSql, [userId], (e3, locs) => {
                        if (e3) return reject(e3);
                        result.partnerLocations = locs;
                        resolve(result);
                    });
                });
            });
        } catch (e) {
            reject(e);
        }
    });
};

db.getSpsnList = (userId) => {
    return new Promise((resolve, reject) => {
         const sql = `
            SELECT 
                COALESCE(sumt.id, null) AS id,
                COALESCE(sumt.uuid, null) AS uuid,
                COALESCE(sumt.code, 'None') AS code,
                COALESCE(sumt.name, 'None') AS name,
                IF(m.id IS NULL, 0, 1) AS isMapped
            FROM spsn_user_master sumt
            LEFT JOIN spsn_extended_user_spsn_map m 
                ON m.spsn_user_id = sumt.id
                AND m.extended_user_id = ?
                AND m.is_active = 1
            WHERE sumt.is_active = 1
            ORDER BY sumt.name
        `;

        pool.query(sql, [userId], (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}

// db.getPartnerLocationList = (extendedUserId,
//             designationCode,
//             spsnUuids,
//             storeTypes,
//             isNoneSelected) => {
//     return new Promise((resolve, reject) => {
//         //    const sql = `
//         //     SELECT 
//         //         pld.id,
//         //         pld.store_name,
//         //         pld.customer_type AS store_type,
//         //         IF(map.id IS NULL, 0, 1) AS isMapped
//         //     FROM partner_location_detail pld
//         //     LEFT JOIN spsn_extended_user_partner_location_map map
//         //         ON map.partner_location_id = pld.id
//         //         AND map.extended_user_id = ?
//         //         AND map.is_active = 1
//         //     WHERE pld.is_active = 1
//         //     AND pld.customer_type IN (?)
//         //     AND (
//         //         ? = 1
//         //         OR pld.spsn_user_id IN (?)
//         //     )
//         //     ORDER BY pld.store_name
//         // `;

//         // console.log(sql, [
//         //         extendedUserId,
//         //         storeTypes,
//         //         isNoneSelected ? 1 : 0,
//         //         spsnUuids
//         //     ])

//         let sql = `
//             SELECT 
//                 pld.id,
//                 pld.uuid,
//                 pld.code,
//                 pld.store_name,
//                 pld.customer_type AS store_type,
//                 IF(map.id IS NULL, 0, 1) AS isMapped
//             FROM partner_location_detail pld
//             LEFT JOIN spsn_extended_user_partner_location_map map
//                 ON map.partner_location_id = pld.id
//                 AND map.extended_user_id = ?
//                 AND map.is_active = 1
//             LEFT JOIN spsn_user_master sumt ON sumt.id = pld.spsn_user_id
//             WHERE pld.is_active = 1
//             AND pld.customer_type IN (?)
//         `;

        
//         let params = [extendedUserId, storeTypes];

//         /* SPSN logic */
//         if (isNoneSelected == true) {
//             /* NONE selected → only locations NOT mapped to any SPSN */
//             sql += ` AND pld.spsn_user_id IS NULL `;
//         } 
        
//         if (spsnUuids && spsnUuids?.length){
//             /* SPSN selected */
//             sql += ` AND sumt.uuid IN (?) `;
//             params.push(spsnUuids);
//         }

//          /* ❗ Exclude locations already mapped to other users with same designation */
//         sql += `
//             AND NOT EXISTS (
//                 SELECT 1
//                 FROM spsn_extended_user_partner_location_map x
//                 WHERE x.partner_location_id = pld.id
//                 AND x.designation_code = ?
//                 AND x.extended_user_id <> ?
//                 AND x.is_active = 1
//             )
//         `;

//         params.push(designationCode, extendedUserId);

//         sql += ` ORDER BY pld.store_name `;

//         // console.log(sql, params)

//         pool.query(sql,  params, (err, rows) => {
//             if (err) return reject(err)
//             resolve(rows)
//         })
//     })
// }

db.getPartnerLocationList = (
    extendedUserId,
    designationCode,
    spsnUuids,
    storeTypes,
    isNoneSelected
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
                SELECT 
                    pld.id,
                    pld.uuid,
                    pld.code,
                    pld.store_name,
                    pld.customer_type AS store_type,
                    IF(map.id IS NULL, 0, 1) AS isMapped,
                    pld.spsn_user_id AS spsnUserId
                FROM partner_location_detail pld
                LEFT JOIN spsn_extended_user_partner_location_map map
                    ON map.partner_location_id = pld.id
                    AND map.extended_user_id = ?
                    AND map.is_active = 1
                LEFT JOIN spsn_user_master sumt 
                    ON sumt.id = pld.spsn_user_id
                WHERE pld.is_active = 1
                  AND pld.customer_type IN (?)
            `;

            let params = [extendedUserId, storeTypes];

            /* 🔹 SPSN filter logic (NONE / SPSN / BOTH) */
            let spsnConditions = [];

            // Case 1: NONE selected
            if (isNoneSelected === true) {
                spsnConditions.push(`pld.spsn_user_id IS NULL`);
            }

            // Case 2: SPSN UUIDs selected
            if (spsnUuids && Array.isArray(spsnUuids) && spsnUuids.length > 0) {
                spsnConditions.push(`sumt.uuid IN (?)`);
                params.push(spsnUuids);
            }

            // Apply SPSN filter only if any condition exists
            if (spsnConditions.length > 0) {
                sql += ` AND ( ${spsnConditions.join(" OR ")} ) `;
            }

            /* ❗ Exclude locations already mapped to other users with same designation */
            sql += `
                AND NOT EXISTS (
                    SELECT 1
                    FROM spsn_extended_user_partner_location_map x
                    WHERE x.partner_location_id = pld.id
                      AND x.designation_code = ?
                      AND x.extended_user_id <> ?
                      AND x.is_active = 1
                )
            `;

            params.push(designationCode, extendedUserId);

            sql += ` ORDER BY pld.store_name `;

            // console.log(sql, params);

            pool.query(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });

        } catch (e) {
            reject(e);
        }
    });
};


db.getExtendedUserWithLocations = (
    clientUuid,
    userTypeCode,
    fromDate,
    toDate
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
                SELECT
                    seu.id                    AS extendedUserId,
                    seu.uuid                  AS extendedUserUuid,
                    seu.name                  AS extendedUserName,
                    seu.email                 AS extendedUserEmail,
                    seu.mobile                AS extendedUserMobile,
                    seu.designation_code      AS designationCode,

                    pld.id                    AS locationId,
                    pld.uuid                  AS locationUuid,
                    pld.code                  AS locationCode,
                    pld.store_name            AS storeName,
                    pld.store_location        AS storeLocation,
                    pld.email                 AS locationEmail,
                    pld.mobile                AS locationMobile,

                  --  sums.id                   AS spsnId,
                  --  sums.uuid                 AS spsnUuid,
                   -- sums.name                 AS spsnName,
                  --  sums.spsn_code            AS spsnCode

                     COALESCE(sums.id, null)        AS spsnId,
                    COALESCE(sums.uuid, null)      AS spsnUuid,
                    COALESCE(sums.name, 'None')      AS spsnName,
                    COALESCE(sums.spsn_code, 'None') AS spsnCode

                FROM spsn_extended_user seu

                INNER JOIN spsn_extended_user_partner_location_map eul
                    ON eul.extended_user_id = seu.id
                    AND eul.is_active = 1

                INNER JOIN partner_location_detail pld
                    ON pld.id = eul.partner_location_id

                LEFT JOIN spsn_extended_user_spsn_map eusm
                    ON eusm.extended_user_id = seu.id
                    AND eusm.is_active = 1

                LEFT JOIN spsn_user_master sums
                    ON sums.id = eusm.spsn_user_id

                WHERE seu.is_active = 1
                AND seu.client_id = (
                    SELECT id FROM client WHERE uuid = '${clientUuid}'
                )
            `;

            // Non-admin users → only active locations
            if (userTypeCode !== 'ADM') {
                sql += ` AND pld.is_active = 1 `;
            }

            if (fromDate) {
                sql += ` AND DATE(eul.created_on) >= DATE('${fromDate}') `;
            }

            if (toDate) {
                sql += ` AND DATE(eul.created_on) <= DATE('${toDate}') `;
            }

            sql += `
                ORDER BY seu.id, pld.id
            `;

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};

db.getExtendedUserWithSpsn = (clientUuid, userTypeCode) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
                SELECT
                    seu.id               AS extendedUserId,
                    seu.uuid             AS extendedUserUuid,
                    seu.name             AS extendedUserName,
                    seu.email            AS extendedUserEmail,
                    seu.mobile           AS extendedUserMobile,
                    seu.designation_code AS designationCode,
                    seu.is_active        AS isActive,

                  --  sums.id              AS spsnId,
                  --  sums.uuid            AS spsnUuid,
                  --  sums.name            AS spsnName,
                   -- sums.spsn_code       AS spsnCode

                   COALESCE(sums.id, null)        AS spsnId,
                    COALESCE(sums.uuid, null)      AS spsnUuid,
                    COALESCE(sums.name, 'None')      AS spsnName,
                    COALESCE(sums.spsn_code, 'None') AS spsnCode

                FROM spsn_extended_user seu

                LEFT JOIN spsn_extended_user_spsn_map eusm
                    ON eusm.extended_user_id = seu.id
                    AND eusm.is_active = 1

                LEFT JOIN spsn_user_master sums
                    ON sums.id = eusm.spsn_user_id

                WHERE seu.client_id = (
                    SELECT id FROM client WHERE uuid = '${clientUuid}'
                )
            `;

            if (userTypeCode !== 'ADM') {
                sql += ` AND seu.is_active = 1 `;
            }

            sql += `
                ORDER BY seu.id
            `;

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};


module.exports = db
