const router = require('express').Router()
const db = require('./dbQueryExtendedUser')

router.get('/:uuid', async (req, res) => {
    try {
        const user = await db.getExtendedUserDetail(req.params.uuid)
        if (!user) return res.status(404).json({ success: false })

        // const mappings = await db.getUserMappings(user.id)

        //  const user = await db.getExtendedUserByUuid(req.params.uuid);
        const mappings = await db.getUserMappings(user.id);

        res.json({
            success: true,
            user,
            mappings
        })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

module.exports = router
