let db = require('./dbQueryProcessController')
let CNSObj = require('../model/creditNoteSummary')
let cns = new CNSObj()
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
const { getDiskSpaceStatus } = require('../diskSpaceChecker/diskSpaceChecker.js');
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const getSftpConfig = require('../common/sftpConfig.js');
const config = getSftpConfig()
module.exports = require('express').Router().get('/:partnerUuid?*',async(req,res) => 
{
    try
    {
        let getProcessSequences;
        let partnerUuid = null;
        let partnerLocationUuid = null;
        let clientUuid = null;
        let fromDate = null;
        let toDate = null;
        let action = null;
        let fileName = null; 
        let userType = null;
        let activity = null; 
        let storageType = null; 
        console.log(new Date())
        if(!req.params['partnerUuid'])
        {
            req.params['partnerUuid'] = ''
        }
        if(req.params['0'].length > 0 &&  req.params['0'] != '/')
        {
            let a = req.params['0'].split('/')
            let [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = a;
            partnerUuid = p1 !== undefined ? req.params['partnerUuid'] + p1 : null;
            partnerLocationUuid = p2 !== undefined ? p2 : null;
            clientUuid = p3 !== undefined ? p3 : null;
            fromDate = p4 !== undefined ? p4 : null;
            toDate = p5 !== undefined ? p5 : null;
            fileName = p6 !== undefined ? p6 : null;
            userType = p7 !== undefined ? p7 : null;
            activity = p8 !== undefined ? p8 : null;
            storageType = p9 !== undefined ? p9 : null;
            action = p10 !== undefined ? p10 : null;
        }
        else
        {
            partnerUuid = null
            partnerLocationUuid = null
            clientUuid = null
            fromDate = null
            toDate = null
            fileName = null
            userType = null
            activity = null
            storageType = null
            action = null
        }

        let testConnection = await uniqueFunction.testSftpConnection(config.host, config.port, config.username, config.password, 'test.txt')
        let isConnection = testConnection.result
        // console.log("partnerUuid: ",partnerUuid," partnerLocationUuid: ",partnerLocationUuid," clientUuid: ", clientUuid, " fromDate: ", fromDate," toDate: ", toDate," fileName: ", fileName," userType: ", userType," activity: ", activity, " storageType: ", storageType, " action: ", action)
        action = action?.length > 0 ? (action == 'view' ? 'downloadUploadedFile' : 'mailDocumentFile') : ''
        let action1 = ''
        getProcessSequences = await db.getProcessSequences()

        const disk = getDiskSpaceStatus();

        console.log("Data Received and Sent", getProcessSequences?.length , new Date())
        res.status(200)
        return res.json({
            "status_code" : 200,
            "message"     : "success",
            "data"        : {"processSequences" : getProcessSequences, 'isSftpConnection': isConnection, isDiskSpaceAvaiable : disk.isAvailable, availableGB:disk.availableGB},
            "status_name" : getCode.getStatus(200)
        });
    }
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message"     : "No Data Found",
            "status_name" : getCode.getStatus(500),
            "error"       : e
        });
    }
})