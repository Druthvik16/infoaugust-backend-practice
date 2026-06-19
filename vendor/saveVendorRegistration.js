let db = require('./dbQueryVendor')
let errorCode = require('../common/error/errorCode');
let getCode = new errorCode()
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
let vendorCommonFunction = require('./vendorCommonFunction')

module.exports = require('express').Router().post('/',async(req,res) =>
{
    try
    {
        if(!req.body.vendor || !req.body.vendor?.uuid)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Provide all values",
                "status_name" : getCode.getStatus(400)
            });
        }
        let partnerUuid = req.body.vendor?.uuid
        let partnerId = req.body.userId
        
        let vendor = await db.getPartner(partnerUuid)
        console.log(vendor)
        if(vendor?.length == 0)
        {
            res.status(400)
            return res.json({
                "status_code" : 400,
                "message"     : "Vendor not found",
                "status_name" : getCode.getStatus(400)
            });
        }

        if(vendor?.isSubmitted == 2)
        {
            res.status(500)
            return res.json({
                "status_code" : 500,
                "message"     : "Vendor document already submitted",
                "status_name" : getCode.getStatus(500)
            });
        }
        else
        {

            const {errors:validationErrors, validBody: vendorData} = await vendorCommonFunction.validateRequestBody(req.body);
    
            if(validationErrors.length > 0) 
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message"     : validationErrors[0].message,
                    "status_name" : getCode.getStatus(400)
                });
            }
            else
            {
                if(Object.keys(vendorData).length > 0)
                {
                    let partnerAdditionalInfo = await db.getPartnerAdditionalInfo(partnerId)
                    let partnerAdditionalInfoId = partnerAdditionalInfo[0].id
        
                    if(vendorData.email2)
                    {
                        let uniqueCheckEmailAddress = await vendorCommonFunction.uniqueCheckEmail(vendorData.email2, partnerAdditionalInfoId)
                        if(!uniqueCheckEmailAddress.result)
                        {
                            validationErrors.push({ field: 'Email', message: uniqueCheckEmailAddress.error});
                            delete vendorData.email2
                        }              
                    }
        
                    if(vendorData.bankAccountNumber)
                    {   
                        let uniqueCheckBank = await vendorCommonFunction.uniqueCheckBankAccountNo(vendorData.bankAccountNumber, partnerAdditionalInfoId)
                        if(!uniqueCheckBank.result)
                        {
                            validationErrors.push({ field: 'Bank account number', message: uniqueCheckBank.error});
                            delete vendorData.bankAccountNumber
                        }  
                    }
        
                    if(vendorData.gstin)
                    {   
                        let uniqueCheckGstIn = await vendorCommonFunction.uniqueCheckGstNo(vendorData.gstin, partnerAdditionalInfoId)
                        if(!uniqueCheckGstIn.result)
                        {
                            validationErrors.push({ field: 'GSTIN', message: uniqueCheckGstIn.error});
                            delete vendorData.gstin
                        }
                    }

                    if(vendorData.cin)
                    {   
                        let uniqueCheckcin = await vendorCommonFunction.uniqueCheckCINNo(vendorData.cin, partnerAdditionalInfoId)
                        if(!uniqueCheckcin.result)
                        {
                            validationErrors.push({ field: 'cin', message: uniqueCheckcin.error});
                            delete vendorData.cin
                        }
                    }
                    
                    if(vendorData.pan)
                    {
                        let uniqueCheckPanNo = await vendorCommonFunction.uniqueCheckPan(vendorData.pan, partnerId)
                        if(!uniqueCheckPanNo.result)
                        {
                            validationErrors.push({ field: 'Pan', message: uniqueCheckPanNo.error});
                            delete vendorData.pan
                        }
                        else
                        {
                            let updatePartner = await db.updatePan(partnerId, vendorData.pan)
                        }
                    }
    
                    if(validationErrors.length > 0) 
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : validationErrors[0].message,
                            "status_name" : getCode.getStatus(400)
                        });
                    }
                    
                    vendorData.isSubmitted = 1;
                    vendorData.modifiedById = partnerId;
                    vendorData.modifiedOn = new Date();
        
                    let response = await generateSqlQuery(vendorData, partnerAdditionalInfoId)
                    if(response.result)
                    {
                        res.status(200)
                        return res.json({
                            "status_code" : 200,
                            "message"     : "success",
                            "status_name" : getCode.getStatus(200)
                        });
                    }
                    else
                    {
                        res.status(400)
                        return res.json({
                            "status_code" : 400,
                            "message"     : response.error,
                            "status_name" : getCode.getStatus(400)
                        });
                    }
                }
                else
                {
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message"     : "success",
                        "status_name" : getCode.getStatus(200),
                        "error" : validationErrors
                    });
                }
            }
        }
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : e?.stack || e.message || e,
            "status_name" : getCode.getStatus(500)
        }) 
    }
})

async function generateSqlQuery(data, partnerAdditionalInfoId)
{ 
    try
    {
        const columnMapping = 
        {
            bankAccountNumber: 'bank_account_number',
            branchName : 'branch_name',
            // pan: 'pan',
            email2: 'email2',
            landlineNo: 'landline_no',
            bankName: 'bank_id',
            bankAddress: 'bank_address',
            ifscCode: 'ifsc_code',
            address1: 'address1',
            address2: 'address2',
            city: 'city_id', 
            state: 'state_id', 
            country: 'country_id',
            postalCode: 'pincode',
            gstin: 'gstin',
            cin: 'cin',
            name2: 'name2',
            modifiedOn: 'modified_on',
            modifiedById: 'modified_by_id',
            isSubmitted: 'is_submitted'
        }; 
    
        let setClauses = [];
        let values = [];
        let index = 1;
    
        for (const key in columnMapping) 
        {
            if (data[key] !== undefined) 
            {
                if(data[key] == '')
                {
                    data[key] = null;
                }
                if (key === 'bankName') 
                {
                    setClauses.push(`${columnMapping[key]} = (SELECT id FROM bank_master WHERE id = ?)`);
                    values.push(data[key].id);
                } 
                else  if (key === 'country' || key === 'state' || key === 'city') 
                {
                    setClauses.push(`${columnMapping[key]} = (SELECT id FROM ${key} WHERE id = ?)`);
                    values.push(data[key].id);
                }
                else 
                {
                    setClauses.push(`${columnMapping[key]} = ?`);
                    values.push(data[key]);
                }
                index++;
            }
        }
        const setQuery = setClauses.join(', ');
        const sql = `UPDATE partner_additional_info SET ${setQuery} WHERE id = ?`;
        values.push(partnerAdditionalInfoId);
        console.log(sql, values);
        let update = await db.updatePartnerAdditionalInfo(sql, values)
        if(update.affectedRows > 0)
        {
            return { result : true}  
        }
        else
        {
            return { result : false, error : 'Something went wrong'}  
        }
    }
    catch (e)
    {
        console.log(e)
        return { error : e?.stack || e.message || e, result : false};
    }
}



