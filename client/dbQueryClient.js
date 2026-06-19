let pool = require('../databaseConnection/createconnection')
let db = {}

db.saveClient = (uuid, name, shortName, code, email, mobile, addressLine1, addressLine2, addressLine3, gstin, pan, tan, city, stateId, pincode, createdById, createdOn, isActive, fullLogoFilePath, shortLogoFilePath, companyName, serviceTypeId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO client (uuid, name, short_name, code, email, mobile, gstin, pan, tan, address_line1, address_line2, address_line3, city, state_id, pincode, created_on, created_by_id, is_active, full_logo_file_path, short_logo_file_path, company_name, service_type_id) VALUES ('${uuid}', '${name}', '${shortName}', '${code}', '${email}', '${mobile}', '${gstin}', '${pan}', '${tan}', '${addressLine1}', '${addressLine2}', '${addressLine3}', '${city}', '${stateId}', '${pincode}', ?, ${createdById}, ${isActive}, '${fullLogoFilePath}', '${shortLogoFilePath}', '${companyName}', '${serviceTypeId}')`
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

db.saveClientSftpMaster = (clientId,sftpHost, sftpPort, sftpUsername, sftpPassword, sftpAlgorithm, sftpBaseFolder, fileStoreTo, rawFileMailTo, fromEmail, fromName, isFtpConnected, ftpDescription, createdOn,createdById, supportTeam, supportContactNo, supportEmail) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO client_ftp_master (client_id,sftp_host,sftp_port,sftp_algorithm,sftp_username,sftp_password,sftp_base_folder,file_store_to, raw_file_mail_to,from_email,from_name,is_ftp_connected,ftp_description,created_on,created_by_id,support_team,support_contact_no,support_email) VALUES('${clientId}','${sftpHost}','${sftpPort}','${sftpAlgorithm}','${sftpUsername}','${sftpPassword}','${sftpBaseFolder}', '${fileStoreTo}','${rawFileMailTo}','${fromEmail}','${fromName}','${isFtpConnected}','${ftpDescription}',?,'${createdById}','${supportTeam}','${supportContactNo}','${supportEmail}');`
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

db.updateClient = (uuid, name, shortName, code, email, mobile, addressLine1, addressLine2, addressLine3, gstin, pan, tan, city, stateId, pincode, modifyById, modifyOn, isActive, companyName) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE client SET name = '${name}', short_name = '${shortName}', code = '${code}', email = '${email}', mobile = '${mobile}', gstin = '${gstin}', pan = '${pan}', tan = '${tan}', address_line1 = '${addressLine1}', address_line2 = '${addressLine2}', address_line3 = '${addressLine3}', city = '${city}', state_id = '${stateId}', pincode = '${pincode}', modify_on = ?, modify_by_id = '${modifyById}', is_active = ${isActive}, company_name = '${companyName}' 
            WHERE  uuid = '${uuid}'`
            pool.query(sql, [modifyOn], (error, result) => 
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


db.saveClientVendorDocMapping = (clientId, documentId, isRequired, createdById, createdOn, isDulySigned, fileName, filePath, encryptionKey, encryptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO client_vendor_attachment_document_mapping (client_id, client_vendor_attachment_doc_id, is_required, created_on, created_by_id, is_duly_signed, file_name, file_path, encryption_key, encryption_iv) VALUES ('${clientId}', '${documentId}', '${isRequired}', ?, '${createdById}', '${isDulySigned}', ${fileName? `'${fileName}'` : null}, ?, ?, ?)`
            pool.query(sql, [createdOn, filePath, encryptionKey, encryptionIV], (error, result) => 
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

db.updateClientLogoFile = (fullLogoFilePath, shortLogoFilePath) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE client SET full_logo_file_path = '${fullLogoFilePath}', short_logo_file_path = '${shortLogoFilePath}' 
            WHERE  uuid = '${uuid}'`
            pool.query(sql, [modifyOn], (error, result) => 
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

db.updateClientLinkedUser = (id, userId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE client SET linked_user_id = '${userId}' 
            WHERE  id = '${id}'`
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

db.getUnallocatedClients = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT c.uuid, c.name 
            FROM client c
            WHERE (c.linked_user_id = 0 OR c.linked_user_id IS NULL) 
            AND c.is_active = 1 `
            
            sql = sql + ` ORDER BY c.name`
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

db.getLinkedUserId = (allocatedToUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.id, u.linked_to_id, r.code 
            FROM user u
            LEFT JOIN role r ON r.id = u.role_id
            WHERE u.uuid = '${allocatedToUuid}'`
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

db.getServiceType = (serviceTypeId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, name
            FROM client_service_type
            WHERE id = '${serviceTypeId}'`
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

db.getServiceTypes = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, name
            FROM client_service_type`
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

db.getClientVendorAttachments = () => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id, name, is_duly_signed AS isDulySigned 
            FROM client_vendor_attachment_document_master`
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

db.getReturnUuid = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT uuid
            FROM client
            WHERE id = ${id}`
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

db.getClientRoleId = (code) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT id
            FROM role
            WHERE code = '${code}'`
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

db.getClients = (serviceTypeIds) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.name AS userName, u.uuid AS userUuid, u.uuid AS uuidss, 
            c.id AS clientId, c.name AS clientName, c.email AS clientEmail, c.mobile AS clientMobile, c.short_name AS clientShortName,  c.company_name AS clientCompanyName,
            c.code AS clientCode, c.gstin AS clientGstin, c.pan AS clientPan, c.tan AS clientTan, c.address_line1 AS clientAddressLine1,
            c.address_line2 AS clientAddressLine2, c.address_line3 AS clientAddressLine3,  c.city AS clientCity, c.pincode AS clientPincode,
            c.is_active AS clientIsActive, c.is_doc_folder AS clientIsDocFolder, 
                c.linked_user_id AS clientLinkedUserId, c.uuid AS clientUuid,
                c.created_on AS userCreatedOn, c.modify_on AS userModifyOn, 
                        cst.id AS serviceTypeId, cst.name AS serviceTypeName,
                cb.name AS userCreatedByName, cb.uuid AS userCreatedByUuid, mb.name AS userModifyByName, mb.uuid AS userModifyByUuid,
                s.id AS stateId, s.name AS stateName,
                (SELECT IF(COUNT(id)>0,1,0) FROM partner_client_mapping WHERE client_id = c.id) AS isExist
                    FROM client c 	
					LEFT JOIN state s ON s.id = c.state_id
                    LEFT JOIN user u ON u.id = c.linked_user_id AND u.is_active = 1 
                    LEFT JOIN user cb ON cb.id = c.created_by_id
                    LEFT JOIN user mb ON mb.id = c.modify_by_id
                    LEFT JOIN client_service_type cst ON cst.id = c.service_type_id`

                    if(serviceTypeIds?.toString()?.length > 0)
                    {
                        sql = sql + `   WHERE FIND_IN_SET(cst.id, '${serviceTypeIds}') > 0`
                    }
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

db.getClient = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT u.name AS userName, u.uuid AS userUuid, 
                        c.id AS clientId, c.name AS clientName, c.email AS clientEmail, c.mobile AS clientMobile, c.short_name AS clientShortName, 
                        c.company_name AS clientCompanyName, c.code AS clientCode, c.gstin AS clientGstin, c.pan AS clientPan, c.tan AS clientTan,
                        c.address_line1 AS clientAddressLine1, c.address_line2 AS clientAddressLine2, c.address_line3 AS clientAddressLine3, 
                        c.city AS clientCity, c.pincode AS clientPincode,
                        c.is_active AS clientIsActive,  c.is_doc_folder AS clientIsDocFolder, 
                        c.linked_user_id AS clientLinkedUserId, c.uuid AS clientUuid,
                        c.created_on AS userCreatedOn, c.modify_on AS userModifyOn,
                        cb.name AS userCreatedByName, cb.uuid AS userCreatedByUuid, mb.name AS userModifyByName, mb.uuid AS userModifyByUuid,
                        s.id AS stateId, s.name AS stateName,
                        (SELECT IF(COUNT(id)>0,1,0) FROM partner_client_mapping WHERE client_id = c.id) AS isExist, 
                        cst.id AS serviceTypeId, cst.name AS serviceTypeName,
                        cvadm.id AS clientVendorAttachmentDocumentId, cvadm.is_required AS clientVendorAttachmentDocumentIsRequired, 
                        cvadm.is_duly_signed AS clientVendorAttachmentDocumentIsDulySigned, cvadm.file_name AS clientVendorAttachmentDocumentFileName,
                        cvad.id AS clientVendorAttachmentId, cvad.name AS clientVendorAttachmentName, cvad.is_duly_signed AS clientVendorAttachmentIsDulySigned		
                            FROM client c 	
                            LEFT JOIN state s ON s.id = c.state_id
                            LEFT JOIN user u ON u.id = c.linked_user_id AND u.is_active = 1 
                            LEFT JOIN user cb ON cb.id = c.created_by_id
                            LEFT JOIN user mb ON mb.id = c.modify_by_id 
                            LEFT JOIN client_service_type cst ON cst.id = c.service_type_id 
                            LEFT JOIN client_vendor_attachment_document_mapping cvadm ON cvadm.client_id = c.id 
                            LEFT JOIN client_vendor_attachment_document_master cvad ON cvad.id = cvadm.client_vendor_attachment_doc_id
                    WHERE c.uuid = '${uuid}'`
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

db.updateStatus = (uuid, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE client SET is_active = IF(is_active = 1,0,1), modify_on = ?, modify_by_id = '${modifyById}' WHERE uuid = '${uuid}'`
            pool.query(sql, [modifyOn], (error, result) => 
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

db.getClientData = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT c.id, c.linked_user_id AS linkedToId, IF(COUNT(pcm.id) > 0,1,0) AS isExist, u.uuid AS userUuid 
            FROM client c
            LEFT JOIN partner_client_mapping pcm ON pcm.client_id = c.id
            LEFT JOIN user u ON u.id = c.linked_user_id
            WHERE c.uuid = '${uuid}'`
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

db.allocateStaffToUser = (id, clientId, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE user SET linked_to_id = '${clientId}', modify_on = ?, modify_by_id = '${modifyById}' 
            WHERE id = '${id}'`
            pool.query(sql, [modifyOn],(error, result) => 
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

db.deallocateStaffFromUser = (id, modifyOn, modifyById) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `UPDATE user SET linked_to_id = null, modify_on = ?, modify_by_id = '${modifyById}'
            WHERE id = '${id}'`
            pool.query(sql, [modifyOn],(error, result) => 
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

db.checkIsDocFolderCreated = (uuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT c.is_doc_folder AS isDocFolder
            FROM client c
            WHERE c.uuid = '${uuid}'`
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

db.getDocumentAttachmentId = (sheetName) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT da.id
            FROM document_attachment da
            WHERE da.name = '${sheetName}'`
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

db.getDocumentCategoryId = (sheetName) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT dc.id
            FROM document_category dc
            WHERE dc.name = '${sheetName}'`
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

db.getClientId = (clientUuid) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT c.id 
            FROM client c 
            WHERE c.uuid = '${clientUuid}'`
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

db.saveUploadDocLogMaster = (fileName, clientId, documentAttachmentId, status, uploadedOn, uploadedFilePath, documentCategoryId, encriptionKey, encriptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO upload_doc_log_master (file_name, client_id, document_attachment_id, status, uploaded_file_path, uploaded_on, document_category_id,encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${documentAttachmentId}', '${status}', '${uploadedFilePath}', ?, '${documentCategoryId}', '${encriptionKey}', '${encriptionIV}')`
            pool.query(sql, [uploadedOn], (error, result) => 
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

db.saveUploadDocLogDetail = (uploadDocLogMasterId, filePath, fileName, status, uploadedOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO upload_doc_log_detail (upload_doc_log_master_id, s3_file_path, file_name, status, uploaded_on) VALUES ('${uploadDocLogMasterId}', '${filePath}', '${fileName}', '${status}', ?)`
            pool.query(sql, [uploadedOn], (error, result) => 
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


db.getUploadedDocLogs = (clientUuid, documentAttachmentId, fromDate, toDate, status) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT udlm.id, udlm.file_name, udlm.status, udlm.document_attachment_id, udlm.uploaded_on, udlm.started_on, udlm.completed_on, udlm.failed_on, udlm.created_on, udlm.uploaded_file_path, udlm.processed_file_path, udlm.failed_file_path, udlm.client_id, udlm.remark, udlm.local_file_path,  
            da.id AS documentAttachmentId, da.name AS documentAttachmentName, 
            dc.id AS documentCategoryId, dc.name AS documentCategoryName, 
            c.uuid AS clientUuid, c.name AS clientName   
            FROM upload_doc_log_master udlm
            LEFT JOIN document_attachment da ON da.id = udlm.document_attachment_id
            LEFT JOIN document_category dc ON dc.id = udlm.document_category_id
            LEFT JOIN client c ON c.id = udlm.client_id
            WHERE c.uuid = '${clientUuid}' 
            `

            if(status && status?.length > 0)
            {
                sql = sql +  ` AND udlm.status = '${status}'`
            }

            if(documentAttachmentId && documentAttachmentId?.length > 0)
            {
                sql = sql +  ` AND udlm.document_attachment_id = '${documentAttachmentId}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(udlm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(udlm.uploaded_on) <= DATE('${toDate}')`
            }

            sql = sql +  ` ORDER by udlm.uploaded_on DESC `

            if(toDate && toDate?.toString()?.length > 0 && (!fromDate || fromDate?.toString()?.length == 0))
            {
                sql = sql +  ` LIMIT 2000`
            }
            
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
db.getUploadedDocLogsVendor = (clientUuid, documentAttachmentId, fromDate, toDate, status) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT udlm.id, udlm.file_name, udlm.status, udlm.document_attachment_id, udlm.uploaded_on, udlm.started_on, udlm.completed_on, udlm.failed_on, udlm.created_on, udlm.uploaded_file_path, udlm.processed_file_path, udlm.failed_file_path, udlm.client_id, udlm.remark, udlm.local_file_path,  
            da.id AS documentAttachmentId, da.name AS documentAttachmentName, 
            dc.id AS documentCategoryId, dc.name AS documentCategoryName, 
            c.uuid AS clientUuid, c.name AS clientName   
            FROM client_vendor_upload_doc_log_master udlm
            LEFT JOIN vendor_document_attachment da ON da.id = udlm.document_attachment_id
            LEFT JOIN vendor_document_category dc ON dc.id = udlm.document_category_id
            LEFT JOIN client c ON c.id = udlm.client_id
            WHERE c.uuid = '${clientUuid}' 
            `

            if(status && status?.length > 0)
            {
                sql = sql +  ` AND udlm.status = '${status}'`
            }

            if(documentAttachmentId && documentAttachmentId?.length > 0)
            {
                sql = sql +  ` AND udlm.document_attachment_id = '${documentAttachmentId}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(udlm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(udlm.uploaded_on) <= DATE('${toDate}')`
            }

            sql = sql +  ` ORDER by udlm.uploaded_on DESC LIMIT 2000;`
            
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
db.getUploadedDocLogsSpsn = (clientUuid, documentAttachmentId, fromDate, toDate, status) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT udlm.id, udlm.file_name, udlm.status, udlm.document_attachment_id, udlm.uploaded_on, udlm.started_on, udlm.completed_on, udlm.failed_on, udlm.created_on, udlm.uploaded_file_path, udlm.processed_file_path, udlm.failed_file_path, udlm.client_id, udlm.remark, udlm.local_file_path,  
            da.id AS documentAttachmentId, da.name AS documentAttachmentName, 
            dc.id AS documentCategoryId, dc.name AS documentCategoryName, 
            c.uuid AS clientUuid, c.name AS clientName   
            FROM client_spsn_upload_doc_log_master udlm
            LEFT JOIN spsn_document_attachment da ON da.id = udlm.document_attachment_id
            LEFT JOIN spsn_document_category dc ON dc.id = udlm.document_category_id
            LEFT JOIN client c ON c.id = udlm.client_id
            WHERE c.uuid = '${clientUuid}' 
            `

            if(status && status?.length > 0)
            {
                sql = sql +  ` AND udlm.status = '${status}'`
            }

            if(documentAttachmentId && documentAttachmentId?.length > 0)
            {
                sql = sql +  ` AND udlm.document_attachment_id = '${documentAttachmentId}'`
            }

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(udlm.uploaded_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(udlm.uploaded_on) <= DATE('${toDate}')`
            }

            sql = sql +  ` ORDER by udlm.uploaded_on DESC LIMIT 2000;`
            
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

db.getUploadedDocLog = (uploadedDocLogId) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        {
            let sql = `SELECT udlm.id, udlm.task_id, udlm.document_attachment_id, udlm.status, udlm.created_on, udlm.completed_on, udlm.client_id, 
            da.id AS documentAttachmentId, da.name AS documentAttachmentName, 
            c.uuid AS clientUuid, c.name AS clientName,
            udld.id AS detailId, udld.s3_file_path, udld.file_name, udld.uploaded_on AS detailUploadedOn, 
            udld.completed_on AS detailCompletedOn, udld.process_started_on, udld.status AS detailStatus   
            FROM upload_doc_log_master udlm
            LEFT JOIN document_attachment da ON da.id = udlm.document_attachment_id
            LEFT JOIN client c ON c.id = udlm.client_id
            LEFT JOIN upload_doc_log_detail udld ON udld.upload_doc_log_master_id = udlm.id
            WHERE udlm.id = '${uploadedDocLogId}' `
            
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


db.insertUser = (uuid,name,linkedToId,roleId,createdById,password,createdOn, isActive, passKey) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO user (uuid, name, linked_to_id, password, role_id, created_on, created_by_id, is_active) VALUES ('${uuid}', '${name}', '${linkedToId}', HEX(AES_ENCRYPT('${password}', '${passKey}')), '${roleId}', ?, ${createdById}, ${isActive})`
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

db.saveUploadDocLogMasterLocal = (fileName, clientId, documentAttachmentId, status, uploadedOn, localFilePath, documentCategoryId, encriptionKey, encriptionIV) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO upload_doc_log_master (file_name, client_id, document_attachment_id, status, local_file_path, uploaded_on, document_category_id,encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${documentAttachmentId}', '${status}', '${localFilePath}', ?, '${documentCategoryId}', '${encriptionKey}', '${encriptionIV}')`
            pool.query(sql, [uploadedOn], (error, result) => 
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


db.saveDataTransactLog = (activity,user,partnerUuid,locationUuid,fileSize,apiName,storageType,createdOn, clientId, fileName) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `INSERT INTO data_transact_log (activity,user,partner_id,location_id,file_size,api_name,storage_type,created_on, client_id, file_name) 
            VALUES ('${activity}','${user}','${partnerUuid}','${locationUuid}','${fileSize}','${apiName}','${storageType}',?, '${clientId}', '${fileName}')`
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


db.saveSpsnProcessSequence = (values) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `
      INSERT INTO client_spsn_process_sequence_master 
      (seq_id, client_id, name, status, type, is_active, read_type, is_complete, is_error) 
      VALUES ?`
            pool.query(sql, [values], (error, result) => 
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
db.saveSpsnInteruptProcess = (clientId, isWorking, createdOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `
      INSERT INTO interupt_process_spsn (client_id, is_working, created_on) 
      VALUES (?, ?, ?)`
            pool.query(sql, [clientId, isWorking, createdOn], (error, result) => 
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


db.vendorSpsnProcessSequence = (values) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `
      INSERT INTO client_vendor_process_sequence_master 
      (seq_id, client_id, name, status, type, is_active, read_type, is_complete, is_error) 
      VALUES ?`
            pool.query(sql, [values], (error, result) => 
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

db.saveVendorInteruptProcess = (clientId, isWorking, createdOn) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `
      INSERT INTO interupt_process_vendor (client_id, is_working, created_on) 
      VALUES (?, ?, ?)`
            pool.query(sql, [clientId, isWorking, createdOn], (error, result) => 
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

db.getState = (id) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `SELECT name FROM state WHERE id = '${id}'`
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


db.getClientCurrentData = (uuid) => 
    {
        return new Promise((resolve, reject) => 
        {
            try
            { 
                let sql = `SELECT * FROM client WHERE uuid = '${uuid}'`
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

module.exports = db