let errorCode = require('./error/errorCode')
let getCode = new errorCode()
let uniqueFunction = require('./commonFunction/uniqueSearchFunction')
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let path = require("path")

const mime = require('mime');
const db = require('./dbQueryDownload')
const fs = require('fs');
const xlsx = require('xlsx');
const openingBalance = {}

const codeHeaderName = 'Code';
const openingBalanceHeaderName = 'Opening Balance';
const FYHeaderName = 'Financial Year';

module.exports = require('express').Router().get('/:fileName/:financialYearId?', async (req, res) => {
    try {
        let fileName;
        let filePath;
        fileName = req.params.fileName?.toString()?.trim()
        filePath = getPath.getName('template')
        const financialYearId = req.query.financialYearId || null;

        if (fileName == 'openingBalanceTemplate.xlsx') {
            if (!financialYearId) {
                res.status(400)
                return res.json({
                    "status_code": 400,
                    "message": "Provide financial year",
                    "status_name": getCode.getStatus(400)
                })
            }
        }

        let file = await uniqueFunction.getFileUploadedPath(filePath, fileName, '', '')
        if (!file) {
            res.status(400)
            return res.json({
                "status_code": 400,
                "message": "File Not Exist",
                "status_name": getCode.getStatus(400)
            })
        }

        if (fileName == 'openingBalanceTemplate.xlsx') {
            const openingBalances = await db.getOpeningBalanceCustomer(financialYearId)
            file.file = openingBalance.updateFile(file.file, openingBalances)
        }

        res.status(200)
        return res.json({
            "status_code": 200,
            "message": "success",
            "data": { "templateFile": "data:" + file.mime + ";base64," + file.file },
            "status_name": getCode.getStatus(200)
        })
    }
    catch (e) {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code": 500,
            "message": "File not found",
            "status_name": getCode.getStatus(500),
            "error": e.sqlMessage
        })
    }
})

openingBalance.updateFile = (base64Data, data) => {

    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const formattedData = data.map(row => ({
        'Code': row.code,
        'Opening Balance': row.opening_balance,
        'Financial Year': row.financial_year
    }));
    xlsx.utils.sheet_add_json(worksheet, formattedData, {
        origin: 'A2',
        skipHeader: true
    });

    const updatedBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // fs.writeFileSync('openingBalanceTemplate.xlsx', updatedBuffer);

    const updatedBase64 = updatedBuffer.toString('base64');

    return updatedBase64;

}