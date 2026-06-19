const router = require('express').Router()
const db = require('./dbQueryExtendedUser')

router.get('/:extendedUserUuid?', async (req, res) => {
    try {
        const {extendedUserUuid} = req.query;

        const user = await db.getExtendedUserDetail(extendedUserUuid)
        
        if (!user) return res.status(404).json({ success: false, message : "User not found" })

        const extendedUserId = user.id || null;       

        const data = await db.getSpsnList(extendedUserId)
        res.json({ success: true, spsnList : data })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

module.exports = router
