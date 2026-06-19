class role {
    id
    name
    code

    constructor(){}

    setData(data)
    {        
        this.id     =   data.id,
        this.name    =   data.name?.trim(),
        this.code    =   data.code                               
    }

    getData()
    {
       return {
                id  : this.id,
                name    : this.name,
                code    : this.code
        }
    }

}
module.exports = role