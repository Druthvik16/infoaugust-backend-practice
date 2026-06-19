const fs = require('fs');
let docPath = require('./docPath')
let getPath = new docPath()



function createFolder(filepath)
{
    let folderName = getPath.getName(filepath)
    if(folderName != 'unknown folder')
    {
        try 
        {
            if (!fs.existsSync(folderName)) 
            {
                fs.mkdirSync(folderName);
                return folderName
            }
            return folderName
        } 
        catch (err) 
        {
            console.error(err);
        }
    }
}

module.exports = createFolder