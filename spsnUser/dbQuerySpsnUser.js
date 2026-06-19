let pool = require('../databaseConnection/createconnection')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
const fs = require('fs');
const { id } = require('date-fns/locale');
let db = {}

db.getPartnerLocationDatas = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, code, uuid, store_location
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


db.getPartnerLocationCodes = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT code 
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

db.getSpsnDatas = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, code, uuid, name, email, mobile, spsn_code 
                FROM spsn_user_master 
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

db.getExtendedUser = (uuid) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT * FROM spsn_extended_user WHERE uuid = ?
        `
        pool.query(sql, [uuid], (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}

db.getSpsnData = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT spsn_code AS code, id, name
                FROM spsn_user_master 
                WHERE is_active = 1
                And uuid = '${uuid}'`

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
            let sql = `SELECT cudm.posting_date AS postingDate, pld.code AS partnerLocationCode  
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

db.getCreditNoteNumberForWorkingFile = (documentAttachmentId) => {
    return new Promise((resolve, reject) => {
        try {
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

db.getPartnerLedgers = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, maxId, spsnUuid, uploadedOn, userTypeCode, dateType, selectedSpsnUuid) => {
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
            JOIN client c ON c.id = cudm.client_id
            JOIN partner_client_mapping pcm ON pcm.client_id = c.id
            JOIN partner p ON p.id = pcm.partner_id
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Ledger'
            LEFT JOIN document d ON d.id = cudm.document_id
            JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
            JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
            LEFT JOIN document_attachment da ON da.id = cudd.document_attachment_id 
			JOIN 
                spsn_user_master sumt ON sumt.id = pld.spsn_user_id
            WHERE
	        cudm.partner_location_detail_id IS NOT NULL   
			
           `

           
			// AND 
            // sumt.uuid = '${spsnUuid}'

            if(spsnUuid && spsnUuid?.length > 0)
                {
                    sql = sql + ` AND sumt.uuid = '${spsnUuid}'`
                }

        if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

            if (partnerUuid && partnerUuid?.length > 0) {
                sql = sql + ` AND p.uuid = '${partnerUuid}'`
            }

            if (partnerLocationUuid?.length > 0) {
                sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
            }

            if (clientUuid) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }
           

            sql = sql + ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Ledger')}`

            sql = sql + `   ORDER by cudm.posting_date DESC;`

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

// db.getPartnerMonthlyTransactions = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, maxId, spsnUuid, uploadedOn, userTypeCode, dateType) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT DISTINCT cudm.id, cudm.from_date AS fromDate, cudm.to_date AS toDate,  
//             cudm.uploaded_on  AS uploaded_on,  DATE_FORMAT(cudm.from_date, '%b %y') AS monthPeriodNarration,
//             c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode, 
//             c.email AS clientEmail, 
//             dc.id AS documentCategoryId, dc.code AS documentCategoryCode, dc.name AS documentCategoryName, 
//             d.id AS documentId, d.name AS documentName, 
//             pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName,
//             pld.customer_type AS partnerLocationCustomerType, 
//             pld.store_location AS partnerLocationStoreLocation,
//             cudd.id AS clientDocId, cudd.document_file_name AS clientDocFileName,  
//             da.id AS documentAttachmentId, da.name AS documentAttachmentName,
//             p.email AS partnerEmail, p.name AS partnerName, p.uuid AS partnerUuid  
//             FROM client_uploaded_document_master cudm
//             JOIN client c ON c.id = cudm.client_id
//             JOIN partner_client_mapping pcm ON pcm.client_id = c.id
//             JOIN partner p ON p.id = pcm.partner_id
//             JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Transaction'
//             LEFT JOIN document d ON d.id = cudm.document_id
//             JOIN partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
//             JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
//             LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id
//             LEFT JOIN document_attachment da ON da.id = cudd.document_attachment_id 
//             JOIN 
//                 spsn_user_master sumt ON sumt.id = pld.spsn_user_id
//             WHERE
// 	        cudm.partner_location_detail_id IS NOT NULL     
//             `


//                 if(spsnUuid && spsnUuid?.length > 0)
//                     {
//                         sql = sql + ` AND sumt.uuid = '${spsnUuid}'`
//                     }

//         if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

//             if (partnerUuid && partnerUuid?.length > 0) {
//                 sql = sql + ` AND p.uuid = '${partnerUuid}'`
//             }

//             if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
//                 sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
//             }

//             if (clientUuid) {
//                 sql = sql + ` AND c.uuid = '${clientUuid}'`
//             }

//             sql = sql + ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Transaction')}`

//             sql = sql + `  ORDER by cudm.from_date DESC;`

//             // console.log(sql)

//             pool.query(sql, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         }
//         catch (e) {
//             throw e
//         }
//     })
// }

db.getPartnerMonthlyTransactions = (
    partnerUuid,
    partnerLocationUuid,
    clientUuid,
    fromDate,
    toDate,
    maxId,
    spsnUuid,
    uploadedOn,
    userTypeCode,
    dateType,
    userDesignation = null,
    selectedSpsnUuid = null
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT DISTINCT
                cudm.id,
                cudm.from_date AS fromDate,
                cudm.to_date AS toDate,
                cudm.uploaded_on AS uploaded_on,
                DATE_FORMAT(cudm.from_date, '%b %y') AS monthPeriodNarration,
                c.uuid AS clientUuid,
                c.name AS clientName,
                c.code AS clientCode,
                c.email AS clientEmail,
                dc.id AS documentCategoryId,
                dc.code AS documentCategoryCode,
                dc.name AS documentCategoryName,
                d.id AS documentId,
                d.name AS documentName,
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
            FROM client_uploaded_document_master cudm
            JOIN client c 
                ON c.id = cudm.client_id
            JOIN partner_client_mapping pcm 
                ON pcm.client_id = c.id
            JOIN partner p 
                ON p.id = pcm.partner_id
            JOIN document_category dc 
                ON dc.id = cudm.document_category_id
                AND dc.name = 'Transaction'
            LEFT JOIN document d 
                ON d.id = cudm.document_id
            JOIN partner_location_detail pld 
                ON pld.id = cudm.partner_location_detail_id
            JOIN partner_statewise_gst_master psgm 
                ON psgm.id = pld.partner_statewise_gst_master_id
                AND psgm.partner_id = p.id
            LEFT JOIN client_uploaded_document_detail cudd 
                ON cudd.client_uploaded_document_master_id = cudm.id
            LEFT JOIN document_attachment da 
                ON da.id = cudd.document_attachment_id
            `;

            /* ---------- ASM / RSM / NSM FLOW ---------- */
            if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                sql += `
                INNER JOIN spsn_extended_user_partner_location_map euplm
                    ON euplm.partner_location_id = pld.id
                    AND euplm.is_active = 1
                    AND euplm.designation_code = '${userDesignation}'
                INNER JOIN spsn_extended_user seu
                    ON seu.id = euplm.extended_user_id
                    AND seu.uuid = '${spsnUuid}'
                LEFT JOIN spsn_user_master sumss ON sumss.id = pld.spsn_user_id
                `;

            }
            /* ---------- EXISTING SPSN FLOW ---------- */
            else {

                sql += `
                JOIN spsn_user_master sumt
                    ON sumt.id = pld.spsn_user_id
                `;

            }

            /* ---------- COMMON WHERE ---------- */
            sql += `
            WHERE
                cudm.partner_location_detail_id IS NOT NULL
            `;

            if (!['ASM', 'RSM', 'NSM'].includes(userDesignation) && spsnUuid?.length > 0) {
                sql += ` AND sumt.uuid = '${spsnUuid}'`;
            }

            

             if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                if(selectedSpsnUuid && selectedSpsnUuid?.length > 1)
                    sql += ` AND sumss.uuid = '${selectedSpsnUuid}'`;

            }

            if (userTypeCode !== 'ADM') {
                sql += ` AND pld.is_active = 1`;
            }

            if (partnerUuid?.length > 0) {
                sql += ` AND p.uuid = '${partnerUuid}'`;
            }

            if (partnerLocationUuid?.length > 0) {
                sql += ` AND pld.uuid = '${partnerLocationUuid}'`;
            }

            if (clientUuid) {
                sql += ` AND c.uuid = '${clientUuid}'`;
            }

            sql += ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Transaction')}`;

            sql += ` ORDER BY cudm.from_date DESC`;

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};


// db.getCreditNoteSummaries = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, action, maxId, spsnUuid, uploadedOn, userTypeCode, dateType) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT 
//             IF(cudd1.id IS NULL, 0, 1) AS isPdfExist, 
//             IF(cudd2.id IS NULL, 0, 1) AS isWorkingExist, 
//             cudm.id, 
//             cudm.debit_amount AS debitAmount, 
//             cudm.credit_amount AS creditAmount, 
//             cudm.posting_date AS postingDate, 
//             cudm.document_number AS documentNumber, 
//             cudm.uploaded_on AS uploadedOn, 
//             cudm.bill_no_or_ref_no AS billNoOrRefNo, 
//             cudm.narration, 
//             c.uuid AS clientUuid, 
//             c.name AS clientName, 
//             c.code AS clientCode, 
//             c.email AS clientEmail, 
//             dc.id AS documentCategoryId, 
//             dc.code AS documentCategoryCode, 
//             dc.name AS documentCategoryName, 
//             d.id AS documentId, 
//             d.name AS documentName, 
//             d.code AS documentCode,
//             pld.uuid AS partnerLocationUuid, 
//             pld.code AS partnerLocationCode, 
//             pld.store_name AS partnerLocationStoreName,
//             pld.customer_type AS partnerLocationCustomerType, 
//             pld.store_location AS partnerLocationStoreLocation,
//             cudd.id AS clientDocId, 
//             cudd.document_file_name AS clientDocFileName,  
//             cudd1.id AS pdfClientDocId, 
//             cudd1.document_file_name AS pdfClientDocFileName, 
//             cudd2.id AS workingClientDocId, 
//             cudd2.document_file_name AS workingClientDocFileName, 
//             da.id AS documentAttachmentId, 
//             da.name AS documentAttachmentName,
//             da1.id AS pdfDocumentAttachmentId, 
//             da1.name AS pdfDocumentAttachmentName,
//             da2.id AS workingDocumentAttachmentId, 
//             da2.name AS workingDocumentAttachmentName,
//             p.email AS partnerEmail, 
//             p.name AS partnerName, 
//             p.uuid AS partnerUuid  
//         FROM 
//             client_uploaded_document_master cudm
//         JOIN 
//             client c ON c.id = cudm.client_id
//         JOIN 
//             partner_client_mapping pcm ON pcm.client_id = c.id
//         JOIN 
//             partner p ON p.id = pcm.partner_id
//         JOIN 
//             partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
//         JOIN 
//             partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
//         JOIN 
//             document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Credit Note'
//         LEFT JOIN 
//             document d ON d.id = cudm.document_id
//         LEFT JOIN 
//             client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 1
//         LEFT JOIN 
//             client_uploaded_document_detail cudd1 ON cudd1.client_uploaded_document_master_id = cudm.id AND cudd1.document_attachment_id = 2
//         LEFT JOIN 
//             client_uploaded_document_detail cudd2 ON cudd2.client_uploaded_document_master_id = cudm.id AND cudd2.document_attachment_id = 3
//         LEFT JOIN 
//             document_attachment da ON da.id = cudd.document_attachment_id
//         LEFT JOIN 
//             document_attachment da1 ON da1.id = cudd1.document_attachment_id
//         LEFT JOIN 
//             document_attachment da2 ON da2.id = cudd2.document_attachment_id  
// 		JOIN 
//             spsn_user_master sumt ON sumt.id = pld.spsn_user_id
//         WHERE
// 	        cudm.partner_location_detail_id IS NOT NULL    
//         AND   
//         ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2) 
//         `

// 		// AND 
//             // sumt.uuid = '${spsnUuid}' 
//         if(spsnUuid && spsnUuid?.length > 0)
//         {
//             sql = sql + ` AND sumt.uuid = '${spsnUuid}'`
//         }

//         if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`
//             if (partnerUuid && partnerUuid?.length > 0) {
//                 sql = sql + ` AND p.uuid = '${partnerUuid}'`
//             }

//             if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
//                 sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
//             }

//             if (clientUuid) {
//                 sql = sql + ` AND c.uuid = '${clientUuid}'`
//             }          

//             sql = sql + ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Credit Note')}`

//             if (action && action?.length > 0) {
//                 sql = sql + ` AND d.name = '${action}'`
//             }

//             sql = sql + ` ORDER by cudm.posting_date DESC;`


//             // (cudm.credit_amount != 0 OR cudm.debit_amount != 0)  
//             // console.log(sql)

//             pool.query(sql, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         }
//         catch (e) {
//             throw e
//         }
//     })
// }

db.getCreditNoteSummaries = (
    partnerUuid,
    partnerLocationUuid,
    clientUuid,
    fromDate,
    toDate,
    action,
    maxId,
    spsnUuid,
    uploadedOn,
    userTypeCode,
    dateType,
    userDesignation = null,
    selectedSpsnUuid = null
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT 
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
            FROM client_uploaded_document_master cudm
            JOIN client c 
                ON c.id = cudm.client_id
            JOIN partner_client_mapping pcm 
                ON pcm.client_id = c.id
            JOIN partner p 
                ON p.id = pcm.partner_id
            JOIN partner_location_detail pld 
                ON pld.id = cudm.partner_location_detail_id
            JOIN partner_statewise_gst_master psgm 
                ON psgm.id = pld.partner_statewise_gst_master_id 
                AND psgm.partner_id = p.id
            JOIN document_category dc 
                ON dc.id = cudm.document_category_id 
                AND dc.name = 'Credit Note'
            LEFT JOIN document d 
                ON d.id = cudm.document_id
            LEFT JOIN client_uploaded_document_detail cudd 
                ON cudd.client_uploaded_document_master_id = cudm.id 
                AND cudd.document_attachment_id = 1
            LEFT JOIN client_uploaded_document_detail cudd1 
                ON cudd1.client_uploaded_document_master_id = cudm.id 
                AND cudd1.document_attachment_id = 2
            LEFT JOIN client_uploaded_document_detail cudd2 
                ON cudd2.client_uploaded_document_master_id = cudm.id 
                AND cudd2.document_attachment_id = 3
            LEFT JOIN document_attachment da 
                ON da.id = cudd.document_attachment_id
            LEFT JOIN document_attachment da1 
                ON da1.id = cudd1.document_attachment_id
            LEFT JOIN document_attachment da2 
                ON da2.id = cudd2.document_attachment_id
            `;

            /* ---------- ASM / RSM / NSM ---------- */
            if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                sql += `
                INNER JOIN spsn_extended_user_partner_location_map euplm
                    ON euplm.partner_location_id = pld.id
                    AND euplm.is_active = 1
                    AND euplm.designation_code = '${userDesignation}'
                INNER JOIN spsn_extended_user seu
                    ON seu.id = euplm.extended_user_id
                    AND seu.uuid = '${spsnUuid}'
                LEFT JOIN spsn_user_master sumss ON sumss.id = pld.spsn_user_id
                `;

            }
            /* ---------- EXISTING SPSN FLOW ---------- */
            else {

                sql += `
                JOIN spsn_user_master sumt
                    ON sumt.id = pld.spsn_user_id
                `;

            }

            /* ---------- COMMON WHERE ---------- */
            sql += `
            WHERE
                cudm.partner_location_detail_id IS NOT NULL
            AND ((ABS(cudm.credit_amount) + ABS(cudm.debit_amount)) > 2)
            `;

            if (!['ASM', 'RSM', 'NSM'].includes(userDesignation) && spsnUuid?.length > 0) {
                sql += ` AND sumt.uuid = '${spsnUuid}'`;
            }

            if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                if(selectedSpsnUuid && selectedSpsnUuid?.length > 1)
                    sql += ` AND sumss.uuid = '${selectedSpsnUuid}'`;

            }

            if (userTypeCode !== 'ADM') {
                sql += ` AND pld.is_active = 1`;
            }

            if (partnerUuid?.length > 0) {
                sql += ` AND p.uuid = '${partnerUuid}'`;
            }

            if (partnerLocationUuid?.length > 0) {
                sql += ` AND pld.uuid = '${partnerLocationUuid}'`;
            }

            if (clientUuid) {
                sql += ` AND c.uuid = '${clientUuid}'`;
            }

            sql += ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Credit Note')}`;

            if (action?.length > 0) {
                sql += ` AND d.name = '${action}'`;
            }

            sql += ` ORDER BY cudm.posting_date DESC`;

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            });

        } catch (e) {
            reject(e);
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

// db.getInvoiceSummaries = (partnerUuid, partnerLocationUuid, clientUuid, fromDate, toDate, maxId, spsnUuid, uploadedOn, userTypeCode, dateType) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT DISTINCT IF(cudd1.id IS NULL,0,1) AS isPdfExist, IF(cudd3.id IS NULL,0,1) AS isPtExist, cudm.id, 
//             cudm.debit_amount AS debitAmount, cudm.credit_amount AS creditAmount, 
//             cudm.posting_date AS postingDate, 
//                         cudm.uploaded_on AS uploadedOn, cudm.bill_no_or_ref_no AS billNoOrRefNo,  
//                         c.uuid AS clientUuid, c.name AS clientName, c.code AS clientCode, 
//             c.email AS clientEmail, 
//                         dc.id AS documentCategoryId, dc.code AS documentCategoryCode, dc.name AS documentCategoryName, 
//                         d.id AS documentId, d.name AS documentName, 
//                         pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName,
//             pld.customer_type AS partnerLocationCustomerType, 
//             pld.store_location AS partnerLocationStoreLocation,
//                         cudd.id AS clientDocId, cudd.document_file_name AS clientDocFileName,  
//                         cudd1.id AS pdfClientDocId, cudd1.document_file_name AS pdfClientDocFileName,
//                         cudd3.id AS ptClientDocId, cudd3.document_file_name AS ptClientDocFileName,
//                         da.id AS documentAttachmentId, da.name AS documentAttachmentName,
//                         da1.id AS pdfDocumentAttachmentId, da1.name AS pdfDocumentAttachmentName,
//                         da2.id AS ptDocumentAttachmentId, da2.name AS ptDocumentAttachmentName,
//                         p.email AS partnerEmail, p.name AS partnerName, p.uuid AS partnerUuid    
//             FROM 
//                 client_uploaded_document_master cudm
//             JOIN 
//                 client c ON c.id = cudm.client_id
//             JOIN 
//                 partner_client_mapping pcm ON pcm.client_id = c.id
//             JOIN 
//                 partner p ON p.id = pcm.partner_id
//             JOIN 
//                 partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
//             JOIN 
//                 partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id AND psgm.partner_id = p.id
//             JOIN 
//                 document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Invoice'
// 			JOIN 
// 				spsn_user_master sumt ON sumt.id = pld.spsn_user_id
//             LEFT JOIN 
//                 document d ON d.id = cudm.document_id
//             LEFT JOIN 
//                 client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = 1
//             LEFT JOIN 
//                 client_uploaded_document_detail cudd1 ON cudd1.client_uploaded_document_master_id = cudm.id AND cudd1.document_attachment_id = 2
//             LEFT JOIN 
//                 client_uploaded_document_detail cudd3 ON cudd3.client_uploaded_document_master_id = cudm.id 
//                 AND cudd3.document_attachment_id = 4
//             LEFT JOIN 
//                 document_attachment da ON da.id = cudd.document_attachment_id
//             LEFT JOIN 
//                 document_attachment da1 ON da1.id = cudd1.document_attachment_id
//             LEFT JOIN 
//                 document_attachment da2 ON da2.id = cudd3.document_attachment_id
//             WHERE
//                 cudm.partner_location_detail_id IS NOT NULL   `
            

                
// 			// AND 
//             // sumt.uuid = '${spsnUuid}'

//                 if(spsnUuid && spsnUuid?.length > 0)
//                     {
//                         sql = sql + ` AND sumt.uuid = '${spsnUuid}'`
//                     }

//         if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

//             if (partnerUuid && partnerUuid?.length > 0) {
//                 sql = sql + ` AND p.uuid = '${partnerUuid}'`
//             }

//             if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
//                 sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
//             }

//             if (clientUuid) {
//                 sql = sql + ` AND c.uuid = '${clientUuid}'`
//             }          

//             sql = sql + ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Invoice')}`

//             sql = sql + `  ORDER by cudm.posting_date DESC;`

//             pool.query(sql, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         }
//         catch (e) {
//             throw e
//         }
//     })
// }

db.getInvoiceSummaries = (
    partnerUuid,
    partnerLocationUuid,
    clientUuid,
    fromDate,
    toDate,
    maxId,
    spsnUuid,
    uploadedOn,
    userTypeCode,
    dateType,
    userDesignation = null,
    selectedSpsnUuid = null
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT DISTINCT
                IF(cudd1.id IS NULL,0,1) AS isPdfExist,
                IF(cudd3.id IS NULL,0,1) AS isPtExist,
                cudm.id,
                cudm.debit_amount AS debitAmount,
                cudm.credit_amount AS creditAmount,
                cudm.posting_date AS postingDate,
                cudm.uploaded_on AS uploadedOn,
                cudm.bill_no_or_ref_no AS billNoOrRefNo,
                c.uuid AS clientUuid,
                c.name AS clientName,
                c.code AS clientCode,
                c.email AS clientEmail,
                dc.id AS documentCategoryId,
                dc.code AS documentCategoryCode,
                dc.name AS documentCategoryName,
                d.id AS documentId,
                d.name AS documentName,
                pld.uuid AS partnerLocationUuid,
                pld.code AS partnerLocationCode,
                pld.store_name AS partnerLocationStoreName,
                pld.customer_type AS partnerLocationCustomerType,
                pld.store_location AS partnerLocationStoreLocation,
                cudd.id AS clientDocId,
                cudd.document_file_name AS clientDocFileName,
                cudd1.id AS pdfClientDocId,
                cudd1.document_file_name AS pdfClientDocFileName,
                cudd3.id AS ptClientDocId,
                cudd3.document_file_name AS ptClientDocFileName,
                da.id AS documentAttachmentId,
                da.name AS documentAttachmentName,
                da1.id AS pdfDocumentAttachmentId,
                da1.name AS pdfDocumentAttachmentName,
                da2.id AS ptDocumentAttachmentId,
                da2.name AS ptDocumentAttachmentName,
                p.email AS partnerEmail,
                p.name AS partnerName,
                p.uuid AS partnerUuid
            FROM client_uploaded_document_master cudm
            JOIN client c 
                ON c.id = cudm.client_id
            JOIN partner_client_mapping pcm 
                ON pcm.client_id = c.id
            JOIN partner p 
                ON p.id = pcm.partner_id
            JOIN partner_location_detail pld 
                ON pld.id = cudm.partner_location_detail_id
            JOIN partner_statewise_gst_master psgm 
                ON psgm.id = pld.partner_statewise_gst_master_id
                AND psgm.partner_id = p.id
            JOIN document_category dc 
                ON dc.id = cudm.document_category_id
                AND dc.name = 'Invoice'
            LEFT JOIN document d 
                ON d.id = cudm.document_id
            LEFT JOIN client_uploaded_document_detail cudd 
                ON cudd.client_uploaded_document_master_id = cudm.id
                AND cudd.document_attachment_id = 1
            LEFT JOIN client_uploaded_document_detail cudd1 
                ON cudd1.client_uploaded_document_master_id = cudm.id
                AND cudd1.document_attachment_id = 2
            LEFT JOIN client_uploaded_document_detail cudd3 
                ON cudd3.client_uploaded_document_master_id = cudm.id
                AND cudd3.document_attachment_id = 4
            LEFT JOIN document_attachment da 
                ON da.id = cudd.document_attachment_id
            LEFT JOIN document_attachment da1 
                ON da1.id = cudd1.document_attachment_id
            LEFT JOIN document_attachment da2 
                ON da2.id = cudd3.document_attachment_id
            `;

            /* ---------- ASM / RSM / NSM FLOW ---------- */
            if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                sql += `
                INNER JOIN spsn_extended_user_partner_location_map euplm
                    ON euplm.partner_location_id = pld.id
                    AND euplm.is_active = 1
                    AND euplm.designation_code = '${userDesignation}'
                INNER JOIN spsn_extended_user seu
                    ON seu.id = euplm.extended_user_id
                    AND seu.uuid = '${spsnUuid}'
                LEFT JOIN spsn_user_master sumss ON sumss.id = pld.spsn_user_id
                `;

            }
            /* ---------- EXISTING SPSN FLOW ---------- */
            else {

                sql += `
                JOIN spsn_user_master sumt
                    ON sumt.id = pld.spsn_user_id
                `;

            }

            /* ---------- COMMON WHERE ---------- */
            sql += `
            WHERE
                cudm.partner_location_detail_id IS NOT NULL
            `;

            if (!['ASM', 'RSM', 'NSM'].includes(userDesignation) && spsnUuid?.length > 0) {
                sql += ` AND sumt.uuid = '${spsnUuid}'`;
            }

             if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                if(selectedSpsnUuid && selectedSpsnUuid?.length > 1)
                    sql += ` AND sumss.uuid = '${selectedSpsnUuid}'`;

            }

            if (userTypeCode !== 'ADM') {
                sql += ` AND pld.is_active = 1`;
            }

            if (partnerUuid?.length > 0) {
                sql += ` AND p.uuid = '${partnerUuid}'`;
            }

            if (partnerLocationUuid?.length > 0) {
                sql += ` AND pld.uuid = '${partnerLocationUuid}'`;
            }

            if (clientUuid) {
                sql += ` AND c.uuid = '${clientUuid}'`;
            }

            sql += ` ${sqlFormation(fromDate, toDate, uploadedOn, dateType, 'Invoice')}`;

            sql += ` ORDER BY cudm.posting_date DESC`;

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};


db.getFilePath = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, file_name AS fileName, failed_file_path AS failedFilePath, processed_file_path AS processedFilePath, encryption_key, encryption_iv  
            FROM client_spsn_upload_doc_log_master 
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
            let sql = `SELECT ldq.id, ldq.file_name AS fileName, ldq.file_path AS filePath, ldq.encryption_key AS encryptionKey, ldq.encryption_iv AS encryptionIV, c.uuid AS clientUuid  
            FROM ledger_download_queue ldq
            LEFT JOIN client c ON ldq.client_id = c.id
            WHERE FIND_IN_SET(ldq.id,'${id}') > 0`

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

db.savePdfFile = (documentFileName, documentFilePath, clientUploadedDocsMasterId, documentAttachmentId, uploadedOn, encriptionKey, encriptionIV) => {
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

db.getClient = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, uuid
                                    FROM client
                                    WHERE is_active = 1
                                    AND uuid = '${uuid}'`
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

db.getLedgerJsonFileMaster = (clientId, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                            id AS id,
                            client_id AS clientId,
                            file_name AS fileName,
                            file_path AS filePath,
                            encryption_key AS encryptionKey,
                            encryption_iv AS encryptionIv
                        FROM ledger_json_file_master
                        WHERE client_id = '${clientId}' 
                        AND financial_year_id = '${financialYearId}'`
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
            let sql = `SELECT id   
            FROM client_uploaded_document_master 
            WHERE bill_no_or_ref_no = '${number}'`

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

db.getClientUploadedDocsMasterIdForCreditNote = (number) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id   
            FROM client_uploaded_document_master 
            WHERE document_number = '${number}'`

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
            let sql = `SELECT encryption_key, encryption_iv
                                    FROM upload_doc_log_master
                                    WHERE UPPER(file_name) = '${fileName.toUpperCase()}'`
            //  
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


db.saveDataTransactLog = (activity, user, partnerUuid, locationUuid, fileSize, apiName, storageType, createdOn, clientUuid, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}','${partnerUuid}','${locationUuid}','${fileSize}','${apiName}','${storageType}',?, (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${fileName}')`

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


db.saveSpsnMasterData = (uuid, name, code, isActive, createdOn, createdById, email, mobile, password, passKey, clientUuid, spsnCode) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO spsn_user_master (uuid, name, code, is_active, created_on, created_by_id, email, mobile, password, client_id, spsn_code) VALUES ('${uuid}', '${name}', '${code}', '${isActive}', ?, '${createdById}', '${email}', '${mobile}', HEX(AES_ENCRYPT('${password}', '${passKey}')), (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${spsnCode}')`
            pool.query(sql, [createdOn], (error, result) => {
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


db.saveSpsnPartnerLocationData = (spsnName, locationCodes) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_location_detail
                            SET spsn_user_id = (SELECT id FROM spsn_user_master WHERE code = '${spsnName}')
                            WHERE FIND_IN_SET(code, '${locationCodes}') > 0;`
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

// db.getSpsns = (clientUuid) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT sums.id, sums.uuid, sums.name, sums.code,  
//                     sums.is_active AS isActive, sums.created_on AS createdOn, sums.email, sums.mobile, sums.client_id AS clientId,
//                     COUNT(pld.id) AS totalLocations, 
//                     cb.name AS createdByName, cb.uuid AS createdByUuid,
//                     c.uuid AS clientUuid, c.name AS clientName 
//                     FROM spsn_user_master sums
//                     LEFT JOIN partner_location_detail pld ON pld.spsn_user_id = sums.id
//                     LEFT JOIN user cb ON cb.id = sums.created_by_id
//                     LEFT JOIN client c ON c.id = sums.client_id
//                     WHERE sums.is_active = 1 
//                     AND sums.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}') `

//         if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

//             // if(partnerCategoryId)
//             // {
//             //     sql = sql + ` AND pc.id = '${partnerCategoryId}'`
//             // }

//             sql = sql + `   GROUP BY sums.id `
//             sql = sql + `   ORDER BY sums.name`



//             pool.query(sql, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         }
//         catch (e) {
//             throw e
//         }
//     })
// }



db.getSpsns = (clientUuid, userTypeCode) => {
    return new Promise((resolve, reject) => {
        try {
            
            // COUNT(pld.id) AS totalLocations, 
            let sql = `SELECT sums.id, sums.uuid, sums.name, sums.code,  sums.spsn_code AS spsnCode, 
                    sums.is_active AS isActive, sums.created_on AS createdOn, sums.email, sums.mobile, sums.client_id AS clientId,
                    SUM(
                            CASE 
                                WHEN '${userTypeCode}' = 'ADM' AND pld.spsn_user_id = sums.id THEN 1
                                WHEN '${userTypeCode}' != 'ADM' AND pld.is_active = 1 THEN 1
                                ELSE 0
                            END
                        ) AS totalLocations, 
                    cb.name AS createdByName, cb.uuid AS createdByUuid,
                    c.uuid AS clientUuid, c.name AS clientName 
                    FROM spsn_user_master sums
                    LEFT JOIN partner_location_detail pld ON pld.spsn_user_id = sums.id
                    LEFT JOIN user cb ON cb.id = sums.created_by_id
                    LEFT JOIN client c ON c.id = sums.client_id
                    WHERE sums.is_active = 1 
                    AND sums.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}') `

        if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

            // if(partnerCategoryId)
            // {
            //     sql = sql + ` AND pc.id = '${partnerCategoryId}'`
            // }

            sql = sql + `   GROUP BY sums.id `
            sql = sql + `   ORDER BY sums.name`



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

db.getSpsnWithLocations = (clientUuid, userTypeCode) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sums.id, sums.uuid, sums.name, sums.code,  sums.email, sums.mobile, pld.id AS locationId, pld.uuid AS locationUuid, pld.code AS locationCode, pld.store_name AS storeName, pld.email AS locationEmail, pld.mobile AS locationMobile
                    FROM spsn_user_master sums
                    LEFT JOIN partner_location_detail pld ON pld.spsn_user_id = sums.id
                    WHERE sums.is_active = 1 
                    AND sums.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}') `

        if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

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

db.getSpsn = (uuid, userTypeCode) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sums.id, sums.uuid, sums.name, sums.code, sums.spsn_code AS spsnCode,
                            sums.is_active AS isActive, sums.created_on AS createdOn, sums.email, sums.mobile, sums.client_id AS clientId, 
                            cb.name AS createdByName, cb.uuid AS createdByUuid,
                        c.uuid AS clientUuid, c.short_name AS clientShortName, c.name AS clientName, c.code AS clientCode, c.email AS clientEmail, 
                        c.mobile AS clientMobile 
                        FROM spsn_user_master sums
                        LEFT JOIN partner_location_detail pld ON pld.spsn_user_id = sums.id
                        LEFT JOIN user cb ON cb.id = sums.created_by_id
                        LEFT JOIN client c ON c.id = sums.client_id
                        WHERE sums.is_active = 1
                        AND sums.uuid = '${uuid}' `

        if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

            sql = sql + ` ORDER BY sums.id`
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

// db.getPartnerLocations = (spsnUuid, stateId, userTypeCode) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT pld.uuid, pld.code, pld.store_name AS storeName, 
//             pld.store_location AS storeLocation, pld.mobile, pld.email, IF(pld.code IS NOT NULL, CONCAT(pld.code, '-',  IF(CHAR_LENGTH(pld.store_name) > 10, CONCAT(LEFT(pld.store_name, 10), '...'), pld.store_name), ' - ', pld.customer_type, ' (', pld.store_location, ')'), '') AS partnerLabel, pld.customer_type AS customerType, 
//             pld.tan, pld.address_line1 AS addressLine1, pld.address_line2 AS addressLine2, 
//             pld.address_line3 AS addressLine3, pld.city, pld.pincode,
//             pld.msme_number AS msmeNumber, pld.is_active AS isActive, pld.created_on AS createdOn,
//             cb.name AS createdByName, cb.uuid AS createdByUuid,
//             s.id AS stateId, s.name AS stateName
//             FROM partner_location_detail pld
//             LEFT JOIN state s ON s.id = pld.state_id
//             LEFT JOIN spsn_user_master sums ON sums.id = pld.spsn_user_id
//             LEFT JOIN user cb ON cb.id = pld.created_by_id 
//             WHERE  sums.uuid = '${spsnUuid}'  `

//             if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

//             if (stateId) {
//                 sql = sql + ` AND s.id = '${stateId}'`
//             }

//             sql = sql + ` ORDER BY pld.store_name`
//             pool.query(sql, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         }
//         catch (e) {
//             throw e
//         }
//     })
// }

db.getPartnerLocations = (spsnUuid, stateId, userTypeCode, userDesignation = null) => {

    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT 
                pld.uuid, pld.code, pld.store_name AS storeName, 
                pld.store_location AS storeLocation, pld.mobile, pld.email,
                IF(pld.code IS NOT NULL,
                    CONCAT(
                        pld.code, '-',  
                        IF(CHAR_LENGTH(pld.store_name) > 10,
                            CONCAT(LEFT(pld.store_name, 10), '...'),
                            pld.store_name
                        ),
                        ' - ', pld.customer_type,
                        ' (', pld.store_location, ')'
                    ),
                    ''
                ) AS partnerLabel,
                pld.customer_type AS customerType, 
                pld.tan, pld.address_line1 AS addressLine1,
                pld.address_line2 AS addressLine2, 
                pld.address_line3 AS addressLine3,
                pld.city, pld.pincode,
                pld.msme_number AS msmeNumber,
                pld.is_active AS isActive,
                pld.created_on AS createdOn,
                cb.name AS createdByName,
                cb.uuid AS createdByUuid,
                s.id AS stateId,
                s.name AS stateName,
                sums.name AS spsnName, 
                sums.spsn_code AS spsnCode,
                sums.uuid AS spsnUuid
            FROM partner_location_detail pld
            LEFT JOIN state s ON s.id = pld.state_id
            LEFT JOIN user cb ON cb.id = pld.created_by_id
            LEFT JOIN spsn_user_master sums
                    ON sums.id = pld.spsn_user_id
            `;

            /* ---------- CASE 1 : ASM / RSM / NSM ---------- */
            if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                sql += `
                INNER JOIN spsn_extended_user_partner_location_map euplm
                    ON euplm.partner_location_id = pld.id
                    AND euplm.is_active = 1
                    AND euplm.designation_code = '${userDesignation}'
                INNER JOIN spsn_extended_user seu
                    ON seu.id = euplm.extended_user_id
                    AND seu.uuid = '${spsnUuid}'
                `;

            }
              sql += `
                
                WHERE 1 = 1
                `;
            /* ---------- CASE 2 : EXISTING LOGIC ---------- */
            if (!['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                sql += `
                
                AND sums.uuid = '${spsnUuid}'
                `;

            }

            /* ---------- COMMON FILTERS ---------- */
            if (userTypeCode !== 'ADM') {
                sql += ` AND pld.is_active = 1`;
            }

            if (stateId) {
                sql += ` AND s.id = '${stateId}'`;
            }

            sql += ` ORDER BY pld.store_name`;

            console.log(sql, userDesignation)

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};



db.updateSpsn = (uuid, email, mobile, modifyById, modifyOn, name) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE spsn_user_master SET name = '${name}', email = '${email}', mobile = '${mobile}', modify_on = ?, modify_by_id = ${modifyById}  
            WHERE uuid = '${uuid}'`
            pool.query(sql, [modifyOn], (error, result) => {
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




db.getSpsnWithUuid = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sums.id, sums.uuid, sums.name 
                        FROM spsn_user_master sums
                        WHERE sums.is_active = 1
                        AND sums.uuid = '${uuid}' `
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




db.updateSpsnLocations = (spsnId, partnerLocationsUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_location_detail SET spsn_user_id = '${spsnId}'  
                WHERE FIND_IN_SET(uuid,'${partnerLocationsUuid}') > 0`
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

db.getPartnerLocation = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.uuid, pld.code, pld.store_name AS storeName, 
            pld.store_location AS storeLocation, pld.mobile, pld.email, 
            pld.tan, pld.address_line1 AS addressLine1, pld.address_line2 AS addressLine2, 
            pld.address_line3 AS addressLine3, pld.city, pld.pincode, pld.customer_type AS customerType, 
            pld.msme_number AS msmeNumber, pld.is_active AS isActive, pld.created_on AS createdOn,
            cb.name AS createdByName, cb.uuid AS createdByUuid,
            s.id AS stateId, s.name AS stateName,
            psgm.id AS partnerStateWiseGstMasterId, psgm.gstin AS partnerStateWiseGstMasterGstIn
            FROM partner_location_detail pld
            LEFT JOIN state s ON s.id = pld.state_id
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN user cb ON cb.id = pld.created_by_id 
            WHERE pld.is_active = 1 
            AND pld.uuid = '${uuid}' `
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

db.getPartnerlocationUuidCode = (uuids) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.code
            FROM partner_location_detail pld
            WHERE
            FIND_IN_SET(pld.uuid, '${uuids}') > 0`

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

db.getPartnerlocationCodeOfSpsn = (spsnId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.code
            FROM partner_location_detail pld
            WHERE spsn_user_id = '${spsnId}'`

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

db.getPartnerlocationCodeOfExtendedUser = (extendedUserId, selectedSpsnUuid) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT DISTINCT pld.code
            FROM spsn_extended_user seu
            JOIN spsn_extended_user_partner_location_map euplm
                ON euplm.extended_user_id = seu.id
                AND euplm.is_active = 1
            JOIN partner_location_detail pld
                ON pld.id = euplm.partner_location_id
            LEFT JOIN spsn_user_master sumss ON sumss.id = pld.spsn_user_id
            WHERE seu.id = '${extendedUserId}'
            `;

            
                if(selectedSpsnUuid && selectedSpsnUuid?.length > 1)
                    sql += ` AND sumss.uuid = '${selectedSpsnUuid}'`;

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            });

        } catch (e) {
            throw e;
        }
    });
};


// db.getLastDocumentUploadDate = (clientUuid, documentName, partnerUuid, partnerLocationUuid, action, spsnUuid, userTypeCode) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT 
//                                 MAX(DATE_FORMAT(cudm.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn,
//                                 MAX(DATE_FORMAT(cudm.posting_date, '%Y-%m-%d %H:%i:%s')) AS postingDate 
//                                 FROM 
//                                     client_uploaded_document_master cudm
//                                 JOIN 
//                                     client c ON c.id = cudm.client_id
//                                 JOIN 
//                                     document_category dc ON dc.id = cudm.document_category_id AND dc.name = '${documentName}'
//                                 LEFT JOIN 
//                                     document d ON d.id = cudm.document_id
//                                 JOIN 
//                                     partner_location_detail pld ON pld.id = cudm.partner_location_detail_id
//                                 JOIN 
//                                     spsn_user_master sumt ON sumt.id = pld.spsn_user_id
//                                 JOIN 
//                                     partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
//                                 JOIN 
//                                     partner p ON p.id = psgm.partner_id
//                                 WHERE
//                                     cudm.partner_location_detail_id IS NOT NULL    
                                    
//                     `
//                     // AND sumt.uuid = '${spsnUuid}'

//                     if(spsnUuid && spsnUuid?.length > 0)
//                     {
//                         sql = sql + ` AND sumt.uuid = '${spsnUuid}'`
//                     }

//         if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

//             if (clientUuid && clientUuid?.length > 0) {
//                 sql = sql + ` AND c.uuid = '${clientUuid}'`
//             }
//             if (partnerUuid && partnerUuid?.length > 0) {
//                 sql = sql + ` AND p.uuid = '${partnerUuid}'`
//             }
//             if (partnerLocationUuid && partnerLocationUuid?.length > 0) {
//                 sql = sql + ` AND pld.uuid = '${partnerLocationUuid}'`
//             }

//             if (action?.length > 0) {
//                 sql = sql + ` AND d.name = '${action}'`
//             }

//             if (documentName == 'Credit Note') {
//                 sql = sql + ` 
//                                 AND
//                                 ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2)`
//             }

//             // console.log(sql)
//             pool.query(sql, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         }
//         catch (e) {
//             throw e
//         }
//     })
// }

db.getLastDocumentUploadDate = (
    clientUuid,
    documentName,
    partnerUuid,
    partnerLocationUuid,
    action,
    spsnUuid,
    userTypeCode,
    userDesignation = null,
    selectedSpsnUuid = null
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT 
                MAX(DATE_FORMAT(cudm.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn,
                MAX(DATE_FORMAT(cudm.posting_date, '%Y-%m-%d %H:%i:%s')) AS postingDate
            FROM client_uploaded_document_master cudm
            JOIN client c 
                ON c.id = cudm.client_id
            JOIN document_category dc 
                ON dc.id = cudm.document_category_id
                AND dc.name = '${documentName}'
            LEFT JOIN document d 
                ON d.id = cudm.document_id
            JOIN partner_location_detail pld 
                ON pld.id = cudm.partner_location_detail_id
            JOIN partner_statewise_gst_master psgm 
                ON psgm.id = pld.partner_statewise_gst_master_id
            JOIN partner p 
                ON p.id = psgm.partner_id
            `;

            /* ---------- CASE 1 : ASM / RSM / NSM ---------- */
            if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                sql += `
                INNER JOIN spsn_extended_user_partner_location_map euplm
                    ON euplm.partner_location_id = pld.id
                    AND euplm.is_active = 1
                    AND euplm.designation_code = '${userDesignation}'
                INNER JOIN spsn_extended_user seu
                    ON seu.id = euplm.extended_user_id
                    AND seu.uuid = '${spsnUuid}'
                LEFT JOIN spsn_user_master sumss ON sumss.id = pld.spsn_user_id
                `;

            }
            /* ---------- CASE 2 : EXISTING LOGIC ---------- */
            else {

                sql += `
                JOIN spsn_user_master sumt
                    ON sumt.id = pld.spsn_user_id
                `;

            }

            /* ---------- COMMON WHERE ---------- */
            sql += `
            WHERE
                cudm.partner_location_detail_id IS NOT NULL
            `;

            if (['ASM', 'RSM', 'NSM'].includes(userDesignation)) {

                if(selectedSpsnUuid && selectedSpsnUuid?.length > 1)
                    sql += ` AND sumss.uuid = '${selectedSpsnUuid}'`;

            }

            if (!['ASM', 'RSM', 'NSM'].includes(userDesignation) && spsnUuid?.length > 0) {
                sql += ` AND sumt.uuid = '${spsnUuid}'`;
            }

            if (userTypeCode !== 'ADM') {
                sql += ` AND pld.is_active = 1`;
            }

            if (clientUuid?.length > 0) {
                sql += ` AND c.uuid = '${clientUuid}'`;
            }

            if (partnerUuid?.length > 0) {
                sql += ` AND p.uuid = '${partnerUuid}'`;
            }

            if (partnerLocationUuid?.length > 0) {
                sql += ` AND pld.uuid = '${partnerLocationUuid}'`;
            }

            if (action?.length > 0) {
                sql += ` AND d.name = '${action}'`;
            }

            if (documentName === 'Credit Note') {
                sql += `
                AND ((ABS(cudm.credit_amount) + ABS(cudm.debit_amount)) > 2)
                `;
            }

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};


/////
db.getFinancialYear = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, name, start_date AS startDate, end_date AS endDate, 
            is_current AS isCurrent 
            FROM financial_year 
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

db.getFinancialYearId = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, 
            FROM financial_year 
            WHERE is_active = 1
            And id = '${id}'`

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

db.getSpsnDocumentTypes = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sdt.id, sdt.name, sdt.code
            FROM spsn_document_type sdt
            WHERE sdt.is_active = 1`
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

db.getSpsnDocumentCategories = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sdc.id, sdc.name, sdc.code 
            FROM spsn_document_category sdc
            WHERE sdc.is_active = 1`
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

db.getSpsnDocumentAttachments = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sda.id, sda.name
            FROM spsn_document_attachment sda;`
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

db.getSpsnDocumentAttachmentId = (name) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT sda.id
            FROM spsn_document_attachment sda 
            WHERE sda.name = '${name}'`
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

//get report for financial year (spsn)
db.getReportForFinancialYear = (spsnUuid, financialYearId, documentCategoryId, monthPeriod) => {
    return new Promise((resolve, reject) => {
        try {
            // su.uuid = '${spsnUuid}' 
            // AND
            let sql = `SELECT csud.id, csud.document_file_path, csud.financial_year_id, csud.encryption_key, csud.encryption_iv      
            FROM client_spsn_upload_document csud  
            LEFT JOIN spsn_user_master su ON su.id = csud.spsn_id
            WHERE  csud.financial_year_id = '${financialYearId}'
            AND csud.document_category_id = '${documentCategoryId}' `

            // if(monthPeriod)
            // {
            //     sql = sql + ` AND csud.month_period = '${monthPeriod}'`
            // }

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

db.saveSpsnOSAndCAReport = (documentCategoryId, documentId, documentAttachmentId, financialYearId, spsnUuid, clientUuid, uploadedOn, createdOn, documentFileName, documentFilePath, encriptionKey, encriptionIV, monthPeriod) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_spsn_upload_document (document_category_id, document_id, document_attachment_id, financial_year_id, client_id, uploaded_on, created_on, document_file_name, document_file_path, encryption_key,encryption_iv, month_period) VALUES ('${documentCategoryId}', '${documentId}', '${documentAttachmentId}', '${financialYearId}', (SELECT id FROM client WHERE uuid = '${clientUuid}'), '${uploadedOn}', ?, '${documentFileName}', '${documentFilePath}', '${encriptionKey}', '${encriptionIV}', ?)`
            // spsn_id
            //  (SELECT id FROM spsn_user_master WHERE uuid = '${spsnUuid}'), 
            // console.log(sql, monthPeriod)
            pool.query(sql, [createdOn, monthPeriod], (error, result) => {
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

db.updateSpsnOSAndCAReport = (documentFileName, documentFilePath, uploadedOn, encriptionKey, encriptionIV, Id, monthPeriod) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_spsn_upload_document SET document_file_name = '${documentFileName}', document_file_path = '${documentFilePath}', uploaded_on = ?, month_period = ?, modify_on = now(), encryption_key = '${encriptionKey}',encryption_iv = '${encriptionIV}' WHERE  id = '${Id}'`

            // console.log(sql)
            pool.query(sql, [uploadedOn, monthPeriod], (error, result) => {
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

db.getEncryptionDataForSpsn = (fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT encryption_key, encryption_iv
            FROM client_spsn_upload_doc_log_master
            WHERE UPPER(file_name) = '${fileName.toUpperCase()}'`
            //
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

db.getSpsnOSAndCALastDocumentUploadDate = (clientUuid, documentCode, action, spsnUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                                MAX(DATE_FORMAT(csud.uploaded_on, '%Y-%m-%d %H:%i:%s')) AS uploadedOn 
                                FROM 
                                    client_spsn_upload_document csud
                                JOIN 
                                    client c ON c.id = csud.client_id
                                JOIN 
                                    spsn_document_category sdc ON sdc.id = csud.document_category_id AND sdc.code = '${documentCode}'
                                LEFT JOIN 
                                    spsn_document_type sdt ON sdt.id = csud.document_id
                                JOIN 
                                    spsn_user_master sumt ON sumt.id = csud.spsn_id
                                WHERE    
                                    sumt.uuid = '${spsnUuid}'
                                
                    `

            if (clientUuid && clientUuid?.length > 0) {
                sql = sql + ` AND c.uuid = '${clientUuid}'`
            }

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

db.getSpsnOSAndCAReport = (financialYearId, clientUuid, fromDate, toDate, spsnUuid, uploadedOn, documentCategoryCode) => {
    return new Promise((resolve, reject) => {
        try {
            
            // csud.month_period AS monthPeriod,
            let sql = `SELECT DISTINCT 
                                        csud.id,  
                                        csud.uploaded_on  AS uploadedOn, 
                                        csud.document_file_name AS fileName,
                                        csud.document_file_path AS filePath,
                                        csud.encryption_key AS encryptionKey,
                                        csud.encryption_iv AS encryptionIV,
                                        csud.created_on AS createdOn,
                                        csud.modify_on AS modifyOn,
                                        c.uuid AS clientUuid, 
                                        c.name AS clientName, 
                                        c.code AS clientCode, 
                                        c.email AS clientEmail, 
                                        sdc.id AS documentCategoryId, 
                                        sdc.code AS documentCategoryCode, 
                                        sdc.name AS documentCategoryName, 
                                        sdt.id AS documentId, 
                                        sdt.name AS documentName, 
                                        sda.id AS documentAttachmentId, 
                                        sda.name AS documentAttachmentName,
                                        fy.id AS financialYearId, 
                                        fy.name AS financialYearName,
                                        sumt.spsn_code AS spsnCode,
                                        sumt.name AS spsnName,
                                        sumt.uuid AS spsnUuid,                                        
                                        DATE_FORMAT(csud.uploaded_on,'%c-%Y')  AS monthPeriodToMatch

                        FROM 
                                    client_spsn_upload_document csud
                        JOIN 
                                    client c ON c.id = csud.client_id
                        JOIN 
                                    spsn_document_category sdc ON sdc.id = csud.document_category_id AND sdc.code = '${documentCategoryCode}'
                        LEFT JOIN 
                                    spsn_document_type sdt ON sdt.id = csud.document_id
                        LEFT JOIN 
                                    spsn_document_attachment sda ON sda.id = csud.document_attachment_id 
                        LEFT JOIN 
                                    spsn_user_master sumt ON sumt.id = csud.spsn_id
                        LEFT JOIN 
                                    financial_year fy ON fy.id = csud.financial_year_id
                        WHERE  
                            c.uuid = '${clientUuid}'
                            AND fy.id = '${financialYearId}'
        `
        // sumt.uuid = '${spsnUuid}' 
        // AND 

            if(documentCategoryCode == 'CA')
            {        
                // if (fromDate && fromDate?.toString()?.length > 0) {
                //     sql = sql + ` AND (MONTH(csud.uploaded_on) = MONTH('${fromDate}')) AND (YEAR(csud.uploaded_on) = YEAR('${fromDate}'))`
                // }
        
                // // if (toDate && toDate?.toString()?.length > 0) {
                // //     sql = sql + ` AND (MONTH(csud.created_on) <= MONTH('${toDate}'))`
                // // }
            }

            sql = sql + `  ORDER by csud.created_on DESC;`

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
// db.getSpsnCAReport = (financialYearId, clientUuid, fromDate, toDate, spsnUuid, uploadedOn, documentCategoryCode) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT DISTINCT 
//                                 csud.id, 
//                                 csud.financial_year_id AS financial_year_id, 
//                                 csud.uploaded_on  AS uploaded_on, 
//                                 csud.document_file_name AS DocFileName, 
//                                 csud.month_period AS monthPeriod,
//                                 c.uuid AS clientUuid, 
//                                 c.name AS clientName, 
//                                 c.code AS clientCode, 
//                                 c.email AS clientEmail, 
//                                 sdc.id AS documentCategoryId, 
//                                 sdc.code AS documentCategoryCode, 
//                                 sdc.name AS documentCategoryName, 
//                                 sdt.id AS documentId, 
//                                 sdt.name AS documentName, 
//                                 sda.id AS documentAttachmentId, 
//                                 sda.name AS documentAttachmentName
//             FROM client_spsn_upload_document csud
//             JOIN client c ON c.id = csud.client_id
//             JOIN financial_year fy ON fy.id = csud.financial_year_id
//             JOIN spsn_document_category sdc ON sdc.id = csud.document_category_id AND sdc.code = 'OS'
//             LEFT JOIN spsn_document_type sdt ON sdt.id = csud.document_id
//             LEFT JOIN spsn_document_attachment sda ON sda.id = csud.document_attachment_id 
//             LEFT JOIN 
//                 spsn_user_master sumt ON sumt.id = csud.spsn_id
//             WHERE  
//                 sumt.uuid = '${spsnUuid}' `

//             if (financialYearId) {
//                 sql = sql + ` AND fy.id = '${financialYearId}'`
//             }

//             if (clientUuid) {
//                 sql = sql + ` AND c.uuid = '${clientUuid}'`
//             }

//             if (fromDate && fromDate?.toString()?.length > 0) {
//                 sql = sql + ` AND DATE(csud.uploaded_on) >= DATE('${fromDate}')`
//             }

//             if (toDate && toDate?.toString()?.length > 0) {
//                 sql = sql + ` AND DATE(csud.uploaded_on) <= DATE('${toDate}')`
//             }

//             if (!toDate && !fromDate && toDate?.toString()?.length == 0 && fromDate?.toString()?.length == 0) {
//                 sql = sql + ` AND DATE(csud.uploaded_on) = DATE('${uploadedOn}')`
//             }

//             sql = sql + `  ORDER by csud.uploaded_on DESC;`

//             pool.query(sql, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve(result);
//             });
//         }
//         catch (e) {
//             throw e
//         }
//     })
// }

db.saveLedgerQueue = (fromDate, toDate, clientId, createdOn, createdById, status, customerCodes, userType, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO ledger_download_queue (from_date, to_date, status, created_on, created_by_id, partner_location_codes, client_id, user_type, financial_year_id) VALUES (?, ?, '${status}', ?, '${createdById}', ?, '${clientId}', ?, '${financialYearId}')`
            pool.query(sql, [fromDate, toDate, createdOn, customerCodes, userType], (error, result) => {
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

db.updateLedgerQueue = (id, status, fileName, filePath, encryptionKey, encryptionIV, modifyById, completedOn, modifyOn, remark) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE ledger_download_queue SET status = '${status}', file_name = '${fileName}', file_path = '${filePath}', completed_on = ?, modify_on = ?, modify_by_id = ?, encryption_key = '${encryptionKey}', encryption_iv = '${encryptionIV}', remark = '${remark}' 
            WHERE id = '${id}'`
            pool.query(sql, [completedOn, modifyOn, modifyById], (error, result) => {
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

db.updateLedgerDownloadMaster = (id, encryptionKey, encryptionIV, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = ` UPDATE ledger_json_file_master
                        SET 
                            encryption_key = '${encryptionKey}',
                            encryption_iv = '${encryptionIV}',
                            financial_year_id = '${financialYearId}',
                            modify_on = NOW()
                        WHERE id = '${id}'`
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

db.saveLedgerDownloadMaster = (fileName, filePath, clientId, encryptionKey, encryptionIV, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO ledger_json_file_master (
                            client_id,
                            file_name,
                            file_path,
                            created_on,
                            encryption_key,
                            encryption_iv,
                            financial_year_id
                        ) VALUES (
                            '${clientId}',                     
                            '${fileName}',     
                            '${filePath}', 
                            NOW(),                      
                            '${encryptionKey}', 
                            '${encryptionIV}',
                            '${financialYearId}'
                        );`
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
db.getLedgerMaster = (clientId, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = ` SELECT 
                            id AS id,
                            client_id AS clientId,
                            file_name AS fileName,
                            file_path AS filePath,
                            encryption_key AS encryptionKey,
                            encryption_iv AS encryptionIV
                        FROM ledger_json_file_master
                        WHERE client_id = '${clientId}' 
                        AND financial_year_id = '${financialYearId}'`
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

// db.getLedgerDownloadQueue = (clientUuid, createdByUuid, status, fromDate, toDate, userTypeCode, financialYearId) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `SELECT 
//                             ldq.id AS id,
//                             ldq.from_date AS fromDate,
//                             ldq.to_date AS toDate, 
//                             ldq.status AS status,
//                             ldq.created_on AS createdOn,
//                             ldq.created_by_id AS createdById,
//                             ldq.user_type AS userType,
//                             ldq.file_name AS fileName,
//                             ldq.partner_location_codes AS partnerLocationCodes,
//                             ldq.client_id AS clientId,
//                             ldq.started_on AS startedOn,
//                             ldq.completed_on AS completedOn,
//                             ldq.remark AS remark,
//                             ldq.modify_on AS modifyOn,
//                             ldq.modify_by_id AS modifyById,
//                             c.uuid AS clientUuid,
//                             c.name AS clientName,

//                             CASE
//                                 WHEN ldq.user_type = 'ADM' THEN s.uuid 
//                                 WHEN ldq.user_type = 'CLNT' THEN uc.uuid
//                                 WHEN ldq.user_type = 'AdditionalUser' THEN aluc.uuid
//                                 WHEN ldq.user_type = 'SpsnUser' THEN sums.uuid
//                                 ELSE NULL
//                             END AS createdByUuid,

//                             CASE
//                                 WHEN ldq.user_type = 'ADM' THEN s.name
//                                 WHEN ldq.user_type = 'CLNT' THEN uc.name
//                                 WHEN ldq.user_type = 'AdditionalUser' THEN aluc.name
//                                 WHEN ldq.user_type = 'SpsnUser' THEN sums.name
//                                 ELSE NULL
//                             END AS createdByName,

//                             CASE
//                                 WHEN ldq.user_type = 'ADM' THEN 'ADM'
//                                 WHEN ldq.user_type = 'CLNT' THEN 'Client'
//                                 WHEN ldq.user_type = 'AdditionalUser' THEN 'Client User'
//                                 WHEN ldq.user_type = 'SpsnUser' THEN 'Spsn User'
//                                 ELSE 'Unknown'
//                             END AS createdByRole,

//                             JSON_ARRAYAGG(
//                                 JSON_OBJECT(
//                                     'locationUuid', pld.uuid,
//                                     'locationCode', pld.code,
//                                     'locationStoreName', pld.store_name
//                                 )
//                             ) AS partnerLocations

//                         FROM ledger_download_queue AS ldq
//                         LEFT JOIN client c ON c.id = ldq.client_id
//                         LEFT JOIN user u ON u.id = ldq.created_by_id AND (ldq.user_type = 'ADM' OR ldq.user_type = 'CLNT')
//                         LEFT JOIN staff s ON s.current_user_id = u.id AND ldq.user_type = 'ADM'
//                         LEFT JOIN client uc ON uc.linked_user_id = u.id AND ldq.user_type = 'CLNT'
//                         LEFT JOIN additional_login_user alu ON alu.id = ldq.created_by_id AND ldq.user_type = 'AdditionalUser'
//                         LEFT JOIN client aluc ON aluc.id = alu.mapped_id AND ldq.user_type = 'AdditionalUser'
//                         LEFT JOIN spsn_user_master sums ON sums.id = ldq.created_by_id  AND ldq.user_type = 'SpsnUser'

//                         LEFT JOIN partner_location_detail pld ON FIND_IN_SET(pld.code, ldq.partner_location_codes) > 0
//                         WHERE c.uuid = '${clientUuid}'
//                         AND ldq.user_type IS NOT NULL`;

                        

//             if(financialYearId && financialYearId?.toString().length > 0)
//             {
//                  sql = sql + ` AND ldq.financial_year_id = '${financialYearId}' `
//             }


//             if (createdByUuid?.length > 0) {
//                 const uuidConditionsMap = {
//                     'ADM': ['s.uuid'],
//                     'CLNT': ['uc.uuid'],
//                     'AdditionalUser': ['aluc.uuid'],
//                     'SpsnUser': ['sums.uuid']
//                 };
//                 const cols = uuidConditionsMap[userTypeCode] || ['sums.uuid'];
//                 if (cols.length) {
//                     const cond = cols.map(col => `${col} = '${createdByUuid}'`).join(' OR ');
//                     sql += ` AND (${cond})`;
//                 }
//             }

//             if (status?.length > 0) {
//                 sql += ` AND ldq.status = '${status}'`;
//             }

//             if (fromDate?.toString()?.length > 0) {
//                 sql += ` AND DATE(ldq.from_date) >= DATE('${fromDate}')`;
//             }

//             if (toDate?.toString()?.length > 0) {
//                 sql += ` AND DATE(ldq.to_date) <= DATE('${toDate}')`;
//             }

//             sql += ` GROUP BY ldq.id
//                      ORDER BY ldq.created_on DESC`;

//             console.log(sql);

//             pool.query(sql, (error, result) => {
//                 if (error) return reject(error);
//                 resolve(result);
//             });
//         } catch (e) {
//             reject(e);
//         }
//     });
// };


db.getLedgerDownloadQueue = (
    clientUuid,
    createdByUuid,
    status,
    fromDate,
    toDate,
    userTypeCode,
    financialYearId
) => {
    return new Promise((resolve, reject) => {
        try {

            let sql = `
            SELECT 
                ldq.id AS id,
                ldq.from_date AS fromDate,
                ldq.to_date AS toDate, 
                ldq.status AS status,
                ldq.created_on AS createdOn,
                ldq.created_by_id AS createdById,
                ldq.user_type AS userType,
                ldq.file_name AS fileName,
                ldq.partner_location_codes AS partnerLocationCodes,
                ldq.client_id AS clientId,
                ldq.started_on AS startedOn,
                ldq.completed_on AS completedOn,
                ldq.remark AS remark,
                ldq.modify_on AS modifyOn,
                ldq.modify_by_id AS modifyById,
                c.uuid AS clientUuid,
                c.name AS clientName,

                CASE
                    WHEN ldq.user_type = 'ADM' THEN s.uuid 
                    WHEN ldq.user_type = 'CLNT' THEN uc.uuid
                    WHEN ldq.user_type = 'AdditionalUser' THEN aluc.uuid
                    WHEN ldq.user_type = 'SpsnUser' THEN sums.uuid
                    WHEN ldq.user_type = 'SpsnExtendedUser' THEN seu.uuid
                    ELSE NULL
                END AS createdByUuid,

                CASE
                    WHEN ldq.user_type = 'ADM' THEN s.name
                    WHEN ldq.user_type = 'CLNT' THEN uc.name
                    WHEN ldq.user_type = 'AdditionalUser' THEN aluc.name
                    WHEN ldq.user_type = 'SpsnUser' THEN sums.name
                    WHEN ldq.user_type = 'SpsnExtendedUser' THEN seu.name
                    ELSE NULL
                END AS createdByName,

                CASE
                    WHEN ldq.user_type = 'ADM' THEN 'ADM'
                    WHEN ldq.user_type = 'CLNT' THEN 'Client'
                    WHEN ldq.user_type = 'AdditionalUser' THEN 'Client User'
                    WHEN ldq.user_type = 'SpsnUser' THEN 'Spsn User'
                    WHEN ldq.user_type = 'SpsnExtendedUser' THEN 'Extended SPSN User'
                    ELSE 'Unknown'
                END AS createdByRole,

                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'locationUuid', pld.uuid,
                        'locationCode', pld.code,
                        'locationStoreName', pld.store_name
                    )
                ) AS partnerLocations

            FROM ledger_download_queue ldq
            LEFT JOIN client c ON c.id = ldq.client_id
            LEFT JOIN user u ON u.id = ldq.created_by_id 
                AND (ldq.user_type = 'ADM' OR ldq.user_type = 'CLNT')
            LEFT JOIN staff s ON s.current_user_id = u.id AND ldq.user_type = 'ADM'
            LEFT JOIN client uc ON uc.linked_user_id = u.id AND ldq.user_type = 'CLNT'
            LEFT JOIN additional_login_user alu 
                ON alu.id = ldq.created_by_id AND ldq.user_type = 'AdditionalUser'
            LEFT JOIN client aluc ON aluc.id = alu.mapped_id AND ldq.user_type = 'AdditionalUser'
            LEFT JOIN spsn_user_master sums 
                ON sums.id = ldq.created_by_id AND ldq.user_type = 'SpsnUser'
            LEFT JOIN spsn_extended_user seu
                ON seu.id = ldq.created_by_id AND ldq.user_type = 'SpsnExtendedUser'

            LEFT JOIN partner_location_detail pld 
                ON FIND_IN_SET(pld.code, ldq.partner_location_codes) > 0
            `;

            /* ---------- ASM / RSM / NSM VISIBILITY ---------- */
            if (['ASM', 'RSM', 'NSM'].includes(userTypeCode)) {

                sql += `
                INNER JOIN spsn_extended_user_partner_location_map euplm
                    ON euplm.partner_location_id = pld.id
                    AND euplm.is_active = 1
                    AND euplm.designation_code = '${userTypeCode}'
                INNER JOIN spsn_extended_user seu_filter
                    ON seu_filter.id = euplm.extended_user_id
                    AND seu_filter.uuid = '${createdByUuid}'
                `;

            }

            /* ---------- COMMON WHERE ---------- */
            sql += `
            WHERE c.uuid = '${clientUuid}'
            AND ldq.user_type IS NOT NULL
            `;

            if (financialYearId?.toString()?.length > 0) {
                sql += ` AND ldq.financial_year_id = '${financialYearId}'`;
            }

            /* ---------- CREATED BY FILTER ---------- */
            if (
                createdByUuid?.length > 0 &&
                !['ASM', 'RSM', 'NSM'].includes(userTypeCode)
            ) {
                const uuidConditionsMap = {
                    'ADM': ['s.uuid'],
                    'CLNT': ['uc.uuid'],
                    'AdditionalUser': ['aluc.uuid'],
                    'SpsnUser': ['sums.uuid']
                };
                const cols = uuidConditionsMap[userTypeCode] || ['sums.uuid'];
                const cond = cols.map(col => `${col} = '${createdByUuid}'`).join(' OR ');
                sql += ` AND (${cond})`;
            }

            if (status?.length > 0) {
                sql += ` AND ldq.status = '${status}'`;
            }

            if (fromDate?.toString()?.length > 0) {
                sql += ` AND DATE(ldq.from_date) >= DATE('${fromDate}')`;
            }

            if (toDate?.toString()?.length > 0) {
                sql += ` AND DATE(ldq.to_date) <= DATE('${toDate}')`;
            }

            sql += `
            GROUP BY ldq.id
            ORDER BY ldq.created_on DESC
            `;

            pool.query(sql, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });

        } catch (e) {
            reject(e);
        }
    });
};


db.getClientUploadedSpsnDocuments = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                            csud.id AS documentId,
                            csud.document_file_name AS fileName,
                            csud.document_file_path AS filePath,
                            dc.id AS documentCategoryId,
                            dc.code AS documentCategoryCode,
                            dc.name AS documentCategoryName,
                            csud.document_id AS documentId,
                            csud.document_attachment_id AS documentAttachmentId,
                            su.name AS spsnName,
                            su.uuid AS spsnUuid,
                            su.spsn_code AS spsnCode,
                            fy.id AS financialYearId,
                            fy.name AS financialYearName,
                            c.uuid AS clientUuid,
                            c.name AS clientName,
                            csud.month_period AS monthPeriod,
                            csud.encryption_key AS encryptionKey,
                            csud.encryption_iv AS encryptionIV
                        FROM 
                            client_spsn_upload_document csud
                        LEFT JOIN 
                            document_category dc ON csud.document_category_id = dc.id
                        LEFT JOIN 
                            spsn_user_master su ON csud.spsn_id = su.id
                        LEFT JOIN 
                            financial_year fy ON csud.financial_year_id = fy.id
                        LEFT JOIN 
                            client c ON csud.client_id = c.id
                        WHERE 
                            csud.id = '${id}';
`

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
db.getOpeningBalance = (codes, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                            id, 
                            partner_location_id AS customerId,  
                            partner_location_code AS customerCode, 
                            opening_balance AS openingBalance, 
                            created_on AS createdOn, 
                            modify_on AS modifiedOn
                        FROM 
                            customer_opening_balance_master
                        WHERE 
                            partner_location_code IN ('${codes}')
                        AND financial_year_id = '${financialYearId}';
                        `


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


db.getPartnerLocationDataByLocationCodes = (locationCodes) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.* 
            FROM partner_location_detail pld
            WHERE FIND_IN_SET(code, '${locationCodes}') > 0 `
                        
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
db.getSpsnDataByCode = (code) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT * 
                FROM spsn_user_master 
                WHERE code = '${code}'`

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
db.getSpsnDataByUuid = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT * 
                FROM spsn_user_master 
                WHERE uuid = '${uuid}'`

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


db.getPartnerLocationDataByUuids = (uuids) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.* 
            FROM partner_location_detail pld
            WHERE FIND_IN_SET(uuid, '${uuids}') > 0 `
                        
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
        else if(documentCategoryName == 'Ledger')
        {
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
        else if(documentCategoryName == 'Transaction')
        {
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
        else if(documentCategoryName == 'Ledger')
        {
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
        else if(documentCategoryName == 'Transaction')
        {
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


module.exports = db
