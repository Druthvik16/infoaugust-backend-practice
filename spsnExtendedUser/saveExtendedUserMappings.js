let db = require('./dbQueryExtendedUser');
let pool = require('../databaseConnection/createconnection');

module.exports = require('express').Router().post('/', async (req, res) => {
    const connection = await pool.promise().getConnection();
    try {
        await connection.beginTransaction();

        const {uuid} = req.body;

        const [userRows] = await connection.query(
            `SELECT id, is_active, designation_code 
             FROM spsn_extended_user WHERE uuid = ?`,
            [uuid]
        );

        if (!userRows.length)
            throw new Error('Extended user not found');

        const user = userRows[0];

        if (!user.is_active)
            return res.status(403).json({
                success: false,
                message: 'Extended user is inactive'
            });

        const {
            spsnUuids:spsn_uuids,
            isNoneSelected: is_none,
            storeTypes: store_types,
            partnerLocationUuids: partner_location_uuids,
            userId: createdById
        } = req.body;

        // if (
        //     (is_none && spsn_uuids.length > 0) ||
        //     (!is_none && spsn_uuids.length === 0)
        // ) {
        //     throw new Error('Invalid SPSN selection');
        // }

        if (
            !is_none && !spsn_uuids.length
        ) {
            throw new Error('Invalid SPSN selection');
        }

        if (!store_types?.length)
            throw new Error('At least one store type required');

        if (!partner_location_uuids?.length)
            throw new Error('Partner location required');

        /* RESET ALL */
        await connection.query(
            `DELETE FROM spsn_extended_user_spsn_map WHERE extended_user_id = ?`,
            [user.id]
        );
        await connection.query(
            `DELETE FROM extended_user_store_type_map WHERE extended_user_id = ?`,
            [user.id]
        );
        await connection.query(
            `DELETE FROM spsn_extended_user_partner_location_map WHERE extended_user_id = ?`,
            [user.id]
        );

        /* INSERT SPSN */
        if (spsn_uuids?.length) {
            for (const spsnUuid of spsn_uuids) {
                const spsn = await db.getSpsn(spsnUuid)
                const spsnId = spsn[0].id || null
                await connection.query(
                    `INSERT INTO spsn_extended_user_spsn_map 
                     (extended_user_id, spsn_user_id, created_by_id)
                     VALUES (?, ?, ?)`,
                    [user.id, spsnId, createdById]
                );
            }
        }

        if (is_none) {
            await connection.query(
                `INSERT INTO spsn_extended_user_spsn_map 
                     (extended_user_id, spsn_user_id, created_by_id)
                     VALUES (?, ?, ?)`,
                [user.id, null, createdById]
            );
        }

        /* INSERT STORE TYPES */
        for (let type of store_types) {
            await connection.query(
                `INSERT INTO extended_user_store_type_map 
                 (extended_user_id, store_type, created_by_id)
                 VALUES (?, ?, ?)`,
                [user.id, type, createdById]
            );
        }

        /* INSERT LOCATIONS */
        for (const locUuid of partner_location_uuids) {
            const loc = await db.getPartnerLocation(locUuid)
            if (!loc?.length) {
                throw new Error('Invalid partner location');
            }
            
            const locId = loc[0].id || null

            /* 🔒 Conflict check */
            const [conflict] = await connection.query(
                `
                    SELECT id
                    FROM spsn_extended_user_partner_location_map
                    WHERE partner_location_id = ?
                    AND designation_code = ?
                    AND extended_user_id <> ?
                    AND is_active = 1
                    LIMIT 1
                `,
                [locId, user.designation_code, user.id]
            );

            if (conflict.length > 0) {
                throw new Error(
                    `Partner location already assigned to another ${user.designation_code}`
                );
            }

            await connection.query(
                `INSERT INTO spsn_extended_user_partner_location_map
                 (extended_user_id, partner_location_id, designation_code, created_by_id)
                 VALUES (?, ?, ?, ?)`,
                [user.id, locId, user.designation_code, createdById]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Mappings saved successfully' });

    } catch (e) {
        await connection.rollback();
        res.status(400).json({ success: false, message: e.message });
    } finally {
        connection.release();
    }
});
