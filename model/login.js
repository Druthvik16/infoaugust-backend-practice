let apiUrl = require('../apiUrl')
let api = new apiUrl()
class login {
    id
    uuid
    name
    email
    mobile
    linkedToId
    role
    lastLoggedIn
    isActive
    authToken
    pan
    staff
    client
    assignedManager
    userClientPartner
    partnerCategory
    vendorStatus
    userType
    constructor(){}

    setClient(data)
    {
        this.client= {
            "name" :   data.clientName,
            "shortName" : data.clientShortName,
            "companyName" : data.clientCompanyName,
            "code" : data.clientCode,
            "email"  :  data.clientEmail,
            "mobile" :  data.clientMobile,  
            "gstin" : data.clientGST,   
            "pan" : data.clientPan,
            "tan" : data.clientTan,                     
            "uuid" : data.clientUuid,
            "fullLogoPath" : api.serviceApi + api.logo + '/' + data.clientFullLogoPath,
            "shortLogoPath" : api.serviceApi + api.logo + '/' + data.clientShortLogoPath,
            "fullLogoName" : data.clientFullLogoPath?.split('/').pop(),
            "shortLogoName" : data.clientShortLogoPath?.split('/').pop(),   
            "fullAddress" : data.clientFullAddress,     
            "state" : {
                id : data.stateId,
                name : data.stateName
            }        
        }
    }

    getClient()
    {
        return this.client
    }

    setPartner(data)
    {
        this.uuid = data.partnerUuid,
        this.name = data.partnerName,
        this.email = data.partnerEmail,
        this.mobile = data.partnerMobile
        this.pan = data.partnerPan
        this.partnerCategory = {
            "id" : data.partnerCategoryId,
            "name" : data.partnerCategoryName,
            "code" : data.partnerCategoryCode
        }
        this.vendorStatus = {
            "id" : data.vendorStatusId,
            "name" : data.vendorStatusName,
        }
        this.lastLoggedIn = data.lastLoggedIn
        this.authToken = data.authToken
        this.client = data.clients  
          
       this.userType = data.userType 
    }

    getPartner()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name,        
            email : this.email,
            mobile : this.mobile,    
            pan : this.pan,          
            partnerCategory  :   this.partnerCategory,
            lastLoggedIn    :   this.lastLoggedIn,
            isActive    :   this.isActive,
            accessToken   :   this.authToken,
            mappedClients   :   this.client,
            vendorStatus : this.vendorStatus,
            userType : this.userType
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
            "partnerId"   : data.userClientPartnerPartnerId,
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
            "name" : data.name,
            "email" : data.email,
            "mobile" : data.mobile,
            "address" : data.staffAddress,
            "isActive"  : data.staffIsActive,
            "currentUserId" : data.staffCurrentUserId,
            "uuid" :data.uuid
        } : null
        this.client= data.clientId ? {
                        "name" :   data.name,
                        "shortName" : data.clientShortName,
                        "companyName" : data.clientCompanyName,
                        "code" : data.clientCode,
                        "email"  :  data.email,
                        "mobile" :  data.mobile,              
                        "gstin" :   data.clientGstIn,
                        "pan" : data.clientPan,
                        "tan" : data.clientTan,  
                        "fullLogoPath" :  api.serviceApi + api.logo + '/' +  data.clientFullLogoPath,
                        "shortLogoPath" :  api.serviceApi + api.logo + '/' +  data.clientShortLogoPath,                       
                        "uuid" : data.uuid,
                        "fullLogoName" : data.clientFullLogoPath?.split('/').pop(),
                        "shortLogoName" : data.clientShortLogoPath?.split('/').pop(),
                        "fullAddress" : data.clientFullAddress,
                        "serviceType" : { "id" : data.serviceTypeId, "name" : data.serviceTypeName}      
                    }: null,
        this.assignedManager   = {
            "name" : data.assignedManagerName,
            "uuid" : data.assignedManagerUuid
        }
       this.userClientPartner = data.userClientPartner     
       this.userType = data.userType
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
            accessToken   :   this.authToken,
            staff   :   this.staff,
            client  :   this.client,
            assignedManager : this.assignedManager,
            userClientPartner   :   this.userClientPartner,
            userType : this.userType
        }
    }

}
module.exports = login