let db = require('./dbQueryDocumentAttachment')
let documentAttachmentObj = require('../../model/documentAttachment')
let documentAttachment = new documentAttachmentObj()
let errorCode = require('../error/errorCode')
let getCode = new errorCode()
module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        let getDocumentAttachemnts;
        let documentAttachemntsList = []
        getDocumentAttachemnts = await db.getDocumentAttachemnts()
        if(getDocumentAttachemnts.length == 0)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"documentAttachemnts" : []},
                "status_name" : getCode.getStatus(200)
            });
        }
        else
        {
            documentAttachemntsList = []
            let attachments = []
            let uniqueDocuments = getDocumentAttachemnts
            .map((item) => item.id)
            .filter(
                (value, index, current_value) => current_value.indexOf(value) === index
            );

            uniqueDocuments.forEach(docId => {
                attachments = []
                let docAttachments = getDocumentAttachemnts.filter(attach => {
                    return attach.id === docId
                })
                docAttachments.forEach(ele => {
                    documentAttachment.setMimeType(ele)
                    attachments.push(documentAttachment.getMimeType())
                })
                docAttachments[0]['mimeTypes'] = attachments
                documentAttachment.setDataAll(docAttachments[0])
                documentAttachemntsList.push(documentAttachment.getDataAll())
            })
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message"     : "success",
                "data"        : {"documentAttachemnts" : documentAttachemntsList},
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