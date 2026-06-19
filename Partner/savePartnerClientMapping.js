let db = require('./dbQueryPartner')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')

module.exports = require('express').Router().post('/',async(req,res) => 
{
    let clientUuid;
    let partnerUuid;
    try
    {
        if(!req.body.partner  || !req.body.partner?.uuid || !req.body.client  || !req.body.client?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        partnerUuid = req.body.partner?.uuid
        clientUuid = req.body.client?.uuid
        const createdById = req.body.userId || 0;
        const loggedUserType = req.body.loggedUserType || 'SYSTEM'
        let uniqueCheckPartnerClientMapping = await uniqueFunction.unquieName('partner_client_mapping', ['partner_id','client_id'],{  "partner_id" : `(SELECT id FROM partner WHERE uuid = '${partnerUuid}')`, "client_id" : `(SELECT id FROM client WHERE uuid = '${clientUuid}')` }, 0, 0)
        if(uniqueCheckPartnerClientMapping != 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : `success`,
                "data" : "Partner already mapped with client",
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            let saveClientPartnerMapping = await db.saveClientPartnerMapping(partnerUuid, clientUuid)
            if(saveClientPartnerMapping.affectedRows > 0)
            {        
                const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null
                
                const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner-Client Mapping Created', `New partner mapped with client, partner uuid : ${partnerUuid}, client uuid : ${clientUuid}`, saveClientPartnerMapping.insertId, 'partner_client_mapping', null, 'success')

                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message" : "success",
                    "data" : { "id" : saveClientPartnerMapping.insertId},
                    "status_name" : getCode.getStatus(200)
                })            
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message" : "Client Partner Mapping Not Created",
                    "status_name" : getCode.getStatus(500)
                }) 
            } 
        }
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Client Partner Mapping Not Created",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        })    
    }
})
