class documentAttachment {
    id
    name
    createdOn
    createdById
    mimeTypes
    constructor(){}

    setMimeType(data)
    {
        this.mimeTypes =   {
                            "id" : data.mimeTypeId,
                            "name" : data.mimeTypeName,
                            "mime" : data.mimeTypeMime
                        }
    }

    getMimeType()
    {
        return  this.mimeTypes
    }
    
    setDataAll(data)
    {
        this.id             =   data.id
        this.name           =   data.name
        this.createdOn      =   data.created_on
        this.createdById  =     {
                                    id : data.created_by_id,
                                    uuid : data.createdUuid,
                                    name : data.createdName
                                }
        this.mimeTypes        =   data.mimeTypes
    }

    getDataAll()
    {
        return {
            id : this.id,
            name : this.name,
            createdOn : this.createdOn,
            createdBy : this.createdById,
            mimeTypes : this.mimeTypes
        }
    }
}
module.exports = documentAttachment