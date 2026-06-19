let pool = require('../databaseConnection/createconnection')
let db = {}

db.getPartnersData = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, uuid, name, pan, partner_category_id  
            FROM partner 
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
db.getDisclaimerStatus = (partnerUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT p.id AS partnerId, p.uuid AS partnerUuid, p.name AS partnerName, p.pan AS partnerPan, p.is_disclaimer AS isDisclaimer 
            FROM partner p
            WHERE p.is_active = 1 
            AND p.uuid = '${partnerUuid}' `

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

db.updateDisclaimerStatus = (partnerUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner SET is_disclaimer = 1 
            WHERE uuid = '${partnerUuid}' `

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

db.getPartnerCategories = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, code, name
            FROM partner_category 
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
db.getPartnerCategory = (code) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, code, name
            FROM partner_category 
            WHERE is_active = 1 AND code = '${code}'`
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


db.getPartnerClientMappings = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pcm.id, pcm.partner_id, pcm.client_id, c.uuid AS clientUuid, p.uuid AS partnerUuid 
            FROM partner_client_mapping pcm
            LEFT JOIN client c ON c.id = pcm.client_id
            LEFT JOIN partner p ON p.id = pcm.partner_id`
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

db.getPartnerStatewiseMaster = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, gstin, state_id, partner_id
            FROM partner_statewise_gst_master `
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

db.getPartnerGstID = (partnerUuid, gstNumber) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, gstin, state_id, partner_id
            FROM partner_statewise_gst_master 
            WHERE partner_id = (SELECT id FROM partner WHERE uuid = '${partnerUuid}') 
            AND gstin = '${gstNumber}'`
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

db.getPartnerGstIDWithNumber = (gstNumber) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, gstin, state_id, partner_id
            FROM partner_statewise_gst_master 
            WHERE  gstin = '${gstNumber}'`
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

db.getState = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, name 
            FROM state WHERE country_id = (SELECT id FROM country WHERE UPPER(name) = UPPER('India'))`
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

db.savePartner = (uuid, name, pan, partnerCategoryId, isActive, createdOn, createdById, email, mobile, password, passKey) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner (uuid, name, pan, partner_category_id, is_active, created_on, created_by_id, email, mobile, password) VALUES ('${uuid}', '${name}', '${pan}', '${partnerCategoryId}', '${isActive}', ?, '${createdById}', '${email}', '${mobile}', HEX(AES_ENCRYPT('${password}', '${passKey}')))`
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

db.deletePartner = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `DELETE FROM partner WHERE id = '${id}'`
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

db.saveClientPartnerMapping = (partnerUuid, clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_client_mapping (partner_id, client_id) VALUES ((SELECT id FROM partner WHERE uuid = '${partnerUuid}'), (SELECT id FROM client WHERE uuid = '${clientUuid}'))`
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

db.savePartnerStatewiseGst = (partnerUuid, gstNumber, stateId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_statewise_gst_master (gstin, partner_id, state_id) VALUES ('${gstNumber}',(SELECT id FROM partner WHERE uuid = '${partnerUuid}'), '${stateId}')`
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

db.savePartnerLocation = (uuid, code, storeName, storeLocation, partnerStatewiseGstMasterId, mobile, email, tan, addressLine1, addressLine2, addressLine3, city, stateId, pincode, msmeNumber, isActive, createdOn, createdById, spsnId, clientId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_location_detail (uuid, code, store_name, store_location, partner_statewise_gst_master_id, mobile, email, tan, address_line1, city, state_id, pincode, is_active, created_on, created_by_id, customer_type, address_line2, address_line3, msme_number, spsn_user_id) VALUES ('${uuid}', '${code}', '${storeName}', '${storeLocation}','${partnerStatewiseGstMasterId}', '${mobile}', '${email}', '${tan}', '${addressLine1}', '${city}', '${stateId}', '${pincode}', '${isActive}', ?, '${createdById}', 
            (SELECT customer_type FROM customer_type_code_master WHERE code_prefix = ${code.substring(0, 2)} AND client_id = '${clientId}')`

            if (addressLine2) {
                sql = sql + `, '${addressLine2}'`
            }
            else {
                sql = sql + `, null`
            }

            if (addressLine3) {
                sql = sql + `, '${addressLine3}'`
            }
            else {
                sql = sql + `, null`
            }

            if (msmeNumber) {
                sql = sql + `, '${msmeNumber}'`
            }
            else {
                sql = sql + `, null`
            }

            if (spsnId) {
                sql = sql + `, '${spsnId}'`
            }
            else {
                sql = sql + `, null`
            }
            sql = sql + `)`

            //  

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

db.savePartnerLocationOpeningBalance = (id, code, balance, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            // let sql = `INSERT INTO customer_opening_balance_master (partner_location_id, partner_location_code, opening_balance) VALUES ('${id}', '${code}', '${balance}')`

            let sql = `INSERT INTO customer_opening_balance_master (
                            partner_location_id, 
                            partner_location_code, 
                            opening_balance,
                            financial_year_id
                        )
                        SELECT 
                          '${id}', '${code}', '${balance}', '${financialYearId}'
                        FROM DUAL
                        WHERE NOT EXISTS (
                            SELECT 1 
                            FROM customer_opening_balance_master 
                            WHERE partner_location_code = '${code}' 
                            AND financial_year_id = '${financialYearId}'
                        );
`

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

db.savePartnerLocationData = (uuid, code, storeName, storeLocation, partnerStatewiseGstMasterId, mobile, email, tan, addressLine1, addressLine2, addressLine3, city, stateId, pincode, msmeNumber, isActive, createdOn, createdById, spsnUuid, clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_location_detail (uuid, code, store_name, store_location, partner_statewise_gst_master_id, mobile, email, tan, address_line1, city, state_id, pincode, is_active, created_on, created_by_id, customer_type, address_line2, address_line3, msme_number, spsn_user_id ) VALUES ('${uuid}', '${code}', '${storeName}', '${storeLocation}','${partnerStatewiseGstMasterId}', '${mobile}', '${email}', '${tan}', '${addressLine1}', '${city}', '${stateId}', '${pincode}', '${isActive}', ?, '${createdById}', 
            (SELECT customer_type FROM customer_type_code_master WHERE code_prefix = '${code.substring(0, 2)}' AND client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}'))`

            if (addressLine2) {
                sql = sql + `, '${addressLine2}'`
            }
            else {
                sql = sql + `, null`
            }

            if (addressLine3) {
                sql = sql + `, '${addressLine3}'`
            }
            else {
                sql = sql + `, null`
            }

            if (msmeNumber) {
                sql = sql + `, '${msmeNumber}'`
            }
            else {
                sql = sql + `, null`
            }
            sql = sql + ` , (SELECT id FROM spsn_user_master WHERE uuid = '${spsnUuid}') )`

            //  

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

db.getReturnUuidByID = (id, tableName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT uuid
            FROM ${tableName}
            WHERE id = ${id}`
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

db.getSpsn = (spsnCode) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id FROM spsn_user_master WHERE spsn_code = '${spsnCode}'`
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

db.getPartnerLocations = (partnerUuid, stateId, userTypeCode) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName, 
            pld.store_location AS partnerLocationStoreLocation, pld.mobile AS partnerLocationMobile, pld.email AS partnerLocationEmail, 
            pld.tan AS partnerLocationTan, pld.address_line1 AS partnerLocationAddressLine1, pld.address_line2 AS partnerLocationAddressLine2, 
            pld.address_line3 AS partnerLocationAddressLine3, pld.city AS partnerLocationCity, pld.pincode AS partnerLocationPincode,
            pld.msme_number AS partnerLocationMsmeNumber, pld.is_active AS partnerLocationIsActive, pld.created_on AS partnerLocationCreatedOn, IF(pld.code IS NOT NULL, CONCAT(pld.code, '-',  IF(CHAR_LENGTH(pld.store_name) > 10, CONCAT(LEFT(pld.store_name, 10), '...'), pld.store_name), ' - ', pld.customer_type, ' (', pld.store_location, ')'), '') AS partnerLabel, pld.customer_type AS customerType, 
            cb.name AS partnerLocationCreatedByName, cb.uuid AS partnerLocationCreatedByUuid,
            s.id AS stateId, s.name AS stateName, 
            sums.uuid AS spsnUuid, sums.name AS spsnName, sums.spsn_code AS spsnCode, 
            psgm.id AS partnerStateWiseGstMasterId, psgm.gstin AS partnerStateWiseGstMasterGstIn
            FROM partner_location_detail pld
            LEFT JOIN state s ON s.id = pld.state_id
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id
            LEFT JOIN user cb ON cb.id = pld.created_by_id 
            LEFT JOIN spsn_user_master sums ON sums.id = pld.spsn_user_id 
            WHERE p.uuid = '${partnerUuid}' `

            if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

            if (stateId) {
                sql = sql + ` AND s.id = '${stateId}'`
            }

            sql = sql + ` ORDER BY pld.store_name`
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
            let sql = `SELECT pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName, 
            pld.store_location AS partnerLocationStoreLocation, pld.mobile AS partnerLocationMobile, pld.email AS partnerLocationEmail, 
            pld.tan AS partnerLocationTan, pld.address_line1 AS partnerLocationAddressLine1, pld.address_line2 AS partnerLocationAddressLine2, 
            pld.address_line3 AS partnerLocationAddressLine3, pld.city AS partnerLocationCity, pld.pincode AS partnerLocationPincode, pld.customer_type AS customerType, 
            pld.msme_number AS partnerLocationMsmeNumber, pld.is_active AS partnerLocationIsActive, pld.created_on AS partnerLocationCreatedOn, 
            cb.name AS partnerLocationCreatedByName, cb.uuid AS partnerLocationCreatedByUuid,
            s.id AS stateId, s.name AS stateName, sums.uuid AS spsnUuid, sums.name AS spsnName, sums.spsn_code AS spsnCode, 
            psgm.id AS partnerStateWiseGstMasterId, psgm.gstin AS partnerStateWiseGstMasterGstIn
            FROM partner_location_detail pld
            LEFT JOIN state s ON s.id = pld.state_id
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id
            LEFT JOIN user cb ON cb.id = pld.created_by_id 
            LEFT JOIN spsn_user_master sums ON sums.id = pld.spsn_user_id
            WHERE pld.uuid = '${uuid}' `
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


db.getPartners = (clientUuid, partnerCategoryId, userTypeCode, fromDate, toDate) => {
    return new Promise((resolve, reject) => {
        try {
            // COUNT(pld.id) AS totalLocations
            let sql = `SELECT p.id AS partnerId, p.uuid AS partnerUuid, p.name AS partnerName, p.pan AS partnerPan, 
            p.is_active AS partnerIsActive, p.created_on AS partnerCreatedOn, p.email AS partnerEmail, p.mobile AS partnerMobile, SUM(
                                    CASE 
                                        WHEN '${userTypeCode}' = 'ADM' AND pld.id IS NOT NULL THEN 1
                                        WHEN '${userTypeCode}' != 'ADM' AND pld.is_active = 1 AND pld.id IS NOT NULL THEN 1
                                        ELSE 0
                                    END
                                ) AS totalLocations, 
            psgm.gstin AS partnerGSTIn, 
            cb.name AS partnerCreatedByName, cb.uuid AS partnerCreatedByUuid,
            pc.id AS partnerCategoryId, pc.name AS partnerCategoryName, pc.code AS partnerCategoryCode,
            s.id AS stateId, s.name AS stateName 
            FROM partner p
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id 
            LEFT JOIN partner_location_detail pld ON pld.partner_statewise_gst_master_id = psgm.id 
            LEFT JOIN user cb ON cb.id = p.created_by_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN state s ON s.id = psgm.state_id 
            WHERE p.is_active = 1 
            AND pc.code = 'C'
            AND pcm.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}') `


            if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`         

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(pld.created_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(pld.created_on) <= DATE('${toDate}')`
            }

            sql = sql + `  GROUP BY p.id`
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


db.getPartnerWithLocations = (clientUuid, partnerCategoryId, userTypeCode, fromDate, toDate) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT p.id, p.uuid, p.name, p.email, p.mobile, pld.id AS locationId, pld.uuid AS locationUuid, 
pld.code AS code, pld.store_name AS storeName, pld.email AS locationEmail, pld.mobile AS locationMobile,
            pc.id AS partnerCategoryId, pc.name AS partnerCategoryName,  sums.uuid AS spsnUuid, sums.name AS spsnName, sums.spsn_code AS spsnCode, pc.code AS partnerCategoryCode
            FROM partner p
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id 
            LEFT JOIN partner_location_detail pld ON pld.partner_statewise_gst_master_id = psgm.id 
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id 
            LEFT JOIN spsn_user_master sums ON sums.id = pld.spsn_user_id 
            WHERE p.is_active = 1 
            AND pc.code = 'C'
            AND pcm.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}') `

            
            if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`      

            if(fromDate && fromDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(pld.created_on) >= DATE('${fromDate}')`
            }

            if(toDate && toDate?.toString()?.length > 0)
            {
                sql = sql +  ` AND DATE(pld.created_on) <= DATE('${toDate}')`
            }

            sql = sql + `  ORDER BY p.id`

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

db.getDisclaimerStatus = (partnerUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT p.id AS partnerId, p.uuid AS partnerUuid, p.name AS partnerName, p.pan AS partnerPan, p.is_disclaimer AS isDisclaimer 
            FROM partner p
            WHERE p.is_active = 1 
            AND p.uuid = '${partnerUuid}' `

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

db.updateDisclaimerStatus = (partnerUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner SET is_disclaimer = 1 
            WHERE uuid = '${partnerUuid}' `

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

db.getPartnerWithEmailMobile = (email, mobile) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT p.id, p.uuid 
            FROM partner p
            WHERE p.email = '${email}'
            AND p.mobile = '${mobile}'`

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

db.getPartnersDownload = (clientUuid, partnerUuids, fromDate, toDate, userTypeCode) => 
    {
        return new Promise((resolve, reject) => 
        {
            try
            {
                // let sql = `SELECT p.id AS partnerId, p.uuid AS partnerUuid, p.name AS partnerName, p.pan AS partnerPan, p.email AS partnerEmail, p.mobile AS partnerMobile,  p.is_active AS partnerIsActive, 
                // p.created_on AS partnerCreatedOn, 
                // pc.id AS partnerCategoryId, pc.name AS partnerCategoryName, pc.code AS partnerCategoryCode,
                // pld.id AS partnerLocationId, pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName, 
                // pld.store_location AS partnerLocationStoreLocation, pld.mobile AS partnerLocationMobile, pld.email AS partnerLocationEmail,  pld.is_active AS partnerLocationIsActive, 
                // pld.tan AS partnerLocationTan, pld.address_line1 AS partnerLocationAddressLine1, pld.address_line2 AS partnerLocationAddressLine2, 
                // pld.address_line3 AS partnerLocationAddressLine3, pld.city AS partnerLocationCity, pld.pincode AS partnerLocationPincode,
                // pld.msme_number AS partnerLocationMsmeNumber, pld.created_on AS partnerLocationCreatedOn, 
                // s.id AS stateId, s.name AS stateName,
                // psgm.id AS partnerStateWiseGstMasterId, psgm.gstin AS partnerStateWiseGstMasterGstIn 
                // FROM partner p
                // LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
                // LEFT JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id 
                // LEFT JOIN partner_location_detail pld ON pld.partner_statewise_gst_master_id = psgm.id 
                // LEFT JOIN user cb ON cb.id = p.created_by_id
                // LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
                // LEFT JOIN state s ON s.id = psgm.state_id 
                // LEFT JOIN spsn_user_master ssum ON ssum.id = pld.spsn_user_id 
                // WHERE p.is_active = 1 
                // AND pcm.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}') ` 

                let sql = ` SELECT pld.created_on AS onboardedDate, pc.code AS Category, pld.code AS Code, p.name AS PartnerName, pld.store_name AS StoreName,
pld.store_location AS Storelocation, p.mobile AS Primarycontactname, p.email AS EmailID, p.pan AS PAN, pld.tan AS TAN, 
psgm.gstin AS GSTnumber, pld.msme_number AS	MSMENumber, pld.address_line1 AS AddressLine1, 	pld.address_line2 AS AddressLine2,
pld.address_line3 AS AddressLine3, pld.city AS City, s.name AS State, pld.pincode AS Pincode, ssum.spsn_code AS spsnCode, ssum.name AS spsnName
            FROM partner_location_detail pld
            LEFT JOIN state s ON s.id = pld.state_id
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id 
            LEFT JOIN spsn_user_master ssum ON ssum.id = pld.spsn_user_id 
            WHERE p.is_active = 1 
            AND pcm.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}') `
                
                if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`
                if(partnerUuids?.length > 0)
                {
                    sql = sql + ` AND p.uuid IN (${partnerUuids})`
                }            
    
                if(fromDate && fromDate?.toString()?.length > 0)
                {
                    sql = sql +  ` AND DATE(pld.created_on) >= DATE('${fromDate}')`
                }
    
                if(toDate && toDate?.toString()?.length > 0)
                {
                    sql = sql +  ` AND DATE(pld.created_on) <= DATE('${toDate}')`
                }
    
                sql = sql + `  ORDER BY p.id, pld.id`
                
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

db.getFilePath = (id) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, file_name AS fileName, failed_file_path AS failedFilePath, processed_file_path AS processedFilePath  
                FROM partner_onboarding_log 
                WHERE id = '${id}'`
                ;
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

db.getEncryptionData = (fileName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT encryption_key, encryption_iv
                                    FROM partner_onboarding_log
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

db.getPartner = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT p.id AS partnerId, p.uuid AS partnerUuid, p.name AS partnerName, p.pan AS partnerPan, 
            p.is_active AS partnerIsActive, p.created_on AS partnerCreatedOn, p.email AS partnerEmail, p.mobile AS partnerMobile, 
            cb.name AS partnerCreatedByName, cb.uuid AS partnerCreatedByUuid,
            pc.id AS partnerCategoryId, pc.name AS partnerCategoryName, pc.code AS partnerCategoryCode,
            c.uuid AS clientUuid, c.short_name AS clientShortName, c.name AS clientName, c.code AS clientCode, c.email AS clientEmail, c.mobile AS clientMobile 
            FROM partner p
            LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
            LEFT JOIN user cb ON cb.id = p.created_by_id
            LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            LEFT JOIN client c ON c.id = pcm.client_id
            WHERE p.uuid = '${uuid}'`

            sql = sql + ` ORDER BY p.id`
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

db.getPartnerLocationForSecondaryMapping = (partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT 
                            pld.uuid,
                            pld.code,
                            pld.store_name AS storeName,
                            pld.store_location AS storeLocation,
                            pld.mobile,
                            pld.email,
                            pld.tan,
                            pld.address_line1 AS addressLine1,
                            pld.address_line2 AS addressLine2,
                            pld.address_line3 AS addressLine3,
                            pld.city,
                            pld.state_id AS stateId,
                            pld.pincode,
                            pld.msme_number AS msmeNumber,
                            pld.is_active AS isActive,
                            pld.customer_type AS customerType,   
                            pc.id AS partnerCategoryId, 
                            pc.name AS partnerCategoryName, 
                            pc.code AS partnerCategoryCode,
                            c.uuid AS clientUuid, 
                            c.short_name AS clientShortName,
                            c.name AS clientName, 
                            c.code AS clientCode, 
                            c.email AS clientEmail, 
                            c.mobile AS clientMobile,
                            IF(pld.code IS NOT NULL, CONCAT(pld.code, '-',  IF(CHAR_LENGTH(pld.store_name) > 10, CONCAT(LEFT(pld.store_name, 10), '...'), pld.store_name), ' - ', pld.customer_type, ' (', pld.store_location, ')'), '') AS partnerLabel  
                        FROM partner_location_detail pld
                        LEFT JOIN secondary_partner_location_detail spld 
                            ON pld.id = spld.partner_location_detail_id
                        LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
                        LEFT JOIN partner p ON p.id = psgm.partner_id
                        LEFT JOIN partner_category pc ON pc.id = p.partner_category_id
                        LEFT JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
                        LEFT JOIN client c ON c.id = pcm.client_id
                        WHERE p.id = '${partnerId}' 
                        AND spld.partner_location_detail_id IS NULL 
            `

            sql = sql + ` ORDER BY pld.code`
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

db.getUnallocatedPartnerLocations = (partnerUuid, userRoleCode, managerUserUuid, userId, userTypeCode) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.id, pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName, 
            pld.store_location AS partnerLocationStoreLocation, psgm.partner_id,
            p.uuid AS partnerUuid, p.name AS partnerName    
            FROM partner_location_detail pld
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id
            WHERE pld.id NOT IN (SELECT ucp.partner_location_detail_id 
                        FROM user_client_partner ucp 
                        JOIN user u ON u.id = ucp.user_id
                        JOIN role r ON r.id = u.role_id
                        WHERE ucp.partner_id = (SELECT id FROM partner WHERE uuid = '${partnerUuid}')
                        AND r.code = '${userRoleCode}'
                        AND u.id != '${userId}')
                        AND psgm.partner_id = (SELECT id FROM partner WHERE uuid = '${partnerUuid}')`

            if (managerUserUuid?.length > 0) {
                sql = sql + ` AND pld.id IN (SELECT partner_location_detail_id 
                    FROM user_client_partner 
                    WHERE user_id = (SELECT id FROM user WHERE uuid = '${managerUserUuid}') 
                    AND partner_id = (SELECT id FROM partner WHERE uuid = '${partnerUuid}'))`
            }

            
            if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

            sql = sql + `  ORDER BY pld.store_name`
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

db.getUserRoleCode = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT u.uuid, u.name, u.id, r.code  
            FROM user u
            JOIN role r ON r.id = u.role_id
            WHERE u.uuid = '${uuid}' 
            AND u.is_active = 1`
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

db.getAllocatedPartnerLocations = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.id, pld.uuid AS partnerLocationUuid, pld.code AS partnerLocationCode, pld.store_name AS partnerLocationStoreName, 
            pld.store_location AS partnerLocationStoreLocation,
            p.uuid AS partnerUuid, p.name AS partnerName  
            FROM user_client_partner ucp
            LEFT JOIN partner p ON p.id = ucp.partner_id
            LEFT JOIN partner_location_detail pld ON pld.id = ucp.partner_location_detail_id
            WHERE ucp.user_id = (SELECT id FROM user WHERE uuid = '${uuid}')`
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

db.getUnallocatedPartners = (clientUuid, userUuid, userTypeCode) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT distinct p.id AS partnerId, p.uuid AS partnerUuid, p.name AS partnerName
            FROM partner p
            JOIN partner_client_mapping pcm ON pcm.partner_id = p.id
            JOIN partner_statewise_gst_master psgm ON psgm.partner_id = p.id
            JOIN partner_location_detail pld ON pld.partner_statewise_gst_master_id = psgm.id 
            WHERE p.is_active = 1 
            AND pcm.client_id = (SELECT id FROM client WHERE uuid = '${clientUuid}')`

            
            if(userTypeCode != 'ADM' ) sql = sql + `  AND pld.is_active = 1`

            if (userUuid?.length > 0) {
                sql = sql + ` AND pld.id IN (SELECT partner_location_detail_id FROM user_client_partner WHERE user_id = (SELECT id FROM user WHERE uuid = '${userUuid}'))`
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

db.getLoggedUserClientUuid = (userId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT c.uuid, c.id 
            FROM user u
            LEFT JOIN client c ON c.id = u.linked_to_id 
            WHERE u.id = '${userId}'`
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

db.getClient = (clientUuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT c.uuid, c.id 
            FROM client c
            WHERE c.uuid = '${clientUuid}'`
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

db.updatePartnerLogMaster = (sql, dates) => {
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


db.savePartnerOnboardingLogMaster = (fileName, clientId, status, uploadedOn, uploadedFilePath, encriptionKey, encriptionIV) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `INSERT INTO partner_onboarding_log (file_name, client_id, status, uploaded_file_path, uploaded_on, encryption_key,encryption_iv) VALUES ('${fileName}', '${clientId}', '${status}', '${uploadedFilePath}', ?`
            if (encriptionKey?.length > 0 && encriptionIV?.length > 0) {
                sql = sql + `, '${encriptionKey}', '${encriptionIV}')`
            }
            else {
                sql = sql + `, null, null)`
            }
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


db.updatePartner = (uuid, email, mobile, modifyById, modifyOn, name) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner SET email = '${email}', name = '${name}', mobile = '${mobile}', modify_on = ?, modify_by_id = ${modifyById}  
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
db.updatePartnerLocationData = (uuid, storeName, storeLocation, msemNumber, tan, pincode, addressLine1, addressLine2, addressLine3, city) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_location_detail 
                        SET 
                            store_name = '${storeName}',
                            store_location = '${storeLocation}',
                            msme_number = '${msemNumber}',
                            tan = '${tan}',
                            pincode = '${pincode}',
                            address_line1 = '${addressLine1}',
                            address_line2 = '${addressLine2}',
                            address_line3 = '${addressLine3}', 
                            city = '${city}'  
                        WHERE uuid = '${uuid}'`
                        console.log(sql)
            pool.query(sql,  (error, result) => {
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


db.updatePartnerLocation = (uuid, email, mobile) => 
{
    return new Promise((resolve, reject) => 
    {
        try
        { 
            let sql = `UPDATE partner_location_detail pl 
         INNER JOIN partner_statewise_gst_master psgm 
         ON pl.partner_statewise_gst_master_id = psgm.id 
         SET pl.email = '${email}', pl.mobile = '${mobile}' 
         WHERE psgm.partner_id = (SELECT id FROM partner WHERE uuid = '${uuid}')`
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


db.getPartnerOnboardingLogs = (clientUuid, documentAttachmentId, fromDate, toDate, status) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pol.id, pol.file_name AS fileName, pol.status, pol.uploaded_on AS uploadedOn, pol.started_on AS startedOn,
                pol.completed_on AS completedOn, pol.failed_on AS failedOn, pol.uploaded_file_path AS uploadedFilePath, pol.processed_file_path AS processedFilePath,
                pol.failed_file_path AS failedFilePath, pol.client_id AS clientId, 
                pol.remark, c.uuid AS clientUuid, c.name AS clientName   
                FROM partner_onboarding_log pol
                LEFT JOIN client c ON c.id = pol.client_id
                WHERE c.uuid = '${clientUuid}' 
                `

            if (status?.length > 0) {
                sql = sql + ` AND pol.status = '${status}'`
            }

            if (fromDate?.length > 0) {
                sql = sql + ` AND DATE(pol.uploaded_on) >= '${fromDate}'`
            }

            if (toDate?.length > 0) {
                sql = sql + ` AND DATE(pol.uploaded_on) <= '${toDate}'`
            }

            sql = sql + ` ORDER by pol.uploaded_on DESC;`

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

db.changeStatusPartnerLocation = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `UPDATE partner_location_detail
                        SET is_active = IF(is_active = 1, 0, 1)
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

db.getPartnerLocationDataByUuid = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT * FROM partner_location_detail
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

db.getPartnerByUuid = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT * FROM partner
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
db.getPartnerLocationByUuid = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT * FROM partner_location_detail
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
db.getPartnerLocationDataByPartnerUuid = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.* 
            FROM partner_location_detail pld
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id
            WHERE p.uuid = '${uuid}' `
                        
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
db.getPartnerData = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, name
                FROM partner 
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


db.getPartnerUserData = (uuid) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT id, name
                FROM secondary_partner 
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

db.getPartnerlocationCodeOfPartner = (partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.code
            FROM partner_location_detail pld
            LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
            LEFT JOIN partner p ON p.id = psgm.partner_id
            WHERE p.id = '${partnerId}' 
            AND pld.is_active = 1`

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
db.getPartnerlocationCodeOfPartnerUser = (partnerId) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `SELECT pld.code
            FROM secondary_partner_location_detail spld
            LEFT JOIN partner_location_detail pld ON pld.id = spld.partner_location_detail_id
            WHERE spld.secondary_partner_id = '${partnerId}' 
            AND pld.is_active = 1`

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
                            
                            AND financial_year_id = '${financialYearId}'
                            ;
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
db.getLedgerDownloadQueue = (clientUuid, createdByUuid, status, fromDate, toDate, userTypeCode, financialYearId) => {
    return new Promise((resolve, reject) => {
        try {
            
            // IF(ldq.user_type = 'ADM', s.uuid, p.uuid) AS createdByUuid,
            // IF(ldq.user_type = 'ADM', s.name, p.name) AS createdByName,                                
            // IF(ldq.user_type = 'ADM', 'ADM', 'Partner') AS createdByRole,
                let sql = `SELECT 
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

                                CASE ldq.user_type
    WHEN 'ADM' THEN s.uuid
    WHEN 'CLNT' THEN uc.uuid
    WHEN 'Partner' THEN p.uuid
    WHEN 'AdditionalUser' THEN aluc.uuid
    WHEN 'Partner-User' THEN sp.uuid
    ELSE NULL
END AS createdByUuid,

CASE ldq.user_type
    WHEN 'ADM' THEN s.name
    WHEN 'CLNT' THEN uc.name
    WHEN 'Partner' THEN p.name
    WHEN 'AdditionalUser' THEN aluc.name
    WHEN 'Partner-User' THEN sp.name
    ELSE NULL
END AS createdByName,

CASE ldq.user_type
    WHEN 'ADM' THEN 'ADM'
    WHEN 'CLNT' THEN 'Client'
    WHEN 'Partner' THEN 'Partner'
    WHEN 'AdditionalUser' THEN 'Client User'
    WHEN 'Partner-User' THEN 'Partner-User'
    ELSE 'Unknown'
END AS createdByRole,

                                JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'locationUuid', COALESCE(pld.uuid, sppld.uuid),
                                        'locationCode', COALESCE(pld.code, sppld.code),
                                        'locationStoreName', COALESCE(pld.store_name, sppld.store_name)
                                    )
                                ) AS partnerLocations

                            FROM 
                                ledger_download_queue AS ldq
                            LEFT JOIN client c ON c.id = ldq.client_id
                            LEFT JOIN user u ON u.id = ldq.created_by_id AND (ldq.user_type = 'ADM' OR ldq.user_type = 'CLNT')
                            LEFT JOIN staff s ON s.current_user_id = u.id AND ldq.user_type = 'ADM'
                            LEFT JOIN client uc ON uc.linked_user_id = u.id AND ldq.user_type = 'CLNT'
                            LEFT JOIN additional_login_user alu ON alu.id = ldq.created_by_id AND (ldq.user_type = 'AdditionalUser')                            
                            LEFT JOIN client aluc ON aluc.id = alu.mapped_id AND ldq.user_type = 'AdditionalUser'
                            LEFT JOIN partner p ON p.id = ldq.created_by_id AND ldq.user_type = 'Partner' 
                            LEFT JOIN partner_location_detail pld 
                            ON FIND_IN_SET(pld.code, ldq.partner_location_codes) > 0

                            LEFT JOIN secondary_partner sp ON sp.id = ldq.created_by_id AND ldq.user_type = 'Partner-User'
                            LEFT JOIN secondary_partner_location_detail spld ON spld.secondary_partner_id = sp.id
                            LEFT JOIN partner spp ON spp.id = sp.partner_id 
                            LEFT JOIN partner_location_detail sppld 
                            ON spld.partner_location_detail_id = sppld.id AND FIND_IN_SET(sppld.code, ldq.partner_location_codes) > 0

                            WHERE c.uuid = '${clientUuid}'
                            AND ldq.user_type IS NOT NULL 
 `
            console.log(userTypeCode)

            if(financialYearId && financialYearId?.toString().length > 0)
            {
                 sql = sql + ` AND ldq.financial_year_id = '${financialYearId}' `
            }

            if(createdByUuid?.length > 0)
            {
                const uuidConditionsMap = {
                    'ADM': ['p.uuid', 's.uuid'],
                    'CLNT': ['p.uuid', 'uc.uuid'],
                    'AdditionalUser': ['p.uuid', 'aluc.uuid'],
                    'Partner-User': ['sp.uuid', 'p.uuid'],
                    'Partner': ['p.uuid']
                };
                
                const conditions = uuidConditionsMap[userTypeCode] || ['p.uuid'];
                const uuidConditions = conditions.map(col => `${col} = '${createdByUuid}'`).join(' OR ');
                sql += ` AND (${uuidConditions})`;

                // if(userTypeCode == 'ADM')
                //     sql = sql + ` AND (p.uuid = '${createdByUuid}' OR s.uuid = '${createdByUuid}' )`
                // else if(userTypeCode == 'CLNT')
                // {
                //     sql = sql + ` AND (p.uuid = '${createdByUuid}' OR uc.uuid = '${createdByUuid}' )`
                // }
                // else if(userTypeCode == 'AdditionalUser')
                // {
                //     sql = sql + ` AND (p.uuid = '${createdByUuid}' OR aluc.uuid = '${createdByUuid}' )`
                // }
                // else 
                //     sql = sql + ` AND (p.uuid = '${createdByUuid}')`
            }

            if(status?.length > 0)
            {
                sql = sql + ` AND ldq.status = '${status}' `
            }  
            
            if (fromDate && fromDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(ldq.from_date) >= DATE('${fromDate}')`
            }

            if (toDate && toDate?.toString()?.length > 0) {
                sql = sql + ` AND DATE(ldq.to_date) <= DATE('${toDate}')`
            }

            sql = sql + ` GROUP BY ldq.id
               ORDER BY ldq.created_on DESC;`

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
db.MovePartnerGetPartnerLocation = async (partnerLocationUuids) => {
    try{
        let sql = `SELECT pld.id as pldId, pld.partner_statewise_gst_master_id , psgm.gstin , psgm.state_id 
                    FROM partner_location_detail as pld
                    LEFT JOIN partner_statewise_gst_master psgm ON psgm.id = pld.partner_statewise_gst_master_id
                    WHERE pld.uuid IN (?)`;
        let result = await pool.promise().query(sql, [partnerLocationUuids]);
        return result[0];
    }
    catch(error){
        throw error;
    }
}
db.MovePartnerGetMovedToId = async (movedTo) => {
    try{
        let sql = `SELECT p.id
        FROM partner as p
        WHERE p.uuid = ?`;
        let result = await pool.promise().query(sql , [movedTo]);
        return result[0][0].id;
    }
    catch(error){
        throw error;
    }
}
db.MovePartnerInsertNewStatewiseGstMaster = async (partnerLocation , movedToId) =>{
    try{
        let getMaxSql = `SELECT MAX(gstin_extended_id) as max_id FROM partner_statewise_gst_master WHERE gstin = ?`;
        let maxResult = await pool.promise().query(getMaxSql, [partnerLocation.gstin]);
        let maxGstinExtendedId = maxResult[0][0].max_id || 0;
        let sql = `INSERT INTO partner_statewise_gst_master (partner_id, gstin, state_id, gstin_extended_id) 
        VALUES (?, ?, ?, ?)`;
        let result = await pool.promise().query(sql, [movedToId, partnerLocation.gstin, partnerLocation.state_id, maxGstinExtendedId+1]);
        return result[0];
    }catch(error){
        throw error;
    }
}
db.MovePartnerCheckPartnerExists = async (partnerLocationGstin , movedToId) =>{
    try{
        let sql = `SELECT id FROM partner_statewise_gst_master WHERE gstin = ? AND partner_id = ?`;
        let result = await pool.promise().query(sql , [partnerLocationGstin , movedToId])
        return result[0];
    }catch(error){
        throw error;
    } 
}
db.MovePartnerUpdatePartnerStatewiseGstMasterId = async (id , partnerId) =>{
    try{
        console.log("update",id , partnerId)
        let sql = `UPDATE partner_location_detail SET partner_statewise_gst_master_id = ${id} WHERE id = ${partnerId}`;
        let result = await pool.promise().query(sql);
        return result[0];
    }catch(error){
        throw error;
    }
}
db.getClientIdByPartnerStatewiseGstMasterId = async (partnerStatewiseGstMasterId) => {
    try {
        let sql = `SELECT pcm.client_id as clientId
        FROM partner_statewise_gst_master psgm
        JOIN partner_client_mapping pcm ON psgm.partner_id = pcm.partner_id
        WHERE psgm.id = ?`;
        let result = await pool.promise().query(sql, [partnerStatewiseGstMasterId]);
        return result[0];
    }catch(error){
        throw error;
    }
}
db.checkCustomerTypeCode = async (prefix) =>{
    try{
        let sql = `SELECT id FROM customer_type_code_master WHERE code_prefix = ?`;
        let result = await pool.promise().query(sql , [prefix]);
        return result[0];
    }catch(error){
        throw error;    
    }
}
module.exports = db
