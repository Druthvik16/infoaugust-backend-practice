let pool = require('../databaseConnection/createconnection')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let db = {}

db.getDocuments = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT vd.id, vd.name, vd.code
            FROM vendor_document_type vd
            WHERE vd.is_active = 1`
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
            let sql = `SELECT vdc.id, vdc.name, vdc.code 
            FROM vendor_document_category vdc
            WHERE vdc.is_active = 1`
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
            let sql = `SELECT vda.id, vda.name
            FROM vendor_document_attachment vda;`
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

db.getDocumentAttachmentId = (name) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT vda.id
            FROM vendor_document_attachment vda 
            WHERE vda.name = '${name}'`
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
            let sql = `SELECT cuvdm.posting_date AS postingDate, pai.sap_code AS partnerLocationCode  
            FROM client_uploaded_document_master cuvdm
            LEFT JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
            WHERE cuvdm.document_category_id = (SELECT id FROM vendor_document_category WHERE name = 'Ledger') `
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
            let sql = `SELECT cuvdm.id,CONCAT(cuvdm.bill_no_or_ref_no, '-', pai.sap_code) AS creditNoteNumber,
            GROUP_CONCAT(DISTINCT cuvdd.document_attachment_id ORDER BY cuvdd.document_attachment_id ASC) AS attach  
                FROM client_uploaded_vendor_doc_master cuvdm 
                LEFT JOIN client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id
                LEFT JOIN vendor_document_attachment vda ON vda.id != cuvdd.document_attachment_id
                LEFT JOIN vendor_document_category vdc ON vdc.id = cuvdm.document_category_id 
                LEFT JOIN vendor_document_type vdt ON vdt.id = cuvdm.document_id 
                LEFT JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
                WHERE vdc.name = 'Credit Note' 
                AND ((abs(cuvdm.credit_amount) + abs(cuvdm.debit_amount)) > 2)  
                GROUP BY cuvdm.id 
                having (attach IS NULL OR FIND_IN_SET('${documentAttachmentId}',attach) = 0)
                ORDER BY cuvdm.id, cuvdd.id `
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

db.getForm16NumberForPdf = (documentAttachmentId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cuvdm.id,CONCAT(pai.sap_code, '-', cuvdm.period,'-',cuvdm.financial_year) AS form16Number,
            GROUP_CONCAT(DISTINCT cuvdd.document_attachment_id ORDER BY cuvdd.document_attachment_id ASC) AS attach  
                FROM client_uploaded_vendor_doc_master cuvdm 
                LEFT JOIN client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id
                LEFT JOIN vendor_document_attachment vda ON vda.id != cuvdd.document_attachment_id
                LEFT JOIN vendor_document_category vdc ON vdc.id = cuvdm.document_category_id 
                LEFT JOIN vendor_document_type vdt ON vdt.id = cuvdm.document_id 
                LEFT JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
                WHERE vdc.name = 'Form16A' 
                GROUP BY cuvdm.id 
                having (attach IS NULL OR FIND_IN_SET('${documentAttachmentId}',attach) = 0)
                ORDER BY cuvdm.id, cuvdd.id `
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
            let sql = `SELECT CONCAT(cuvdm.bill_no_or_ref_no,'-',pai.sap_code) AS documentNumber   
            FROM client_uploaded_document_master cuvdm 
            LEFT JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
            WHERE cuvdm.document_category_id = (SELECT id FROM vendor_document_category WHERE name = 'Credit Note')  `
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

db.getClientDocsBillOrRefNoForInvoiceSummary = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cuvdm.bill_no_or_ref_no AS billNoOrRefNo  
            FROM client_uploaded_document_master cuvdm 
            WHERE cuvdm.document_category_id = (SELECT id FROM vendor_document_category WHERE name = 'Invoice') `
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

db.saveClientUploadedDocMaster = (documentDate, invoiceNumber, documentCategoryId, documentId, vendorUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, uploadedOn, openingBalance, closingBalance, period, financialYear) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO client_uploaded_vendor_doc_master (document_date, invoice_number, document_category_id, document_id, partner_id, client_id, narration, month_period, posting_date, debit_amount, credit_amount, bill_no_or_ref_no, uploaded_on, opening_balance, closing_balance, period, financial_year) VALUES ('${documentDate}', '${invoiceNumber}', '${documentCategoryId}', '${documentId}', (SELECT id FROM partner WHERE uuid = '${vendorUuid}'), (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${uniqueFunction.manageSpecialCharacter(narration)}', '${monthPeriod}', '${postingDate}', '${debitAmount}', '${creditAmount}', '${billNoOrRefNo}', ?, '${openingBalance}', '${closingBalance}', ?, ?)`

            //  
            pool.query(sql, [uploadedOn, period, financialYear] ,(error, result) => 
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


db.saveClientUploadedDocMasterPAM = (documentCategoryId, documentId, vendorUuid, clientUuid, narration, billNoOrRefNo, uploadedOn, paidDate, totalAmount) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO client_uploaded_vendor_doc_master (document_category_id, document_id, partner_id, client_id, narration, paid_date, total_amount_paid, bill_no_or_ref_no, uploaded_on) VALUES ('${documentCategoryId}', '${documentId}', (SELECT id FROM partner WHERE uuid = '${vendorUuid}'), (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${uniqueFunction.manageSpecialCharacter(narration)}', '${paidDate}', '${totalAmount}', '${billNoOrRefNo}', ?)`

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
            let sql = `INSERT INTO client_uploaded_vendor_doc_detail (document_file_name, document_file_path, client_uploaded_vendor_doc_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
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

db.saveClientUploadedDocDetailPAM = (documentFileName, documentFilePath, clientUploadedDocsMasterId, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO client_uploaded_vendor_doc_detail (document_file_name, document_file_path, client_uploaded_vendor_doc_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
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

db.saveVendorUploadedDocMaster = (documentDate, invoiceNumber, documentCategoryId, documentId, vendorUuid, clientUuid, narration, monthPeriod, postingDate, debitAmount, creditAmount, billNoOrRefNo, uploadedOn, openingBalance, closingBalance, period, financialYear) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO vendor_uploaded_client_doc_master (document_date, invoice_number, document_category_id, document_id, partner_id, client_id, narration, month_period, posting_date, debit_amount, credit_amount, bill_no_or_ref_no, uploaded_on, opening_balance, closing_balance, period, financial_year) VALUES ('${documentDate}', '${invoiceNumber}', '${documentCategoryId}', '${documentId}', (SELECT id FROM partner WHERE uuid = '${vendorUuid}'), (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${uniqueFunction.manageSpecialCharacter(narration)}', '${monthPeriod}', '${postingDate}', '${debitAmount}', '${creditAmount}', '${billNoOrRefNo}', ?, '${openingBalance}', '${closingBalance}', ?, ?)`

            //  
            pool.query(sql, [uploadedOn, period, financialYear] ,(error, result) => 
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
    
db.saveVendorUploadedDocDetail = (documentFileName, documentFilePath, clientUploadedDocsMasterId, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO vendor_uploaded_client_doc_detail (document_file_name, document_file_path, vendor_uploaded_client_doc_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
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

db.getClientVendorLedgers = (partnerUuid, clientUuid, fromDate, toDate, uploadedOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `SELECT DISTINCT cuvdm.id, cuvdm.opening_balance AS openingBalance, (IFNULL(cuvdm.opening_balance,0)+IFNULL(cuvdm.closing_balance,0)) AS closingBalance, cuvdm.posting_date AS postingDate, 
            cuvdm.uploaded_on AS uploadedOn, cuvdm.month_period AS monthPeriod, cuvdm.narration, IF(cuvdm.month_period > 1, concat(DATE_FORMAT(cuvdm.posting_date, '%b %y - '), 
            DATE_FORMAT(DATE_ADD(cuvdm.posting_date, INTERVAL cuvdm.month_period MONTH), '%b %y')),
            DATE_FORMAT(cuvdm.posting_date, '%b %y')) AS monthPeriodNarration, 
            c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode, 
            c.email AS clientEmail, 
            vdc.id AS documentCategoryId, vdc.code AS documentCategoryCode, vdc.name AS documentCategoryName, 
            vd.id AS documentId, vd.name AS documentName, 
            pai.sap_code AS vendorCode,
            cuvdd.id AS clientDocId, cuvdd.document_file_name AS clientDocFileName,  
            vda.id AS documentAttachmentId, vda.name AS documentAttachmentName,
            p.email AS vendorEmail, p.name AS vendorName, p.uuid AS vendorUuid  
            FROM client_uploaded_vendor_doc_master cuvdm
            JOIN client c ON c.id = cuvdm.client_id
            JOIN partner p ON p.id = cuvdm.partner_id
            JOIN vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.name = 'Ledger'
            LEFT JOIN vendor_document_type vd ON vd.id = cuvdm.document_id
            JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
            LEFT JOIN client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id
            LEFT JOIN vendor_document_attachment vda ON vda.id = cuvdd.document_attachment_id 
            WHERE
	        cuvdm.partner_id IS NOT NULL   
           `

            if(partnerUuid && partnerUuid?.length > 0)
            {
                sql = sql +  ` AND p.uuid = '${partnerUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) <= DATE('${toDate}')`
            }

            if(!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) = DATE('${uploadedOn}')`
            }
            
            sql = sql +  `   ORDER by cuvdm.posting_date DESC;`
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
db.getVendorLedgers = (partnerUuid, clientUuid, fromDate, toDate) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `SELECT DISTINCT cuvdm.id, cuvdm.opening_balance AS openingBalance, cuvdm.closing_balance AS closingBalance, cuvdm.posting_date AS postingDate, 
            cuvdm.uploaded_on AS uploadedOn, cuvdm.month_period AS monthPeriod, cuvdm.narration, IF(cuvdm.month_period > 1, concat(DATE_FORMAT(cuvdm.posting_date, '%b %y - '), 
            DATE_FORMAT(DATE_ADD(cuvdm.posting_date, INTERVAL cuvdm.month_period MONTH), '%b %y')),
            DATE_FORMAT(cuvdm.posting_date, '%b %y')) AS monthPeriodNarration, 
            c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode, 
            c.email AS clientEmail, 
            vdc.id AS documentCategoryId, vdc.code AS documentCategoryCode, vdc.name AS documentCategoryName, 
            vd.id AS documentId, vd.name AS documentName, 
            pai.sap_code AS vendorCode,
            cuvdd.id AS clientDocId, cuvdd.document_file_name AS clientDocFileName,  
            vda.id AS documentAttachmentId, vda.name AS documentAttachmentName,
            p.email AS vendorEmail, p.name AS vendorName, p.uuid AS vendorUuid  
            FROM vendor_uploaded_client_doc_master cuvdm
            JOIN client c ON c.id = cuvdm.client_id
            JOIN partner p ON p.id = cuvdm.partner_id
            JOIN vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.name = 'Ledger'
            LEFT JOIN vendor_document_type vd ON vd.id = cuvdm.document_id
            JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
            LEFT JOIN vendor_uploaded_client_doc_detail cuvdd ON cuvdd.vendor_uploaded_client_doc_master_id = cuvdm.id
            LEFT JOIN vendor_document_attachment vda ON vda.id = cuvdd.document_attachment_id 
            WHERE
	        cuvdm.partner_id IS NOT NULL   
           `

            if(partnerUuid && partnerUuid?.length > 0)
            {
                sql = sql +  ` AND p.uuid = '${partnerUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) <= DATE('${toDate}')`
            }
            
            sql = sql +  `   ORDER by cuvdm.posting_date DESC;`
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

db.getCreditNoteSummaries = (partnerUuid, clientUuid, fromDate, toDate, action, uploadedOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT 
            IF(cuvdd1.id IS NULL, 0, 1) AS isPdfExist,  
            cuvdm.id, 
            cuvdm.debit_amount AS debitAmount, 
            cuvdm.credit_amount AS creditAmount, 
            cuvdm.posting_date AS postingDate, 
            cuvdm.invoice_number AS invoiceNumber, 
            cuvdm.uploaded_on AS uploadedOn, 
            cuvdm.bill_no_or_ref_no AS billNoOrRefNo, 
            cuvdm.narration, 
            c.uuid AS clientUuid, 
            c.name AS clientName, 
            c.code AS clientCode, 
            c.email AS clientEmail, 
            vdc.id AS documentCategoryId, 
            vdc.code AS documentCategoryCode, 
            vdc.name AS documentCategoryName, 
            vd.id AS documentId, 
            vd.name AS documentName, 
            vd.code AS documentCode, 
            pai.sap_code AS vendorCode, 
            cuvdd.id AS clientDocId, 
            cuvdd.document_file_name AS clientDocFileName,  
            cuvdd1.id AS pdfClientDocId, 
            cuvdd1.document_file_name AS pdfClientDocFileName, 
            vda.id AS documentAttachmentId, 
            vda.name AS documentAttachmentName,
            vda1.id AS pdfDocumentAttachmentId, 
            vda1.name AS pdfDocumentAttachmentName,
            p.email AS vendorEmail, 
            p.name AS vendorName, 
            p.uuid AS vendorUuid  
        FROM 
            client_uploaded_vendor_doc_master cuvdm
        JOIN 
            client c ON c.id = cuvdm.client_id
        JOIN 
            partner p ON p.id = cuvdm.partner_id
        JOIN 
            partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
        JOIN 
            vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.name = 'Credit Note'
        LEFT JOIN 
            vendor_document_type vd ON vd.id = cuvdm.document_id
        LEFT JOIN 
            client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd.document_attachment_id = 1
        LEFT JOIN 
            client_uploaded_vendor_doc_detail cuvdd1 ON cuvdd1.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd1.document_attachment_id = 2
        LEFT JOIN 
            vendor_document_attachment vda ON vda.id = cuvdd.document_attachment_id
        LEFT JOIN 
            vendor_document_attachment vda1 ON vda1.id = cuvdd1.document_attachment_id
        WHERE
	        cuvdm.partner_id IS NOT NULL    
        AND   
        ((abs(cuvdm.credit_amount) + abs(cuvdm.debit_amount)) > 2)     
        `
            if(partnerUuid && partnerUuid?.length > 0 )
            {
                sql = sql +  ` AND p.uuid = '${partnerUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) <= DATE('${toDate}')`
            }

            if(!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) = DATE('${uploadedOn}')`
            }

            if(action?.length > 0)
            {
                sql = sql +  ` AND vd.name = '${action}'`
            }
            
            sql = sql +  ` ORDER by cuvdm.posting_date DESC;`
            //  
            
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

db.getBCLorNDC = (partnerUuid, clientUuid, fromDate, toDate, action, uploadedOn, documentCategoryId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT 
            IF(cuvdd1.id IS NULL, 'initiated', 'submitted') AS status,  
            cuvdm.id, 
            cuvdm.amount, 
            cuvdm.uploaded_on AS uploadedOn, 
            cuvdm.posting_date AS postingDate,  
            c.uuid AS clientUuid, 
            c.name AS clientName, 
            c.code AS clientCode, 
            c.email AS clientEmail, 
            vdc.id AS documentCategoryId, 
            vdc.code AS documentCategoryCode, 
            vdc.name AS documentCategoryName, 
            vd.id AS documentId, 
            vd.name AS documentName, 
            vd.code AS documentCode, 
            pai.sap_code AS vendorCode, 
            cuvdd.id AS clientDocId, 
            cuvdd.document_file_name AS clientDocFileName,  
            cuvdd1.id AS receivedClientDocId, 
            cuvdd1.document_file_name AS receivedClientDocFileName, 
            vda.id AS documentAttachmentId, 
            vda.name AS documentAttachmentName,
            vda1.id AS receivedDocumentAttachmentId, 
            vda1.name AS receivedDocumentAttachmentName,
            p.email AS vendorEmail, 
            p.name AS vendorName, 
            p.uuid AS vendorUuid  
        FROM 
            client_uploaded_vendor_doc_master cuvdm
        JOIN 
            client c ON c.id = cuvdm.client_id
        JOIN 
            partner p ON p.id = cuvdm.partner_id
        JOIN 
            partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
        JOIN 
            vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.id = ${documentCategoryId}
        LEFT JOIN 
            vendor_document_type vd ON vd.id = cuvdm.document_id
        LEFT JOIN 
            client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd.document_attachment_id = 1
        LEFT JOIN 
            client_uploaded_vendor_doc_detail cuvdd1 ON cuvdd1.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd1.document_attachment_id = 2
        LEFT JOIN 
            vendor_document_attachment vda ON vda.id = cuvdd.document_attachment_id
        LEFT JOIN 
            vendor_document_attachment vda1 ON vda1.id = cuvdd1.document_attachment_id
        WHERE
	        cuvdm.partner_id IS NOT NULL    
        `
            if(partnerUuid && partnerUuid?.length > 0 )
            {
                sql = sql +  ` AND p.uuid = '${partnerUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) <= DATE('${toDate}')`
            }

            if(!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) = DATE('${uploadedOn}')`
            }

            if(action?.length > 0)
            {
                sql = sql +  ` AND vd.name = '${action}'`
            }
            
            sql = sql +  ` ORDER by cuvdm.uploaded_on DESC;`
            //  
            
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

db.getPaymentAdvices = (partnerUuid, clientUuid, fromDate, toDate, action, uploadedOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT 
            cuvdm.id, 
            IF(cuvdd1.id IS NULL, 0, 1) AS isPdfExist,
            cuvdm.total_amount_paid AS totalAmountPaid, 
            cuvdm.paid_date AS paidDate,  
            cuvdm.uploaded_on AS uploadedOn, 
            cuvdm.bill_no_or_ref_no AS billNoOrRefNo, 
            cuvdm.narration, 
            c.uuid AS clientUuid, 
            c.name AS clientName, 
            c.code AS clientCode, 
            c.email AS clientEmail, 
            vdc.id AS documentCategoryId, 
            vdc.code AS documentCategoryCode, 
            vdc.name AS documentCategoryName, 
            vd.id AS documentId, 
            vd.name AS documentName, 
            vd.code AS documentCode, 
            pai.sap_code AS vendorCode, 
            cuvdd.id AS clientDocId, 
            cuvdd.document_file_name AS clientDocFileName,  
            cuvdd1.id AS pdfClientDocId, 
            cuvdd1.document_file_name AS pdfClientDocFileName, 
            vda.id AS documentAttachmentId, 
            vda.name AS documentAttachmentName,
            vda1.id AS pdfDocumentAttachmentId, 
            vda1.name AS pdfDocumentAttachmentName,
            p.email AS vendorEmail, 
            p.name AS vendorName, 
            p.uuid AS vendorUuid  
        FROM 
            client_uploaded_vendor_doc_master cuvdm
        JOIN 
            client c ON c.id = cuvdm.client_id
        JOIN 
            partner p ON p.id = cuvdm.partner_id
        JOIN 
            partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
        JOIN 
            vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.name = 'Payment Advice'
        LEFT JOIN 
            vendor_document_type vd ON vd.id = cuvdm.document_id
        LEFT JOIN 
            client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd.document_attachment_id = 1
        LEFT JOIN 
            client_uploaded_vendor_doc_detail cuvdd1 ON cuvdd1.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd1.document_attachment_id = 3
        LEFT JOIN 
            vendor_document_attachment vda ON vda.id = cuvdd.document_attachment_id
        LEFT JOIN 
            vendor_document_attachment vda1 ON vda1.id = cuvdd1.document_attachment_id
        WHERE
	        cuvdm.partner_id IS NOT NULL       
        `
            if(partnerUuid && partnerUuid?.length > 0 )
            {
                sql = sql +  ` AND p.uuid = '${partnerUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) <= DATE('${toDate}')`
            }

            if(!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) = DATE('${uploadedOn}')`
            }
            
            sql = sql +  ` ORDER by cuvdm.paid_date DESC;`
            //  
            
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

db.getVendorCreditNoteSummaries = (partnerUuid, clientUuid, fromDate, toDate, action, uploadedOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT 
            IF(cuvdd1.id IS NULL, 0, 1) AS isPdfExist,  
            cuvdm.id, 
            cuvdm.debit_amount AS debitAmount, 
            cuvdm.credit_amount AS creditAmount, 
            cuvdm.posting_date AS postingDate, 
            cuvdm.invoice_number AS invoiceNumber, 
            cuvdm.uploaded_on AS uploadedOn, 
            cuvdm.bill_no_or_ref_no AS billNoOrRefNo, 
            cuvdm.narration, 
            c.uuid AS clientUuid, 
            c.name AS clientName, 
            c.code AS clientCode, 
            c.email AS clientEmail, 
            vdc.id AS documentCategoryId, 
            vdc.code AS documentCategoryCode, 
            vdc.name AS documentCategoryName, 
            vd.id AS documentId, 
            vd.name AS documentName, 
            vd.code AS documentCode, 
            pai.sap_code AS vendorCode, 
            cuvdd.id AS clientDocId, 
            cuvdd.document_file_name AS clientDocFileName,  
            cuvdd1.id AS pdfClientDocId, 
            cuvdd1.document_file_name AS pdfClientDocFileName, 
            vda.id AS documentAttachmentId, 
            vda.name AS documentAttachmentName,
            vda1.id AS pdfDocumentAttachmentId, 
            vda1.name AS pdfDocumentAttachmentName,
            p.email AS vendorEmail, 
            p.name AS vendorName, 
            p.uuid AS vendorUuid  
        FROM 
            vendor_uploaded_client_doc_master cuvdm
        JOIN 
            client c ON c.id = cuvdm.client_id
        JOIN 
            partner p ON p.id = cuvdm.partner_id
        JOIN 
            partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
        JOIN 
            vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.name = 'Credit Note'
        LEFT JOIN 
            vendor_document_type vd ON vd.id = cuvdm.document_id
        LEFT JOIN 
            vendor_uploaded_client_doc_detail cuvdd ON cuvdd.vendor_uploaded_client_doc_master_id = cuvdm.id AND cuvdd.document_attachment_id = 1
        LEFT JOIN 
            vendor_uploaded_client_doc_detail cuvdd1 ON cuvdd1.vendor_uploaded_client_doc_master_id = cuvdm.id AND cuvdd1.document_attachment_id = 2
        LEFT JOIN 
            vendor_document_attachment vda ON vda.id = cuvdd.document_attachment_id
        LEFT JOIN 
            vendor_document_attachment vda1 ON vda1.id = cuvdd1.document_attachment_id
        WHERE
	        cuvdm.partner_id IS NOT NULL    
        AND   
        ((abs(cuvdm.credit_amount) + abs(cuvdm.debit_amount)) > 2)     
        `
            if(partnerUuid && partnerUuid?.length > 0 )
            {
                sql = sql +  ` AND p.uuid = '${partnerUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) <= DATE('${toDate}')`
            }

            if(!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) = DATE('${uploadedOn}')`
            }

            if(action?.length > 0)
            {
                sql = sql +  ` AND vd.name = '${action}'`
            }
            
            sql = sql +  ` ORDER by cuvdm.posting_date DESC;`
            //  
            
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

db.getForm16ASummaries = (partnerUuid, clientUuid, fromDate, toDate, uploadedOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT 
            IF(cuvdd1.id IS NULL, 0, 1) AS isPdfExist,  
            cuvdm.id, 
            cuvdm.period, 
            cuvdm.financial_year AS financialYear, 
            cuvdm.posting_date AS postingDate, 
            cuvdm.uploaded_on AS uploadedOn,  
            c.uuid AS clientUuid, 
            c.name AS clientName, 
            c.code AS clientCode, 
            c.email AS clientEmail, 
            vdc.id AS documentCategoryId, 
            vdc.code AS documentCategoryCode, 
            vdc.name AS documentCategoryName, 
            vd.id AS documentId, 
            vd.name AS documentName, 
            vd.code AS documentCode, 
            pai.sap_code AS vendorCode, 
            cuvdd.id AS clientDocId, 
            cuvdd.document_file_name AS clientDocFileName,  
            cuvdd1.id AS pdfClientDocId, 
            cuvdd1.document_file_name AS pdfClientDocFileName, 
            vda.id AS documentAttachmentId, 
            vda.name AS documentAttachmentName,
            vda1.id AS pdfDocumentAttachmentId, 
            vda1.name AS pdfDocumentAttachmentName,
            p.email AS vendorEmail, 
            p.name AS vendorName, 
            p.uuid AS vendorUuid  
        FROM 
            client_uploaded_vendor_doc_master cuvdm
        JOIN 
            client c ON c.id = cuvdm.client_id
        JOIN 
            partner p ON p.id = cuvdm.partner_id
        JOIN 
            partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
        JOIN 
            vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.name = 'Form16A'
        LEFT JOIN 
            vendor_document_type vd ON vd.id = cuvdm.document_id
        LEFT JOIN 
            client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd.document_attachment_id = 1
        LEFT JOIN 
            client_uploaded_vendor_doc_detail cuvdd1 ON cuvdd1.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd1.document_attachment_id = 2
        LEFT JOIN 
            vendor_document_attachment vda ON vda.id = cuvdd.document_attachment_id
        LEFT JOIN 
            vendor_document_attachment vda1 ON vda1.id = cuvdd1.document_attachment_id
        WHERE
	        cuvdm.partner_id IS NOT NULL        
        `
            if(partnerUuid && partnerUuid?.length > 0 )
            {
                sql = sql +  ` AND p.uuid = '${partnerUuid}'`
            }

            if(clientUuid)
            {
                sql = sql +  ` AND c.uuid = '${clientUuid}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) <= DATE('${toDate}')`
            }

            if(!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) = DATE('${uploadedOn}')`
            }
            
            sql = sql +  ` ORDER by cuvdm.uploaded_on DESC;`
            //  
            
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


db.getDailyActivityLog = (date) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                let sql = `SELECT id FROM vendor_daily_activity_log WHERE DATE(activity_date) = DATE(?);`
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
            let sql = `INSERT INTO vendor_daily_activity_log (activity_date) VALUES (?);`
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


db.getTotalCount = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, addField) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT DISTINCT COUNT(cuvdm.id) AS totalCount 
                       FROM client_uploaded_document_master cuvdm
                       LEFT JOIN vendor_document_type vd ON vd.id = cuvdm.document_id
                       WHERE cuvdm.document_category_id = (SELECT id FROM vendor_document_category WHERE name = '${action}') `

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(cuvdm.uploaded_on) <= DATE('${toDate}')`
            }

            if(addField?.length > 0)
            {
                sql = sql +  ` AND vd.name = '${addField}'`
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
            let sql = `SELECT id, file_name AS fileName, failed_file_path AS failedFilePath, processed_file_path AS processedFilePath, local_file_path AS localFilePath, encryption_key, encryption_iv    
            FROM client_vendor_upload_doc_log_master 
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
            let sql = `SELECT cuvdd.id, cuvdd.document_file_name AS fileName, cuvdd.document_file_path AS filePath, cuvdd.encryption_key, cuvdd.encryption_iv, p.id AS partnerId, p.name AS partnerName, pai.sap_code AS partnerCode, 
            CONCAT(TRIM(CONCAT(pai.address1, ' ',  IFNULL(pai.address2, ''))), ' - ', p.mobile) AS vendorFullAddress,
            cuvdm.client_id AS clientId,  cuvdm.total_amount_paid AS totalAmountPaid, 
            cuvdm.paid_date AS paidDate1,  DATE_FORMAT(cuvdm.paid_date, '%d-%m-%Y') AS paidDate,
            cuvdm.bill_no_or_ref_no AS billNoOrRefNo, 
            cuvdm.narration, clnt.name AS clientName, clnt.email AS clientEmail, 
            CONCAT(TRIM(CONCAT(clnt.address_line1, ' ',  IFNULL(clnt.address_line2, ''), ' ', IFNULL(clnt.address_line3, ''))), ' - ', clnt.mobile) AS clientFullAddress, 
            clnt.short_logo_file_path AS clientShortLogoPath  
            FROM client_uploaded_vendor_doc_detail cuvdd
            LEFT JOIN client_uploaded_vendor_doc_master cuvdm ON cuvdm.id = cuvdd.client_uploaded_vendor_doc_master_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
            LEFT JOIN partner p ON p.id = cuvdm.partner_id
            LEFT JOIN client clnt ON clnt.id = cuvdm.client_id
            WHERE FIND_IN_SET(cuvdd.id,'${id}') > 0`

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

db.getClientAndVendorData = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cuvdd.id, cuvdd.document_file_name AS fileName, cuvdd.document_file_path AS filePath, cuvdd.encryption_key, cuvdd.encryption_iv, p.id AS partnerId, pai.sap_code AS partnerCode, cuvdm.client_id AS clientId   
            FROM client_uploaded_vendor_doc_detail cuvdd
            LEFT JOIN client_uploaded_vendor_doc_master cuvdm ON cuvdm.id = cuvdd.client_uploaded_vendor_doc_master_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
            LEFT JOIN partner p ON p.id = cuvdm.partner_id
            WHERE FIND_IN_SET(cuvdd.id,'${id}') > 0`

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

db.getClientUploadedBCLorNDC = (id, action) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT p.id AS vendorId, p.name AS vendorName, pai.sap_code AS vendorCode, 
            CONCAT(TRIM(CONCAT(pai.address1, ' ',  IFNULL(pai.address2, ''))), ' - ', p.mobile) AS vendorFullAddress, cuvdm.posting_date AS postingDate, 
            cuvdm.client_id AS clientId,  cuvdm.amount, clnt.name AS clientName, clnt.email AS clientEmail, 
            CONCAT(TRIM(CONCAT(clnt.address_line1, ' ',  IFNULL(clnt.address_line2, ''), ' ', IFNULL(clnt.address_line3, ''))), ' - ', clnt.mobile) AS clientFullAddress, 
            clnt.short_logo_file_path AS clientShortLogoPath  
            FROM client_uploaded_vendor_doc_master cuvdm
            LEFT JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
            JOIN vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.code = '${action}'
            LEFT JOIN partner p ON p.id = cuvdm.partner_id
            LEFT JOIN client clnt ON clnt.id = cuvdm.client_id
            WHERE FIND_IN_SET(cuvdm.id,'${id}') > 0`

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

db.getVendorUploadedFilePath = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cuvdd.id, cuvdd.document_file_name AS fileName, cuvdd.document_file_path AS filePath, cuvdd.encryption_key, cuvdd.encryption_iv, p.id AS partnerId, pai.sap_code AS partnerCode, cuvdm.client_id AS clientId   
            FROM vendor_uploaded_client_doc_detail cuvdd
            LEFT JOIN vendor_uploaded_client_doc_master cuvdm ON cuvdm.id = cuvdd.vendor_uploaded_client_doc_master_id
                LEFT JOIN partner_additional_info pai ON pai.partner_id = cuvdm.partner_id
            LEFT JOIN partner p ON p.id = cuvdm.partner_id
            WHERE FIND_IN_SET(cuvdd.id,'${id}') > 0`

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


db.getClientSftpMasterData = (clientId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT cfm.id, cfm.from_email AS fromEmail, cfm.from_name AS fromName, cfm.support_email AS supportEmail, cfm.support_team AS supportTeam, cfm.support_contact_no AS supportContactNo    
            FROM client_ftp_master cfm 
            WHERE cfm.client_id = '${clientId}'`

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
            let sql = `INSERT INTO client_uploaded_document_detail (document_file_name, document_file_path, client_uploaded_vendor_doc_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
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
            let sql = `INSERT INTO client_uploaded_vendor_doc_detail (document_file_name, document_file_path, client_uploaded_vendor_doc_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
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

db.getPartner = (partnerUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT p.id, pai.doc_state AS docState, vs.name AS vendorStatusName, vs.id AS vendorStatusId, pai.is_submitted AS isSubmitted, pai.is_form_validated AS isFormValidated, c.id AS clientId, c.uuid AS clientUuid    
            FROM partner p 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id 
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.uuid = '${partnerUuid}'`
            // console.log(sql);
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

db.getVendor = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT p.id, p.uuid, pai.sap_code AS vendorCode, pai.doc_state AS docState, vs.name AS vendorStatusName, vs.id AS vendorStatusId, pai.is_submitted AS isSubmitted, pai.is_form_validated AS isFormValidated, c.id AS clientId, c.uuid AS clientUuid    
            FROM partner p 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id 
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.id = '${id}'`
            // console.log(sql);
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

db.saveCreditNotePdfFile = (documentFileName,documentFilePath,clientUploadedDocsMasterId,documentAttachmentId,uploadedOn,encriptionKey, encriptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO vendor_uploaded_client_doc_detail (document_file_name, document_file_path, vendor_uploaded_client_doc_master_id, document_attachment_id, uploaded_on,encryption_key,encryption_iv) VALUES ('${documentFileName}', '${documentFilePath}', '${clientUploadedDocsMasterId}', '${documentAttachmentId}', ?, '${encriptionKey}', '${encriptionIV}')`
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
            let sql = `SELECT distinct cuvdm.id, IF(COUNT(cuvdd.id) > 0,1,0) AS isPdfExist   
                        FROM 
                            client_uploaded_document_master cuvdm
                        LEFT JOIN 
                            client_uploaded_document_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id AND cuvdd.document_attachment_id = 2
                        WHERE 
                            cuvdm.bill_no_or_ref_no = '${number}'                        
						AND 
                            cuvdm.document_category_id = 2;`

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

db.getClientUploadedDocsMasterIdForCreditNote = (number, vendorCode) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT distinct cuvdm.id, IF(COUNT(cuvdd.id) > 0,1,0) AS isPdfExist   
                        FROM 
                            client_uploaded_vendor_doc_master cuvdm
                        LEFT JOIN 
                            client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id 
                            AND cuvdd.document_attachment_id = 2
						LEFT JOIN 
							partner p ON p.id = cuvdm.partner_id
						LEFT JOIN 
							partner_additional_info pai ON pai.partner_id = p.id
                        WHERE 
                            cuvdm.bill_no_or_ref_no = '${number}'
                        AND 
                            cuvdm.document_category_id = 1
						AND 
							pai.sap_code = '${vendorCode}'  `

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

db.getClientUploadedDocsMasterIdForForm16 = (vendorCode, period, financialYear) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT distinct cuvdm.id, IF(COUNT(cuvdd.id) > 0,1,0) AS isPdfExist   
                        FROM 
                            client_uploaded_vendor_doc_master cuvdm
                        LEFT JOIN 
                            client_uploaded_vendor_doc_detail cuvdd ON cuvdd.client_uploaded_vendor_doc_master_id = cuvdm.id 
                            AND cuvdd.document_attachment_id = 2
                        LEFT JOIN 
                            partner p ON p.id = cuvdm.partner_id
                        LEFT JOIN 
                            partner_additional_info pai ON pai.partner_id = p.id
                        WHERE 
                            cuvdm.period = '${period}'
                        AND 
                            cuvdm.document_category_id = 2
                        AND
                            cuvdm.financial_year = '${financialYear}'
                        AND 
                            pai.sap_code = '${vendorCode}'  `

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
                                    FROM client_vendor_upload_doc_log_master
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

db.updateDailyActivityLogDetail = (activityType, activityName, closingRemark, clientUuid, date) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                let sql = `UPDATE vendor_daily_activity_detail 
                SET closing_remark = '${closingRemark}', end_on = ?
                WHERE id IN (
                    SELECT id FROM (
                        SELECT dad.id 
                        FROM vendor_daily_activity_detail AS dad 
                        JOIN vendor_daily_activity_log AS dal ON dad.vendor_daily_activity_detail_id = dal.id 
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
            let sql = `INSERT INTO vendor_daily_activity_detail (activity_type, activity_name, opening_remark, started_on, vendor_daily_activity_detail_id, client_id) 
            VALUES ('${activityType}', '${activityName}', '${openingRemark}', ?, (SELECT id FROM vendor_daily_activity_log WHERE DATE(activity_date) = DATE(?)), (SELECT id FROM client WHERE uuid = '${clientUuid}' ));`
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

db.updateDailyActivityLogDetailByMasterId = (activityType, activityName, closingRemark, clientUuid, date, masterId) =>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                let sql = `UPDATE vendor_daily_activity_detail 
                SET closing_remark = '${closingRemark}', end_on = ?
                WHERE id IN (
                    SELECT id FROM (
                        SELECT dad.id 
                        FROM vendor_daily_activity_detail AS dad 
                        JOIN vendor_daily_activity_log AS dal ON dad.vendor_daily_activity_detail_id = dal.id 
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


db.updatePdfBotLogLastActive = (lastActiveOn, botName) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {
            let sql = `UPDATE vendor_pdf_bot_process_log SET last_active_on = ? 
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

db.getLastDocumentUploadDate = (clientUuid, documentName, partnerUuid, action) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                                MAX(DATE_FORMAT(cuvdm.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn 
                                FROM 
                                    client_uploaded_vendor_doc_master cuvdm
                                JOIN 
                                    client c ON c.id = cuvdm.client_id
                                JOIN 
                                    vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.name = '${documentName}'
                                LEFT JOIN 
                                    vendor_document_type vd ON vd.id = cuvdm.document_id
                                JOIN 
                                    partner p ON p.id = cuvdm.partner_id
                                WHERE
                                    cuvdm.partner_id IS NOT NULL    
                                
                    `

            if (clientUuid && clientUuid?.length > 0) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }
            if (partnerUuid && partnerUuid?.length > 0) {
                sql = sql + ` AND p.uuid = '${partnerUuid}'`
            }

            if(action?.length > 0)
            {
                sql = sql +  ` AND vd.name = '${action}'`
            }

            if(documentName == 'Credit Note')
            {
                sql = sql + ` 
                                AND
                                ((abs(cuvdm.credit_amount) + abs(cuvdm.debit_amount)) > 2)`
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

db.getVendorLastDocumentUploadDate = (clientUuid, documentName, partnerUuid, action) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                                MAX(DATE_FORMAT(cuvdm.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn 
                                FROM 
                                    vendor_uploaded_client_doc_master cuvdm
                                JOIN 
                                    client c ON c.id = cuvdm.client_id
                                JOIN 
                                    vendor_document_category vdc ON vdc.id = cuvdm.document_category_id AND vdc.name = '${documentName}'
                                LEFT JOIN 
                                    vendor_document_type vd ON vd.id = cuvdm.document_id
                                JOIN 
                                    partner p ON p.id = cuvdm.partner_id
                                WHERE
                                    cuvdm.partner_id IS NOT NULL    
                                
                    `

            if (clientUuid && clientUuid?.length > 0) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }
            if (partnerUuid && partnerUuid?.length > 0) {
                sql = sql + ` AND p.uuid = '${partnerUuid}'`
            }

            if(action?.length > 0)
            {
                sql = sql +  ` AND vd.name = '${action}'`
            }

            if(documentName == 'Credit Note')
            {
                sql = sql + ` 
                                AND
                                ((abs(cuvdm.credit_amount) + abs(cuvdm.debit_amount)) > 2)`
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

db.getVendors = (clientUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `
            SELECT p.id, p.name, pai.sap_code AS code, p.uuid, p.email
            FROM partner p
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            WHERE pc.code = 'V' 
            AND pcm.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}')`
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



db.getClient = (clientUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, email, name FROM client WHERE uuid = '${clientUuid}'`
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
    
db.saveBalanceConfirmationAndNoDueLog = (initiationDate, documentCategoryId, vendorId, createdOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO balance_confirmation_and_no_due_log (initiation_date, document_category_id, vendor_id,created_on) VALUES ('${initiationDate}', '${documentCategoryId}', '${vendorId}', ?)`
            pool.query(sql, [createdOn] ,(error, result) => 
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


db.saveClientUploadedDocMasterBDLNDC = (documentCategoryId, documentId, vendorId, clientId, uploadedOn, amount, postingDate) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `INSERT INTO client_uploaded_vendor_doc_master (document_category_id, document_id, partner_id, client_id, amount, uploaded_on, posting_date) VALUES ('${documentCategoryId}', '${documentId}', '${vendorId}', '${clientId}', '${amount}', ?, '${postingDate}')`

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




module.exports = db







