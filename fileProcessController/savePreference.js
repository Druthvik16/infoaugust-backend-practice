let db = require('./dbQueryProcessController')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let readType;
        let isActive;
        let id;
        if(!req.body.id)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        id = req.body.id
        isActive = req.body.isActive
        readType = req.body.readType
        let checkIfProcessRunning = await db.getRunningProcessSequence()
        console.log(checkIfProcessRunning)
        if(checkIfProcessRunning[0].processing != 0)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Process is running, cannot update",
                "status_name" : getCode.getStatus(500)
            })
        }

        let savePreference = await db.savePreference(id, isActive, readType)
        if(savePreference.affectedRows > 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : getCode.getStatus(200)
            })            
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "Preference Not Saved",
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
            "message" : "Preference Not Saved",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        })    
    }
})
