let pool = require('../databaseConnection/createconnection')
let db = {}
db.updateUserToken = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE user SET auth_token = null, modify_on = ? WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '10' 
                AND auth_token IS NOT NULL;`

            //  
            pool.query(sql, [new Date()], (error, result) => {
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

db.updateSpsnUserToken = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE spsn_user_master SET auth_token = null, modify_on = ? WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '10' 
                    AND auth_token IS NOT NULL;`

            //  
            pool.query(sql, [new Date()], (error, result) => {
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

db.updateLoginHistory = (userType, loggedOut, loggedOutType, tableName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE login_history SET logged_out_type = '${loggedOutType}',logged_out = ? 
                WHERE user_id IN (SELECT id FROM ${tableName} WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '10' )
                AND user_type = '${userType}' 
                AND logged_out IS NULL `
            pool.query(sql, [loggedOut], (error, result) => {
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

db.updatePartnerToken = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner SET auth_token = null, modify_on = ?  WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '10' 
                AND auth_token IS NOT NULL;`

            //  
            pool.query(sql, [new Date()], (error, result) => {
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

db.getClientUuid = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT uuid, id 
                                        FROM client
                                        WHERE is_doc_folder = 1 
                                        AND is_active = 1
                                        AND name = 'BlackBerrys'
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



db.getClientData = (clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT c.id, c.uuid, c.name, c.email, c.mobile, cfm.sftp_host AS sftpHost, cfm.sftp_algorithm AS sftpAlgorithm, cfm.sftp_port AS sftpPort, cfm.sftp_base_folder AS sftpBaseFolder, cfm.sftp_password AS sftpPassword, cfm.sftp_username AS sftpUserName 
                    FROM client c
                    LEFT JOIN client_ftp_master cfm ON cfm.client_id = c.id
                    WHERE c.uuid = '${clientUuid}' 
                        AND c.is_doc_folder = 1 
                        AND c.is_active = 1`
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

db.getClientsUuid = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT uuid
                                        FROM client
                                        WHERE is_doc_folder = 1 
                                        AND is_active = 1
                                        AND (service_type_id = 2 OR service_type_id = 3)
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

db.savePartnerOnboardingLogMaster = (fileName, clientId, status, uploadedOn, uploadedFilePath, encriptionKey, encriptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_onboarding_log (file_name, client_id, status, uploaded_file_path, uploaded_on, encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${status}', '${uploadedFilePath}', ?, '${encriptionKey}', '${encriptionIV}')`
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

db.savePartnerOnboardingLogMasterLocal = (fileName, clientId, status, uploadedOn, localFilePath, encriptionKey, encriptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_onboarding_log (file_name, client_id, status, local_file_path, uploaded_on, encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${status}', '${localFilePath}', ?, '${encriptionKey}', '${encriptionIV}')`
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

db.getEncryptionData = (fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT encryption_key, encryption_iv
                                        FROM client_spsn_upload_doc_log_master
                                        WHERE UPPER(file_name) = '${fileName?.toUpperCase()}'`
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


db.getEncryptionDataFromPartner = (fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT encryption_key, encryption_iv
                                        FROM partner_onboarding_log
                                        WHERE UPPER(file_name) = '${fileName?.toUpperCase()}'`
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

db.getDocumentAttachemnts = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT da.id, da.name 
                FROM spsn_document_attachment da 
                ORDER BY da.name`
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

db.saveUploadDocLogMaster = (fileName, clientId, documentAttachmentId, status, uploadedOn, uploadedFilePath, documentCategoryId, encriptionKey, encriptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_spsn_upload_doc_log_master (file_name, client_id, document_attachment_id, status, uploaded_file_path, uploaded_on, document_category_id,encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${documentAttachmentId}', '${status}', '${uploadedFilePath}', ?, '${documentCategoryId}', '${encriptionKey}', '${encriptionIV}')`
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

db.saveUploadDocLogMasterLocal = (fileName, clientId, documentAttachmentId, status, uploadedOn, localFilePath, documentCategoryId, encriptionKey, encriptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_spsn_upload_doc_log_master (file_name, client_id, document_attachment_id, status, local_file_path, uploaded_on, document_category_id,encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${documentAttachmentId}', '${status}', '${localFilePath}', ?, '${documentCategoryId}', '${encriptionKey}', '${encriptionIV}')`
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

db.getDocumentCategories = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT dc.id, dc.name, dc.code 
                FROM spsn_document_category dc
                WHERE dc.is_active = 1
                ORDER BY dc.name`
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


db.checkBillNoExistCreditNote = (documentAttachmentId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(cuvdm.id) > 0, 1, 0) AS isBillNoExist 
                FROM client_uploaded_spsn_doc_master cuvdm 
                    LEFT JOIN client_uploaded_spsn_doc_detail cuvdd ON cuvdd.client_uploaded_spsn_doc_master_id = cuvdm.id AND cuvdd.document_attachment_id = '${documentAttachmentId}'
                JOIN spsn_document_category sdc ON sdc.id = cuvdm.document_category_id AND sdc.name = 'Credit Note'
                WHERE cuvdd.client_uploaded_spsn_doc_master_id IS NULL 
                AND ((abs(cuvdm.credit_amount) + abs(cuvdm.debit_amount)) > 2);`
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


db.checkBillNoExistForm16 = (documentAttachmentId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(cuvdm.id) > 0, 1, 0) AS isBillNoExist 
                FROM client_uploaded_spsn_doc_master cuvdm 
                    LEFT JOIN client_uploaded_spsn_doc_detail cuvdd ON cuvdd.client_uploaded_spsn_doc_master_id = cuvdm.id AND cuvdd.document_attachment_id = '${documentAttachmentId}'
                JOIN spsn_document_category sdc ON sdc.id = cuvdm.document_category_id AND sdc.name = 'Form16A'
                WHERE cuvdd.client_uploaded_spsn_doc_master_id IS NULL ;`
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

db.updatePdfBotProcessLog = (botName, isBillNoExist, isExecuteBot, isSummaryFileExist, isPdfFileExist) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE spsn_pdf_bot_process_log SET is_bot_execute = '${isExecuteBot}', is_bill_number_exist = '${isBillNoExist}', is_summary_file_exist = '${isSummaryFileExist}', is_pdf_file_exist = '${isPdfFileExist}' 
                WHERE bot_name = '${botName}'; `
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

db.checkBotStatus = (botName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT bot_status AS botStatus 
                                        FROM spsn_pdf_bot_process_log
                                        WHERE bot_name = '${botName}'`
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


db.getDailyActivityLog = (date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id FROM spsn_daily_activity_log WHERE DATE(activity_date) = DATE(?);`
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
            let sql = `INSERT INTO spsn_daily_activity_log (activity_date) VALUES (?);`
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

db.saveDailyActivityLogDetail = (activityType, activityName, openingRemark, clientUuid, date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO spsn_daily_activity_detail (activity_type, activity_name, opening_remark, started_on, spsn_daily_activity_detail_id, client_id) 
                VALUES ('${activityType}', '${activityName}', '${openingRemark}', ?, (SELECT id FROM spsn_daily_activity_log WHERE DATE(activity_date) = DATE(?)), (SELECT id FROM client WHERE uuid = '${clientUuid}' ));`
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

db.updateDailyActivityLogDetail = (activityType, activityName, closingRemark, date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE spsn_daily_activity_detail 
                    SET closing_remark = '${closingRemark}', end_on = ?
                    WHERE id IN (
                        SELECT id FROM (
                            SELECT dad.id 
                            FROM spsn_daily_activity_detail AS dad 
                            JOIN spsn_daily_activity_log AS dal ON dad.spsn_daily_activity_detail_id = dal.id 
                            WHERE dad.activity_type = '${activityType}' 
                                AND dad.activity_name = '${activityName}' 
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

db.updateDailyActivityLogDetailForClient = (activityType, activityName, closingRemark, clientUuid, date) => {
    return new Promise((resolve, reject) => {
        try {
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

db.getUniqueProcessSequencetype = (clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT DISTINCT type FROM client_spsn_process_sequence_master  WHERE is_active = 1 AND client_id = '${clientId}';`
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


db.getProcessSequence = (processType, isActive, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `WITH ActiveRows AS (
                        SELECT seq_id AS seqId, name, status, type, is_active AS isActive, read_type AS readType  
                        FROM client_spsn_process_sequence_master
                        WHERE is_active = ${isActive} 
                        AND type = '${processType}'
                        AND client_id = '${clientId}'
                    ),
                    SumCheck AS (
                        SELECT SUM(status) AS totalStatus
                        FROM ActiveRows
                    )
                    SELECT *
                    FROM ActiveRows
                    WHERE (SELECT totalStatus FROM SumCheck) = 0;`
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

db.getProcessSequences = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
    psm.seq_id AS seqId, 
    psm.id AS id, 
    psm.name, psm.status, 
    psm.type, 
    psm.is_active AS isActive, 
    psm.read_type AS readType,
    psm.is_complete AS isComplete,
    psm.is_error AS isError,
    pml.start_on AS startOn,
    pml.end_on AS endOn
FROM 
    client_spsn_process_sequence_master psm
LEFT JOIN 
    (
        SELECT 
            process_name, 
            module_name, 
            MAX(start_on) AS latest_start_on
        FROM 
            client_spsn_process_module_log
        GROUP BY 
            process_name, 
            module_name
    ) latest_pml ON psm.name = latest_pml.process_name AND psm.type = latest_pml.module_name
LEFT JOIN 
    client_spsn_process_module_log pml ON latest_pml.process_name = pml.process_name 
    AND latest_pml.module_name = pml.module_name 
    AND latest_pml.latest_start_on = pml.start_on  
    WHERE psm.client_id = '${id}'
    
    ORDER BY 
    FIELD(psm.type, 'FileSync', 'FileProcess', 'BotProcess');`
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

db.updateProcessSequenceIsComplete = (isComplete, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_spsn_process_sequence_master SET is_complete = '${isComplete}' where is_active = 1 AND client_id = '${clientId}';`

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

db.getProcessSequenceStatus = (clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(id) > 0,1,0) as working FROM client_spsn_process_sequence_master where status = 1 AND client_id = '${clientId}';`

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
db.updateProcessSequence = (status, isActive, processType, processSequenceName, isComplete, isError, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_spsn_process_sequence_master SET status = '${status}', is_complete = '${isComplete}', is_error = '${isError}' `

            if (isActive.toString()?.length > 0) {
                sql = sql + `, is_active = ${isActive} `
            }

            sql = sql + ` WHERE type = '${processType}' 
                                AND name = '${processSequenceName}'
                                AND client_id = '${clientId}'`

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

db.updateProcessSequenceError = (processType, processSequenceName, isError) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_spsn_process_sequence_master SET is_error = '${isError}' `

            sql = sql + ` WHERE type = '${processType}' 
                            AND name = '${processSequenceName}'`

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

db.savePreference = (id, isActive, readType, isError) => {
    return new Promise((resolve, reject) => {
        try {
            // , is_error = '${isError}' 
            let sql = `UPDATE client_spsn_process_sequence_master SET read_type = '${readType}' `

            if (isActive.toString()?.length > 0) {
                sql = sql + `, is_active = ${isActive} `
            }

            sql = sql + ` WHERE id = '${id}' `

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

db.getRunningProcessSequence = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT SUM(status) AS processing 
                    FROM client_spsn_process_sequence_master`
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

db.saveProcessSequenceLog = (processName, processType, date, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO client_spsn_process_module_log (process_name, module_name, start_on, client_id) VALUES 
('${processName}','${processType}', ?, '${clientId}') `

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

db.updateProcessSequenceLog = (processName, processType, date, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_spsn_process_module_log SET end_on = ? WHERE module_name = '${processType}' AND process_name = '${processName}' AND client_id = '${clientId}' ORDER BY id DESC LIMIT 1`

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

db.resetProcessSequence = (status, isComplete, isError, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE client_spsn_process_sequence_master SET status = '${status}', is_complete = '${isComplete}', is_error = '${isError}' WHERE client_id = '${clientId}'`

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

db.updateInteruptProcess = (isWorking, modifyOn, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE interupt_process_spsn SET is_working = '${isWorking}', modify_on = ? WHERE client_id = '${clientId}'`

            pool.query(sql, [modifyOn], (error, result) => {
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

module.exports = db