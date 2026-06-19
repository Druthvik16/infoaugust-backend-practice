let db = require('./dbQueryDocument')
let documentsObj = require('../../model/document')
let document = new documentsObj()
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/:action?',async(req,res) => 
{
    try
    {
        const action = req.query.action // all, manual - cn and invoice
        let documentsList = []
        let attachments = []
        let getDocuments = await db.getDocuments()
        if(getDocuments.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"document" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {     
            if (action == 'manual')
            {
                getDocuments = getDocuments.filter(doc => doc.documentCategoryName == 'Credit Note')
            }   
            let uniqueDocuments = getDocuments
            .map((item) => item.id)
            .filter(
                (value, index, current_value) => current_value.indexOf(value) === index
            );
            console.log(uniqueDocuments)
            uniqueDocuments.forEach(docId => {
                attachments = []
                let docAttachments = getDocuments.filter(attach => {
                    return attach.id === docId
                })
                    
                
                docAttachments.forEach(ele => {
                    document.setDocumentAttachment(ele)
                    attachments.push(document.getDocumentAttachment())
                })
                docAttachments[0]['documentAttachments'] = attachments
                document.setDataAll(docAttachments[0])
                documentsList.push(document.getDataAll())
            })
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"document" : documentsList},
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