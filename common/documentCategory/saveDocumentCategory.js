let db = require('./dbQueryDocumentCategory')
let uniqueFunction = require('../commonFunction/uniqueSearchFunction')
let commondb = require('../commonFunction/dbQueryCommonFuntion')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let name;
        let isActive;
        let createdOn;
        let createdById;
        let code;
        if(!req.body.name?.trim() || !req.body.code)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        name = req.body.name?.trim();
        code = req.body.code;
        createdById = req.body.userId;
        isActive = 1
        createdOn = new Date()
        let identifierName = 'document_category'
        let id = 0
        let uniqueCheckCode = await uniqueFunction.unquieName(identifierName, ['code'], {
            "code" : code
        }, id, 0)
        if(uniqueCheckCode != 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Document Category Code Already Exist",
                "status_name" : getCode.getStatus(400)
            });
        }
        let columnName = ['name']
        let columnValue = 
        {
            "name" : name
        }
        let uniqueCheck = await uniqueFunction.unquieName(identifierName, columnName, columnValue, id, 0)
        if(uniqueCheck == 0)
        {
            let saveDocumentCategory = await db.saveDocumentCategory(name, createdOn, createdById, isActive, code)
            if(saveDocumentCategory.affectedRows > 0)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message"     : "success",
                    "data"        : {"id" : saveDocumentCategory.insertId},
                    "status_name" : getCode.getStatus(200)
                });
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Document Category not saved",
                    "status_name" : getCode.getStatus(500)
                });
            }
        }
        else if(uniqueCheck == 1)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Document Category Name Already Exist",
                "status_name" : getCode.getStatus(400)
            });
        }
        else
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "Document Category not saved",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})