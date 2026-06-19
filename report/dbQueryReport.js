let pool = require('../databaseConnection/createconnection')
let db = {}
let fs = require('fs')

db.clientIsExist = (clientKey) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT IF(COUNT(id) > 0, 1, 0) AS isExist FROM client WHERE client_key = '${clientKey}'`
            //  
            pool.query(sql, (error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e)
        {
            throw e
        }
    })
}

db.updateMailQueueStatus = (sql, date) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {           
            pool.query(sql, [date], (error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch(e)
        { 
            console.log(e)
        }
    });
};

db.checkLogStatusesPending = () =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT rpl.id, rpl.client_id AS clientId, rpl.status, rpl.from_date AS fromDate, 
           rpl.to_date AS toDate, rpl.mail_to AS mailTo, c.name AS clientName, c.uuid AS clientUuid  
                                    FROM report_processing_log rpl
                                    LEFT JOIN client c ON c.id = rpl.client_id
                                    WHERE rpl.status = 'Pending'
                                    ORDER BY rpl.id`
            pool.query(sql, (error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch(e)
        { 
            console.log(e)
        }
    });
};


db.getCreditNoteSummaries = (partnerLocationUuid, clientUuid, fromDate, toDate, action) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT 
            IF(cudd1.id IS NULL, 0, 1) AS isPdfExist, 
            IF(cudd2.id IS NULL, 0, 1) AS isWorkingExist, 
            cudm.id, 
            cudm.posting_date AS postingDate, 
            cudm.document_number AS documentNumber, 
            cudm.uploaded_on AS uploadedOn, 
            cudm.bill_no_or_ref_no AS billNoOrRefNo,  
            d.id AS documentId, 
            d.name AS documentName, 
            pld.uuid AS partnerLocationUuid, 
            pld.code AS partnerLocationCode, 
            pld.store_name AS partnerLocationStoreName
        FROM 
            client_uploaded_document_master cudm
        JOIN 
            client c ON c.id = cudm.client_id
        JOIN 
            partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
        JOIN 
            document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Credit Note'
        LEFT JOIN 
            document d ON d.id = cudm.document_id
        LEFT JOIN 
            client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 1
        LEFT JOIN 
            client_uploaded_document_detail cudd1 ON cudd1.client_uploaded_document_master_id = cudm.id AND cudd1.document_attachment_id = 2
        LEFT JOIN 
            client_uploaded_document_detail cudd2 ON cudd2.client_uploaded_document_master_id = cudm.id AND cudd2.document_attachment_id = 3 
        WHERE
            cudm.partner_location_detail_id IS NOT NULL    
        AND   
        ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2)     
        AND (IF(cudd1.id IS NULL, 0, 1) = 0) 
        `
        // OR IF(cudd2.id IS NULL, 0, 1) = 0
            if(partnerLocationUuid?.length > 0)
            {
                sql = sql +  ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }

            if(action?.length > 0)
            {
                sql = sql +  ` AND d.name = '${action}'`
            }
            
            sql = sql +  ` ORDER by cudm.uploaded_on DESC;`
            //  

            
            // console.log(partnerLocationUuid, clientUuid, new Date(fromDate), new Date(toDate), action)

            // let dummyData = `\n\n\n\n\n\ Credit Note  \n\n\n\n\n\ `
            // fs.appendFileSync('./sqlQueries.txt', dummyData)
            // fs.appendFileSync('./sqlQueries.txt', sql)
            
            // (cudm.credit_amount != 0 OR cudm.debit_amount != 0)  
            // console.log(sql)

            pool.query(sql,(error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e)
        {
            throw e
        }
    })
}

db.getInvoiceSummaries = (partnerLocationUuid, clientUuid, fromDate, toDate, action) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT DISTINCT IF(cudd1.id IS NULL,0,1) AS isPdfExist, 
            IF(cudd3.id IS NULL,0,1) AS isPtExist, cudm.id,
            cudm.posting_date AS postingDate, 
                        cudm.uploaded_on AS uploadedOn, 
                        cudm.bill_no_or_ref_no AS billNoOrRefNo,   
                        d.id AS documentId, d.name AS documentName, 
                        pld.uuid AS partnerLocationUuid, 
                        pld.code AS partnerLocationCode, 
                        pld.store_name AS partnerLocationStoreName  
            FROM 
                client_uploaded_document_master cudm
            JOIN 
                client c ON c.id = cudm.client_id
            JOIN 
                partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            JOIN 
                document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Invoice'
            LEFT JOIN 
                document d ON d.id = cudm.document_id
            LEFT JOIN 
                client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id 
                AND cudd.document_attachment_id = 1
            LEFT JOIN 
                client_uploaded_document_detail cudd1 ON cudd1.client_uploaded_document_master_id = cudm.id 
                AND cudd1.document_attachment_id = 2
            LEFT JOIN 
                client_uploaded_document_detail cudd3 ON cudd3.client_uploaded_document_master_id = cudm.id 
                AND cudd3.document_attachment_id = 4
            WHERE
                cudm.partner_location_detail_id IS NOT NULL  
            AND (IF(cudd1.id IS NULL, 0, 1) = 0 OR IF(cudd3.id IS NULL, 0, 1) = 0)
         `

            if(partnerLocationUuid?.length > 0)
            {
                sql = sql +  ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }
            
            sql = sql +  `  ORDER by cudm.uploaded_on DESC;`

            
            // let dummyData = `\n\n\n\n\n\ INvoice ${partnerLocationUuid, clientUuid, fromDate, toDate, action}\n\n\n\n\n\ `
            // fs.appendFileSync('./sqlQueries.txt', dummyData)
            // fs.appendFileSync('./sqlQueries.txt', sql)

            pool.query(sql,(error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e)
        {
            throw e
        }
    })
}

db.getPartnerLedgers = (partnerLocationUuid, clientUuid, fromDate, toDate, action) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT DISTINCT cudm.id, cudm.posting_date AS postingDate, IF(cudd.id IS NULL,0,1) AS isFileExist, 
            cudm.uploaded_on AS uploadedOn, cudm.month_period AS monthPeriod, IF(cudm.month_period > 1, concat(DATE_FORMAT(cudm.posting_date, '%b %y - '), 
            DATE_FORMAT(DATE_ADD(cudm.posting_date, INTERVAL cudm.month_period MONTH), '%b %y')),
            DATE_FORMAT(cudm.posting_date, '%b %y')) AS monthPeriodNarration,  
            d.id AS documentId, d.name AS documentName, 
            pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName 
            FROM client_uploaded_document_master cudm
            JOIN client c ON c.id = cudm.client_id
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Ledger'
            LEFT JOIN document d ON d.id = cudm.document_id
            JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
            WHERE
            cudm.partner_location_detail_id IS NOT NULL   
           
            `

            if(partnerLocationUuid?.length > 0)
            {
                sql = sql +  ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }
            
            sql = sql +  `   ORDER by cudm.uploaded_on DESC;`
            //  
            
            // let dummyData = `\n\n\n\n\n\ Ledger ${partnerLocationUuid, clientUuid, fromDate, toDate, action}\n\n\n\n\n\ `
            // fs.appendFileSync('./sqlQueries.txt', dummyData)
            // fs.appendFileSync('./sqlQueries.txt', sql)
            pool.query(sql,(error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e)
        {
            throw e
        }
    })
}

db.getPartnerMonthlyTransactions = (partnerLocationUuid, clientUuid, fromDate, toDate, action) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT DISTINCT cudm.id, cudm.from_date AS fromDate, cudm.to_date AS toDate,  
            cudm.uploaded_on  AS uploadedOn, IF(cudd.id IS NULL,0,1) AS isFileExist, 
            d.id AS documentId, d.name AS documentName, 
            pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName
            FROM client_uploaded_document_master cudm
            JOIN client c ON c.id = cudm.client_id
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Transaction'
            LEFT JOIN document d ON d.id = cudm.document_id
            JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
            WHERE
            cudm.partner_location_detail_id IS NOT NULL   
           `

            if(partnerLocationUuid?.length > 0)
            {
                sql = sql +  ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }
            
            sql = sql +  `  ORDER by cudm.uploaded_on DESC;`

            
            // let dummyData = `\n\n\n\n\n\ Monthly ${partnerLocationUuid, clientUuid, fromDate, toDate, action}\n\n\n\n\n\ `
            // fs.appendFileSync('./sqlQueries.txt', dummyData)
            // fs.appendFileSync('./sqlQueries.txt', sql)

            pool.query(sql,(error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e)
        {
            throw e
        }
    })
}

db.saveReportRequest = (status, fromDate, toDate, createdOn, clientUuid, mailTo) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `INSERT INTO report_processing_log (status, from_date, to_date, client_id, mail_to, created_on) VALUES ('${status}', ?, ?, (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${mailTo}', ?); `
            pool.query(sql, [fromDate, toDate, createdOn], (error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch(e)
        { 
            console.log(e)
        }
    });
};

db.getPartnerOnboardings = (clientUuid, fromDate, toDate) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT DISTINCT pol.id, pol.uploaded_on AS uploadedOn, pol.file_name AS fileName, pol.status AS status, pol.client_id AS clientid, pol.processed_file_path AS processedFilePath, pol.failed_file_path AS failedFilePath, pol.remark, pol.encryption_key As encryptionKey, pol.encryption_iv AS encryptionIV, pol.completed_on AS completedOn, pol.failed_on AS failedOn, pol.started_on AS startedOn  
            FROM partner_onboarding_log pol
            JOIN client c ON c.id = pol.client_id
            WHERE
            pol.id IS NOT NULL   
           
            `

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(pol.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(pol.uploaded_on) <= DATE('${toDate}')`
            }
            
            sql = sql +  `   ORDER by pol.uploaded_on DESC;`

            pool.query(sql,(error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e)
        {
            throw e
        }
    })
}

db.getUploadDocMasterFailedFileData = (clientUuid, fromDate, toDate) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT 
	json_object(IF(document_category_id = 1, 'CN', IF(document_category_id = 2, 'INV', IF(document_category_id = 3, 'LGR', 'TRNS'))), 
			json_object(
					'id',id,
                    'fileName', file_name,
                    'clientId', client_id,
                    'documentAttachmentId', document_attachment_id, 
                    'documentCategoryId',document_category_id, 
                    'uploadedOn',uploaded_on, 
                    'status',status,  
                    'remark', remark,
                    'encryptionKey',encryption_key,
                    'encryptionIV',encryption_iv,
                    'failedOn', failed_on, 
                    'failedFilePath',failed_file_path)) AS uploadDocData
            FROM upload_doc_log_master WHERE (status = 'Failed' OR status = 'Partially-Completed')  
            AND (document_attachment_id = 1 OR document_attachment_id = 4) 
            AND (document_category_id = 1 OR document_category_id = 2 OR document_category_id = 3 OR document_category_id = 7) 
           

            `

            if(clientUuid)
            {
                sql = sql +  ` AND client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}')`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(uploaded_on) <= DATE('${toDate}')`
            }
            
            sql = sql +  `   ORDER by id;`

            console.log(sql)



            pool.query(sql,(error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e)
        {
            throw e
        }
    })
}

db.saveDataTransactLog = (activity,user,partnerUuid,locationUuid,fileSize,apiName,storageType,createdOn, clientUuid, fileName) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}',${partnerUuid ? `'${partnerUuid}'` : null},${locationUuid ? `'${locationUuid}'` : null},'${fileSize}','${apiName}','${storageType}',?, (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${fileName}')`
            pool.query(sql, [createdOn], (error, result) => 
            {
                if(error)
                {
                    return reject(error);
                }          
                return resolve(result);
            });
        }
        catch(e)
        {
            throw e
        }
    })
}

module.exports = db