let express = require('express')
let router = express.Router()
let manualBlockerDb = require('./dbQueryManualRunBlocker')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

router.get('/', async (req, res) => {
    try {
        let status = await manualBlockerDb.getStatus()

        if (!status) {
            return res.status(404).json({
                status_code: 404,
                message: "Blocker status not found",
                status_name: getCode.getStatus(404)
            })
        }

        return res.status(200).json({
            status_code: 200,
            status_name: getCode.getStatus(200),
            data: status
        })
    }
    catch (e) {
        console.error(e)
        return res.status(500).json({
            status_code: 500,
            message: "Error while fetching blocker status",
            status_name: getCode.getStatus(500)
        })
    }
})

module.exports = router
