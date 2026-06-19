class uploadDoc{

    id 
    client  
    fileName
    status
    documentAttachment  
    documentCategory
    uploadedFilePath
    processedFilePath
    failedFilePath
    localFilePath
    uploadedOn
    startedOn  
    completedOn
    createdOn
    failedOn
    remark
    uploadDocLogDetails

    constructor(){}

    setUploadDocLogDetails(data)
    {
        this.uploadDocLogDetails =   {
                            "id" : data.detailId,
                            "fileName" : data.file_name,
                            "status" : data.detailStatus,
                            "uploadedOn"  : data.detailUploadedOn,
                            "completedOn" : data.detailCompletedOn,
                            "processStartedOn" : data.process_started_on
                        }
    }

    getUploadDocLogDetails()
    {
        return  this.uploadDocLogDetails
    }
    
    setDataAll(data)
    {
        this.id  =   data.id 
        this.fileName = data.file_name
        this.uploadedFilePath = data.uploaded_file_path
        this.processedFilePath = data.processed_file_path
        this.failedFilePath = data.failed_file_path
        this.localFilePath = data.local_file_path
        this.client  = {
            "uuid": data.clientUuid,
            "name": data.clientName
        }
        this.documentAttachment  = {
            "id" : data.documentAttachmentId,
            "name" : data.documentAttachmentName
        }
        this.documentCategory  = {
            "id" : data.documentCategoryId,
            "name" : data.documentCategoryName
        }
        this.status  = data.status
        this.uploadedOn  = data.uploaded_on
        this.startedOn = data.started_on
        this.completedOn = data.completed_on
        this.failedOn = data.failed_on
        this.createdOn = data.created_on
        this.remark = data.remark
        this.uploadDocLogDetails = data.uploadDocLogDetails
    }

    getDataAll()
    {
        return {
            id : this.id,
            fileName  : this.fileName,
            client  : this.client,
            documentAttachment  : this.documentAttachment, 
            documentCategory : this.documentCategory,
            uploadedFilePath : this.uploadedFilePath,
            processedFilePath : this.processedFilePath,
            failedFilePath : this.failedFilePath,
            localFilePath : this.localFilePath,
            startedOn  : this.startedOn,
            failedOn : this.failedOn,
            status  : this.status,
            uploadedOn  : this.uploadedOn,
            completedOn : this.completedOn,
            ccreatedOn : this.createdOn,
            remark : this.remark
            // uploadDocLogDetails : this.uploadDocLogDetails
        }
    }
}
module.exports = uploadDoc