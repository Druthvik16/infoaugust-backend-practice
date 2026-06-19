let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
const SftpClient = require('ssh2-sftp-client');
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        const remoteFilePath = 'test.txt';
        // const remoteFilePath = '/home/ubuntu/testInfoaugustDocs/test.txt';
        if(!req.body.sftpHost?.trim() || !req.body.sftpPort?.trim() || !req.body.sftpUsername?.trim() || !req.body.sftpPassword.trim())
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let host = uniqueFunction.manageSpecialCharacter(req.body.sftpHost?.trim());   
        let port = uniqueFunction.manageSpecialCharacter(req.body.sftpPort?.trim());   
        let username = uniqueFunction.manageSpecialCharacter(req.body.sftpUsername?.trim());   
        let password = uniqueFunction.manageSpecialCharacter(req.body.sftpPassword?.trim());

        console.log(username, password,host,port, remoteFilePath);
        
        let result = await createConnection(host, port, username, password, remoteFilePath)
        if(result?.result)
        {
            res.status(200)
            return res.json({
                "status_code" : 200,
                "message" : "success",
                "status_name" : getCode.getStatus(200),
                "data"     :    { 'isSftpConnected' : result?.result ? 1 : 0}
            })
        }
        else
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message" : "SFTP connection failed",
                "error" : result?.error,
                "status_name" : getCode.getStatus(500)
            }) 
        }
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack || e.message || e,
            "status_name" : getCode.getStatus(500)
        }) 
    }
})


async function createConnection(host, port, username, password, remoteFilePath)
{
    // infomap-tgbl-new-qa.pem
    const sftp = new SftpClient();
    let algorithms = {"kex":["diffie-hellman-group1-sha1","ecdh-sha2-nistp256","ecdh-sha2-nistp384","ecdh-sha2-nistp521","diffie-hellman-group-exchange-sha256","diffie-hellman-group14-sha1"],"cipher":["3des-cbc","aes128-ctr","aes192-ctr","aes256-ctr","aes128-gcm","aes128-gcm@openssh.com","aes256-gcm","aes256-gcm@openssh.com"],"serverHostKey":["ssh-rsa","ecdsa-sha2-nistp256","ecdsa-sha2-nistp384","ecdsa-sha2-nistp521"],"hmac":["hmac-sha2-256","hmac-sha2-512","hmac-sha1"]}
    try 
    {
        await sftp.connect({ host, port, username, password, algorithms }); /// for prod only
       ////////////////////////for qa and dev \\\\\\\\\\\\\\\\\\
    //    await sftp.connect({
    //   host:host,
    //   port: port,
    //   username: 'ubuntu',
    //   privateKey: fs.readFileSync('./infomap-tgbl-new-qa.pem')
    // });
    

        await sftp.put(Buffer.from('hello client'), remoteFilePath);
        await sftp.end();
        console.log("Sftp connection successful")
        return({ result: true });
    } 
    catch (err) 
    {
        console.error('SFTP connection or file operation failed:', err);
        console.log("Sftp connection failed")
        return({ result: false, error: err?.stack || err.message || err });
    }
}