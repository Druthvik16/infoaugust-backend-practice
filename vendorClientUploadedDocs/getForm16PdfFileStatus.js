let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let db = require('./dbQueryClientUploadedDocs')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
let inputFolderPath = 'Input_form16_Pdfs_Raw_Sap_dump';
const bucketName = process.env.Bucket_Name;
const vendorModuleClientPath = '/' + uniqueFunction.vendorModule + 'client'
const folderName = uniqueFunction.vendorModule + 'client/' // 'vendorModule/client/'


module.exports = require('express').Router().post('/',async(req,res) => 
{
    try 
    { 
        let fileName;
        let totalForm16Numbers;
        let matchedForm16Numbers;
        let clientUuid;
        console.log("form 16 status api ", req.body)
        if(!req.body.fileName)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message" : "Provide all values",
                "status_name" : getCode.getStatus(400)
            })
        }
        fileName = req.body.fileName
        totalForm16Numbers = req.body.totalForm16Numbers
        matchedForm16Numbers = req.body.matchedForm16Numbers
        clientUuid = req.body.clientUuid
        let s3FilePathListObject = folderName + clientUuid + "/" + inputFolderPath + "/" + fileName
        const params = {
            Bucket: bucketName,
            Key : s3FilePathListObject
        };
        console.log(params);
        s3.deleteObject(params,(err, data) =>
        {
            if (err) 
            {
                console.error('Error list:', err);
                res.end()
            } 
            else 
            {
                let status = ''
                if(totalForm16Numbers?.length > 0)
                {
                    let form16Numbers = totalForm16Numbers.split(',')
                    totalForm16Numbers = form16Numbers
                    .map((item) => item)
                    .filter(
                        (value, index, current_value) => current_value.indexOf(value) === index
                    );
                }

                if(matchedForm16Numbers?.length > 0)
                {
                    let form16Numbers = matchedForm16Numbers.split(',')
                    matchedForm16Numbers = form16Numbers
                    .map((item) => item)
                    .filter(
                        (value, index, current_value) => current_value.indexOf(value) === index
                    );
                }
                if(totalForm16Numbers?.length == matchedForm16Numbers?.length)
                {
                    status = "Completed"
                }

                if(totalForm16Numbers?.length == 0 || (totalForm16Numbers?.length > 0 && matchedForm16Numbers?.length == 0))
                {
                    status = "Failed"
                }

                if((totalForm16Numbers?.length > matchedForm16Numbers?.length))
                {
                    status = "Partially-Completed"
                }

                // status = (totalForm16Numbers?.length == 0 || (totalForm16Numbers?.length > 0 && matchedForm16Numbers?.length == 0)) ? "Failed" :  ((totalForm16Numbers?.length > matchedForm16Numbers?.length) ? "Partially-Completed" : "Completed")

                let sql = `UPDATE client_vendor_upload_doc_log_master SET status = '${status}' `
                if(status != 'Failed')
                {
                    let dates = 'completed_on'
                    sql = sql + ` , ${dates} = ? `
                }
                sql = sql + `  WHERE UPPER(file_name) = '${fileName.toUpperCase()}'`
                
                db.updateUploadDocLogMaster(sql, [new Date()]).then((updateLog) => 
                {
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message" : "success",
                        "status_name" : getCode.getStatus(200)
                    })
                })
            }   
        }) 
    }
    catch(e)
    {
        console.log("e************", e)
    } 
})