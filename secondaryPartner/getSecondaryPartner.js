let db = require('./dbQuerySecondaryPartner')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let partnerObj = require('../model/partner')
let partner = new partnerObj()
module.exports = require('express').Router().get('/:uuid', async (req, res) => {
    try {
        const uuid = req.params.uuid;
        const getSecondaryPartner = await db.getSecondaryPartner(uuid)

        // if (getSecondaryPartner.length == 0) {
        //     res.status(200)
        //     return res.json({
        //         "status_code": 200,
        //         "message": "success",
        //         "data": { "secondaryPartner": [] },
        //         "status_name": getCode.getStatus(200)
        //     });
        // }
        // else {
        //     clientList = [];
        //     getSecondaryPartner.forEach((element) => {
        //         partner.setClient(element)
        //         clientList.push(partner.getClient());
        //     });
        //     getSecondaryPartner[0]['clients'] = clientList
        //     partner.setDataAll(getSecondaryPartner[0])
        //     res.status(200)
        //     return res.json({
        //         "status_code": 200,
        //         "message": "success",
        //         "data": { "secondaryPartner": partner.getDataAll() },
        //         "status_name": getCode.getStatus(200)
        //     });
        // }

        res.status(200)
            return res.json({
                "status_code": 200,
                "message": "success",
                "data": { "secondaryPartner": getSecondaryPartner },
                "status_name": getCode.getStatus(200)
            });
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "No Data Found",
            "status_name": getCode.getStatus(500),
            "error": e
        });
    }
})