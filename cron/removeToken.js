let db = require('./dbQueryCronTab')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let updateUserToken = await db.updateUserToken()
        let updateAddonUserToken = await db.updateAddonUserToken()
        let updatePartnerToken = await db.updatePartnerToken()
        let updatePartnerUserToken = await db.updatePartnerUserToken()
        let updateSpsnToken = await db.updateSpsnToken()
        if(updateUserToken?.affectedRows > 0)
        {
            let updateLoginHistory = await db.updateLoginHistory('Infomap Admin', new Date(), 'SYSTEM', 'user')
            let updateLoginHistory2 = await db.updateLoginHistory('Client Admin', new Date(), 'SYSTEM', 'user')
        }
        if(updateAddonUserToken?.affectedRows > 0)
        {
            let updateLoginHistory = await db.updateLoginHistory('Infomap User', new Date(), 'SYSTEM', 'user')
            let updateLoginHistory2 = await db.updateLoginHistory('Client User', new Date(), 'SYSTEM', 'user')
        }
        if (updatePartnerToken?.affectedRows > 0)
        {
            let updateLoginHistory = await db.updateLoginHistory('Partner', new Date(), 'SYSTEM', 'partner')
        }
        
        if (updatePartnerUserToken?.affectedRows > 0)
            {
                let updateLoginHistory = await db.updateLoginHistory('Partner-User', new Date(), 'SYSTEM', 'secondary_partner')
            }
        if (updateSpsnToken?.affectedRows > 0)
        {
            let updateLoginHistory = await db.updateLoginHistory('SPSN-User', new Date(), 'SYSTEM', 'spsn_user_master')
        }
        console.log("Removed user token: " + updateUserToken?.affectedRows)
        console.log("Removed partner token: " + updatePartnerToken?.affectedRows)
        res.end()
    }
    catch(e)
    {
        console.log(e)
        res.end()
    }
})