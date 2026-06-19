let pool = require('../databaseConnection/createconnection')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let db = {}


db.getFinancialYears = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, name, start_date AS startDate, end_date AS endDate, is_current AS isCurrent 
                        FROM financial_year  
                        WHERE is_active = 1        
                        ORDER BY name`
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

db.getPartnerLocationDatas = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, code, uuid, store_location, customer_type AS customerType 
            FROM partner_location_detail 
            WHERE is_active = 1`
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

db.getDocuments = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT d.id, d.name, d.code
            FROM document d
            WHERE d.is_active = 1`
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

db.getDocumentCategories = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT dc.id, dc.name, dc.code 
            FROM document_category dc
            WHERE dc.is_active = 1`
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

db.getDocumentAttachments = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT da.id, da.name
            FROM document_attachment da;`
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

db.getDocumentAttachmentId = (name) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT da.id
            FROM document_attachment da 
            WHERE da.name = '${name}'`
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

db.getClientDocsPostingDates = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `
            SELECT 
            -- cudm.posting_date AS postingDate, 
            DATE_FORMAT(cudm.posting_date, '%Y-%m-%d') AS postingDate,
            pld.code AS partnerLocationCode  
            FROM client_uploaded_document_master cudm
            JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            WHERE cudm.document_category_id = (SELECT id FROM document_category WHERE name = 'Ledger') `
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

db.getCreditNoteNumberForWorkingFile = (documentAttachmentId, documentCode) => {
    return new Promise((resolve, reject) => {
        try {

            // AND d.name != 'Cash Discount' 
            // cudm.bill_no_or_ref_no AS creditNoteNumber, 
            let sql = `SELECT cudm.id, CONCAT(cudm.bill_no_or_ref_no, '-', pld.code) AS creditNoteNumber,   cudm.posting_date AS postingDate, 
            GROUP_CONCAT(DISTINCT cudd.document_attachment_id ORDER BY cudd.document_attachment_id ASC) AS attach  
                                    FROM client_uploaded_document_master cudm 
                                    LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
                                    LEFT JOIN document_attachment da ON da.id != cudd.document_attachment_id
                                    LEFT JOIN document_category dc ON dc.id = cudm.document_category_id 
                                    LEFT JOIN document d ON d.id = cudm.document_id 
                                    LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                                    WHERE dc.name = 'Credit Note' 
                                    AND d.code != 'AB'
                                    AND d.code != 'OTH'  `

            if (documentCode) {
                sql = sql + ` AND d.code = '${documentCode}'`
            }

            sql = sql + ` 
                        GROUP BY cudm.id 
                        having (attach IS NULL OR FIND_IN_SET('${documentAttachmentId}',attach) = 0)
                        ORDER BY cudm.id, cudd.id`

            console.log(sql)

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

db.getCreditNoteNumberForPdf = (documentAttachmentId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT cudm.id,   CONCAT(
        cudm.document_number, '-', 
        pld.code, '-', 
        DATE_FORMAT(CONVERT_TZ(cudm.posting_date, '+00:00', @@session.time_zone), '%Y-%m-%d')
    ) AS creditNoteNumber,
            GROUP_CONCAT(DISTINCT cudd.document_attachment_id ORDER BY cudd.document_attachment_id ASC) AS attach  
                FROM client_uploaded_document_master cudm 
                LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
                LEFT JOIN document_attachment da ON da.id != cudd.document_attachment_id
                LEFT JOIN document_category dc ON dc.id = cudm.document_category_id 
                LEFT JOIN document d ON d.id = cudm.document_id 
                LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                WHERE dc.name = 'Credit Note' 
                AND ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2)  
                GROUP BY cudm.id 
                having (attach IS NULL OR FIND_IN_SET('${documentAttachmentId}',attach) = 0)
                ORDER BY cudm.id, cudd.id `
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

db.getInvoiceNumberForPdf = (documentAttachmentId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT cudm.id,cudm.bill_no_or_ref_no AS invoiceNumber,
            GROUP_CONCAT(DISTINCT cudd.document_attachment_id ORDER BY cudd.document_attachment_id ASC) AS attach  
                FROM client_uploaded_document_master cudm 
                LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
                LEFT JOIN document_attachment da ON da.id != cudd.document_attachment_id
                LEFT JOIN document_category dc ON dc.id = cudm.document_category_id 
                LEFT JOIN document d ON d.id = cudm.document_id 
                WHERE dc.name = 'Invoice' 
                GROUP BY cudm.id 
                having (attach IS NULL OR FIND_IN_SET('${documentAttachmentId}',attach) = 0)
                ORDER BY cudm.id, cudd.id `
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

db.getClientDocNo = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT CONCAT(cudm.document_number,'-',pld.code, '-', DATE_FORMAT(CONVERT_TZ(cudm.posting_date, '+00:00', @@session.time_zone), '%Y-%m-%d')) AS documentNumber   
            FROM client_uploaded_document_master cudm 
            LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            WHERE cudm.document_category_id = (SELECT id FROM document_category WHERE name = 'Credit Note')  `
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

db.getClientDocsBillOrRefNoForInvoiceSummary = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT cudm.bill_no_or_ref_no AS billNoOrRefNo  
            FROM client_uploaded_document_master cudm 
            WHERE cudm.document_category_id = (SELECT id FROM document_category WHERE name = 'Invoice') `
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

db.saveMonthlyTransactionDocMaster = (documentCategoryId, documentId, partnerLocationDetailUuid, clientUuid, uploadedOn, fromDate, toDate) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_uploaded_document_master (document_category_id, document_id, partner_location_detail_id, client_id, uploaded_on, from_date, to_date) VALUES ('${documentCategoryId}', '${documentId}', (SELECT id FROM partner_location_detail WHERE uuid = '${partnerLocationDetailUuid}'), (SELECT id FROM client WHERE uuid = '${clientUuid}'), ?, '${fromDate}', '${toDate}')`

            //  
            pool.query(sql, [uploadedOn], (error, result) => {
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


db.saveClientUploadedDocMaster = (documentDate, documentNumber, documentCategoryId, documentId, partnerLocationDetailUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, uploadedOn, openingBalance, closingBalance) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_uploaded_document_master (document_date, document_number, document_category_id, document_id, partner_location_detail_id, client_id, narration, month_period, posting_date, debit_amount, credit_amount, bill_no_or_ref_no, uploaded_on, opening_balance, closing_balance) VALUES ('${documentDate}', '${documentNumber}', '${documentCategoryId}', '${documentId}', (SELECT id FROM partner_location_detail WHERE uuid = '${partnerLocationDetailUuid}'), (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${uniqueFunction.manageSpecialCharacter(narration)}', '${monthPeriod}', '${postingDate}', '${debitAmount}', '${creditAmount}', '${billNoOrRefNo}', ?, '${openingBalance}', '${closingBalance}')`

            //  
            pool.query(sql, [uploadedOn], (error, result) => {
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

db.saveClientUploadedDocDetail = (documentFileName, documentFilePath, clientUploadedDocsMasterId, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_uploaded_document_detail (document_file_name, document_file_path, client_uploaded_document_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
            pool.query(sql, [uploadedOn], (error, result) => {
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

db.updateClientUploadedDocDetail = (documentFileName, documentFilePath, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV, detailId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_uploaded_document_detail SET document_file_name = '${documentFileName}', document_file_path = '${documentFilePath}', document_attachment_id = '${documentAttachmentId}', uploaded_on = ?,encryption_key = '${encriptionKey}',encryption_iv = '${encriptionIV}' WHERE  id = '${detailId}'`

            pool.query(sql, [uploadedOn], (error, result) => {
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

db.updateClientUploadedDocMasterLedger = (masterId, postingDate, openingBalance, closingBalance) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_uploaded_document_master SET posting_date = '${postingDate}', opening_balance ='${openingBalance}', closing_balance ='${closingBalance}'  WHERE  id = '${masterId}'`
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

db.updateClientUploadedDocMaster = (masterId, toDate) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_uploaded_document_master SET to_date = '${toDate}' WHERE  id = '${masterId}'`
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
db.getPartnerLedgers = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, maxId, uploadedOn, userTypeCode, dateType, loggedUserType) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT DISTINCT cudm.id, cudm.opening_balance AS openingBalance, (IFNULL(cudm.opening_balance,0)+IFNULL(cudm.closing_balance,0)) AS closingBalance, cudm.posting_date AS postingDate, 
            cudm.uploaded_on AS uploadedOn, cudm.month_period AS monthPeriod, cudm.narration, IF(cudm.month_period > 1, concat(DATE_FORMAT(cudm.posting_date, '%b %y - '), 
            DATE_FORMAT(DATE_ADD(cudm.posting_date, INTERVAL cudm.month_period MONTH), '%b %y')),
            DATE_FORMAT(cudm.posting_date, '%b %y')) AS monthPeriodNarration, 
            c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode, 
            c.email AS clientEmail, 
            dc.id AS documentCategoryId, dc.code AS documentCategoryCode, dc.name AS documentCategoryName, 
            d.id AS documentId, d.name AS documentName, 
            pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName, 
            pld.customer_type AS partnerLocationCustomerType, 
            pld.store_location AS partnerLocationStoreLocation,
            cudd.id AS clientDocId, cudd.document_file_name AS clientDocFileName,  
            da.id AS documentAttachmentId, da.name AS documentAttachmentName,
            p.email AS partnerEmail, p.name AS partnerName, p.uuid AS partnerUuid  
            FROM client_uploaded_document_master cudm
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Ledger'
            LEFT JOIN document d ON d.id = cudm.document_id
            JOIN client c ON c.id = cudm.client_id

            `

            if (loggedUserType == 'Partner-User') {
                sql = sql + ` 
                            JOIN 
                                secondary_partner_location_detail spld ON spld.partner_location_detail_id = cudm.partner_location_detail_id
                            JOIN 
                                secondary_partner sp ON sp.id = spld.secondary_partner_id
                            JOIN 
                                partner p ON p.id = sp.partner_id 
                            JOIN 
                                partner_location_detail pld ON pld.id = spld.partner_location_detail_id
                
                `
            }
            else {
                sql = sql + ` 
                        JOIN 
                            partner_client_mapping pcm ON pcm.client_id = c.id
                        JOIN 
                            partner p ON p.id = pcm.partner_id
                        JOIN 
                            partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                        JOIN 
                            partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
                            
                            `
            }


            sql = sql + ` 
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
            LEFT JOIN document_attachment da ON da.id = cudd.document_attachment_id 
            WHERE
	        cudm.partner_location_detail_id IS NOT NULL       
           `

            if (userTypeCode != 'ADM') sql = sql + `  AND pld.is_active = 1`
            if (partnerUuid && partnerUuid?.length > 0) {
                // sql = sql + ` AND p.uuid = '${partnerUuid}'`
                if (loggedUserType == 'Partner-User') {
                    sql = sql + ` AND sp.uuid = '${partnerUuid}'`
                }
                else {
                    sql = sql + ` AND p.uuid = '${partnerUuid}'`
                }
            }

            if (partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

            sql = sql + ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Ledger')}`

            sql = sql + `   ORDER by cudm.posting_date DESC;`

            console.log(sql)
            //  
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

db.getPartnerMonthlyTransactions = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, maxId, uploadedOn, userTypeCode, dateType, loggedUserType) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT DISTINCT cudm.id, cudm.from_date AS fromDate, cudm.to_date AS toDate,  
            cudm.uploaded_on  AS uploaded_on,  DATE_FORMAT(cudm.from_date, '%b %y') AS monthPeriodNarration,
            c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode, 
            c.email AS clientEmail, 
            dc.id AS documentCategoryId, dc.code AS documentCategoryCode, dc.name AS documentCategoryName, 
            d.id AS documentId, d.name AS documentName, 
            pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName,
            pld.customer_type AS partnerLocationCustomerType, 
            pld.store_location AS partnerLocationStoreLocation,
            cudd.id AS clientDocId, cudd.document_file_name AS clientDocFileName,  
            da.id AS documentAttachmentId, da.name AS documentAttachmentName,
            p.email AS partnerEmail, p.name AS partnerName, p.uuid AS partnerUuid  
            FROM client_uploaded_document_master cudm
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Transaction'
            LEFT JOIN document d ON d.id = cudm.document_id
            JOIN client c ON c.id = cudm.client_id
            `
            if (loggedUserType == 'Partner-User') {
                sql = sql + ` 
                            JOIN 
                                secondary_partner_location_detail spld ON spld.partner_location_detail_id = cudm.partner_location_detail_id
                            JOIN 
                                secondary_partner sp ON sp.id = spld.secondary_partner_id
                            JOIN 
                                partner p ON p.id = sp.partner_id 
                            JOIN 
                                partner_location_detail pld ON pld.id = spld.partner_location_detail_id
                
                `
            }
            else {
                sql = sql + ` 
                        JOIN 
                            partner_client_mapping pcm ON pcm.client_id = c.id
                        JOIN 
                            partner p ON p.id = pcm.partner_id
                        JOIN 
                            partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                        JOIN 
                            partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
                            
                            `
            }


            sql = sql + ` 
            
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
            LEFT JOIN document_attachment da ON da.id = cudd.document_attachment_id 
            WHERE
	        cudm.partner_location_detail_id IS NOT NULL   
             `

            if (userTypeCode != 'ADM') sql = sql + `  AND pld.is_active = 1`

            if (partnerUuid && partnerUuid?.length > 0) {
                // sql = sql + ` AND p.uuid = '${partnerUuid}'`
                if (loggedUserType == 'Partner-User') {
                    sql = sql + ` AND sp.uuid = '${partnerUuid}'`
                }
                else {
                    sql = sql + ` AND p.uuid = '${partnerUuid}'`
                }
            }

            if (partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

            sql = sql + ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Transaction')}`

            sql = sql + `  ORDER by cudm.from_date DESC;`

            
            console.log(sql)

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

db.getCreditNoteSummaries = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, maxId, uploadedOn, userTypeCode, dateType, loggedUserType) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
            IF(cudd1.id IS NULL, 0, 1) AS isPdfExist, 
            IF(cudd2.id IS NULL, 0, 1) AS isWorkingExist, 
            cudm.id, 
            cudm.debit_amount AS debitAmount, 
            cudm.credit_amount AS creditAmount, 
            cudm.posting_date AS postingDate, 
            cudm.document_number AS documentNumber, 
            cudm.uploaded_on AS uploadedOn, 
            cudm.bill_no_or_ref_no AS billNoOrRefNo, 
            cudm.narration, 
            c.uuid AS clientUuid, 
            c.name AS clientName, 
            c.code AS clientCode, 
            c.email AS clientEmail, 
            dc.id AS documentCategoryId, 
            dc.code AS documentCategoryCode, 
            dc.name AS documentCategoryName, 
            d.id AS documentId, 
            d.name AS documentName, 
            d.code AS documentCode, 
            pld.uuid AS partnerLocationUuid, 
            pld.code AS partnerLocationCode, 
            pld.store_name AS partnerLocationStoreName,
            pld.customer_type AS partnerLocationCustomerType, 
            pld.store_location AS partnerLocationStoreLocation,
            cudd.id AS clientDocId, 
            cudd.document_file_name AS clientDocFileName,  
            cudd1.id AS pdfClientDocId, 
            cudd1.document_file_name AS pdfClientDocFileName, 
            cudd2.id AS workingClientDocId, 
            cudd2.document_file_name AS workingClientDocFileName, 
            da.id AS documentAttachmentId, 
            da.name AS documentAttachmentName,
            da1.id AS pdfDocumentAttachmentId, 
            da1.name AS pdfDocumentAttachmentName,
            da2.id AS workingDocumentAttachmentId, 
            da2.name AS workingDocumentAttachmentName,
            p.email AS partnerEmail, 
            p.name AS partnerName, 
            p.uuid AS partnerUuid  
        FROM 
            client_uploaded_document_master cudm
        JOIN 
            client c ON c.id = cudm.client_id

        `
            if (loggedUserType == 'Partner-User') {
                sql = sql + ` 
            JOIN 
                secondary_partner_location_detail spld ON spld.partner_location_detail_id = cudm.partner_location_detail_id
		    JOIN 
                secondary_partner sp ON sp.id = spld.secondary_partner_id
		    JOIN 
                partner p ON p.id = sp.partner_id 
            JOIN 
                partner_location_detail pld ON pld.id = spld.partner_location_detail_id
                
                `
            }
            else {
                sql = sql + ` 
                        JOIN 
                            partner_client_mapping pcm ON pcm.client_id = c.id
                        JOIN 
                            partner p ON p.id = pcm.partner_id
                        JOIN 
                            partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                        JOIN 
                            partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
                            
                            `
            }

            sql = sql + `   JOIN 
            document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Credit Note'
        LEFT JOIN 
            document d ON d.id = cudm.document_id
        LEFT JOIN 
            client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 1
        LEFT JOIN 
            client_uploaded_document_detail cudd1 ON cudd1.client_uploaded_document_master_id = cudm.id AND cudd1.document_attachment_id = 2
        LEFT JOIN 
            client_uploaded_document_detail cudd2 ON cudd2.client_uploaded_document_master_id = cudm.id AND cudd2.document_attachment_id = 3
        LEFT JOIN 
            document_attachment da ON da.id = cudd.document_attachment_id
        LEFT JOIN 
            document_attachment da1 ON da1.id = cudd1.document_attachment_id
        LEFT JOIN 
            document_attachment da2 ON da2.id = cudd2.document_attachment_id  
        WHERE
	        cudm.partner_location_detail_id IS NOT NULL      
        AND   
        ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2)     
        `

            if (userTypeCode != 'ADM') sql = sql + `  AND pld.is_active = 1`

            if (partnerUuid && partnerUuid?.length > 0) {
                if (loggedUserType == 'Partner-User') {
                    sql = sql + ` AND sp.uuid = '${partnerUuid}'`
                }
                else {
                    sql = sql + ` AND p.uuid = '${partnerUuid}'`
                }
            }

            if (partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

            sql = sql + ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Credit Note')}`

            if (action?.length > 0) {
                sql = sql + ` AND d.name = '${action}'`
            }

            sql = sql + ` ORDER by cudm.posting_date DESC;`
            //  

            console.log(sql)

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
db.getPendingPdfSummaries = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, documentCategory, uploadedOn, userTypeCode) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                            IF(cudd1.id IS NULL, 0, 1) AS isPdfExist, 
                            IF(cudd2.id IS NULL, 0, 1) AS isWorkingExist, 
                            IF(cudd3.id IS NULL, 0, 1) AS isPtExist, 
                            cudm.id, 
                            cudm.debit_amount AS debitAmount, 
                            cudm.credit_amount AS creditAmount, 
                            cudm.posting_date AS postingDate, 
                            cudm.document_number AS documentNumber, 
                            cudm.uploaded_on AS uploadedOn, 
                            cudm.bill_no_or_ref_no AS billNoOrRefNo, 
                            cudm.narration, 
                            c.uuid AS clientUuid, 
                            c.name AS clientName, 
                            c.code AS clientCode, 
                            c.email AS clientEmail, 
                            dc.id AS documentCategoryId, 
                            dc.code AS documentCategoryCode, 
                            dc.name AS documentCategoryName, 
                            d.id AS documentId, 
                            d.name AS documentName, 
                            d.code AS documentCode, 
                            pld.uuid AS partnerLocationUuid, 
                            pld.code AS partnerLocationCode, 
                            pld.store_name AS partnerLocationStoreName,
                            pld.customer_type AS partnerLocationCustomerType, 
                            pld.store_location AS partnerLocationStoreLocation,
                            cudd.id AS clientDocId, 
                            cudd.document_file_name AS clientDocFileName,  
                            da.id AS documentAttachmentId, 
                            da.name AS documentAttachmentName,
                            p.email AS partnerEmail, 
                            p.name AS partnerName, 
                            p.uuid AS partnerUuid  
                        FROM 
                            client_uploaded_document_master cudm
                        JOIN 
                            client c ON c.id = cudm.client_id
                        JOIN 
                            partner_client_mapping pcm ON pcm.client_id = c.id
                        JOIN 
                            partner p ON p.id = pcm.partner_id
                        JOIN 
                            partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                        JOIN 
                            partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
                        JOIN 
                            document_category dc ON dc.id = cudm.document_category_id 
                            AND dc.name IN ('${documentCategory}') 
                        LEFT JOIN 
                            document d ON d.id = cudm.document_id
                        LEFT JOIN 
                            client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id 
                            AND cudd.document_attachment_id = 1
                        LEFT JOIN 
                            client_uploaded_document_detail cudd1 ON cudd1.client_uploaded_document_master_id = cudm.id 
                            AND cudd1.document_attachment_id = 2
                        LEFT JOIN 
                            client_uploaded_document_detail cudd2 ON cudd2.client_uploaded_document_master_id = cudm.id 
                            AND cudd2.document_attachment_id = 3
                        LEFT JOIN 
                            client_uploaded_document_detail cudd3 ON cudd3.client_uploaded_document_master_id = cudm.id 
                            AND cudd3.document_attachment_id = 4
                        LEFT JOIN 
                            document_attachment da ON da.id = cudd.document_attachment_id
                        WHERE
                            cudm.partner_location_detail_id IS NOT NULL    
                                                       
                        `
            if (documentCategory == 'Credit Note') {
                sql = sql + `  AND ((ABS(cudm.credit_amount) + ABS(cudm.debit_amount)) > 2) 
                     AND (IF((cudd1.id IS NULL OR cudd2.id IS NULL), 0, 1) = 0)`
            }
            else 
            {
                sql = sql + `  AND (IF(cudd1.id IS NULL, 0, 1) = 0)`
            }



            if (userTypeCode != 'ADM') sql = sql + `  AND pld.is_active = 1`

            if (partnerUuid && partnerUuid?.length > 0) {
                sql = sql + ` AND p.uuid = '${partnerUuid}'`
            }

            if (partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }

            if (!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) = DATE('${uploadedOn}')`
            }

            if (action?.length > 0) {
                sql = sql + ` AND d.name = '${action}'`
            }

            sql = sql + ` ORDER by cudm.posting_date DESC;`
            //  

            console.log(sql)

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


db.searchCreditNoteSummaries = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, like) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT DISTINCT IF(cudd1.id IS NULL,0,1) AS isPdfExist, IF(cudd2.id IS NULL,0,1) AS isWorkingExist, 
            cudm.id, cudm.debit_amount AS debitAmount, cudm.credit_amount AS creditAmount, cudm.posting_date AS postingDate, 
            cudm.document_number AS documentNumber, cudm.uploaded_on AS uploadedOn, cudm.bill_no_or_ref_no AS billNoOrRefNo, cudm.narration, 
                                   c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode, 
                                   dc.id AS documentCategoryId, dc.code AS documentCategoryCode, dc.name AS documentCategoryName, 
                                   d.id AS documentId, d.name AS documentName, 
                                   pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName,
                                   cudd.id AS clientDocId, cudd.document_file_name AS clientDocFileName,  
                                   cudd1.id AS pdfClientDocId, cudd1.document_file_name AS pdfClientDocFileName, 
                                   cudd2.id AS workingClientDocId, cudd2.document_file_name AS workingClientDocFileName, 
                                   da.id AS documentAttachmentId, da.name AS documentAttachmentName,
                                   da1.id AS pdfDocumentAttachmentId, da1.name AS pdfDocumentAttachmentName,
                                   da2.id AS workingDocumentAttachmentId, da2.name AS workingDocumentAttachmentName,
                                   p.email AS partnerEmail, p.name AS partnerName, p.uuid AS partnerUuid  
                                   FROM client_uploaded_document_master cudm
                                   JOIN client c ON c.id = cudm.client_id
                                   JOIN partner_client_mapping pcm ON pcm.client_id = c.id
                                   JOIN partner p ON p.id = pcm.partner_id
                                   LEFT JOIN document_category dc ON dc.id = cudm.document_category_id
                                   LEFT JOIN document d ON d.id = cudm.document_id
                                   JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                                   JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
                                   JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id  AND cudd.document_attachment_id = 1
                                   LEFT JOIN client_uploaded_document_detail cudd1 ON cudd1.client_uploaded_document_master_id = cudm.id 
                                   AND cudd1.document_attachment_id = 2
                                   LEFT JOIN client_uploaded_document_detail cudd2 ON cudd2.client_uploaded_document_master_id = cudm.id 
                                   AND cudd2.document_attachment_id = 3
                                   LEFT JOIN document_attachment da ON da.id = cudd.document_attachment_id
                                   LEFT JOIN document_attachment da1 ON da1.id = cudd1.document_attachment_id
                                   LEFT JOIN document_attachment da2 ON da2.id = cudd2.document_attachment_id
                                   WHERE cudm.document_category_id = (SELECT id FROM document_category WHERE name = 'Credit Note')  
                                   OR cudm.posting_date like '%${like}%' 
                                   OR UPPER(d.name) like '%${like}%'
                                   OR UPPER(cudm.narration) like '%${like}%'
                                   OR pld.code like '%${like}%'
                                   OR UPPER(pld.store_name) like '%${like}%'
                                   OR cudm.bill_no_or_ref_no  like '%${like}%'
                                   OR cudm.credit_amount like '%${like}%'
                                   OR cudm.debit_amount like '%${like}%'`

            if (partnerUuid && partnerUuid?.length > 0) {
                sql = sql + ` AND p.uuid = '${partnerUuid}'`
            }

            if (partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }

            if (action?.length > 0) {
                sql = sql + ` AND d.name = '${action}'`
            }
            //  
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





db.getDailyActivityLog = (date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id FROM daily_activity_log WHERE DATE(activity_date) = DATE(?);`
            pool.query(sql, [date], (error, result) => {
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

db.saveDailyActivityLog = (date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO daily_activity_log (activity_date) VALUES (?);`
            pool.query(sql, [date], (error, result) => {
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


db.getTotalCount = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, addField) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT DISTINCT COUNT(cudm.id) AS totalCount 
                       FROM client_uploaded_document_master cudm
                       LEFT JOIN document d ON d.id = cudm.document_id
                       WHERE cudm.document_category_id = (SELECT id FROM document_category WHERE name = '${action}') `

            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }

            if (addField?.length > 0) {
                sql = sql + ` AND d.name = '${addField}'`
            }

            //  
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

db.getInvoiceSummaries = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, maxId, uploadedOn, userTypeCode, dateType, loggedUserType) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT DISTINCT IF(cudd1.id IS NULL,0,1) AS isPdfExist, IF(cudd3.id IS NULL,0,1) AS isPtExist, cudm.id, 
            cudm.debit_amount AS debitAmount, cudm.credit_amount AS creditAmount, 
            cudm.posting_date AS postingDate, 
                        cudm.uploaded_on AS uploadedOn, cudm.bill_no_or_ref_no AS billNoOrRefNo,  
                        c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode, 
            c.email AS clientEmail, 
                        dc.id AS documentCategoryId, dc.code AS documentCategoryCode, dc.name AS documentCategoryName, 
                        d.id AS documentId, d.name AS documentName, 
                        pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName, pld.customer_type AS partnerLocationCustomerType, pld.store_location AS partnerLocationStoreLocation,  
                        cudd.id AS clientDocId, cudd.document_file_name AS clientDocFileName,  
                        cudd1.id AS pdfClientDocId, cudd1.document_file_name AS pdfClientDocFileName,
                        cudd3.id AS ptClientDocId, cudd3.document_file_name AS ptClientDocFileName,
                        da.id AS documentAttachmentId, da.name AS documentAttachmentName,
                        da1.id AS pdfDocumentAttachmentId, da1.name AS pdfDocumentAttachmentName,
                        da2.id AS ptDocumentAttachmentId, da2.name AS ptDocumentAttachmentName,
                        p.email AS partnerEmail, p.name AS partnerName, p.uuid AS partnerUuid    
            FROM 
                client_uploaded_document_master cudm
            JOIN 
                client c ON c.id = cudm.client_id 

                `
            if (loggedUserType == 'Partner-User') {
                sql = sql + ` 
                JOIN 
                    secondary_partner_location_detail spld ON spld.partner_location_detail_id = cudm.partner_location_detail_id
                JOIN 
                    secondary_partner sp ON sp.id = spld.secondary_partner_id
                JOIN 
                    partner p ON p.id = sp.partner_id 
                JOIN 
                    partner_location_detail pld ON pld.id = spld.partner_location_detail_id
                    
                    `
            }
            else {
                sql = sql + ` 
                            JOIN 
                                partner_client_mapping pcm ON pcm.client_id = c.id
                            JOIN 
                                partner p ON p.id = pcm.partner_id
                            JOIN 
                                partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                            JOIN 
                                partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
                                
                                `
            }
            sql = sql + `     
            JOIN 
                document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Invoice'
			LEFT JOIN 
				spsn_user_master sumt ON sumt.id = pld.spsn_user_id
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
            LEFT JOIN 
                document_attachment da ON da.id = cudd.document_attachment_id
            LEFT JOIN 
                document_attachment da1 ON da1.id = cudd1.document_attachment_id
            LEFT JOIN 
                document_attachment da2 ON da2.id = cudd3.document_attachment_id
            WHERE
                cudm.partner_location_detail_id IS NOT NULL    
        `

            if (userTypeCode != 'ADM') sql = sql + `  AND pld.is_active = 1`
            if (partnerUuid && partnerUuid?.length > 0) {
                // sql = sql + ` AND p.uuid = '${partnerUuid}'`
                if (loggedUserType == 'Partner-User') {
                    sql = sql + ` AND sp.uuid = '${partnerUuid}'`
                }
                else {
                    sql = sql + ` AND p.uuid = '${partnerUuid}'`
                }
            }

            if (partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

            sql = sql + ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Invoice')}`

            sql = sql + `  ORDER by cudm.posting_date DESC;`

            console.log(sql)

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

db.getFilePath = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, file_name AS fileName, failed_file_path AS failedFilePath, processed_file_path AS processedFilePath, local_file_path AS localFilePath, encryption_key, encryption_iv    
            FROM upload_doc_log_master 
            WHERE id = '${id}'`

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

db.getUploadedFilePath = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT cudd.id, cudd.document_file_name AS fileName, cudd.document_file_path AS filePath, cudd.encryption_key, cudd.encryption_iv, p.id AS partnerId, pld.id AS locationId, pld.code AS partnerCode, cudm.client_id AS clientId   
            FROM client_uploaded_document_detail cudd
            LEFT JOIN client_uploaded_document_master cudm ON cudm.id = cudd.client_uploaded_document_master_id
            LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id  
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id  
            WHERE FIND_IN_SET(cudd.id,'${id}') > 0`

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

db.getClientSftpMasterData = (clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT cfm.id, cfm.from_email AS fromEmail, cfm.from_name AS fromName, cfm.support_email AS supportEmail, cfm.support_team AS supportTeam, cfm.support_contact_no AS supportContactNo    
            FROM client_ftp_master cfm 
            WHERE cfm.client_id = '${clientId}'`

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

db.getMimeType = (name) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT mime   
            FROM mime_type 
            WHERE LOWER(name) = LOWER('${name}')`

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

db.updateUploadDocLogMaster = (sql, dates) => {
    return new Promise((resolve, reject) => {
        try {
            pool.query(sql, dates, (error, result) => {
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

db.saveWorkingFile = (documentFileName, documentFilePath, clientUploadedDocsMasterId, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_uploaded_document_detail (document_file_name, document_file_path, client_uploaded_document_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
            pool.query(sql, [uploadedOn], (error, result) => {
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

db.savePdfFile = (documentFileName, documentFilePath, clientUploadedDocsMasterId, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV, createdById = null) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_uploaded_document_detail (document_file_name, document_file_path, client_uploaded_document_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv, uploaded_by_id) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}', ?)`
            pool.query(sql, [uploadedOn, createdById], (error, result) => {
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

db.getClientsUuid = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT uuid
                                    FROM client
                                    WHERE is_doc_folder = 1 
                                    AND is_active = 1
                                    AND (linked_user_id IS NOT NULL OR linked_user_id != '')`
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


db.getClientUploadedDocsMasterId = (number) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT distinct cudm.id, IF(COUNT(cudd.id) > 0,1,0) AS isPdfExist   
                        FROM 
                            client_uploaded_document_master cudm
                        LEFT JOIN 
                            client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 2
                        WHERE 
                            cudm.bill_no_or_ref_no = '${number}'                        
						AND 
                            cudm.document_category_id = 2;`

            // console.log(sql)

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
db.getPendingPdfClientUploadedDocMaster = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT distinct cudm.id, cudm.document_number, cudm.posting_date, pld.code, cudm.bill_no_or_ref_no, IF(COUNT(cudd.id) > 0,1,0) AS isPdfExist   
                        FROM 
                            client_uploaded_document_master cudm
                        LEFT JOIN 
                            client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 2
                        LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                        WHERE
                            cudm.id = '${id}'                        
						;`

            // console.log(sql)

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

db.getClientUploadedDocsMasterIdForCreditNote = (number, partnerLocationCode, postingDate, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT distinct cudm.id, IF(COUNT(cudd.id) > 0,1,0) AS isPdfExist   
                        FROM 
                            client_uploaded_document_master cudm
                        LEFT JOIN 
                            client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 2
						LEFT JOIN 
							partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                        WHERE 
                            CONCAT(
        cudm.document_number, '-', 
        pld.code, '-', 
        DATE_FORMAT(CONVERT_TZ(cudm.posting_date, '+00:00', @@session.time_zone), '%Y-%m-%d')
    ) = '${fileName}'
                           `

            console.log(sql)

            //    cudm.document_number = '${number}'
            //    AND 
            //        cudm.document_category_id = 1
            //    AND 
            //        pld.code = '${partnerLocationCode}' 
            //    AND 
            //        DATE(cudm.posting_date) = DATE('${postingDate}')

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

db.getEncryptionData = (fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, encryption_key, encryption_iv
                                    FROM upload_doc_log_master
                                    WHERE UPPER(file_name) = '${fileName.toUpperCase()}'`
            console.log(sql)
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

db.getUploadedEncryptionData = (fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT encryption_key, encryption_iv
                                    FROM client_uploaded_document_detail
                                    WHERE document_file_name = '${fileName}'`
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

db.getMonthlyTransactionForPartnerLocation = (partnerLocationUuid, fromDate, clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT cudm.id, cudd.id AS detailId, cudd.document_file_path    
            FROM client_uploaded_document_master cudm
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
            LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            LEFT JOIN client c ON c.id = cudm.client_id
            WHERE pld.uuid = '${partnerLocationUuid}' 
            AND c.uuid = '${clientUuid}' 
            AND DATE(cudm.from_date) = DATE('${fromDate}') `
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

db.getInvoiceForPartnerLocation = (partnerLocationUuid, invoiceNumber, clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT cudm.id, cudd.id AS detailId, cudd.document_file_path    
            FROM client_uploaded_document_master cudm
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
            LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            LEFT JOIN client c ON c.id = cudm.client_id
            WHERE c.uuid = '${clientUuid}' 
            AND cudm.bill_no_or_ref_no = '${invoiceNumber}' 
            AND cudm.document_category_id = 2`

            // pld.uuid = '${partnerLocationUuid}' 
            // AND 
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


db.saveDataTransactLog = (activity, user, partnerUuid, locationUuid, fileSize, apiName, storageType, createdOn, clientUuid, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}',${partnerUuid ? `'${partnerUuid}'` : null},${locationUuid ? `'${locationUuid}'` : null},'${fileSize}','${apiName}','${storageType}',?, (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${fileName}')`
            pool.query(sql, [createdOn], (error, result) => {
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

db.updateDailyActivityLogDetail = (activityType, activityName, closingRemark, clientUuid, date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE daily_activity_detail 
                SET closing_remark = '${closingRemark}', end_on = ?
                WHERE id IN (
                    SELECT id FROM (
                        SELECT dad.id 
                        FROM daily_activity_detail AS dad 
                        JOIN daily_activity_log AS dal ON dad.daily_activity_detail_id = dal.id 
                        Left JOIN client AS c ON c.id = dad.client_id 
                        WHERE dad.activity_type = '${activityType}' 
                            AND dad.activity_name = '${activityName}'
                            AND c.uuid = '${clientUuid}'
                            AND DATE(dal.activity_date) = DATE(?)
                        ORDER BY dad.id DESC 
                        LIMIT 1
                    ) AS tmp
                );`
            pool.query(sql, [date, date], (error, result) => {
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

db.saveDailyActivityLogDetail = (activityType, activityName, openingRemark, clientUuid, date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO daily_activity_detail (activity_type, activity_name, opening_remark, started_on, daily_activity_detail_id, client_id) 
            VALUES ('${activityType}', '${activityName}', '${openingRemark}', ?, (SELECT id FROM daily_activity_log WHERE DATE(activity_date) = DATE(?)), (SELECT id FROM client WHERE uuid = '${clientUuid}' ));`
            pool.query(sql, [date, date], (error, result) => {
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

db.updateDailyActivityLogDetailByMasterId = (activityType, activityName, closingRemark, clientUuid, date, masterId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE daily_activity_detail 
                SET closing_remark = '${closingRemark}', end_on = ?
                WHERE id IN (
                    SELECT id FROM (
                        SELECT dad.id 
                        FROM daily_activity_detail AS dad 
                        JOIN daily_activity_log AS dal ON dad.daily_activity_detail_id = dal.id 
                        Left JOIN client AS c ON c.id = dad.client_id 
                        WHERE dad.activity_type = '${activityType}' 
                            AND dad.activity_name = '${activityName}'
                            AND c.uuid = '${clientUuid}'
                            AND dal.id = '${masterId}' 
                        ORDER BY dad.id DESC 
                        LIMIT 1
                    ) AS tmp
                );`
            pool.query(sql, [date, date], (error, result) => {
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



db.updatePdfBotLogLastActive = (lastActiveOn, botName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE pdf_bot_process_log SET last_active_on = ? 
            WHERE bot_name = '${botName}'; `
            pool.query(sql, [lastActiveOn], (error, result) => {
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

db.getLastDocumentUploadDate = (clientUuid, documentName, partnerUuid, partnerLocationUuid, action, userTypeCode, loggedUserType) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                                MAX(DATE_FORMAT(cudm.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn,
                                MAX(DATE_FORMAT(cudm.posting_date, '%Y-%m-%d %H:%i:%s')) AS postingDate
                                FROM 
                                    client_uploaded_document_master cudm
                                JOIN 
                                    client c ON c.id = cudm.client_id
                                JOIN 
                                    document_category dc ON dc.id = cudm.document_category_id AND dc.name = '${documentName}'
                                LEFT JOIN 
                                    document d ON d.id = cudm.document_id

                                    `

            if (loggedUserType == 'Partner-User') {
                sql = sql + `  JOIN 
                                            secondary_partner_location_detail spld ON spld.partner_location_detail_id = cudm.partner_location_detail_id
                                        JOIN 
                                            secondary_partner sp ON sp.id = spld.secondary_partner_id
                                        JOIN 
                                            partner p ON p.id = sp.partner_id
                                            
            JOIN 
                partner_location_detail pld ON pld.id = spld.partner_location_detail_id
                                    
                                            `
            }
            else {
                sql = sql + ` JOIN 
                                                partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                                            JOIN 
                                                partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
                                            JOIN 
                                                partner p ON p.id = psgm.partner_id
                                    
                                            `
            }

            sql = sql + `                                
                                WHERE
                                    cudm.partner_location_detail_id IS NOT NULL      
                                 `


            if (userTypeCode != 'ADM') sql = sql + `  AND pld.is_active = 1`

            if (clientUuid && clientUuid?.length > 0) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }
            if (partnerUuid && partnerUuid?.length > 0) {
                // sql = sql + ` AND p.uuid = '${partnerUuid}'`

                if (loggedUserType == 'Partner-User') {
                    sql = sql + ` AND sp.uuid = '${partnerUuid}'`
                }
                else {
                    sql = sql + ` AND p.uuid = '${partnerUuid}'`
                }
            }
            if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (action?.length > 0) {
                sql = sql + ` AND d.name = '${action}'`
            }

            if (documentName == 'Credit Note') {
                sql = sql + ` 
                                AND
                                ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2)`
            }

            console.log(sql)
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




db.getClientUploadedDocMaster = (partnerLocationDetailUuid, postingDate, documentCategoryId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT cudm.id, cudd.id AS detailId, cudd.document_file_name AS fileName, cudd.document_file_path AS filePath, cudd.encryption_key AS encryptionKey, cudd.encryption_iv AS encryptionIV 
            FROM client_uploaded_document_master cudm 
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id 
            LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id 
            WHERE  DATE_FORMAT(cudm.posting_date, '%b %y') = DATE_FORMAT('${postingDate}', '%b %y')
             AND pld.uuid = '${partnerLocationDetailUuid}'
              AND cudm.document_category_id = '${documentCategoryId}'`

            // console.log(sql)
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

db.getCreditNoteNo = (creditNoteNumber, partnerLocationCode, postingDate) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(cudm.id) > 0, 1, 0) AS isExist   
            FROM client_uploaded_document_master cudm 
            LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            WHERE cudm.bill_no_or_ref_no = '${creditNoteNumber}' 
            AND pld.code = '${partnerLocationCode}'  
            AND DATE(cudm.posting_date) = DATE('${postingDate}')
            AND cudm.document_category_id = (SELECT id FROM document_category WHERE name = 'Credit Note')`
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

db.getClientUploadedDocsMasterIdForCreditNoteWorking = (number, partnerLocationCode, postingDate) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT distinct cudm.id, IF(COUNT(cudd.id) > 0,1,0) AS isWorkingExist   
                        FROM 
                            client_uploaded_document_master cudm
                        LEFT JOIN 
                            client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 3
						LEFT JOIN 
							partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
                        WHERE 
                            cudm.bill_no_or_ref_no = '${number}'
                        AND 
                            cudm.document_category_id = 1
						AND 
							pld.code = '${partnerLocationCode}' 
                        AND                             
                            DATE(cudm.posting_date) = DATE('${postingDate}')`

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

function sqlFormation(fromDate, toDate, uploadedOn, dateType, documentCategoryName) {
    let sql = ` `
    if (dateType == 'posting') {
        if (documentCategoryName == 'Credit Note' || documentCategoryName == 'Invoice') {
            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.posting_date) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.posting_date) <= DATE('${toDate}')`
            }

            if ((!toDate || toDate?.toString()?.length == 0) && (!fromDate || fromDate?.toString()?.length == 0)) {
                sql = sql + ` AND DATE(cudm.posting_date) = DATE('${uploadedOn.postingDate}')`
            }
        }
        else if (documentCategoryName == 'Ledger') {
            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND MONTH(cudm.posting_date) >= MONTH('${fromDate}') AND YEAR(cudm.posting_date) = YEAR('${fromDate}')`;
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND MONTH(cudm.posting_date) <= MONTH('${toDate}') AND YEAR(cudm.posting_date) = YEAR('${toDate}')`;
            }

            if ((!toDate || toDate?.toString()?.length == 0) && (!fromDate || fromDate?.toString()?.length == 0)) {
                sql = sql + ` AND MONTH(cudm.posting_date) = MONTH('${uploadedOn.postingDate}') AND YEAR(cudm.posting_date) = YEAR('${uploadedOn.postingDate}')`;

            }

        }
        else if (documentCategoryName == 'Transaction') {
            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.from_date) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.to_date) <= DATE('${toDate}')`
            }

            if ((!toDate || toDate?.toString()?.length == 0) && (!fromDate || fromDate?.toString()?.length == 0)) {
                sql = sql + ` AND DATE(cudm.uploaded_on) = DATE('${uploadedOn.uploadedOn}')`
            }
        }
    }
    else if (dateType == 'uploaded') {
        if (documentCategoryName == 'Credit Note' || documentCategoryName == 'Invoice') {
            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }

            if ((!toDate || toDate?.toString()?.length == 0) && (!fromDate || fromDate?.toString()?.length == 0)) {
                sql = sql + ` AND DATE(cudm.uploaded_on) = DATE('${uploadedOn.uploadedOn}')`
            }
        }
        else if (documentCategoryName == 'Ledger') {
            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND MONTH(cudm.uploaded_on) >= MONTH('${fromDate}') AND YEAR(cudm.uploaded_on) = YEAR('${fromDate}')`;

            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND MONTH(cudm.uploaded_on) <= MONTH('${toDate}') AND YEAR(cudm.uploaded_on) = YEAR('${toDate}')`;
            }

            if ((!toDate || toDate?.toString()?.length == 0) && (!fromDate || fromDate?.toString()?.length == 0)) {
                sql = sql + ` AND MONTH(cudm.uploaded_on) = MONTH('${uploadedOn.uploadedOn}') AND YEAR(cudm.uploaded_on) = YEAR('${uploadedOn.uploadedOn}')`;
            }
        }
        else if (documentCategoryName == 'Transaction') {
            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(cudm.uploaded_on) <= DATE('${toDate}')`
            }

            if ((!toDate || toDate?.toString()?.length == 0) && (!fromDate || fromDate?.toString()?.length == 0)) {
                sql = sql + ` AND DATE(cudm.uploaded_on) = DATE('${uploadedOn.uploadedOn}')`
            }
        }
    }
    return sql;
}

db.validatePostingLocationExists = async (billToData) =>{
    try{
        let sql = 'SELECT code FROM partner_location_detail WHERE code IN (?)';
        // console.log("billToData",billToData)
        let result = await pool.promise().query(sql, [billToData]); 
        // console.log("result",result)
        const foundCodes = result[0].map(row => row.code);
        // console.log("foundCodes",foundCodes)
        const missingCodes = billToData.filter(code => !foundCodes.includes(code));
        // console.log("missingCodes",missingCodes)
        return missingCodes;
    } catch(error) {
        throw new Error(error.stack);
    }
}
db.validateCreditNoteEntryExists = async (docNumber,billToCode,postingDate,clientUploadedDocMasterId) =>{
    let sql = `SELECT cudm.id FROM client_uploaded_document_master cudm 
    LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
    LEFT JOIN document_attachment da ON da.id != cudd.document_attachment_id
    LEFT JOIN document_category dc ON dc.id = cudm.document_category_id 
    LEFT JOIN document d ON d.id = cudm.document_id 
    LEFT JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
    WHERE dc.name = 'Credit Note' 
    AND d.code != 'AB'
    AND d.code != 'OTH'
    AND cudm.bill_no_or_ref_no = ?
    AND pld.code = ?
    AND DATE(cudm.posting_date) = DATE(?)
    AND cudm.id != ?`;
    let result = await pool.promise().query(sql, [docNumber, billToCode, postingDate, clientUploadedDocMasterId]); 
    return result[0].length > 0;
}
db.getCreditNoteNumberById = async (clientUploadedDocsMasterId) =>{
    let sql = `SELECT cudm.bill_no_or_ref_no as creditNoteNumber , cudm.document_category_id as documentCategoryId , cudm.posting_date as postingDate , pld.code as partnerLocationCode , 
    IF(COUNT(cudd.id) > 0,1,0) AS isWorkingExist 
     FROM client_uploaded_document_master cudm
     LEFT JOIN partner_location_detail pld 
     ON pld.id = cudm.partner_location_detail_id
     LEFT JOIN client_uploaded_document_detail cudd 
     ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 3   
     WHERE cudm.id = ?
     AND cudm.document_category_id = 1`;
    let result = await pool.promise().query(sql, [clientUploadedDocsMasterId]); 
    return result[0];
}
db.checkFileNameExistsOnUploadedDocLogMaster = async (fileName) => {
    let sql = `SELECT COUNT(*) FROM upload_doc_log_master WHERE file_name = ?`;
    let result = await pool.promise().query(sql, [fileName]); 
    return result[0][0].count > 0;
}
db.insertUploadedDocLogMaster = async (clientUuid, fileName, file_path, documentAttachmentId, documentCategoryId, encryptionKey, encryptionIV) => {
        try {
            let sql = `INSERT INTO upload_doc_log_master (
            client_id, 
            file_name, 
            status, 
            document_attachment_id , 
            document_category_id, 
            processed_file_path, 
            started_on,
            completed_on,
            encryption_key, 
            encryption_iv) VALUES ((SELECT id FROM client WHERE uuid = ?), ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`;
            let result = await pool.promise().query(sql, [clientUuid, fileName,'Completed', documentAttachmentId, documentCategoryId,file_path, encryptionKey, encryptionIV]);
            return result[0].insertId > 0;
        } catch (error) {
            throw error;
        }

    }
module.exports = db
