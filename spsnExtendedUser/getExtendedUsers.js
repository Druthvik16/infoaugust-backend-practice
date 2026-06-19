const router = require('express').Router()
const db = require('./dbQueryExtendedUser')

router.get('/:clientUuid?', async (req, res) => {
    try {
        const {clientUuid} = req.query;

        let clientId = null;
        if(clientUuid)
        {
            const client = await db.getClient(clientUuid);
            clientId = client?.length ? client[0].id || null : null;
        }

        const data = await db.getExtendedUsers(clientId)
        res.json({ success: true, data })
    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
})

module.exports = router
