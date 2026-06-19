let db = require('./dbQuerySpsnUser')
let uniqueFunction = require('../common/commonFunction/uniqueSearchFunction')
const commonDb = require('../common/commonFunction/dbQueryCommonFuntion')
let createUuid = require('uuid')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let docPath = require('../DOC_FOLDER_PATH/docPath')
let getPath = new docPath()
let formidable = require('formidable');
let fs = require('fs')
let mime = require('mime')
let path = require('path')
const XLSX = require('xlsx');
let fileObject = {};
let createdOn;
let isActive
let createdById;
let fileArray = []
let passKey;
let partnerLocationCodes;
let spsnNames;
let spsnCodes;
let spsnMasterCodes;
let spsnEmails;
let spsnMobiles;
let partnerLocations;
let spsnData;
let newSpsnIds = [];
let spsnMaster;
let spsnPartnerLocations;
let clientUuid;
const outputFilePath = './output.xlsx';
let sheet1 = "SPSN Master"
let sheet2 = "Partners"

let spsnId = "Sales Group" // "SPSN ID"
let name = "Name"
let spsnCode = "Sales Group"
let mobile = "SPSN Contact No."
let email = "SPSN Email ID"
let code = "Location Code"

module.exports = require('express').Router().post('/',async(req,res) => 
{
    try
    {      
        createdOn =  new Date()
        createdById = req.body.userId || 0;
        passKey = process.env.PASS_SECRET_KEY
        const loggedUserType = req.body.loggedUserType || 'SYSTEM';
        newSpsnIds = []
        isActive = 1
        fileArray = []
        fileObject = {}
        let options = {
            filename :  (name, ext, part, form) =>
                        {
                            return part.originalFilename
                        }
        }
        let form = new formidable.IncomingForm(options);
        form.parse(req, async function (error, fields, files) 
        {
            if(error) 
            {
                console.log(error);
                throw error;
            }
            if(Object.keys(files).length > 0)
            {
                req.body = fields
                if(!req.body.clientUuid)
                {
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "Provide all values",
                        "status_name" : getCode.getStatus(400)
                    })                    
                }
                clientUuid = req.body.clientUuid
                for(let file in files)
                {
                    if(Array.isArray(files[file]) == true)
                    {
                        files[file] = files[file][0]
                    }
                }

                if(path.extname(files?.spsnFile?.originalFilename)?.toLowerCase() != '.xlsx' && path.extname(files?.spsnFile?.originalFilename)?.toLowerCase() != '.csv')
                {
                    res.status(400)
                    return res.json({
                        "status_code" : 400,
                        "message" : "File Type Not Matched",
                        "status_name" : getCode.getStatus(400)
                    }) 
                }
                else
                {
                    partnerLocations = await db.getPartnerLocationDatas()
                    partnerLocationCodes = partnerLocations.map(location => location.code?.toString()?.toLowerCase())
                    spsnData = await db.getSpsnDatas()
                    spsnNames = spsnData.map(spsn => spsn.name?.toString()?.toLowerCase())
                    spsnCodes = spsnData.map(spsn => spsn.code?.toString()?.toLowerCase())
                    spsnMasterCodes = spsnData.map(spsn => spsn.spsn_code?.toString()?.toLowerCase())
                    spsnMasterCodes = spsnMasterCodes.filter(spsn => {return (spsn != '' && spsn)})
                    spsnEmails = spsnData.map(spsn => spsn.email?.toString()?.toLowerCase())
                    spsnMobiles = spsnData.map(spsn => spsn.mobile?.toString()?.toLowerCase())
                    const workbook = XLSX.readFile(files?.spsnFile?.filepath);
                    const result = processSheets(workbook);

                    if(result?.error?.length > 0)
                    {
                        res.status(500)
                        return res.json({
                            "status_code" : 500,
                            "message"     : result?.error,
                            "status_name" : getCode.getStatus(500)
                        });
                    }

                    const uniqueCheck = result?.uniqueCheck
                    const sortedMappingData = result?.sortedMappingData
                    
                    spsnMaster = uniqueCheck.filter((row) => {
                        return !(row.remark?.length > 0);
                    });

                    spsnPartnerLocations = sortedMappingData.filter((row) => {
                        return !(row.remark?.length > 0);
                    });
                    console.log(spsnPartnerLocations)
                    let response;
                            
            
                    const loggedUserTable = (loggedUserType == 'User') ? 'user' : (loggedUserType == 'Partner') ? 'partner' : (loggedUserType == 'SpsnUser') ? 'spsn_user_master' : (loggedUserType == 'AdditionalUser') ? 'additional_login_user' : null

                    if(spsnMaster?.length > 0)
                    {
                        response = await saveSpsnMaster(spsnMaster, 0, spsnMaster.length, clientUuid, loggedUserType, loggedUserTable)
                    }
                    else if(spsnPartnerLocations?.length > 0)
                    {        
                        response = await saveSpsnPartnerLocation(spsnPartnerLocations, 0, spsnPartnerLocations.length, loggedUserType, loggedUserTable) 
                    }
                    // deleteSheet(workbook, 'CopiedSheet');
                    XLSX.writeFile(workbook, files?.spsnFile?.filepath);
                    // XLSX.writeFile(workbook, outputFilePath);
                    
                    let xlsxFile = fs.readFileSync(files?.spsnFile?.filepath, 'base64')
                    
                    xlsxFile = `data:${mime.getType(files?.spsnFile?.filepath)};base64,${xlsxFile}`
                    
                    // Log MIME type and binary data for debugging
                    console.log('MIME type:', mime.getType(files?.spsnFile?.filepath));
                    
                    // Step 6: Write the Base64 string to a text file
                    const base64FilePath = './base64Data.txt';
                    // console.log(`Writing Base64 data to: ${base64FilePath}`);
                    // fs.writeFileSync(base64FilePath, xlsxFile);
                   
                    
                    uniqueFunction.removeFileFromDirectory(files?.spsnFile?.filepath)
                    // uniqueFunction.removeFileFromDirectory('./output.xlsx')
                    res.status(200)
                    return res.json({
                        "status_code" : 200,
                        "message"     : "success",
                        "data" : {"result" : response, "file" : xlsxFile},
                        "status_name" : getCode.getStatus(200)
                    });
                }
            }
            else
            {
                res.status(400)
                return res.json({
                    "status_code" : 400,
                    "message" : "File Not Found",
                    "status_name" : getCode.getStatus(400)
                }) 
            }
        })  
    } 
    catch(e)
    {
        console.log(e)
        res.status(500)
        return res.json({
            "status_code" : 500,
            "message" : "Client Not Created",
            "status_name" : getCode.getStatus(500),
            "error"     :      e
        }) 
    }
})


function processSheets(workbook) 
{
    try
    {
        const spsnMasterSheet = workbook.Sheets[sheet1];
        const spsnStoreMappingSheet = workbook.Sheets[sheet2];

        if(!spsnMasterSheet || spsnMasterSheet?.length <= 0)
        {
            return { error: `Missing required sheet '${sheet1}'` };
        }

        if(!spsnStoreMappingSheet || spsnStoreMappingSheet?.length <= 0)
        {
            return { error: `Missing required sheet '${sheet2}'` };
        }
        
        const spsnMasterHeaders = XLSX.utils.sheet_to_json(spsnMasterSheet, { header: 1 })[0];
        const spsnStoreMappingHeaders = XLSX.utils.sheet_to_json(spsnStoreMappingSheet, { header: 1 })[0];
        
        if (!validateColumns(spsnMasterHeaders, [spsnId, name, email, mobile, spsnCode])) 
        {
            return { error: `Missing required columns in sheet '${sheet1}'` };
        }

        if (!validateColumns(spsnStoreMappingHeaders, [spsnId, code])) 
        {
            return { error: `Missing required columns in sheet '${sheet2}'` };
        }
        
        const spsnMasterData = XLSX.utils.sheet_to_json(spsnMasterSheet);
        // const uniqueCheck = checkUniqueAndMarkDuplicates(spsnMasterData, [spsnId, name, email, mobile, spsnCode]);
        const uniqueCheck = checkUniqueAndMarkDuplicates(spsnMasterData, [name, email, mobile, spsnCode]);
    
        // const originalData = XLSX.utils.sheet_to_json(spsnStoreMappingSheet, { header: 1 });
    
        // const newWorksheet = XLSX.utils.aoa_to_sheet(originalData);
    
        // const newSheetName = 'CopiedSheet';
        // XLSX.utils.book_append_sheet(workbook, newWorksheet, newSheetName);
    
        
        // const CopiedSheet = workbook.Sheets['CopiedSheet'];
        const spsnStoreMappingData = XLSX.utils.sheet_to_json(spsnStoreMappingSheet);
        const [sortedMappingData, uniqueCheckSotres] = sortAndGroupByCode(spsnStoreMappingData);
       
    
        const newMasterSheet = XLSX.utils.json_to_sheet(uniqueCheck);
        // const newMappingSheet = XLSX.utils.json_to_sheet(sortedMappingData);
        
        const uniqueCheckSotreSheet = XLSX.utils.json_to_sheet(uniqueCheckSotres);
        
        workbook.Sheets[sheet1] = newMasterSheet;
        workbook.Sheets[sheet2] = uniqueCheckSotreSheet; 
        // workbook.Sheets['CopiedSheet'] = newMappingSheet;
        return { success: true, sortedMappingData, uniqueCheck};

    }
    catch (e)
    {
        console.log(e)
        return {success:false, error : e?.stack};
    }
  }
  
  function validateColumns(headers, requiredColumns) {
    return requiredColumns.every(column => headers.includes(column));
  }
  
  async function checkUniqueAndMarkDuplicates(data, uniqueColumns) {
    const seen = {};
    data.forEach(row => {
      uniqueColumns.forEach(col => {
        if (!seen[col]) seen[col] = new Set();
        // (col == spsnId) ? validateSpsnId(row[col]) :
        let validate = (col == name) ? validateName(row[col]) : (col == email) ? validateEmail(row[col]) : (col == mobile) ? validateMobile(row[col]) : (col == spsnCode) ? validateSpsnCode(row[col]) : null;

        if(!validate)
        {
            row.remark = row.remark ? `${row.remark}, Empty or invalid ${col} format ` : `Empty or invalid ${col} format`;
        }

        // if(col == name && spsnNames.includes(row[col]?.toString()?.toLowerCase()))
        // {
        //     row.remark = row.remark ? `${row.remark}, Duplicate ${col} ` : `Duplicate ${col}`;
        // }

        // if(col == spsnId && spsnCodes.includes(row[col]?.toString()?.toLowerCase()))
        // {
        //     row.remark = row.remark ? `${row.remark}, Duplicate ${col} ` : `Duplicate ${col}`;
        // }

        if(col == spsnCode && (spsnMasterCodes.includes(row[col]?.toString()?.toLowerCase()) || spsnCodes.includes(row[col]?.toString()?.toLowerCase())))
        {
            row.remark = row.remark ? `${row.remark}, Duplicate ${col} ` : `Duplicate ${col}`;
        }

        if(col == email && spsnEmails.includes(row[col]?.toString()?.toLowerCase()))
        {
            row.remark = row.remark ? `${row.remark}, Duplicate ${col} ` : `Duplicate ${col}`;
        }

        if(col == mobile && spsnMobiles.includes(row[col]?.toString()?.toLowerCase()))
        {
            row.remark = row.remark ? `${row.remark}, Duplicate ${col} ` : `Duplicate ${col}`;
        }
        // && col != spsnCode
        if (seen[col].has(row[col]) && col != name ) {
            row.remark = row.remark ? `${row.remark}, Duplicate ${col}` : `Duplicate ${col}`;
        } else {
          seen[col].add(row[col]);
        }
      });
    });

    for (const row of data) {
        let uniqueCheckClientEmail = await uniqueFunction.unquieName('client', ['email'],{ "email" : row[email] }, 0, 0)
        if(uniqueCheckClientEmail != 0)
        {
            row.remark = row.remark ? `${row.remark}, Email already exist in client ` : `Email already exist in client `;
        }

        let uniqueCheckClientMobile = await uniqueFunction.unquieName('client', ['mobile'],{ "mobile" : row[mobile] }, 0, 0)
        if(uniqueCheckClientMobile != 0)
        {
            row.remark = row.remark ? `${row.remark}, Mobile already exist in client ` : `Mobile already exist in client `;
        }

        let uniqueCheckStaffEmail = await uniqueFunction.unquieName('staff', ['email'],{ "email" : row[email] }, 0, 0)
        if(uniqueCheckStaffEmail != 0)
        {
            row.remark = row.remark ? `${row.remark}, Email already exist in staff ` : `Email already exist in staff `;
        }

        let uniqueCheckStaffMobile = await uniqueFunction.unquieName('staff', ['mobile'],{ "mobile" : row[mobile] }, 0, 0)
        if(uniqueCheckStaffMobile != 0)
        {
            row.remark = row.remark ? `${row.remark}, Mobile already exist in staff ` : `Mobile already exist in staff `;
        }

        let uniqueCheckAddOnEmail = await uniqueFunction.unquieName('additional_login_user', ['email'],{ "email" : row[email] }, 0, 0)
        if(uniqueCheckAddOnEmail != 0)
        {
            row.remark = row.remark ? `${row.remark}, Email already exist in additional user ` : `Email already exist in additional user `;
        }

        let uniqueCheckAddOnMobile = await uniqueFunction.unquieName('additional_login_user', ['mobile'],{ "mobile" : row[mobile] }, 0, 0)
        if(uniqueCheckAddOnMobile != 0)
        {
            row.remark = row.remark ? `${row.remark}, Mobile already exist in additional user ` : `Mobile already exist in additional user `;
        }

        let uniqueCheckEmailPartnerUser = await uniqueFunction.unquieName('secondary_partner', ['email'],{ "email" : row[email] }, 0, 0)
        if(uniqueCheckEmailPartnerUser != 0)
        {
            row.remark = row.remark ? `${row.remark}, Email already exist in partner user ` : `Email already exist in partner user `;
        }

        let uniqueCheckMobilePartnerUser = await uniqueFunction.unquieName('secondary_partner', ['mobile'],{ "mobile" : row[mobile] }, 0, 0)
        if(uniqueCheckMobilePartnerUser != 0)
        {
            row.remark = row.remark ? `${row.remark}, Mobile already exist in partner user ` : `Mobile already exist in partner user `;
        }

        let uniqueCheckEmailPartner = await uniqueFunction.unquieName('partner', ['email'],{ "email" : row[email] }, 0, 0)
        if(uniqueCheckEmailPartner != 0)
        {
            row.remark = row.remark ? `${row.remark}, Email already exist in partner ` : `Email already exist in partner `;
        }

        let uniqueCheckMobilePartner = await uniqueFunction.unquieName('partner', ['mobile'],{ "mobile" : row[mobile] }, 0, 0)
        if(uniqueCheckMobilePartner != 0)
        {
            row.remark = row.remark ? `${row.remark}, Mobile already exist in partner ` : `Mobile already exist in partner `;
        }

        

        let uniqueCheckEmailSpsnExtendedUser = await uniqueFunction.unquieName('spsn_extended_user', ['email'],{ "email" : row[email] }, 0, 0)
        if(uniqueCheckEmailSpsnExtendedUser != 0)
        {
            row.remark = row.remark ? `${row.remark}, Email already exist in spsn extended user ` : `Email already exist in spsn extended user `;
        }

        let uniqueCheckMobileSpsnExtendedUser = await uniqueFunction.unquieName('spsn_extended_user', ['mobile'],{ "mobile" : row[mobile] }, 0, 0)
        if(uniqueCheckMobileSpsnExtendedUser != 0)
        {
            row.remark = row.remark ? `${row.remark}, Mobile already exist in spsn extended user ` : `Mobile already exist in spsn extended user `;
        }
    }

    const data1 = data.filter((row) => {
        return !(row.remark?.length > 0);
    });
    // newSpsnIds = data1.map(row => row[spsnId]?.toString()?.toLowerCase())
    newSpsnIds = data1.map(row => row[spsnCode]?.toString()?.toLowerCase())
    return data;
  }
  
  function sortAndGroupByCode(data) {
    const seen = {};
    data.sort((a, b) => a[spsnId]?.toString().localeCompare(b[spsnId?.toString()]));
    data.forEach(row => {
        [code].forEach(col => {
            if (!seen[col]) seen[col] = new Set();
            let checkStoreCode = row[col] && row[col]?.toString()?.length > 0
            if(!checkStoreCode)
            {
                row.remark = row.remark ? `${row.remark}, Empty ${col} ` : `Empty ${col}`;
            }
            if(!partnerLocationCodes.includes(row[col]?.toString()?.toLowerCase()))
            {
                row.remark = row.remark ? `${row.remark}, ${col} not exist in database ` : `${col} not exist in database `;
            }
          if (seen[col].has(row[col]?.toString())) {
            row.remark = row.remark ? `${row.remark}, Duplicate ${col}` : `Duplicate ${col}`;
          } else {
            seen[col].add(row[col]?.toString());
          }
        });
        [spsnId].forEach(col => {
            let checkSpsnId = row[col] && row[col]?.toString()?.length > 0
            if(!checkSpsnId)
            {
                row.remark = row.remark ? `${row.remark}, Empty ${col} ` : `Empty ${col}`;
            }
            if(!spsnCodes.includes(row[col]?.toString()?.toLowerCase()) && !newSpsnIds.includes(row[col]?.toString()?.toLowerCase()))
            {
                row.remark = row.remark ? `${row.remark}, ${col} not exist in database` : `${col} not exist in database`;
            }
        });
    });
    const data1 = data.filter((row) => {
        if (row.remark?.length > 0) {
            // console.log(row, row.remark?.length);
        }
        return !(row.remark?.length > 0);
    });
    const grouped = {};
    data1.forEach(row => {
      if (!grouped[row[spsnId]?.toString()]) grouped[row[spsnId]?.toString()] = [];
      grouped[row[spsnId]?.toString()].push(row[code]);
    });
    
    return [Object.keys(grouped).map(code => ({
      code,
      locationCodes: grouped[code].join(',')
    })), data];
  }

  async function deleteSheet(workbook, sheetName)
   {
     try
     {
        if (workbook.SheetNames.includes(sheetName)) {
            delete workbook.Sheets[sheetName];
            const sheetIndex = workbook.SheetNames.indexOf(sheetName);
            if (sheetIndex > -1) {
                workbook.SheetNames.splice(sheetIndex, 1);
            }
            } 
            else {
             console.log(`Sheet "${sheetName}" does not exist in the workbook.`);
            }
        return true
    }
    catch (e) {
        console.log(e)
        return false;
    }
  }
  
  const validateName = (name1) => {
    const nameRegex = /^[A-Za-z]+([ _.-]?[A-Za-z0-9])*$/;    
    return name1 && nameRegex.test(name1);
};

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return email && emailRegex.test(email);
};

const validateSpsnId = (spsnId) => {
    const spsn = spsnId?.toString()?.trim()?.length
    return spsnId && spsn > 0;
};

const validateSpsnCode = (spsnCode) => {
    const spsn = spsnCode?.toString()?.trim()?.length
    return spsnCode && spsn > 0;
};

const validateMobile = (mobile) => {
    mobile = mobile?.toString()
    const mobileRegex = /^(?!0{10}$)[0-9]{10}$/;
    return mobile && mobileRegex.test(mobile) && new Set(mobile).size > 1;
};

async function saveSpsnMaster(spsnMaster, start, end, clientUuid, loggedUserType, loggedUserTable)
{
    try
    {
        if(start < end)
        {
            let spsn = spsnMaster[start]
            let uuid = createUuid.v1();
            let name1 = uniqueFunction.manageSpecialCharacter(spsn[name])
            let code = uniqueFunction.manageSpecialCharacter(spsn[spsnId]?.toString())
            let isActive = 1
            let createdOn = new Date()
            let email1 = uniqueFunction.manageSpecialCharacter(spsn[email])
            let mobile1 = spsn[mobile]
            let password = 'admin'
            let spsnCode1 = spsn[spsnCode]
            let saveMaster = await db.saveSpsnMasterData(uuid, name1, code, isActive, createdOn, createdById, email1, mobile1, password, passKey, clientUuid, spsnCode1)    
            
            const saveActivityLog = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'SPSN Profile Created', 'New SPSN Profile Created', saveMaster?.insertId, 'spsn_user_master', null, 'success')

            start++
            return(saveSpsnMaster(spsnMaster, start, end, clientUuid, loggedUserType, loggedUserTable))
        }
        else
        {
            console.log(spsnPartnerLocations?.length)
            if(spsnPartnerLocations?.length > 0)
            {
                console.log("1111111111111111")
                let save = await saveSpsnPartnerLocation(spsnPartnerLocations, 0, spsnPartnerLocations.length, loggedUserType, loggedUserTable)
                
                console.log("33333333333333333333")
                return save;
            }
            else
            {
                console.log("22222222")
                return true;
            }
        }
    }
    catch (e)
    {
        console.log(e)
        return {success:false, error : e?.stack};
    }
}

async function saveSpsnPartnerLocation(spsnPartnerLocations, start, end, loggedUserType, loggedUserTable)
{
    try
    {
        if(start < end)
        {
            console.log("444444444444444444")
            let spsnPartner = spsnPartnerLocations[start]   
            const spsnData = await db.getSpsnDataByCode(spsnPartner?.code)
            const currentDataLocation = await db.getPartnerLocationDataByLocationCodes(spsnPartner.locationCodes) 
            let saveSpsnPartner = await db.saveSpsnPartnerLocationData(spsnPartner?.code, spsnPartner.locationCodes)  

            for(const currentRecordLocation of currentDataLocation) 
            {
                const locationChanges = {};
                const locationLogChanges = [];
        
                const field2 = {
                    spsn_user_id : spsnData[0].id
                };
    
                
                for (const field in field2) {
                    if (field2[field] != currentRecordLocation[field]) {
                        locationChanges[field] = {
                            oldValue: currentRecordLocation[field],
                            newValue: field2[field],
                        };
                        
                        const fieldNameLocation = field?.toString().split('_').join(' ').replace(/\w\S*/g, function (txt) {
                            return txt.charAt(0).toUpperCase() +
                                txt.substr(1).toLowerCase();
                        });
    
                        locationLogChanges.push(`${fieldNameLocation}: '${currentRecordLocation[field]}' -> '${field2[field]}'`);
                    }
                }
    
                if (Object.keys(locationLogChanges).length == 0) {
                    locationLogChanges.push(`No fields were changed.`)
                }   
    
                const saveActivityLogLocation = await commonDb.saveInfoaugustActivityLog(createdById, loggedUserType, loggedUserTable, 'Partner Location Profile Updated', uniqueFunction.manageSpecialCharacter(locationLogChanges.join(' ,')), currentRecordLocation.id, 'partner_location_detail', null, 'success')                  
            }  
            start++
            return saveSpsnPartnerLocation(spsnPartnerLocations, start, end, loggedUserType, loggedUserTable)
        }
        else
        {
            return true;
        }
    }
    catch (e)
    {
        console.log(e)
        return {success:false, error : e?.stack};
    }
}