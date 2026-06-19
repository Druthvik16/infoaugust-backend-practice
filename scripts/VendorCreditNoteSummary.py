import pandas as pd
import requests
import json
import sys
import os
import re

try:
    base_URL = sys.argv[11]
    inputFilePath = sys.argv[7]
    clientUUID = sys.argv[6]
    documents = json.loads(sys.argv[1])

    documentCategories = json.loads(sys.argv[2])

    documentAttachments = json.loads(sys.argv[4])

    vendorsFilePath = sys.argv[3]
    file = open(vendorsFilePath, 'r')
    vendors = json.loads(file.read())
    file.close()

    documentNoFilePath = sys.argv[10]
    file = open(documentNoFilePath, 'r')
    content = file.read()
    documentNos = content.split(',')
    file.close()
    
    outputFolderName = 'scripts'
    isSuccess = False
    def getDocumentCategoryId():
        filterDocumentCategories = [documentCategory['id'] for documentCategory in documentCategories if "CN" == documentCategory["code"] or "Credit Note" == documentCategory["name"]]
        if len(filterDocumentCategories) > 0:
            documentCategoryId = filterDocumentCategories[0]
            return documentCategoryId

    def getDocumentId(documentType):
        documentId = -1
        filterDocuments = [document['id'] for document in documents if documentType == document["code"]]
        if len(filterDocuments) > 0:
            documentId = filterDocuments[0]
        return documentId

    def getDocumentAttachmentId():
        filterDocumentAttachments = [documentAttachment['id'] for documentAttachment in documentAttachments if "Summary" == documentAttachment['name']]
        if len(filterDocumentAttachments) > 0:
            documentAttachmentId = filterDocumentAttachments[0]
            return documentAttachmentId

    def saveClientUploadedSummaryDocs(vendorUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, row):

        api_URL = base_URL + 'api/vendorUploadedDoc/saveCnsAndForm16SummaryData'
        payload = {
   "documentDate" : '',
   "documentCategory" : {"id" : documentCategoryId},
   "document" : {"id" : documentId},
   "vendor" : {"uuid" : vendorUUID},
   "client" : {"uuid" : clientUUID},
   "narration" : row["Text"],
   "monthPeriod" : 0,
   "postingDate" : row["Posting Date"],
   "debitAmount" : row["Debit Amount"],
   "creditAmount" : row["Credit Amount"],
   "billNoOrRefNo" : row["Bill No."],
   "documentAttachment" : {"id" : documentAttachmentId},
   "invoiceNumber": row["Invoice Number"],
   "period": None,
   "financialYear": None,
}
        
        response = requests.post(api_URL, data=json.dumps(payload), headers={"Content-Type":"application/json"})
        print(json.dumps('Save client uploaded summary payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save client uploaded summary response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)
        return response.status_code

    def saveFailedFile(fileName, fileObj, clientUUID):
        api_URL = base_URL + 'api/vendorUploadedDoc/uploadFailedFile'
        payload = {
           "client" : json.dumps({"uuid" : clientUUID}),
           "documentFailedFolderPath" : sys.argv[9]
        }
        files=[
              ('uploadFile', (fileName, fileObj, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
            ]

        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save failed file payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save failed file response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)

    requiredColumns = ["Document Type", "Posting Date", "Text", "Bill No.", "Vendor Code", "Invoice Number", "Debit Amount", "Credit Amount"]
    inputFileName = os.path.basename(inputFilePath)
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')
    
    for columnName in requiredColumns:
        if columnName not in df.columns:
            print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
            sys.exit()

    df['Posting Date'] = pd.to_datetime(df['Posting Date'])
    df['Posting Date'] = df['Posting Date'].dt.strftime("%Y-%m-%d")
    
    if 'Remark' not in df.columns:
        df.insert(len(df.columns), 'Remark', '')
    for index, row in df.iterrows():
        print(json.dumps("Processing credit note summary row no. " + str(index + 1) + " of " + str(len(df))))
        vendorUUIDs = [vendor['uuid'] for vendor in vendors if vendor['code'] == row['Vendor Code']]
        documentId = getDocumentId(row['Document Type'])
        documentCategoryId = getDocumentCategoryId()
        documentAttachmentId = getDocumentAttachmentId()
        balanceAmount = abs(float(row['Debit Amount'])) + abs(float(row['Credit Amount']))
        
        if len(vendorUUIDs) == 0:
            df.at[index, 'Remark'] = 'Vendor code not found in database'
        elif row['Bill No.'] + '-' + row['Vendor Code'] in documentNos:
            df.at[index, 'Remark'] = 'Document number already exists in database'
        elif documentId == -1:
            df.at[index, 'Remark'] = 'Document id not found in database'
        elif balanceAmount < 2:
            df.at[index, 'Remark'] = 'Invalid amount'
        else:
            statusCode = saveClientUploadedSummaryDocs(vendorUUIDs[0], clientUUID, documentId, documentCategoryId, documentAttachmentId, row)
            if statusCode == 200:
                documentNos.append(row['Bill No.'])
                isSuccess = True

    successDF = df[df['Remark'] == '']
    failedDF = df[df['Remark'] != '']
    print(json.dumps("From " + str(len(df)) + " credit note summary " + str(len(successDF)) + " rows acceptd and "  + str(len(failedDF)) + " rows rejected"))
    
    if len(failedDF) > 0:
        outputPath = os.path.join(outputFolderName, os.path.splitext(inputFileName)[0] + '.xlsx')
        failedDF.to_excel(outputPath, index=False)
        dfile = open(outputPath, "rb")
        saveFailedFile(inputFileName, dfile, clientUUID)
        dfile.close()
        if os.path.exists(outputPath):
            os.remove(outputPath)
        print(json.dumps('Output file generated with remark: ' + inputFileName))

    if os.path.exists(documentNoFilePath):
        os.remove(documentNoFilePath)
    if os.path.exists(vendorsFilePath):
        os.remove(vendorsFilePath)
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(failedDF) > 0, 'isSuccess' : isSuccess}))
        
except Exception as e:
    if os.path.exists(documentNoFilePath):
        os.remove(documentNoFilePath)
    if os.path.exists(vendorsFilePath):
        os.remove(vendorsFilePath)
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
