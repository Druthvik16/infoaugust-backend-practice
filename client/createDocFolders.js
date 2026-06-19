let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let db = require('./dbQueryClient')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {   
        let uuid;   
        if(!req.body.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        uuid = req.body.uuid;
        let checkIfExists = await db.checkIsDocFolderCreated(uuid)
        if(checkIfExists?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Client Not Exists",
                "status_name" : getCode.getStatus(400)
            })
        }
        if(checkIfExists[0].isDocFolder == 1)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "Folders Already Exists",
                "status_name" : getCode.getStatus(200)
            })
        }
        console.log("Folders creation started", new Date())
        uniqueFunction.createClientFoldersInLocal(uuid)
        uniqueFunction.createFolderInAwsS3Bucket(uuid)
        checkIfExistsFolder(uuid, res)  
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Folders Not Created",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})

async function checkIfExistsFolder(uuid, res)
{
    let checkIfExists = await db.checkIsDocFolderCreated(uuid)
    if(checkIfExists[0].isDocFolder == 1)
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
        checkIfExistsFolder(uuid, res)
    }
}