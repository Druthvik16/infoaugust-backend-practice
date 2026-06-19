let formidable = require('formidable');
let path = require('path');
let fs = require('fs');
let xlsx = require('xlsx');
let db = require('./dbQueryClientUploadedDocs');

module.exports = require('express').Router().post('/',async(req,res) => 
{
    let uploadedFile = null;
    try {
        let options = {
            uploadDir: path.join(__dirname, '..', 'tempFiles'),
            filename: (name, ext, part, form) => part.originalFilename
        };
        
        const form = new formidable.IncomingForm(options);
        form.multiples = false;

        // Wrap formidable's callback in a Promise
        const { file, fields } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, file) => {
                if (err) reject(err);
                else resolve({ fields, file });
            });
        });

        if (Object.keys(file).length === 0) {
            return res.status(400).json({
                status_code: 400,
                message: "No file uploaded"
            });
        }

        uploadedFile = file?.file?.[0] || file?.uploadedFile?.[0];
        let clientUploadedDocMasterId = fields.clientUploadedDocMasterId?.[0].toString().trim();
        if(!clientUploadedDocMasterId || isNaN(clientUploadedDocMasterId)){
            if (fs.existsSync(uploadedFile.filepath)) fs.unlinkSync(uploadedFile.filepath);
            return res.status(400).json({
                status_code: 400,
                message: "Missing required fields"
            });
        }
        const fileName = uploadedFile.originalFilename.trim();
        const fileExt = fileName.split('.').pop();
        // Validate file name and extension
        if (!fileName.startsWith("FOFO") && !fileName.startsWith("MBO")) {
            if (fs.existsSync(uploadedFile.filepath)) fs.unlinkSync(uploadedFile.filepath);
            return res.status(400).json({
                status_code: 400,
                message: "Invalid file name"
            });
        }
        const fileType = fileName.startsWith("FOFO") ? "FOFO" : "MBO";

        if (!['xlsx', 'csv'].includes(fileExt)) {
            if (fs.existsSync(uploadedFile.filepath)) fs.unlinkSync(uploadedFile.filepath);
            return res.status(400).json({
                status_code: 400,
                message: "Invalid file extension"
            });
        }

        // Process file
        const downloadFilePath = await validateCreditNoteWorkingFile(uploadedFile.filepath, fileName, fileType , clientUploadedDocMasterId);

        // Send response and clean up
        res.sendFile(downloadFilePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                    res.status(500).json({
                    status_code: 500,
                    message: "Error sending file"
                });
            }
            
            // Clean up files
            [uploadedFile.filepath].forEach(file => {
                try {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                } catch (cleanupErr) {
                    console.error('Error cleaning up file:', cleanupErr);
                }
            });
        });

    } catch (error) {
        // Clean up if file was uploaded
        if (uploadedFile?.filepath) {
            try {
                if (fs.existsSync(uploadedFile.filepath)) fs.unlinkSync(uploadedFile.filepath);
            } catch (cleanupErr) {
                console.error('Error cleaning up file:', cleanupErr);
            }
        }

        console.error('Error processing file:', error);
        return res.status(500).json({
            status_code: 500,
            message: error.message || error.stack || error
        });
    }
})

const validateCreditNoteWorkingFile = async (filePath , fileName , fileType , clientUploadedDocMasterId) => {
    try{
        let workbook = xlsx.readFile(filePath);
        let requiredSheetsForFOFO = ["Summary","DRM","EMP","Promo","Points","GV","Prepaid"];
        if(fileType === "FOFO"){    
            for(let sheetName of requiredSheetsForFOFO){
                if(!workbook.SheetNames.includes(sheetName)){
                    throw new Error(`Sheet ${sheetName} is not present in the file`);
                }
            }
        }else{
            if(workbook.SheetNames.length === 0){
                throw new Error(`No sheets found in the file`);
            }
        }
    for(let index = 0; index < workbook.SheetNames.length; index++){
        let sheetName = workbook.SheetNames[index];
        let sheet = workbook.Sheets[sheetName];
        let data = xlsx.utils.sheet_to_json(sheet, {raw: false ,  defval: ''});
        if(data.length === 0){
            let checkHeader = xlsx.utils.sheet_to_json(sheet, {raw: false, header: 1});
            let headerData = {}
            checkHeader[0].forEach((item) => {
                headerData[item] = '';
            })
            data = [headerData];
            // console.log("dataLength",data)
        }
        const requiredColumns = ["CNNumber", "BillToCode", "PostingDate"];
        const headers = Object.keys(data[0] || {});
        // check if required columns are present
        for (const column of requiredColumns) {
            if (!headers.includes(column)) {
                throw new Error(`Required column "${column}" is missing from file`);
            }
        }

        let docNumber = data[0]["CNNumber"].toString().trim();
        let postingDate = data[0]["PostingDate"].toString().trim();
        let billToCode = data[0]["BillToCode"].toString().trim();
        // check if required columns are empty
        if((fileType === "FOFO" && sheetName === "Summary") || (fileType === "MBO" && index === 0)){
            if(docNumber === "" || postingDate === "" || billToCode === ""){
                throw new Error("Missing data in required columns");
            }
        }
        let billToData = new Set();
        let billToCodesArr = [];
        for(let item of data){
            if(!billToData.has(item.BillToCode)){
                billToData.add(item.BillToCode);
                billToCodesArr.push(item.BillToCode);
            }
        }
        // console.log("billToData",billToData)
        let missingBillToCodes = await db.validatePostingLocationExists(billToCodesArr)
        let missingBillToCodesSet = new Set(missingBillToCodes);
        // console.log("missingBillToCodes",missingBillToCodes)
        let isValid = await db.validateCreditNoteEntryExists(docNumber,billToCode,postingDate,clientUploadedDocMasterId)
        if(!isValid && ((fileType === "FOFO" && sheetName === "Summary") || (fileType === "MBO" && index === 0))){
            throw new Error(`Credit Note do not exists for this bill no. ${docNumber} , code ${billToCode} and posting date ${postingDate}`);
        }

        let newData = data.map(item => {
            let remark = "";
            if(missingBillToCodesSet.has(item["BillToCode"])){
                remark += "Partner Location does not exists, ";
            } 
            if(item["CNNumber"] !== docNumber){
                remark += "CN Number mismatch, ";
            }
            if(item["BillToCode"] !== billToCode){
                remark += "Bill To Code mismatch, ";
            }
            if(item["PostingDate"] !== postingDate){
                remark += "Posting Date mismatch, ";
            }
            const itemWithoutRemark = {...item};
            return {
                ...itemWithoutRemark,
                "Process Remark": remark.length > 0 ? remark.slice(0, -2) : "Success" // Also remove trailing comma and space
            }
        });
        workbook.Sheets[sheetName] = xlsx.utils.json_to_sheet(newData);
    }
    
    xlsx.writeFile(workbook, filePath);

    return filePath;
    }catch(error){
        throw error;
    }
}


