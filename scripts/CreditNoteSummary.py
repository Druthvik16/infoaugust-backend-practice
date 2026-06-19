import pandas as pd
import requests
import json
import sys
import os
import re

try:
    mode = 'prod'
    # mode = 'dev'

    if mode == 'dev':
        base_URL = ''
        #inputFilePath = r'C:\Divyansh\APProcess\CreditNoteSummary\CNS_17_02_25.csv' #upto 21-4-26,10.30AM
        inputFilePath = r'C:\Divyansh\CreditNoteSummary\CNS_20_04_26.csv' #From 21-4-26,10.30AM
        clientUUID = 'clientUUID'
        documents = [{"id": 1, "code": "OTH"}]
        documentCategories = []
        documentAttachments = []
        partnerLocationsFilePath = r'C:\Divyansh\CreditNoteSummary\partnerLocations.txt'
        documentNoFilePath = r'C:\Divyansh\CreditNoteSummary\billNo.txt'
        documentFailedFolderPath = ''
    else:
        base_URL = sys.argv[11]
        inputFilePath = sys.argv[7]
        clientUUID = sys.argv[6]
        documents = json.loads(sys.argv[1])
        documentCategories = json.loads(sys.argv[2])
        documentAttachments = json.loads(sys.argv[4])
        partnerLocationsFilePath = sys.argv[3]
        documentNoFilePath = sys.argv[10]
        documentFailedFolderPath = sys.argv[9]

    file = open(partnerLocationsFilePath, 'r')
    partnerLocations = json.loads(file.read())
    file.close()

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

    def getDocumentId(documentType, text):
        documentId = -1
        if documentType == 'DC' or documentType == 'DD':   # or documentType == 'DN'
            documentCode = text.split('-')[0]
        else:
            documentCode = documentType
        
        filterDocuments = [document['id'] for document in documents if documentCode == document["code"]]

        # if documentType == 'DN':
        #     filterDocuments = [document['id'] for document in documents if documentCode == document["code"] and documentCode == "OTH"]
        # else:
        #     filterDocuments = [document['id'] for document in documents if documentCode == document["code"]]
        if len(filterDocuments) > 0:
            documentId = filterDocuments[0]
        return documentId

    def getDocumentAttachmentId():
        filterDocumentAttachments = [documentAttachment['id'] for documentAttachment in documentAttachments if "Summary" == documentAttachment['name']]
        if len(filterDocumentAttachments) > 0:
            documentAttachmentId = filterDocumentAttachments[0]
            return documentAttachmentId

    def saveClientUploadedSummaryDocs(partnerLocationUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, row):

        api_URL = base_URL + 'api/uploadedDoc/saveCnsAndInvSummaryData'
        payload = {
   "documentDate" : '',
   "documentNumber" : row["Doc. No."],
   "documentCategory" : {"id" : documentCategoryId},
   "document" : {"id" : documentId},
   "partnerLocationDetail" : {"uuid" : partnerLocationUUID},
   "client" : {"uuid" : clientUUID},
   "narration" : row["Text"],
   "monthPeriod" : 0,
   "postingDate" : row["Posting Date"],
   "debitAmount" : row["Debit Amount"],
   "creditAmount" : row["Credit Amount"],
   "billNoOrRefNo" : row["Bill No./Ref. No."],
   "documentAttachment" : { "id" : documentAttachmentId}
}
        print(json.dumps('Save client uploaded summary payload-------'))
        print(json.dumps(payload))
        if mode == 'dev':
            return 200
        
        response = requests.post(api_URL, data=json.dumps(payload), headers={"Content-Type":"application/json"})
        print(json.dumps('Save client uploaded summary response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)
        return response.status_code

    def saveFailedFile(fileName, fileObj, clientUUID, documentFailedFolderPath):
        api_URL = base_URL + 'api/uploadedDoc/uploadFailedFile'
        payload = {
           "client" : json.dumps({"uuid" : clientUUID}),
           "documentFailedFolderPath" : documentFailedFolderPath
        }
        files=[
              ('uploadFile', (fileName, fileObj, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
            ]
        print(json.dumps('Save failed file payload-------'))
        print(json.dumps(payload))
        if mode == 'dev':
            return 200
        
        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save failed file response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)

    requiredColumns = ["Document Type", "Posting Date", "Text", "Bill No./Ref. No.", "Customer", "Doc. No.", "Debit Amount", "Credit Amount"]
    inputFileName = os.path.basename(inputFilePath)
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')
    # Convert blank Credit Amount to 0                   #From 21-4-26,10.30AM
    df['Credit Amount'] = df['Credit Amount'].replace('', '0')    
    # Convert blank Debit Amount to 0                   #From 21-4-26,10.30AM
    df['Debit Amount'] = df['Debit Amount'].replace('', '0')
    
    for columnName in requiredColumns:
        if columnName not in df.columns:
            print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
            sys.exit()

    #df.drop_duplicates(subset='Bill No./Ref. No.', inplace=True)

    df['Posting Date'] = pd.to_datetime(df['Posting Date'])
    df['Posting Date'] = df['Posting Date'].dt.strftime("%Y-%m-%d")
    
    if 'Remark' not in df.columns:
        df.insert(len(df.columns), 'Remark', '')
    for index, row in df.iterrows():
        print(json.dumps("Processing credit note summary row no. " + str(index + 1) + " of " + str(len(df))))
        partnerLocationUUIDs = [partnerLocation['uuid'] for partnerLocation in partnerLocations if partnerLocation['code'] == row['Customer']]
        documentId = getDocumentId(row['Document Type'], row['Text'])
        documentCategoryId = getDocumentCategoryId()
        documentAttachmentId = getDocumentAttachmentId()
        balanceAmount = abs(float(row['Debit Amount'])) + abs(float(row['Credit Amount']))
        
        if len(partnerLocationUUIDs) == 0:
            df.at[index, 'Remark'] = 'Partner location not found in database'
        elif row['Doc. No.'] + '-' + row['Customer'] + '-' + row['Posting Date'] in documentNos:
            df.at[index, 'Remark'] = 'Document number already exists in database'
        elif documentId == -1:
            df.at[index, 'Remark'] = 'Document id not found in database'
        elif balanceAmount <= 2:
            df.at[index, 'Remark'] = 'Invalid amount'
        else:
            statusCode = saveClientUploadedSummaryDocs(partnerLocationUUIDs[0], clientUUID, documentId, documentCategoryId, documentAttachmentId, row)
            if statusCode == 200:
                documentNos.append(row['Doc. No.'] + '-' + row['Customer'] + '-' + row['Posting Date'])
                isSuccess = True

    successDF = df[df['Remark'] == '']
    failedDF = df[df['Remark'] != '']
    print(json.dumps("From " + str(len(df)) + " credit note summary " + str(len(successDF)) + " rows acceptd and "  + str(len(failedDF)) + " rows rejected"))
    
    if len(failedDF) > 0:
        outputPath = os.path.join(outputFolderName, os.path.splitext(inputFileName)[0] + '.xlsx')
        failedDF.to_excel(outputPath, index=False)
        dfile = open(outputPath, "rb")
        saveFailedFile(inputFileName, dfile, clientUUID, documentFailedFolderPath)
        dfile.close()
        if os.path.exists(outputPath) and mode != 'dev':
            os.remove(outputPath)
        print(json.dumps('Output file generated with remark: ' + inputFileName))

    if os.path.exists(documentNoFilePath) and mode != 'dev':
        os.remove(documentNoFilePath)
    if os.path.exists(partnerLocationsFilePath) and mode != 'dev':
        os.remove(partnerLocationsFilePath)
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(failedDF) > 0, 'isSuccess' : isSuccess}))
        
except Exception as e:
    if os.path.exists(documentNoFilePath) and mode != 'dev':
        os.remove(documentNoFilePath)
    if os.path.exists(partnerLocationsFilePath) and mode != 'dev':
        os.remove(partnerLocationsFilePath)
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
