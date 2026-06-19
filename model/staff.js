class staff{
    id
    uuid
    name
    currentUser
    mobile
    isActive
    email
    address
    createdOn
    createdBy
    modifyOn
    modifyBy

    constructor(){}



    setUnallocatedStaff(data)
    {
        this.uuid = data.uuid;
        this.name = data.name;
    }

    getUnallocatedStaff()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name
        }
    }


    setDataAll(data)
    {
        this.uuid = data.staffUuid,
        this.name = data.staffName,
        this.email = data.staffEmail,
        this.currentUser = {
            uuid : data.userUuid,
            name : data.userName
        },
        this.mobile = data.staffMobile
        this.address = data.staffAddress
        this.isActive = data.staffIsActive 
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
       this.isExist = data.isExist
    }

    getDataAll()
    {
        return {
            uuid    :   this.uuid,                            
            name    :   this.name,                        
            currentUser  :   this.currentUser,
            email  :   this.email,
            mobile    :   this.mobile,
            isActive    :   this.isActive,
            createdOn : this.createdOn,
            createdBy : this.createdBy,
            modifyOn : this.modifyOn,
            modifyBy : this.modifyBy,
            address : this.address
        }
    }

}
module.exports = staff