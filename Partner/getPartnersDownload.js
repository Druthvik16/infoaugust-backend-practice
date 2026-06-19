let db = require('./dbQueryPartner')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
module.exports = require('express').Router().get('/:clientUuid/:partnerUuids?/:fromDate?/:toDate?',async(req,res) => 
{
    try
    {       
        const clientUuid = req.params.clientUuid
        const partnerUuids = req.query.partnerUuids || null;
        const fromDate = req.query.fromDate || null;
        const toDate = req.query.toDate || null;
        const formattedUuids = partnerUuids ? partnerUuids.split(',').map(uuid => `'${uuid}'`).join(',') : null;
        const userTypeCode = req.body.roleCode || null
        getPartners = await db.getPartnersDownload(clientUuid, formattedUuids, fromDate, toDate, userTypeCode)
        // Convert JSON array to a worksheet
        const worksheet = XLSX.utils.json_to_sheet(getPartners);
        // Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Partners");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const fileName = 'partners_download.xlsx'
            // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the buffer as the response
        res.send(buffer);
        res.end();

        // res.status(200)
        // return res.json({
        //     "status_code" : 200,
        //     "message"     : "success",
        //     "data"        : {"partners" : getPartners},
        //     "status_name" : getCode.getStatus(200)
        // });
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
})