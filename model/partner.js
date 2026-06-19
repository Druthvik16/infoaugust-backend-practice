class partner
{
    id
    uuid
    name
    email
    mobile
    pan
    gstin
    state
    partnerCategory
    isActive
    client
    createdOn
    createdBy
    totalLocations

    constructor(){}

    setClient(data)
    {
        this.client= {
            "name" :   data.clientName,
            "shortName" : data.clientShortName,
            "code" : data.clientCode,
            "email"  :  data.clientEmail,
            "mobile" :  data.clientMobile,                          
            "uuid" : data.clientUuid        
        }
    }

    getClient()
    {
        return this.client
    }

    setData(data)
    {
        this.uuid = data.partnerUuid,
        this.name = data.partnerName
    }

    getData()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name
        }
    }

    setDataAll(data)
    {
        this.uuid = data.partnerUuid,
        this.name = data.partnerName,
        this.email = data.partnerEmail,
        this.mobile = data.partnerMobile,
        this.pan = data.partnerPan,
        this.gstin = data.partnerGSTIn,
        this.partnerCategory = {
            "id" : data.partnerCategoryId,
            "code" : data.partnerCategoryCode,
            "name" : data.partnerCategoryName
        }
        this.state = {
            "id" : data.stateId,
            "name" : data.stateName
        }
        this.isActive = data.partnerIsActive 
        this.createdOn      =   data.partnerCreatedOn
        this.createdBy  =    data.partnerCreatedByUuid ? {
                                   uuid : data.partnerCreatedByUuid,
                                   name : data.partnerCreatedByName
                               } : null  
        this.isExist = data.isExist,
        this.totalLocations = data.totalLocations
        this.client = data.clients
    }

    getDataAll()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name, 
            email : this.email,
            mobile : this.mobile,
            pan    : this.pan,
            gstin : this.gstin,
            partnerCategory   : this.partnerCategory,    
            state : this.state,
            isActive   :   this.isActive,
            createdOn : this.createdOn,
            createdBy : this.createdBy,
            totalLocations : this.totalLocations,
            clients : this.client
        }
    }
}
module.exports = partner