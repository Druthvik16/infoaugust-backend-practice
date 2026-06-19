class user{
    id
    uuid
    name
    linkedToId
    role
    lastLoggedIn
    isActive
    authToken
    staff
    client
    userClientPartner
    createdOn
    createdBy
    modifyOn
    modifyBy
    isExist
    assignedManager
    constructor(){}

    setAllocatedManagerUsers(data)
    {
        this.uuid = data.uuid;
        this.name = data.name;
    }

    getAllocatedManagerUsers()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name
        }
    }

    setUserClientPartner(data)
    {
        this.userClientPartner = {
            "client"  :   {
                            "name" :   data.userClientName,
                            "shortName" : data.userClientShortName,
                            "code" : data.userClientCode,
                            "email"  :  data.userClientEmail,
                            "mobile" :  data.userClientMobile,            
                            "gstin" :   data.userClientGstIn,
                            "pan" : data.userClientPan,
                            "tan" : data.userClientTan,                         
                            "uuid" : data.userClientUuid        
                        },
            "partner":{
                            "name"  :    data.userClientPartnerPartnerName,
                            "pan"  :  data.userClientPartnerPartnerPan,
                            "partnerCategoryId" :  data.userClientPartnerPartnerPartnerCategoryId,
                            "isActive"  :  data.userClientPartnerPartnerIsActive,
                            "uuid" :  data.userClientPartnerPartnerUuid
                        },
            "partnerLocation":{
                "name"  :    data.partnerLocationName,
                "code"  :  data.partnerLocationCode,
                "uuid" :  data.partnerLocationUuid
            },
            "isActive"    :   data.userClientPartnerIsActive,
            "uuid"    :   data.userClientPartnerUuid,
        }
    }

    getUserClientPartner()
    {
        return this.userClientPartner
    }

    setDataAll(data)
    {
        this.uuid = data.userUuid,
        this.name = data.userName,
        this.linkedToId = data.userLinkedToId,
        this.role = {
            "id" : data.roleId,
            "name" : data.roleName,
            "code" : data.roleCode
        }
        this.lastLoggedIn = data.lastLoggedIn
        this.authToken = data.authToken
        this.staff = data.staffId ? {
            "name" : data.staffName,
            "email" : data.staffEmail,
            "mobile" : data.staffMobile,
            "address" : data.staffAddress,
            "isActive"  : data.staffIsActive,
            "currentUserId" : data.staffCurrentUserId,
            "uuid" :data.staffUuid
        } : null
        this.client= data.clientId ? {
                        "name" :   data.clientName,
                        "shortName" : data.clientShortName,
                        "code" : data.clientCode,
                        "email"  :  data.clientEmail,
                        "mobile" :  data.clientMobile,             
                        "gstin" :   data.clientGstIn,
                        "pan" : data.clientPan,
                        "tan" : data.clientTan,                         
                        "uuid" : data.clientUuid        
                    }: null,
        this.assignedManager   = {
            "name" : data.assignedManagerName,
            "uuid" : data.assignedManagerUuid
        }
       this.userClientPartner = data.userClientPartner  
       this.createdOn      =   data.userCreatedOn
       this.createdBy  =    data.userCreatedByUuid ? {
                                   id : data.created_by_id,
                                   uuid : data.userCreatedByUuid,
                                   name : data.userCreatedByName
                               } : null  
        this.modifyOn      =   data.userModifyOn
        this.modifyBy  =    data.userModifyByUuid ? {
                                    id : data.created_by_id,
                                    uuid : data.userModifyByUuid,
                                    name : data.userModifyByName
                                } : null
       this.isExist = data.isExist,
       this.isActive = data.userIsActive
    }

    getDataAll()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name,                        
            linkedToId  :   this.linkedToId,
            role  :   this.role,
            lastLoggedIn    :   this.lastLoggedIn,
            isActive    :   this.isActive,
            createdOn : this.createdOn,
            createdBy : this.createdBy,
            modifyOn : this.modifyOn,
            modifyBy : this.modifyBy,
            staff   :   this.staff,
            client  :   this.client,
            assignedManager : this.assignedManager,
            userClientPartner   :   this.userClientPartner,
            isExist : this.isExist
        }
    }

}
module.exports = user