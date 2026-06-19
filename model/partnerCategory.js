class partnerCategory {
    id
    name
    isActive
    constructor(){}
    
    setDataAll(data)
    {
        this.id           =   data.id
        this.name         =   data.name
        this.isActive         =     data.is_active
    }

    getDataAll()
    {
        return {
            id : this.id,
            name : this.name,
            isActive : this.isActive
        }
    }
}
module.exports = partnerCategory