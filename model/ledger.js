class ledger {
    id
    postingDate
    openingBalance
    closingBalance
    uploadedOn
    documentCategory
    document 
    client
    partnerLocation
    monthPeriod
    clientUploadedDocumentDetail
    partner
    constructor(){}
    
    setDataAll(data)
    {
        this.id           =   data.id
        this.postingDate         =   data.postingDate
        this.openingBalance = data.openingBalance
        this.closingBalance      =   data.closingBalance
        this.uploadedOn      =   data.uploaded_on
        this.document = {
            "id" : data.documentId,
            "name" : data.documentName
        }
        this.documentCategory = {
            "id" : data.documentCategoryId,
            "name" : data.documentCategoryName
        }
        this.client = {
            "name" :   data.clientName,
            "code" : data.clientCode,                          
            "uuid" : data.clientUuid        
        }
        this.partnerLocation = {
            "name"  :    data.partnerLocationStoreName,
            "code"  :  data.partnerLocationCode,
            "uuid" :  data.partnerLocationUuid
        }
        this.clientUploadedDocumentDetail = {
            "id" : data.clientDocId,
            "fileName" : data.clientDocFileName,
            "documentAttachments" : {
                "id" : data.documentAttachmentId,
                "name" : data.documentAttachmentName
            }
        }
        this.partner = {
            "name"  :    data.partnerName,
            "email"  :  data.partnerEmail,
            "uuid" :  data.partnerUuid
        }
        this.monthPeriod = data.monthPeriodNarration
    }

    getDataAll()
    {
        return {
            id : this.id,
            postingDate : this.postingDate,
            openingBalance : this.openingBalance,
            closingBalance : this.closingBalance,
            uploadedOn : this.uploadedOn,
            documentCategory : this.documentCategory,
            document : this.document,
            client : this.client,
            partnerLocation : this.partnerLocation,
            monthPeriod : this.monthPeriod,
            clientUploadedDocumentDetail : this.clientUploadedDocumentDetail,
            partner : this.partner
        }
    }
}
module.exports = ledger