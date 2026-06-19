class document {
    id
    name
    code
    documentCategory
    documentAttachments
    isExist
    constructor(){}

    setDocumentAttachment(data)
    {
        this.documentAttachments = {
            "id" : data.documentAttachmentId,
            "name" : data.documentAttachmentName
        }
    }

    getDocumentAttachment()
    {
        return this.documentAttachments
    }
    
    setDataAll(data)
    {
        this.id           =   data.id
        this.name         =   data.name
        this.code = data.code
        this.documentCategory = {
            "id" : data.documentCategoryId,
            "name" : data.documentCategoryName,
            "code" : data.documentCategoryCode
        }
        this.documentAttachments = data.documentAttachments
        this.isExist      =   data.isExist
    }

    getDataAll()
    {
        return {
            id : this.id,
            name : this.name,
            code : this.code,
            documentAttachments : this.documentAttachments,
            documentCategory : this.documentCategory,
            isExist : this.isExist
        }
    }
}
module.exports = document