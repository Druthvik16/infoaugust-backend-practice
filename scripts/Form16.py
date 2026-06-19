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

    vendorLocationsFilePath = sys.argv[3]
    file = open(vendorLocationsFilePath, 'r')
    vendorLocations = json.loads(file.read())
    file.close()

    documentNoFilePath = sys.argv[10]
    file = open(documentNoFilePath, 'r')
    content = file.read()
    documentNos = content.split(',')
    file.close()
    
    outputFolderName = 'scripts'
    isSuccess = False
    def getDocumentCategoryId():
        filterDocumentCategories = [documentCategory['id'] for documentCategory in documentCategories if "FSA" == documentCategory["code"]]
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

    def saveClientUploadedSummaryDocs(vendorLocationUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, row):

        api_URL = base_URL + 'api/vendorUploadedDoc/saveCnsAndForm16SummaryData'
        payload = {
   "documentDate" : '',
   "documentCategory" : {"id" : documentCategoryId},
   "document" : {"id" : documentId},
   "vendor" : {"uuid" : vendorLocationUUID},
   "client" : {"uuid" : clientUUID},
   "narration" : '',
   "monthPeriod" : 0,
   "postingDate" : '',
   "debitAmount" : 0,
   "creditAmount" : 0,
   "billNoOrRefNo" : None,
   "documentAttachment" : {"id" : documentAttachmentId},
   "invoiceNumber": None,
   "period": row["Period"],
   "financialYear": row["Financial Year"],
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
    
    requiredColumns = ["Vendor Code", "Period", "Financial Year"]
    inputFileName = os.path.basename(inputFilePath)
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')
    
    for columnName in requiredColumns:
        if columnName not in df.columns:
            print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
            sys.exit()
    
    if 'Remark' not in df.columns:
        df.insert(len(df.columns), 'Remark', '')
    for index, row in df.iterrows():
        print(json.dumps("Processing form-16 row no. " + str(index + 1) + " of " + str(len(df))))
        vendorLocationUUIDs = [vendorLocation['uuid'] for vendorLocation in vendorLocations if vendorLocation['code'] == row['Vendor Code']]
        documentId = getDocumentId("FSA")
        documentCategoryId = getDocumentCategoryId()
        documentAttachmentId = getDocumentAttachmentId()
        
        if len(vendorLocationUUIDs) == 0:
            df.at[index, 'Remark'] = 'Vendor code not found in database'
        elif row['Vendor Code'] + '-' + row["Period"] + '-' + row["Financial Year"] in documentNos:
            df.at[index, 'Remark'] = 'Form 16A already exists for vendor - '+ row['Vendor Code'] + ', period - ' + row["Period"] + ' and financial year - ' + row["Financial Year"]
        elif documentId == -1:
            df.at[index, 'Remark'] = 'Document id not found in database'
        else:
            statusCode = saveClientUploadedSummaryDocs(vendorLocationUUIDs[0], clientUUID, documentId, documentCategoryId, documentAttachmentId, row)
            if statusCode == 200:
                documentNos.append(row['Vendor Code'] + '-' + row["Period"] + '-' + row["Financial Year"])
                isSuccess = True

    successDF = df[df['Remark'] == '']
    failedDF = df[df['Remark'] != '']
    print(json.dumps("From " + str(len(df)) + " form-16 " + str(len(successDF)) + " rows acceptd and "  + str(len(failedDF)) + " rows rejected"))
    
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
    if os.path.exists(vendorLocationsFilePath):
        os.remove(vendorLocationsFilePath)
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(failedDF) > 0, 'isSuccess' : isSuccess}))
        
except Exception as e:
    if os.path.exists(documentNoFilePath):
        os.remove(documentNoFilePath)
    if os.path.exists(vendorLocationsFilePath):
        os.remove(vendorLocationsFilePath)
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
