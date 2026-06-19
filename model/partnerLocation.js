class partnerLocation{
    id
    uuid
    name
    code
    storeName
    storeLocation
    email
    mobile
    partnerStatewiseGstMaster
    tan
    addressLine1
    addressLine2
    addressLine3
    city
    state
    pincode
    msmeNumber
    isActive
    createdOn
    createdBy
    partner
    spsn
    partnerLabel
    customerType

    constructor(){}

    setData(data)
    {
        this.uuid = data.partnerLocationUuid,
        this.code = data.partnerLocationCode,
        this.storeName = data.partnerLocationStoreName,
        this.storeLocation = data.partnerLocationStoreLocation, 
        this.isExist = data.isExist,
        this.partner = {
            "uuid" : data.partnerUuid,
            "name" : data.partnerName
        },
        this.spsn = {
            "uuid" : data.spsnUuid,
            "code" : data.spsnCode,
            "name" : data.spsnName
        }
    }

    getData()
    {
        return {
            uuid    :   this.uuid,      
            code    : this.code,
            storeName : this.storeName,
            storeLocation : this.storeLocation,
            partner : this.partner,
            spsn : this.spsn
        }
    }

    setDataAll(data)
    {
        this.uuid = data.partnerLocationUuid,
        this.code = data.partnerLocationCode,
        this.storeName = data.partnerLocationStoreName,
        this.storeLocation = data.partnerLocationStoreLocation,
        this.email = data.partnerLocationEmail,
        this.mobile = data.partnerLocationMobile
        this.partnerStatewiseGstMaster = {
            "id" : data.partnerStateWiseGstMasterId,
            "gstin" : data.partnerStateWiseGstMasterGstIn
        }
        this.tan = data.partnerLocationTan
        this.addressLine1 = data.partnerLocationAddressLine1
        this.addressLine2 = data.partnerLocationAddressLine2
        this.addressLine3 = data.partnerLocationAddressLine3
        this.city = data.partnerLocationCity
        this.state = {
            id : data.stateId,
            name : data.stateName
        }
        this.pincode = data.partnerLocationPincode
        this.msmeNumber = data.partnerLocationMsmeNumber
        this.isActive = data.partnerLocationIsActive 
        this.createdOn      =   data.partnerLocationCreatedOn
        this.createdBy  =    data.partnerLocationCreatedByUuid ? {
                                   uuid : data.partnerLocationCreatedByUuid,
                                   name : data.partnerLocationCreatedByName
                               } : null  
        this.isExist = data.isExist,
        this.spsn = {
            "uuid" : data.spsnUuid,
            "code" : data.spsnCode,
            "name" : data.spsnName
        }
        this.partnerLabel = data.partnerLabel
        this.customerType = data.customerType
    }

    getDataAll()
    {
        return {
            uuid    :   this.uuid,      
            code    : this.code,
            storeName : this.storeName,
            storeLocation : this.storeLocation,
            email   : this.email,
            mobile  : this.mobile,
            partnerStatewiseGstMaster   : this.partnerStatewiseGstMaster,
            tan : this.tan,
            addressLine1    : this.addressLine1,
            addressLine2    : this.addressLine2,
            addressLine3    : this.addressLine3,
            city    :   this.city,
            state : this.state,
            pincode : this.pincode,
            msmeNumber : this.msmeNumber,       
            isActive   :   this.isActive,
            createdOn : this.createdOn,
            createdBy : this.createdBy,
            spsn : this.spsn,            
            partnerLabel : this.partnerLabel,
            customerType : this.customerType
        }
    }

}
module.exports = partnerLocation