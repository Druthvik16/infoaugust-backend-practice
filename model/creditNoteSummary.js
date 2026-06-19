class creditNoteSummary {
    id
    postingDate
    creditAmount
    debitAmount
    billNoOrRefNo
    documentNumber
    narration
    uploadedOn
    documentCategory
    document 
    client
    partnerLocation
    clientUploadedDocumentDetail
    isPdfExist
    isWorkingExist
    partner
    constructor(){}

    setClientDocDetail(data)
    {
        this.clientUploadedDocumentDetail = {
            "id" : data.clientDocId,
            "fileName" : data.clientDocFileName,
            "documentAttachments" : {
                "id" : data.documentAttachmentId,
                "name" : data.documentAttachmentName
            }
        }
    }

    getClientDocDetail()
    {
        return this.clientUploadedDocumentDetail
    }
    
    setDataAll(data)
    {
        this.id           =   data.id
        this.postingDate         =   data.postingDate
        this.creditAmount = data.creditAmount
        this.debitAmount      =   data.debitAmount
        this.billNoOrRefNo = data.billNoOrRefNo
        this.documentNumber = data.documentNumber
        this.narration = data.narration
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
        this.partner = {
            "name"  :    data.partnerName,
            "email"  :  data.partnerEmail,
            "uuid" :  data.partnerUuid
        }
        this.clientUploadedDocumentDetail = data.uploadedDocumentDetail,
        this.isPdfExist = data.isPdfExist,
        this.isWorkingExist = data.isWorkingExist
    }

    getDataAll()
    {
        return {
            id : this.id,
            postingDate : this.postingDate,
            creditAmount : this.creditAmount,
            debitAmount : this.debitAmount,
            billNoOrRefNo : this.billNoOrRefNo,
            documentNumber : this.documentNumber,
            narration : this.narration,
            uploadedOn : this.uploadedOn,
            documentCategory : this.documentCategory,
            document : this.document,
            client : this.client,
            partnerLocation : this.partnerLocation,
            clientUploadedDocumentDetail : this.clientUploadedDocumentDetail,
            isPdfExist : this.isPdfExist,
            isWorkingExist : this.isWorkingExist,
            partner : this.partner
        }
    }
}
module.exports = creditNoteSummary