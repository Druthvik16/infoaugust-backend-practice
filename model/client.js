class client{
    id
    uuid
    name
    shortName
    companyName
    code
    email
    mobile
    gstin
    pan
    tan
    addressLine1
    addressLine2
    addressLine3
    city
    state
    pincode
    linkedUser
    isActive
    isDocFolder
    createdOn
    createdBy
    modifyOn
    modifyBy
    serviceType
    clientVendorAttachmentDocumentMapping

    constructor(){}
    setUnallocatedClient(data)
    {
        this.uuid = data.uuid;
        this.name = data.name;
    }
    getUnallocatedClient()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name
        }
    }

    setClientVendorAttachmentDocumentMapping(data)
    {
        this.clientVendorAttachmentDocumentMapping = {
            "id" : data.clientVendorAttachmentDocumentId,
            "isRequired" : data.clientVendorAttachmentDocumentIsRequired,
            "isDulySigned" : data.clientVendorAttachmentDocumentIsDulySigned, 
            "fileName" : data.clientVendorAttachmentDocumentFileName,
            "clientVendorAttachmentDocument" : {
                "id" : data.clientVendorAttachmentId,
                "name" : data.clientVendorAttachmentName,
                "isDulySigned" : data.clientVendorAttachmentIsDulySigned
            }
        }
    }

    getClientVendorAttachmentDocumentMapping()
    {
        return this.clientVendorAttachmentDocumentMapping
    }


    setDataAll(data)
    {
        this.uuid = data.clientUuid,
        this.name = data.clientName,
        this.shortName = data.clientShortName,
        this.code = data.clientCode,
        this.email = data.clientEmail,
        this.mobile = data.clientMobile
        this.gstin = data.clientGstin
        this.pan = data.clientPan
        this.tan = data.clientTan
        this.addressLine1 = data.clientAddressLine1
        this.addressLine2 = data.clientAddressLine2
        this.addressLine3 = data.clientAddressLine3
        this.city = data.clientCity
        this.companyName = data.clientCompanyName
        this.state = {
            id : data.stateId,
            name : data.stateName
        }
        this.pincode = data.clientPincode
        this.linkedUser = {
            uuid : data.userUuid,
            name : data.userName
        },
        this.isActive = data.clientIsActive 
        this.isDocFolder = data.clientIsDocFolder
        this.createdOn      =   data.userCreatedOn
        this.createdBy  =    data.userCreatedByUuid ? {
                                   uuid : data.userCreatedByUuid,
                                   name : data.userCreatedByName
                               } : null  
        this.modifyOn      =   data.userModifyOn
        this.modifyBy  =    data.userModifyByUuid ? {
                                    uuid : data.userModifyByUuid,
                                    name : data.userModifyByName
                                } : null
       this.isExist = data.isExist,
       
       this.serviceType = {
            id : data.serviceTypeId,
            name : data.serviceTypeName
        }
        this.clientVendorAttachmentDocumentMapping = data.clientVendorAttachmentDocumentMapping
    }

    getDataAll()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name, 
            shortName : this.shortName,
            companyName : this.companyName,
            code    : this.code,
            email   : this.email,
            mobile  : this.mobile,
            gstin   : this.gstin,
            pan : this.pan,
            tan : this.tan,
            addressLine1    : this.addressLine1,
            addressLine2    : this.addressLine2,
            addressLine3    : this.addressLine3,
            city    :   this.city,
            state : this.state,
            pincode : this.pincode,
            linkedUser : this.linkedUser,       
            isActive   :   this.isActive,
            isDocFolder : this.isDocFolder,
            createdOn : this.createdOn,
            createdBy : this.createdBy,
            modifyOn : this.modifyOn,
            modifyBy : this.modifyBy,
            serviceType : this.serviceType,
            clientVendorAttachmentDocumentMapping : this.clientVendorAttachmentDocumentMapping
        }
    }

}
module.exports = client