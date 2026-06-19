let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let db = require('./dbQueryClientUploadedDocs')
const s3 = require('../awsS3BucketConfig/s3BucketConnection')
let inputFolderPath = 'Input_Invoice_Pdfs_Raw_Sap_dump';
const bucketName = process.env.Bucket_Name;
const folderName = process.env.currentFolder;


module.exports = require('express').Router().post('/',async(req,res) => 
{
    try 
    { 
        let fileName;
        let totalInvoiceNumbers;
        let matchedInvoiceNumbers;
        let clientUuid;
        console.log("invoice status api ", req.body)
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
        totalInvoiceNumbers = req.body.totalInvoiceNumbers
        matchedInvoiceNumbers = req.body.matchedInvoiceNumbers
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
                if(totalInvoiceNumbers?.length > 0)
                {
                    let invoiceNumbers = totalInvoiceNumbers.split(',')
                    totalInvoiceNumbers = invoiceNumbers
                    .map((item) => item)
                    .filter(
                        (value, index, current_value) => current_value.indexOf(value) === index
                    );
                }

                if(matchedInvoiceNumbers?.length > 0)
                {
                    let invoiceNumbers = matchedInvoiceNumbers.split(',')
                    matchedInvoiceNumbers = invoiceNumbers
                    .map((item) => item)
                    .filter(
                        (value, index, current_value) => current_value.indexOf(value) === index
                    );
                }
                if(totalInvoiceNumbers?.length == matchedInvoiceNumbers?.length)
                {
                    status = "Completed"
                }

                if(totalInvoiceNumbers?.length == 0 || (totalInvoiceNumbers?.length > 0 && matchedInvoiceNumbers?.length == 0))
                {
                    status = "Failed"
                }

                if((totalInvoiceNumbers?.length > matchedInvoiceNumbers?.length))
                {
                    status = "Partially-Completed"
                }

                // status = (totalInvoiceNumbers?.length == 0 || (totalInvoiceNumbers?.length > 0 && matchedInvoiceNumbers?.length == 0)) ? "Failed" :  ((totalInvoiceNumbers?.length > matchedInvoiceNumbers?.length) ? "Partially-Completed" : "Completed")

                let sql = `UPDATE upload_doc_log_master SET status = '${status}' `
                if(status != 'Failed')
                {
                    let dates = 'completed_on'
                    sql = sql + ` , ${dates} = ? `
                }
                sql = sql + `  WHERE UPPER(file_name) = '${fileName?.toUpperCase()}'`
                
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