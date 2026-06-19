let db = require('./dbQueryPartner')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let stateId;
        let gstNumber;
        let partnerUuid;
        if(!req.body.partner  || !req.body.partner?.uuid || !req.body.state  || !req.body.state?.id)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        partnerUuid = req.body.partner?.uuid
        stateId = req.body.state?.id
        gstNumber = req.body.gstNumber
        const createdById = req.body.userId || 0;
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null
        let uniqueCheckGSTInPartner = await uniqueFunction.unquieName('partner_statewise_gst_master', ['gstin'],{ 'gstin': gstNumber}, 0, 0)
        if(uniqueCheckGSTInPartner != 0)
        {
            let uniqueCheckGSTWithPartner = await uniqueFunction.unquieName('partner_statewise_gst_master', ['gstin','partner_id'],{ 'gstin': gstNumber,'partner_id' : `(SELECT id FROM partner WHERE uuid = '${partnerUuid}')`}, 0, 0)
            if(uniqueCheckGSTWithPartner != 0){
                let getPartnerGstID = await db.getPartnerGstID(partnerUuid, gstNumber)
        
                const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner State Wise GST Mapping Created', `Partner mapped with statewise GST, partner uuid : ${partnerUuid}, gstNumber : ${gstNumber}, stateId : ${stateId}`, getPartnerGstID[0].id, 'partner_statewise_gst_master', null, 'success')

                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "data" : { "id" : getPartnerGstID[0].id},
                    "status_name" : getCode.getStatus(200)
                })
                // res.status(400)
                // return res.json({
                //     "status_code" : 400,
                //     "message"     : `GST Number ${gstNumber} Already Exist For Some Other Partner(PAN)`,
                //     "status_name" : getCode.getStatus(400)
                // });
            }
            else
            {
                let getPartnerGstID = await db.getPartnerGstIDWithNumber(gstNumber)
        
                const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner State Wise GST Mapping Created', `Partner mapped with statewise GST, partner uuid : ${partnerUuid}, gstNumber : ${gstNumber}, stateId : ${stateId}`, getPartnerGstID[0].id, 'partner_statewise_gst_master', null, 'success')

                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "data" : { "id" : getPartnerGstID[0].id},
                    "status_name" : getCode.getStatus(200)
                })                       
            }
        }
        let savePartnerStatewiseGst = await db.savePartnerStatewiseGst(partnerUuid, gstNumber, stateId)
        if(savePartnerStatewiseGst.affectedRows > 0)
        {
        
            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner State Wise GST Mapping Created', `Partner mapped with statewise GST, partner uuid : ${partnerUuid}, gstNumber : ${gstNumber}, stateId : ${stateId}`, savePartnerStatewiseGst.insertId, 'partner_statewise_gst_master', null, 'success')

            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "data" : { "id" : savePartnerStatewiseGst.insertId},
                "status_name" : getCode.getStatus(200)
            })            
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Partner Statewise GST Not Created",
                "status_name" : getCode.getStatus(500)
            }) 
        } 
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Partner Statewise GST Not Created",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        })    
    }
})
