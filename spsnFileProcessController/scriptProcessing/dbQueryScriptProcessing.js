let pool = require('../../databaseConnection/createconnection')
const uniqueFunction = require('../../common/commonFunction/uniqueSearchFunction');
let db = {}

db.getSpsnDatas = (clientId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT sums.id, sums.spsn_code AS code, sums.uuid
            FROM spsn_user_master sums
            WHERE sums.is_active = 1
            AND sums.client_id = '${clientId}'`
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
db.getPartnerLocationDatas = (clientId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT distinct pld.id, pld.code, pld.uuid, sums.name AS spsnName, sums.spsn_code AS spsnCode, sums.uuid AS spsnUuid
            FROM partner_location_detail pld
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN spsn_user_master sums ON sums.id = pld.spsn_user_id
            WHERE pld.is_active = 1
            AND pc.code = 'C'
            AND pcm.client_id = '${clientId}'`
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
    
    
db.getDailyActivityLog = (date) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT id FROM spsn_daily_activity_log WHERE DATE(activity_date) = DATE(?);`
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

db.saveDailyActivityLog = (date) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `INSERT INTO spsn_daily_activity_log (activity_date) VALUES (?);`
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

db.getDocuments = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT sdt.id, sdt.name, sdt.code
            FROM spsn_document_type sdt
            WHERE sdt.is_active = 1`
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

db.getDocumentCategories = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT sdc.id, sdc.name, sdc.code 
            FROM spsn_document_category sdc
            WHERE sdc.is_active = 1`
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

db.getDocumentAttachments = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT sda.id, sda.name
            FROM spsn_document_attachment sda;`
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
db.getFinancialYear = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, name, start_date AS startDate, end_date AS endDate, 
            is_current AS isCurrent 
            FROM financial_year 
            WHERE is_active = 1
            AND id = 1`
            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}
db.getFinancialYearData = (date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, name, start_date AS startDate, end_date AS endDate, 
            is_current AS isCurrent 
            FROM financial_year 
            WHERE is_active = 1
            AND DATE(start_date) <= DATE(?)
            AND DATE(end_date) >= DATE(?)`;

            console.log(sql)

            pool.query(sql, [date, date], (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) { 
            throw e
        }
    })
}


db.getDocumentAttachmentId = (name) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT da.id
            FROM document_attachment da 
            WHERE da.name = '${name}'`
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

db.getClientDocsPostingDates = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cudm.posting_date AS postingDate, pai.sap_code AS vendorCode  
            FROM client_uploaded_spsn_doc_master cudm
            LEFT JOIN partner_additional_info pai ON pai.partner_id = cudm.id
            WHERE cudm.document_category_id = (SELECT id FROM spsn_document_category WHERE name = 'Ledger') `
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

db.getCreditNoteNumberForWorkingFile = (documentAttachmentId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cudm.id,cudm.bill_no_or_ref_no AS creditNoteNumber,
            GROUP_CONCAT(DISTINCT cudd.document_attachment_id ORDER BY cudd.document_attachment_id ASC) AS attach  
                                    FROM client_uploaded_document_master cudm 
                                    LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
                                    LEFT JOIN document_attachment da ON da.id != cudd.document_attachment_id
                                    LEFT JOIN document_category dc ON dc.id = cudm.document_category_id 
                                    LEFT JOIN document d ON d.id = cudm.document_id 
                                    WHERE dc.name = 'Credit Note' 
                                    AND d.name != 'Cash Discount' 
                                   GROUP BY cudm.id 
                                   having (attach IS NULL OR FIND_IN_SET('${documentAttachmentId}',attach) = 0)
                                   ORDER BY cudm.id, cudd.id `
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

db.getCreditNoteNumberForPdf = (documentAttachmentId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cudm.id,cudm.document_number AS creditNoteNumber,
            GROUP_CONCAT(DISTINCT cudd.document_attachment_id ORDER BY cudd.document_attachment_id ASC) AS attach  
                FROM client_uploaded_document_master cudm 
                LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
                LEFT JOIN document_attachment da ON da.id != cudd.document_attachment_id
                LEFT JOIN document_category dc ON dc.id = cudm.document_category_id 
                LEFT JOIN document d ON d.id = cudm.document_id 
                WHERE dc.name = 'Credit Note' 
                GROUP BY cudm.id 
                having (attach IS NULL OR FIND_IN_SET('${documentAttachmentId}',attach) = 0)
                ORDER BY cudm.id, cudd.id `
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

db.getClientDocNo = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT CONCAT(cuvdm.bill_no_or_ref_no,'-',pai.sap_code) AS billNumber   
            FROM client_uploaded_spsn_doc_master cuvdm 
            LEFT JOIN partner p ON p.id = cuvdm.partner_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
            WHERE cuvdm.document_category_id = (SELECT id FROM spsn_document_category WHERE name = 'Credit Note')  `
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

db.getClientDocNoPA = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cuvdm.id, cuvdm.bill_no_or_ref_no AS billNumber, cuvdm.total_amount_paid AS totalAmount   
            FROM client_uploaded_spsn_doc_master cuvdm 
            LEFT JOIN partner p ON p.id = cuvdm.partner_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
            WHERE cuvdm.document_category_id = (SELECT id FROM spsn_document_category WHERE name = 'Payment Advice')  `
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

db.getInteruptProcess = (clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT is_working AS isWorking FROM interupt_process_spsn WHERE client_id = '${clientId}';`

            pool.query(sql, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        }
        catch (e) {
            console.log(e)
        }
    });
};

db.saveClientUploadedDocMaster = (documentDate, documentNumber, documentCategoryId, documentId, partnerLocationDetailUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, uploadedOn, openingBalance, closingBalance) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO client_uploaded_document_master (document_date, document_number, document_category_id, document_id, partner_location_detail_id, client_id, narration, month_period, posting_date, debit_amount, credit_amount, bill_no_or_ref_no, uploaded_on, opening_balance, closing_balance) VALUES ('${documentDate}', '${documentNumber}', '${documentCategoryId}', '${documentId}', (SELECT id FROM partner_location_detail WHERE uuid = '${partnerLocationDetailUuid}'), (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${uniqueFunction.manageSpecialCharacter(narration)}', '${monthPeriod}', '${postingDate}', '${debitAmount}', '${creditAmount}', '${billNoOrRefNo}', ?, '${openingBalance}', '${closingBalance}')`

            //  
            pool.query(sql, [uploadedOn] ,(error, result) => 
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

db.saveClientUploadedDocDetail = (documentFileName, documentFilePath, clientUploadedDocsMasterId, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO client_uploaded_document_detail (document_file_name, document_file_path, client_uploaded_document_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
            pool.query(sql, [uploadedOn] ,(error, result) => 
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

db.updateClientUploadedDocDetail = (documentFileName, documentFilePath, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV, detailId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE client_uploaded_document_detail SET document_file_name = '${documentFileName}', document_file_path = '${documentFilePath}', document_attachment_id = '${documentAttachmentId}', uploaded_on = ?,encryption_key = '${encriptionKey}',encryption_iv = '${encriptionIV}' WHERE  id = '${detailId}'`
            pool.query(sql, [uploadedOn] ,(error, result) => 
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

db.updateClientUploadedDocMaster = (masterId, toDate) => 
    {
        return new Promise((resolve, reject) => 
        {
            try
            {
                let sql = `UPDATE client_uploaded_document_master SET to_date = '${toDate}' WHERE  id = '${masterId}'`
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


db.getTotalCount = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, addField) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT DISTINCT COUNT(cudm.id) AS totalCount 
                       FROM client_uploaded_document_master cudm
                       LEFT JOIN document d ON d.id = cudm.document_id
                       WHERE cudm.document_category_id = (SELECT id FROM document_category WHERE name = '${action}') `

            if(fromDate?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) >= '${fromDate}'`
            }

            if(toDate?.length > 0)
            {
                sql = sql +  ` AND DATE(cudm.uploaded_on) <= '${toDate}'`
            }

            if(addField?.length > 0)
            {
                sql = sql +  ` AND d.name = '${addField}'`
            }
            
            //  
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

db.getFilePath = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, file_name AS fileName, failed_file_path AS failedFilePath, processed_file_path AS processedFilePath  
            FROM upload_doc_log_master 
            WHERE id = '${id}'`

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

db.getUploadedFilePath = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cudd.id, cudd.document_file_name AS fileName, cudd.document_file_path AS filePath, p.id AS partnerId, pld.id AS locationId 
            FROM client_uploaded_document_detail cudd
            LEFT JOIN client_uploaded_document_master cudm ON cudm.id = cudd.client_uploaded_document_master_id
            LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id  
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id  
            WHERE FIND_IN_SET(cudd.id,'${id}') > 0`

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

db.getMimeType = (name) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT mime   
            FROM mime_type 
            WHERE LOWER(name) = LOWER('${name}')`

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

db.updateUploadDocLogMaster = (sql, dates) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            pool.query(sql,dates,(error, result) => 
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

db.saveWorkingFile = (documentFileName,documentFilePath,clientUploadedDocsMasterId,documentAttachmentId,uploadedOn,encriptionKey, encriptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO client_uploaded_document_detail (document_file_name, document_file_path, client_uploaded_document_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
            pool.query(sql,[uploadedOn],(error, result) => 
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

db.savePdfFile = (documentFileName,documentFilePath,clientUploadedDocsMasterId,documentAttachmentId,uploadedOn,encriptionKey, encriptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO client_uploaded_document_detail (document_file_name, document_file_path, client_uploaded_document_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
            pool.query(sql,[uploadedOn],(error, result) => 
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

db.getClientsUuid = () =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT uuid
                                    FROM client
                                    WHERE is_doc_folder = 1 
                                    AND is_active = 1
                                    AND (service_type_id = 2 OR service_type_id = 3)
                                    AND (linked_user_id IS NOT NULL OR linked_user_id != '')`
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


db.getClientUploadedDocsMasterId = (number) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id   
            FROM client_uploaded_document_master 
            WHERE bill_no_or_ref_no = '${number}'`

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

db.getClientUploadedDocsMasterIdForCreditNote = (number) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id   
            FROM client_uploaded_document_master 
            WHERE document_number = '${number}'`

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

db.getEncryptionData = (fileName) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT encryption_key, encryption_iv
                                    FROM upload_doc_log_master
                                    WHERE UPPER(file_name) = '${fileName.toUpperCase()}'`
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
            console.log(e)
        }
    });
};

db.getUploadedEncryptionData = (fileName) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `SELECT encryption_key, encryption_iv
                                    FROM client_uploaded_document_detail
                                    WHERE document_file_name = '${fileName}'`
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


db.saveDataTransactLog = (activity,user,partnerUuid,locationUuid,fileSize,apiName,storageType,createdOn, clientUuid, fileName) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}','${partnerUuid}','${locationUuid}','${fileSize}','${apiName}','${storageType}',?, (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${fileName}')`
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

db.updateDailyActivityLogDetail = (activityType, activityName, closingRemark, clientUuid, date) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                let sql = `UPDATE spsn_daily_activity_detail 
                SET closing_remark = '${closingRemark}', end_on = ?
                WHERE id IN (
                    SELECT id FROM (
                        SELECT dad.id 
                        FROM spsn_daily_activity_detail AS dad 
                        JOIN spsn_daily_activity_log AS dal ON dad.spsn_daily_activity_detail_id = dal.id 
                        Left JOIN client AS c ON c.id = dad.client_id 
                        WHERE dad.activity_type = '${activityType}' 
                            AND dad.activity_name = '${activityName}'
                            AND c.uuid = '${clientUuid}'
                            AND DATE(dal.activity_date) = DATE(?)
                        ORDER BY dad.id DESC 
                        LIMIT 1
                    ) AS tmp
                );`
                pool.query(sql, [date, date], (error, result) => 
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

db.saveDailyActivityLogDetail = (activityType, activityName, openingRemark, clientUuid, date) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                let sql = `INSERT INTO spsn_daily_activity_detail (activity_type, activity_name, opening_remark, started_on, spsn_daily_activity_detail_id, client_id) 
                VALUES ('${activityType}', '${activityName}', '${openingRemark}', ?, (SELECT id FROM spsn_daily_activity_log WHERE DATE(activity_date) = DATE(?)), (SELECT id FROM client WHERE uuid = '${clientUuid}' ));`
                pool.query(sql, [date, date], (error, result) => 
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



db.updatePdfBotLogLastActive = (lastActiveOn, botName) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE pdf_bot_process_log SET last_active_on = ? 
            WHERE bot_name = '${botName}'; `
            pool.query(sql, [lastActiveOn], (error, result) => 
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

db.updateDailyActivityLogDetailByMasterId = (activityType, activityName, closingRemark, clientUuid, date, masterId) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                let sql = `UPDATE spsn_daily_activity_detail 
                SET closing_remark = '${closingRemark}', end_on = ?
                WHERE id IN (
                    SELECT id FROM (
                        SELECT dad.id 
                        FROM spsn_daily_activity_detail AS dad 
                        JOIN spsn_daily_activity_log AS dal ON dad.spsn_daily_activity_detail_id = dal.id 
                        Left JOIN client AS c ON c.id = dad.client_id 
                        WHERE dad.activity_type = '${activityType}' 
                            AND dad.activity_name = '${activityName}'
                            AND c.uuid = '${clientUuid}'
                            AND dal.id = '${masterId}' 
                        ORDER BY dad.id DESC 
                        LIMIT 1
                    ) AS tmp
                );`
                pool.query(sql, [date, date], (error, result) => 
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


module.exports = db

