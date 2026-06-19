let db = require('./dbQueryPartnerCategory')
let partnerCategoryObj = require('../../model/partnerCategory')
let partnerCategory = new partnerCategoryObj()
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getPartnerCategories;
        let countriesList = []
        getPartnerCategories = await db.getPartnerCategories()
        if(getPartnerCategories.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"partnerCategories" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            countriesList = []
            getPartnerCategories.forEach((element) => 
            {
                partnerCategory.setDataAll(element)
                countriesList.push(partnerCategory.getDataAll())
            });
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"partnerCategories" : countriesList},
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
            "error"       : e
        });
    }
})