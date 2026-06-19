let db = require('./dbQueryPartner');
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode();  
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
module.exports = require('express').Router().post('/',async(req,res) => {
    try{
        let { movedTo , partnerLocationUuids} = req.body;
        if( !movedTo || !partnerLocationUuids){
            return res.status(400).json({
                "status_code" : 400,
                "message" : "Missing required fields",
                "status_name" : getCode.getStatus(400),
            })
        }
        
        let partnerLocation = await db.MovePartnerGetPartnerLocation(partnerLocationUuids.split(","));
        let movedToPartnerId = await db.MovePartnerGetMovedToId(movedTo);
        console.log("movedToPartnerId",partnerLocation);
        for(let partner of partnerLocation){
            let isExists = await db.MovePartnerCheckPartnerExists(partner.gstin , movedToPartnerId);
            let result = {};
            if(isExists.length > 0){
                await db.MovePartnerUpdatePartnerStatewiseGstMasterId(isExists[0].id , partner.pldId);
            }else{
                result = await db.MovePartnerInsertNewStatewiseGstMaster(partner , movedToPartnerId);
                await db.MovePartnerUpdatePartnerStatewiseGstMasterId(result.insertId , partner.pldId);
            }
            await commonDb.saveInfoaugustActivityLog( 1 , 'Partner' , 'partner' , 'Partner Location Moved' , `pld id : ${partner.pldId} , partner statewise gst master id : ${partner.partner_statewise_gst_master_id} -> ${isExists.length > 0 ? isExists[0].id : result.insertId}` , partner.pldId , 'partner_location_detail' , null , 'success');
        }
        res.status(200).json({
            "status_code" : 200,
            "message" : "success",
            "status_name" : getCode.getStatus(200),
        })

    }catch(error){
        return res.status(500).json({
            "status_code" : 500,
            "message" : "Something went wrong",
            "status_name" : getCode.getStatus(500),
            "error" : error.stack
        })
    }
})
