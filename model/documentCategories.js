class documentCategories {
    id
    name
    code
    isExist
    constructor(){}
    
    setDataAll(data)
    {
        this.id           =   data.id
        this.name         =   data.name
        this.code = data.code
        this.isExist      =   data.isExist
    }

    getDataAll()
    {
        return {
            id : this.id,
            name : this.name,
            code : this.code,
            isExist : this.isExist
        }
    }
}
module.exports = documentCategories