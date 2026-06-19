let db = require('./dbQueryDocument')
let uniqueFunction = require('../commonFunction/uniqueSearchFunction')
let commondb = require('../commonFunction/dbQueryCommonFuntion')
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {
        let name;
        let documentCategoryId;
        let documentAttachmentIds;
        let isActive;
        let createdOn;
        let createdById;
        let code;
        if(!req.body.name?.trim() || !req.body.documentAttachmentIds || !req.body.documentCategory || !req.body.documentCategory?.id || !req.body.code)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        name = req.body.name?.trim();
        code = req.body.code?.trim();
        documentCategoryId = req.body.documentCategory?.id;
        documentAttachmentIds = req.body.documentAttachmentIds?.trim();
        createdById = req.body.userId;
        isActive = 1
        createdOn = new Date()
        let identifierName = 'document'
        let id = 0
        let uniqueCheckCode = await uniqueFunction.unquieName(identifierName, ['code'], {
            "code" : code
        }, id, 0)
        if(uniqueCheckCode != 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Document Code Already Exist",
                "status_name" : getCode.getStatus(400)
            });
        }
        let columnName = ['name','document_category_id']
        let columnValue = 
        {
            "name" : name,
            "document_category_id" : documentCategoryId
        }
        let uniqueCheck = await uniqueFunction.unquieName(identifierName, columnName, columnValue, id, 0)
        if(uniqueCheck == 0)
        {
            let saveDocument = await db.saveDocument(name, documentCategoryId, documentAttachmentIds, createdOn, createdById, isActive, code)
            if(saveDocument.affectedRows > 0)
            {
                res.status(200)
                return res.json({
                    "status_code" : 200,
                    "message"     : "success",
                    "data"        : {"id" : saveDocument.insertId},
                    "status_name" : getCode.getStatus(200)
                });
            }
            else
            {
                res.status(500)
                return res.json({
                    "status_code" : 500,
                    "message"     : "Document not saved",
                    "status_name" : getCode.getStatus(500)
                });
            }
        }
        else if(uniqueCheck == 1)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Document Name Already Exist For Document Category",
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
            "message"     : "Document not saved",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})