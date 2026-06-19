let pool = require('../databaseConnection/createconnection')
let db = {}

db.checkBillNoExistCreditNote = (documentAttachmentId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(cudm.id) > 0, 1, 0) AS isBillNoExist 
            FROM client_uploaded_document_master cudm 
            LEFT JOIN client_uploaded_document_detail cudd ON cudd.client_uploaded_document_master_id = cudm.id AND cudd.document_attachment_id = '${documentAttachmentId}'
            JOIN document_category dc ON dc.id = cudm.document_category_id AND dc.name = 'Credit Note'
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

db.getUniqueProcessSequencetype = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT DISTINCT type FROM process_sequence_master  WHERE is_active = 1;`
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


db.getProcessSequence = (processType, isActive) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `WITH ActiveRows AS (
                        SELECT seq_id AS seqId, name, status, type, is_active AS isActive, read_type AS readType  
                        FROM process_sequence_master
                        WHERE is_active = ${isActive} 
                        AND type = '${processType} '
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

db.getProcessSequences = () => {
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
    process_sequence_master psm
LEFT JOIN 
    (
        SELECT 
            process_name, 
            module_name, 
            MAX(start_on) AS latest_start_on
        FROM 
            process_module_log
        GROUP BY 
            process_name, 
            module_name
    ) latest_pml ON psm.name = latest_pml.process_name AND psm.type = latest_pml.module_name
LEFT JOIN 
    process_module_log pml ON latest_pml.process_name = pml.process_name 
    AND latest_pml.module_name = pml.module_name 
    AND latest_pml.latest_start_on = pml.start_on 
    
    ORDER BY 
    FIELD(psm.type, 'FileSync', 'FileProcess', 'BotProcess')`
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

db.updateProcessSequenceIsComplete = (isComplete) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE process_sequence_master SET is_complete = '${isComplete}' where is_active = 1;`

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

db.getProcessSequenceStatus = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT IF(COUNT(id) > 0,1,0) as working FROM process_sequence_master where status = 1;`

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

db.getInteruptProcess = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT is_working AS isWorking FROM interupt_process_customer;`

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

db.updateProcessSequence = (status, isActive, processType, processSequenceName, isComplete, isError) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE process_sequence_master SET status = '${status}', is_complete = '${isComplete}', is_error = '${isError}' `

            if (isActive.toString()?.length > 0) {
                sql = sql + `, is_active = ${isActive} `
            }

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

db.updateProcessSequenceError = (processType, processSequenceName, isError) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE process_sequence_master SET is_error = '${isError}' `

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
            let sql = `UPDATE process_sequence_master SET read_type = '${readType}' `

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
                    FROM process_sequence_master`
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

db.saveProcessSequenceLog = (processName, processType, date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO process_module_log (process_name, module_name, start_on) VALUES ('${processName}','${processType}', ?) `

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

db.updateProcessSequenceLog = (processName, processType, date) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE process_module_log SET end_on = ? WHERE module_name = '${processType}' AND process_name = '${processName}' ORDER BY id DESC LIMIT 1`

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

db.resetProcessSequence = (status, isComplete, isError) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE process_sequence_master SET status = '${status}', is_complete = '${isComplete}', is_error = '${isError}' `

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

db.updateInteruptProcess = (isWorking, modifyOn) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE interupt_process_customer SET is_working = '${isWorking}', modify_on = ?`

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
db.getDataFromProcessSequenceMaster = async ( processType , isActive , processName) => {
    try{
        // let sql = `SELECT name as processName, type as processType, id as processId FROM process_sequence_master 
        //  CASE 
        //     WHEN name = 'LedgerSummary' AND type = '${processType}' THEN (is_active = 0 OR is_active = 1)
        //     ELSE type = ? AND is_active = ? 
        // `
        
        // if(processName){
        //     sql = sql + ` AND name = ?`
        // }

        // sql = sql + ` END`

        let sql = `
                    SELECT name as processName, type as processType, id as processId 
                    FROM process_sequence_master 
                    WHERE (
                        (name = 'LedgerSummary' AND type = '${processType}')
                        OR
                        (type = ? AND is_active = ?)
                    )
                    `;

                    if (processName) {
                    sql += ` AND name = ?`;
                    }

        let result = await pool.promise().query(sql, [processType, isActive, processName])
        console.log(result[0])
        return result[0];
    }catch(error){
        console.log(error)
    }
}
module.exports = db