class state {
    id
    name
    constructor(){}
    
    setDataAll(data)
    {
        this.id           =   data.id
        this.name         =   data.name
    }

    getDataAll()
    {
        return {
            id : this.id,
            name : this.name
        }
    }
    getData()
    {
        return {
            id : this.id,
            name : this.name
        }
    }
}
module.exports = state