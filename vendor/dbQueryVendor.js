let pool = require('../databaseConnection/createconnection')
const uniqueFunction = require('../common/commonFunction/uniqueSearchFunction');
let db = {}

db.saveVendor = (uuid, name, partnerCategoryId, isActive, createdOn, createdById, email, mobile, password, passKey, additionalInfo) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner (uuid, name, partner_category_id, is_active, created_on, created_by_id, email, mobile, password, is_additional_info) VALUES ('${uuid}', '${name}', '${partnerCategoryId}', '${isActive}', ?, '${createdById}', '${email}', '${mobile}', HEX(AES_ENCRYPT('${password}', '${passKey}')), '${additionalInfo}')`
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

db.saveClientPartnerMapping = (partnerId, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_client_mapping (partner_id, client_id) VALUES ('${partnerId}', '${clientId}')`
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

db.saveVendorAddiInfo = (partnerId, name, createdOn, createdById, tempId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_additional_info (partner_id, vendor_status_id, created_on, created_by_id, registration_initiated_on, registration_initiated_by, temp_id, is_submitted) VALUES ('${partnerId}', (SELECT id FROM vendor_status WHERE name = '${name}'), ?, '${createdById}',?, '${createdById}', '${tempId}', 0)`
            pool.query(sql, [createdOn, createdOn], (error, result) => {
                if (error) {
                    return resolve({ result: true, error });
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getCategory = (isActive, code) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, code, name FROM partner_category WHERE is_active = '${isActive}' AND code = '${code}'`
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

db.getClient = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT c.id, c.email, c.name, c.code, cst.id AS clientServiceTypeId, cst.name AS clientServiceTypeName
                        FROM client c
                        LEFT JOIN client_service_type cst ON cst.id = c.service_type_id
                        WHERE c.uuid = '${uuid}'`
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

db.getClientUuid = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT c.id, c.uuid, c.email, c.name, c.code, cst.id AS clientServiceTypeId, cst.name AS clientServiceTypeName
                        FROM client c
                        LEFT JOIN client_service_type cst ON cst.id = c.service_type_id
                        WHERE c.id = '${id}'`
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

db.getVendorStatuses = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, name FROM vendor_status;`
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

db.getVendors = (clientUuid, statusId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
			p.id, 
			p.uuid, 
			p.name, 
			p.pan, 
			p.is_active AS isActive, 
			p.created_on AS createdOn, 
			p.modify_on AS modifyOn,
			p.email, 
			p.mobile, 
			pc.id AS vendorCategoryId, 
			pc.name AS vendorCategoryName, 
			pc.code AS vendorCategoryCode, 
			pai.temp_id AS tempId, 
			vs.id AS statusId, 
			vs.name AS statusName,
			pai.name2, 
			pai.email2,
			pai.is_submitted AS isSubmitted,  
			pai.doc_state, 
			pai.vendor_doc_submitted_on AS vendorDocSubmittedOn, 
			pai.infomap_doc_modified_on AS infomapDocModifiedOn, 
			pai.registration_initiated_on AS registrationInitiatedOn, 
			pai.document_submitted_on AS documentSubmittedOn, 
			pai.document_validated_on AS documentValidatedOn, 
			pai.onboarded_on AS onboardedOn, 
            pai.sap_code AS sapCode, 
			IF(pai.is_submitted = 0,'Initiated',IF(pai.is_submitted = 1, 'Draft', 'Submitted')) AS formMode, 
			clnt.name AS clientName,  
			clnt.uuid AS clientUuid
            FROM partner p
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client clnt ON clnt.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.is_active = 1 
            AND pc.code = 'V'`

            if (clientUuid?.toString()?.length > 0) {
                sql = sql + ` AND pcm.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}')`
            }

            if (statusId?.toString()?.length > 0) {
                sql = sql + ` AND vs.id = '${statusId}'`
            }

            // sql = sql + `  GROUP BY p.id`
            sql = sql + `  ORDER BY p.name`

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

db.getVendorsWithoutBCLndNDC = (clientUuid, status, documentCategoryId, ledgerDocumentCategoryId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT distinct p.id, 
                p.uuid, 
                p.name, 
                p.email, 
                p.mobile, 
                pc.id AS vendorCategoryId, 
                pc.name AS vendorCategoryName, 
                pc.code AS vendorCategoryCode, 
                pai.sap_code AS sapCode, 
                clnt.name AS clientName,  
                clnt.uuid AS clientUuid
            FROM partner p  
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
                        LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
                        LEFT JOIN client clnt ON clnt.id = pcm.client_id
                        LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
                        LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            LEFT JOIN balance_confirmation_and_no_due_log b 
                ON p.id = b.vendor_id 
                AND MONTH(b.initiation_date) = MONTH(CURRENT_DATE()) 
                AND YEAR(b.initiation_date) = YEAR(CURRENT_DATE())
                AND b.document_category_id = ${documentCategoryId}
            INNER JOIN client_uploaded_vendor_doc_master c
                ON p.id = c.partner_id 
                AND c.document_category_id = ${ledgerDocumentCategoryId}
            WHERE b.id IS NULL
                AND p.is_active = 1 
                AND pc.code = 'V' 
                AND vs.name = '${status}'`

            if (clientUuid?.toString()?.length > 0) {
                sql = sql + ` AND pcm.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}')`
            }

            sql = sql + `  ORDER BY p.name`

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
            let sql = `SELECT vdc.id, vdc.name, vdc.code 
            FROM vendor_document_category vdc
            WHERE vdc.is_active = 1`
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



db.getPurchaseOrders = (clientUuid, vendorUuid, fromDate, toDate) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
            p.uuid AS vendorUuid, 
            p.name AS vendorName,  
            p.email AS vendorEmail, 
            p.mobile AS vendorMobile, 
            pc.id AS vendorCategoryId, 
            pc.name AS vendorCategoryName, 
            pc.code AS vendorCategoryCode,  
            clnt.name AS clientName,  
            clnt.uuid AS clientUuid,
            vpo.po_number AS poNumber,
            vpo.po_date AS poDate,
            vpo.description,
            vpo.id,
            vpo.value,
            vpo.created_on AS createdOn,
            vpo.modify_on AS modifyOn,
            vpo.pdf_file_path AS pdfFilePath
            FROM vendor_purchase_order vpo
            LEFT JOIN partner p ON p.id = vpo.vendor_id
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client clnt ON clnt.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
            WHERE p.is_active = 1 `

            if (clientUuid?.toString()?.length > 0) {
                sql = sql + ` AND clnt.uuid = '${clientUuid}'`
            }

            if (vendorUuid?.toString()?.length > 0) {
                sql = sql + ` AND p.uuid = '${vendorUuid}'`
            }

            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(vpo.po_date) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(vpo.po_date) <= DATE('${toDate}')`
            }

            sql = sql + `  ORDER BY vpo.po_date DESC`

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



db.getVendorInvoices = (clientUuid, vendorUuid, fromDate, toDate) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
            p.uuid AS vendorUuid, 
            p.name AS vendorName,  
            p.email AS vendorEmail, 
            p.mobile AS vendorMobile, 
            pc.id AS vendorCategoryId, 
            pc.name AS vendorCategoryName, 
            pc.code AS vendorCategoryCode,  
            clnt.name AS clientName,  
            clnt.uuid AS clientUuid,
            vpo.po_number AS poNumber,
            vi.id,
            vi.invoice_number AS invoiceNumber,
            vi.invoice_date AS invoiceDate,
            vi.amount,
            vi.created_on AS createdOn,
            vi.modify_on AS modifyOn,
            vi.pdf_file_path AS pdfFilePath
            FROM vendor_invoice vi
            LEFT JOIN vendor_purchase_order vpo ON vpo.id = vi.vendor_purchase_order_id
            LEFT JOIN partner p ON p.id = vpo.vendor_id
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client clnt ON clnt.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
            WHERE p.is_active = 1 `

            if (clientUuid?.toString()?.length > 0) {
                sql = sql + ` AND clnt.uuid = '${clientUuid}'`
            }

            if (vendorUuid?.toString()?.length > 0) {
                sql = sql + ` AND p.uuid = '${vendorUuid}'`
            }

            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(vi.invoice_date) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(vi.invoice_date) <= DATE('${toDate}')`
            }

            sql = sql + `  ORDER BY vi.invoice_date DESC`

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

db.getVendorInvoiceNumber = (invoiceNumber) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(vi.id) > 0, 1, 0) AS invoiceNumberExists
            FROM vendor_invoice vi 
            WHERE vi.invoice_number = '${invoiceNumber}'`



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

db.getVendorPONumber = (poNumber) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(vi.id) > 0, 1, 0) AS poNumberExists
            FROM vendor_invoice vi 
            LEFT JOIN vendor_purchase_order vpo ON vpo.id = vi.vendor_purchase_order_id
            WHERE vpo.po_number = '${poNumber}'`

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



db.getDocumentTimelines = (vendorUuid, status) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT dt.id, dt.file_name AS fileName, dt.status, dt.remark, dt.uploaded_on AS uploadedOn, u.id AS uploadedById, u.name AS uploadedByName 
                FROM document_timeline dt 
                LEFT JOIN partner p ON p.id = dt.vendor_id
                LEFT JOIN user u ON u.id = dt.uploaded_by_id
                WHERE p.uuid = '${vendorUuid}'
                AND dt.status = '${status}' `

            sql = sql + `  ORDER BY dt.uploaded_on DESC`

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

db.getVendor = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
            p.id, 
            p.uuid, 
            p.name, 
            p.pan, 
            p.is_active AS isActive, 
            p.created_on AS createdOn, 
            p.modify_on AS modifyOn,
            p.email, 
            p.mobile, 
            pc.id AS vendorCategoryId, 
            pc.name AS vendorCategoryName, 
            pc.code AS vendorCategoryCode, 
            pai.temp_id AS tempId, 
            vs.id AS statusId, 
            vs.name AS statusName,
            pai.name2, 
            pai.email2,
            pai.landline_no AS landlineNo, 
            pai.gstin, 
            p.pan,  
            pai.address1, pai.address2, 
            ct.id AS cityId, 
            ct.name AS cityName,  
            s.id AS stateId, 
            s.name AS stateName,
            c.id AS countryId,
            c.name AS countryName, 
            pai.pincode AS postalCode, 
            bm.id AS bankId, 
            bm.name AS bankName, 
            pai.branch_name AS branchName, 
            pai.bank_account_number AS bankAccountNumber, 
            pai.ifsc_code AS ifscCode, 
            pai.bank_address AS bankAddress, 
            pai.is_form_validated AS isFormValidated,  
            pai.is_submitted AS isSubmitted,  
            pai.doc_state, 
            pai.sap_code AS sapCode, 
            pai.vendor_doc_submitted_on AS vendorDocSubmittedOn, 
            pai.infomap_doc_modified_on AS infomapDocModifiedOn, 
            pai.registration_initiated_on AS registrationInitiatedOn, 
            pai.document_submitted_on AS documentSubmittedOn, 
            pai.document_validated_on AS documentValidatedOn, 
            pai.onboarded_on AS onboardedOn, 
            IF(pai.is_submitted = 0,'Initiated',IF(pai.is_submitted = 1, 'Draft', 'Submitted')) AS formMode, 
            clnt.name AS clientName,  
            clnt.uuid AS clientUuid
            FROM partner p
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client clnt ON clnt.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id 
            LEFT JOIN bank_master bm ON bm.id = pai.bank_id
            LEFT JOIN country c ON c.id = pai.country_id
            LEFT JOIN state s ON s.id = pai.state_id
            LEFT JOIN city ct ON ct.id = pai.city_id
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.is_active = 1 
            AND pc.code = 'V'
            AND p.uuid = '${uuid}'`

            // sql = sql + `  GROUP BY p.id`

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

db.getVendorRegistrationForm = (partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT p.uuid, 
            p.name, 
            pai.name2, 
            p.email, 
            pai.email2,
            p.mobile, 
            pai.landline_no AS landlineNo, 
            pai.gstin, 
            p.pan,  
            pai.address1, pai.address2, 
            ct.id AS cityId, 
            ct.name AS cityName,  
            s.id AS stateId, 
            s.name AS stateName,
            c.id AS countryId,
            c.name AS countryName, 
            pai.pincode AS postalCode, 
            bm.id AS bankId, 
            bm.name AS bankName, 
            pai.branch_name AS branchName, 
            pai.bank_account_number AS bankAccountNumber, 
            pai.ifsc_code AS ifscCode, 
            pai.bank_address AS bankAddress, 
            pai.is_submitted AS isSubmitted, 
            pai.is_form_validated AS isFormValidated,  
            pai.temp_id AS tempId, 
            IF(pai.is_submitted = 0,'Initiated',IF(pai.is_submitted = 1, 'Draft', 'Submitted')) AS formMode, clnt.name AS clientName, clnt.email AS clientEmail, 
            CONCAT(TRIM(CONCAT(clnt.address_line1, ' ',  IFNULL(clnt.address_line2, ''), ' ', IFNULL(clnt.address_line3, ''))), ' - ', clnt.mobile) AS clientFullAddress, 
            clnt.short_logo_file_path AS clientShortLogoPath, clnt.pan AS clientPan, 
            vs.id AS vendorStatusId, vs.name AS vendorStatusName   
            FROM partner p 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client clnt ON clnt.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id 
            LEFT JOIN bank_master bm ON bm.id = pai.bank_id
            LEFT JOIN country c ON c.id = pai.country_id
            LEFT JOIN state s ON s.id = pai.state_id
            LEFT JOIN city ct ON ct.id = pai.city_id
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.id = '${partnerId}'`

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

db.getVendorUploadDocuments = (partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT vd.id AS id, vd.file_name AS fileName, vd.is_infomap_verified AS isInfomapVerified, vd.is_client_verified AS isClientVerified, 
                                vd.file_path AS filePath, 
                                vd.encryption_key AS encryptionKey,
                                vd.encryption_iv AS encryptionIV, 
                                cvadm.id AS clientVendorDocumentId, cvadm.file_name AS clientVendorDocumentFileName, cvadm.is_required AS isRequired, cvadm.is_duly_signed AS isDulySigned, 
                                cvadm.client_id AS clientId, cvad.name AS clientVendorAttachmentName
            FROM vendor_document vd
            LEFT JOIN client_vendor_attachment_document_mapping cvadm ON cvadm.id = vd.client_vendor_document_mapping_id
            LEFT JOIN client_vendor_attachment_document_master cvad ON cvad.id = cvadm.client_vendor_attachment_doc_id 
            WHERE vd.partner_id = '${partnerId}'`


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

db.getClientVendorUploadDocument = (vendorUploadId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                vd.id AS id, 
                vd.file_name AS fileName, 
                vd.is_infomap_verified AS isInfomapVerified, 
                vd.is_client_verified AS isClientVerified, 
                vd.file_path AS filePath, 
                vd.encryption_key AS encryptionKey,
                vd.encryption_iv AS encryptionIV, 
                cvadm.id AS clientVendorDocumentId, 
                cvadm.file_name AS clientVendorDocumentFileName,  
                cvadm.is_required AS isRequired, 
                cvadm.is_duly_signed AS isDulySigned, 
                cvadm.file_path AS clientVendorDocumentFilePath,
                cvadm.encryption_key AS clientVendorDocumentEncryptionKey,
                cvadm.encryption_iv AS clientVendorDocumentEncryptionIV,
                cvad.name AS clientVendorAttachmentName, 
                p.uuid AS partnerUuid, 
                p.name AS partnerName, 
                p.id AS partnerId, 
                c.id AS clientId, 
                c.uuid AS clientUuid, 
                c.name AS clientName 

            FROM vendor_document vd
            LEFT JOIN client_vendor_attachment_document_mapping cvadm ON cvadm.id = vd.client_vendor_document_mapping_id
            LEFT JOIN client_vendor_attachment_document_master cvad ON cvad.id = cvadm.client_vendor_attachment_doc_id 
            LEFT JOIN partner p ON p.id = vd.partner_id
            LEFT JOIN client c ON c.id = cvadm.client_id
            WHERE vd.id = '${vendorUploadId}'`


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

db.getPOFile = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT vpo.id AS id, vpo.pdf_file_path AS filePath, vpo.pdf_encryption_key AS encryptionKey, vpo.pdf_encryption_iv AS encryptionIV, vpo.vendor_id AS vendorId  
            FROM vendor_purchase_order vpo
            WHERE vpo.id = '${id}'`
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

db.getInvoiceFile = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT vi.id AS id, vi.pdf_file_path AS filePath, vi.pdf_encryption_key AS encryptionKey, vi.pdf_encryption_iv AS encryptionIV, vi.vendor_id AS vendorId  
            FROM vendor_invoice vi
            WHERE vi.id = '${id}'`


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

db.getVendorDocument = (id, partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = ` SELECT 
                                vd.id AS id, 
                                vd.file_name AS fileName, 
                                vd.file_path AS filePath, 
                                vd.encryption_key AS encryptionKey,
                                vd.encryption_iv AS encryptionIV, 
                                cvadm.id AS clientVendorDocumentId, 
                                cvadm.file_name AS clientVendorDocumentFileName, 
                                cvadm.is_required AS isRequired, 
                                cvadm.is_duly_signed AS isDulySigned, 
                                cvadm.client_id AS clientId,
                                cvad.name AS clientVendorAttachmentName
                        FROM vendor_document vd
                        LEFT JOIN client_vendor_attachment_document_mapping cvadm ON cvadm.id = vd.client_vendor_document_mapping_id
                        LEFT JOIN client_vendor_attachment_document_master cvad ON cvad.id = cvadm.client_vendor_attachment_doc_id
                        WHERE vd.partner_id = '${partnerId}'
                        AND vd.id = '${id}'`


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

db.getClientVendorDocumentMappings = (clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id FROM client_vendor_attachment_document_mapping WHERE client_id = '${clientId}'`
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

db.saveVendorDocument = (partnerId, clientVendorDocId, createdOn, createdById) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO vendor_document (partner_id, client_vendor_document_mapping_id, attached_on, attached_by_id)
            VALUES ('${partnerId}', '${clientVendorDocId}', ?, '${createdById}')`
            pool.query(sql, [createdOn], (error, result) => {
                if (error) {
                    return resolve({ result: true, error });
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.getPartnerAdditionalInfo = (partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id FROM partner_additional_info WHERE partner_id = '${partnerId}';`
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

db.updatePan = (partnerId, pan) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner SET pan = '${pan}' WHERE id = '${partnerId}'`
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

db.getPartner = (partnerUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT p.id, pai.doc_state AS docState, vs.name AS vendorStatusName, vs.id AS vendorStatusId, pai.is_submitted AS isSubmitted, pai.is_form_validated AS isFormValidated, c.id AS clientId, c.uuid AS clientUuid, pai.sap_code AS vendorCode     
            FROM partner p 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id 
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.uuid = '${partnerUuid}'`
            // console.log(sql);
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

db.getVendorData = (vendorStatus) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT p.id, vs.name AS vendorStatusName, vs.id AS vendorStatusId, pai.sap_code AS sapCode
            FROM partner p 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id 
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE vs.name = '${vendorStatus}' 
            AND pai.sap_code IS NOT NULL OR pai.sap_code != ''`
            // console.log(sql);
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

db.getPOData = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT vpo.po_number AS poNumber 
            FROM vendor_purchase_order vpo;`
            // console.log(sql);
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

db.getPODataForPdf = (clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            // let sql = `SELECT vpo.po_number AS poNumber, vpo.vendor_id AS vendorId  
            // FROM vendor_purchase_order vpo 
            // WHERE vpo.pdf_file_path IS NULL OR vpo.pdf_file_path = '' `

            let sql = `SELECT vpo.po_number AS poNumber, vpo.vendor_id AS vendorId, p.uuid AS vendorUuid, c.id AS clientId, c.uuid AS clientUuid, pai.sap_code AS vendorCode    
                FROM vendor_purchase_order vpo 
                LEFT JOIN partner p ON p.id = vpo.vendor_id
                LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id
                LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
                LEFT JOIN client c ON c.id = pcm.client_id
                WHERE vpo.pdf_file_path IS NULL OR vpo.pdf_file_path = '' 
                AND c.uuid = '${clientUuid}'`
            // console.log(sql); 
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

db.getPODataForInvoice = (poNumber) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT vpo.po_number AS poNumber, vpo.id  
            FROM vendor_purchase_order vpo 
            WHERE vpo.po_number = '${poNumber}'`
            // console.log(sql);
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
db.getInvoiceData = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT vi.invoice_number AS invoiceNumber, vi.id  
            FROM vendor_invoice vi`
            // console.log(sql);
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

db.updateVendorDocument = (vendorDocumentId, fileName, uploadedOn, uploadedBy, filePath, encryptionKey, encryptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE vendor_document SET file_name = ?, uploaded_on = ?, uploaded_by_id = ?, file_path = ?, encryption_key = ?, encryption_iv = ? WHERE id = '${vendorDocumentId}'`
            pool.query(sql, [fileName, uploadedOn, uploadedBy, filePath, encryptionKey, encryptionIV], (error, result) => {
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

db.updatePartnerAdditionalInfo = (sql, values) => {
    return new Promise((resolve, reject) => {
        try {
            pool.query(sql, values, (error, result) => {
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

db.submitVendorDocuments = (partnerId, date, status, docState, isSubmitted) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_additional_info SET vendor_status_id = (SELECT id FROM vendor_status WHERE name = '${status}'), doc_state = '${docState}', vendor_doc_submitted_on =?, vendor_doc_submitted_by = '${partnerId}', document_submitted_on = ?, document_submitted_by = '${partnerId}', is_submitted = '${isSubmitted}'
            WHERE partner_id = '${partnerId}'`

            pool.query(sql, [date, date, date], (error, result) => {
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

db.submitVendorValidation = (partnerId, date, status, docState, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_additional_info SET vendor_status_id = (SELECT id FROM vendor_status WHERE name = '${status}'), document_validated_on = ?, document_validated_by = '${userId}'
            WHERE partner_id = '${partnerId}'`

            pool.query(sql, [date, date, date], (error, result) => {
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

db.submitVendorApproval = (partnerId, date, status, sapCode, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_additional_info SET vendor_status_id = (SELECT id FROM vendor_status WHERE name = '${status}'), onboarded_on = ?, onboarded_by = '${userId}', sap_code = '${sapCode}' 
            WHERE partner_id = '${partnerId}'`

            pool.query(sql, [date, date, date], (error, result) => {
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

db.validateVendorDocumentByClient = (partnerId, date, isClientVerified, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE vendor_document SET is_client_verified = '${isClientVerified}', client_verified_on =?, client_verified_by_id = '${userId}' 
            WHERE partner_id = '${partnerId}'`

            pool.query(sql, [date], (error, result) => {
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

db.vendorFormValidation = (partnerId, date, isFormValidated, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_additional_info SET is_form_validated = '${isFormValidated}', validated_on =?, validated_by_id = '${userId}' 
            WHERE partner_id = '${partnerId}'`

            pool.query(sql, [date, date, date], (error, result) => {
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

db.updateVendorDocumentValidation = (partnerId, date, docState, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_additional_info SET doc_state = '${docState}', infomap_doc_modified_on =?, infomap_doc_modified_by_id = '${userId}' 
            WHERE partner_id = '${partnerId}'`

            pool.query(sql, [date], (error, result) => {
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

db.validateVendorDocument = (vendorDocumentId, date, isInfomapVerified, userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE vendor_document SET is_infomap_verified = '${isInfomapVerified}', infomap_verified_on =?, infomap_verified_by_id = '${userId}' 
            WHERE id = '${vendorDocumentId}'`

            pool.query(sql, [date], (error, result) => {
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

db.saveDocumentTimeline = (fileName, partnerId, status, createdOn, createdById, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO document_timeline (file_name, vendor_id, status, created_on, created_by_id, local_file_path) VALUES ('${fileName}', '${partnerId}', '${status}', ?, '${createdById}', '${filePath}')`
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

db.saveDataTransactLog = (activity, user, partnerUuid, locationUuid, fileSize, apiName, storageType, createdOn, clientId, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}','${partnerUuid}','${locationUuid}','${fileSize}','${apiName}','${storageType}',?, '${clientId}', '${fileName}')`
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

db.getDocumentTimeline = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT dt.id, dt.file_name AS fileName, dt.encryption_iv AS  encryptionIV, dt.encryption_key AS encryptionKey, dt.local_file_path AS localFilePath, dt.vendor_id AS vendorId, dt.remark, dt.uploaded_file_path AS uploadedFilePath, dt.status 
                FROM document_timeline dt WHERE dt.id = '${id}'`
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

db.updateDocumentTimeline = (id, date, status, userId, encryptionIV, encryptionKey, uploadedFilePath, remark) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE document_timeline SET  encryption_iv = '${encryptionIV}', encryption_key = '${encryptionKey}', 
            uploaded_file_path = '${uploadedFilePath}', remark  = ?, status = '${status}', uploaded_on = ?, uploaded_by_id = '${userId}'
            WHERE id = '${id}';`

            pool.query(sql, [remark, date], (error, result) => {
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

db.getInfomapAdmin = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT u.id AS userId, u.name AS userName, u.linked_to_id AS userLinkedToId, u.role_id AS userRoleId, u.uuid AS userUuid, s.id AS staffId, s.name AS staffName, s.email AS staffEmail, s.mobile AS staffMobile, s.address AS staffAddress,
            r.id AS roleId, r.code AS roleCode, r.name AS roleName 
                FROM user u
                JOIN role r ON r.id = u.role_id
                LEFT JOIN staff s ON s.id = u.linked_to_id AND s.is_active = 1
                WHERE u.is_active = 1
                AND r.code = 'ADM'`
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

db.savePO = (data) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO vendor_purchase_order (vendor_id,po_number,po_date,description,value,created_on,created_by_id) VALUES('${data.vendorId}','${data.poNumber}',?,'${data.description}','${data.value}',?,'${data.createdById}');`
            pool.query(sql, [data.poDate, data.createdOn], (error, result) => {
                if (error) {
                    return resolve({ result: true, error: error?.stack || error?.message || error });
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.updatePOpdf = (poNumber, pdfFilePath, uploadedOn, uploadedById, encryptionKey, encryptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            // pdf_encryption_key
            let sql = `UPDATE vendor_purchase_order SET pdf_file_path = '${pdfFilePath}', pdf_uploaded_on = ?,pdf_uploaded_by_id = '${uploadedById}', pdf_encryption_key = ?, pdf_encryption_iv = ? WHERE po_number = '${poNumber}'`
            pool.query(sql, [uploadedOn, encryptionKey, encryptionIV], (error, result) => {
                if (error) {
                    return resolve({ result: true, error: error?.stack || error?.message || error });
                }
                return resolve(result);
            });
        }
        catch (e) {
            throw e
        }
    })
}

db.saveInvoice = (vendorUuid, poId, invoiceNumber, invoiceDate, amount, createdOn, createdById, pdfFilePath, encryptionKey, encryptionIV, description) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO vendor_invoice (vendor_id,vendor_purchase_order_id,invoice_number,invoice_date,created_on,created_by_id,amount,pdf_file_path, pdf_encryption_key, pdf_encryption_iv, description) VALUES((SELECT id FROM partner WHERE uuid = '${vendorUuid}'),'${poId}','${invoiceNumber}',?,?,'${createdById}','${amount}','${pdfFilePath}', ?, ?, '${description}');`
            pool.query(sql, [invoiceDate, createdOn, encryptionKey, encryptionIV], (error, result) => {
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
db.getAdminUser = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT s.id, s.email, s.name
                        FROM staff s
                        JOIN user u  ON u.linked_to_id = s.current_user_id
                        LEFT JOIN role r ON r.id = u.role_id
                        WHERE r.code = 'ADM';`
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


db.getRegisteredVendorRegistrationForm = (partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            
            let sql = `SELECT p.uuid, 
            p.name, 
            pai.name2, 
            p.email, 
            pai.email2,
            p.mobile, 
            pai.landline_no AS landlineNo, 
            pai.gstin, 
            p.pan,  
            pai.address1, 
            pai.address2,
            ct.name AS cityName,  
            s.name AS stateName,
            c.name AS countryName, 
            pai.pincode AS postalCode, 
            clnt.code AS clientCode  
            FROM partner p 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client clnt ON clnt.id = pcm.client_id
            LEFT JOIN partner_additional_info pai ON pai.partner_id = p.id 
            LEFT JOIN bank_master bm ON bm.id = pai.bank_id
            LEFT JOIN country c ON c.id = pai.country_id
            LEFT JOIN state s ON s.id = pai.state_id
            LEFT JOIN city ct ON ct.id = pai.city_id
            LEFT JOIN vendor_status vs ON vs.id = pai.vendor_status_id
            WHERE p.id = '${partnerId}'`

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




module.exports = db