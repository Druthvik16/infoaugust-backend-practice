let db = require('./dbQueryDocumentCategory')
let documentCategoriesObj = require('../../model/documentCategories')
let documentCategories = new documentCategoriesObj()
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:action?',async(req,res) => 
{
    try
    {
        const action = req.query.action // all, manual - cn and invoice
        let documentCategoriesList = []
        let getDocumentCategories = await db.getDocumentCategories()
        if(getDocumentCategories.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"documentCategories" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            if (action == 'manual')
            {
                getDocumentCategories = getDocumentCategories.filter(doc => doc.name == 'Credit Note' || doc.name == 'Invoice')
            }
            getDocumentCategories.forEach((element) => 
            {
                documentCategories.setDataAll(element)
                documentCategoriesList.push(documentCategories.getDataAll())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"documentCategories" : documentCategoriesList},
                "status_name" : getCode.getStatus(200)
            });
        }
    }
    catch(e)
    {
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e?.stack
        });
    }
})