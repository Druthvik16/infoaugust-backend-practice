const router = require('express').Router()
const db = require('./dbQueryExtendedUser')

router.post('/', async (req, res) => {
    try {
        const {
            extendedUserUuid,
            spsnUuids,
            storeTypes,
            isNoneSelected
        } = req.body;

        if (!extendedUserUuid) {
            return res.status(400).json({ success: false, message : 'Missing required fields'});
        }

        const user = await db.getExtendedUserDetail(extendedUserUuid)
        if (!user) return res.status(404).json({ success: false, message : "User not found" })

        const extendedUserId = user.id || null;  

        const designationCode = user.designation_code || null;
        
        // if (!isNoneSelected && (!spsnUuids || !spsnUuids.length)) {
        //     return res.status(400).json({ success: false, message : "SPSN selection required" });
        // }

        // if (isNoneSelected && (spsnUuids && spsnUuids.length)) {
        //     return res.status(400).json({ success: false, message : 'Invalid SPSN selection' });
        // }

        if (!storeTypes.length) {
            return res.status(400).json({ success: false, message : 'Store type selection required'});
        }

        const data = await db.getPartnerLocationList(extendedUserId,
            designationCode,
            spsnUuids,
            storeTypes,
            isNoneSelected)

        const response = data.map(r => ({
                    ...r,
                    isSelectable: !(
                        r.spsnUserId &&
                        r.store_type === 'MBO'
                    )
        }));

        res.json({ success: true, partnerLocationList : response })
        
    } catch (e) {
        console.log(e)
        res.status(500).json({ success: false, message: e.message })
    }
})

module.exports = router
