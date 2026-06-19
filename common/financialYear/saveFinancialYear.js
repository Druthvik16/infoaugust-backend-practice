let db = require('./dbQueryFinancialYear')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().post('/', async (req, res) => {
    try {
        const { name, start_date, end_date, is_current } = req.body;

        console.log(req.body)

        if (!name || !start_date || !end_date || is_current === undefined) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const is_active = 1;

        if(is_current == 1)
        {
            const update = await db.updateFinancialYearIsCurrent();
        }

        const save  = await db.saveFinancialYear(name, start_date, end_date, is_current, is_active);

        const saveOpeningBalance = await db.saveOpeningBalance(save.insertId)

        res.status(200)
        return res.json({
            "status_code": 200,
            "message": "success",
            "status_name": getCode.getStatus(200)
        });
    }
    catch (e) {
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "No saved",
            "status_name": getCode.getStatus(500),
            "error": e?.stack
        });
    }
})