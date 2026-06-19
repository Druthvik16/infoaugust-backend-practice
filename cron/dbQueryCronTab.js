let pool = require('../databaseConnection/createconnection')
let db = {}

db.updateUserToken = () => {
    return new Promise((resolve, reject) => {
        try {
            // 15 minutes to 120 minutes
            let sql = `UPDATE user SET auth_token = null, modify_on = ? WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '120' 
            AND auth_token IS NOT NULL;`


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

db.updateAddonUserToken = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE additional_login_user SET auth_token = null, modify_on = ? WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '120' 
            AND auth_token IS NOT NULL;`


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
            let sql = `UPDATE spsn_user_master SET auth_token = null, modify_on = ? WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '120' 
                AND auth_token IS NOT NULL;`


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
            WHERE user_id IN (SELECT id FROM ${tableName} WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '120' )
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
            let sql = `UPDATE partner SET auth_token = null, modify_on = ?  WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '120' 
            AND auth_token IS NOT NULL;`


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



db.updatePartnerUserToken = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE secondary_partner SET auth_token = null, modified_on = ?  WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '120' 
                AND auth_token IS NOT NULL;`


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

db.updateSpsnToken = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE spsn_user_master SET auth_token = null, modify_on = ?  WHERE TIMESTAMPDIFF(MINUTE, last_logged_in, now()) >= '120' 
            AND auth_token IS NOT NULL;`


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
db.getClient = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT uuid, id 
                                    FROM client
                                    WHERE uuid = '${uuid}'`
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
                                    FROM upload_doc_log_master
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
            FROM document_attachment da 
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
            let sql = `INSERT INTO upload_doc_log_master (file_name, client_id, document_attachment_id, status, uploaded_file_path, uploaded_on, document_category_id,encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${documentAttachmentId}', '${status}', '${uploadedFilePath}', ?, '${documentCategoryId}', '${encriptionKey}', '${encriptionIV}')`
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
            let sql = `INSERT INTO upload_doc_log_master (file_name, client_id, document_attachment_id, status, local_file_path, uploaded_on, document_category_id,encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${documentAttachmentId}', '${status}', '${localFilePath}', ?, '${documentCategoryId}', '${encriptionKey}', '${encriptionIV}')`
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
            FROM document_category dc
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
            let sql = `SELECT IF(COUNT(cudm.id) > 0, 1, 0) AS isBillNoExist 
            FROM client_uploaded_document_master cudm 
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = '${documentAttachmentId}'
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Credit Note'
            WHERE cudd.client_uploaded_document_master_id IS NULL 
            AND ((abs(cudm.credit_amount) + abs(cudm.debit_amount)) > 2);`
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

db.checkBillNoExistInvoice = (documentAttachmentId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(cudm.id) > 0, 1, 0) AS isBillNoExist 
            FROM client_uploaded_document_master cudm 
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = '${documentAttachmentId}'
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Invoice'
            WHERE cudd.client_uploaded_document_master_id IS NULL;`
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

db.updatePdfBotProcessLog = (botName, isBillNoExist, isExecuteBot, isSummaryFileExist, isPdfFileExist) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE pdf_bot_process_log SET is_bot_execute = '${isExecuteBot}', is_bill_number_exist = '${isBillNoExist}', is_summary_file_exist = '${isSummaryFileExist}', is_pdf_file_exist = '${isPdfFileExist}' 
            WHERE bot_name = '${botName}'; `

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
                                    FROM pdf_bot_process_log
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

db.updateDailyActivityLogDetail = (activityType, activityName, closingRemark, date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE daily_activity_detail 
                SET closing_remark = '${closingRemark}', end_on = ?
                WHERE id IN (
                    SELECT id FROM (
                        SELECT dad.id 
                        FROM daily_activity_detail AS dad 
                        JOIN daily_activity_log AS dal ON dad.daily_activity_detail_id = dal.id 
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

module.exports = db