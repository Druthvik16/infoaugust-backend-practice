let pool = require('../databaseConnection/createconnection');

module.exports = require('express').Router().post('/', async (req, res) => {
    const connection = await pool.promise().getConnection();

    try {
        await connection.beginTransaction();

        const { uuid, userId: updatedById } = req.body;

        if (!uuid)
            throw new Error('Extended user uuid required');

        /* FETCH USER */
        const [userRows] = await connection.query(
            `
            SELECT id, is_active 
            FROM spsn_extended_user 
            WHERE uuid = ?
            `,
            [uuid]
        );

        if (!userRows.length)
            throw new Error('Extended user not found');

        const user = userRows[0];

        const isActive = user.is_active ? 0 : 1;

        // if (!user.is_active)
        //     throw new Error('Extended user already inactive');

        /* DISABLE USER */
        await connection.query(
            `
            UPDATE spsn_extended_user
            SET is_active = '${isActive}',
                modify_by_id = ?
            WHERE id = ?
            `,
            [updatedById, user.id]
        );

        /* DELETE ALL MAPPINGS */
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

        await connection.commit();

        res.json({
            success: true,
            message: 'Extended user disabled and all mappings removed successfully'
        });

    } catch (e) {
        await connection.rollback();
        res.status(400).json({
            success: false,
            message: e.message
        });
    } finally {
        connection.release();
    }
});
