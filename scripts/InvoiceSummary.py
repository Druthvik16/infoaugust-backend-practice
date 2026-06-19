import pandas as pd
import requests
import json
import sys
import os
import re

try:
    def deleteIfExists(outputPath):
        if os.path.exists(outputPath):
            os.remove(outputPath)
    
    def changeDateFormat(dateFormat, columnName, df):
        df[columnName] = pd.to_datetime(df[columnName])
        df[columnName] = df[columnName].dt.strftime(dateFormat)

    def checkFormat(requiredColumns, df):
        for columnName in requiredColumns:
            if columnName not in df.columns:
                print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
                sys.exit()
    
    def getDocumentCategoryId():
        filterDocumentCategories = [documentCategory['id'] for documentCategory in documentCategories if "INV" == documentCategory["code"] or "Invoice" == documentCategory["name"]]
        return filterDocumentCategories[0]

    def getDocumentId(Text):
        documentId = -1
        filterDocuments = [document['id'] for document in documents if Text == document["code"]]
        if len(filterDocuments) > 0:
            documentId = filterDocuments[0]
        return documentId

    def getDocumentAttachmentId():
        filterDocumentAttachments = [documentAttachment['id'] for documentAttachment in documentAttachments if "Summary" == documentAttachment['name']]
        return filterDocumentAttachments[0]

    def getPartnerLocationUUID():
        partnerLocationUUIDs = [partnerLocation['uuid'] for partnerLocation in partnerLocations if partnerLocation['code'] == row['Customer']]
        if len(partnerLocationUUIDs) > 0:
            return partnerLocationUUIDs[0]
        return ''

    def saveClientUploadedSummaryDocs(partnerLocationUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, row):

        api_URL = base_URL + 'api/uploadedDoc/saveCnsAndInvSummaryData'
        payload = {
   "documentDate" : '',
   "documentNumber" : '',
   "documentCategory" : {"id" : documentCategoryId},
   "document" : {"id" : documentId},
   "partnerLocationDetail" : {"uuid" : partnerLocationUUID},
   "client" : {"uuid" : clientUUID},
   "narration" : '',
   "monthPeriod" : 0,
   "postingDate" : row["Posting Date"],
   "debitAmount" : row["Debit Amount"],
   "creditAmount" : '',
   "billNoOrRefNo" : row["Bill No./Ref. No."],
   "documentAttachment" : { "id" : documentAttachmentId}
}
        
        response = requests.post(api_URL, data=json.dumps(payload), headers={"Content-Type":"application/json"})
        print(json.dumps('Save invoice ssummary payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save invoice summary response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)
        if response.status_code == 200:
            #billNos.append(row["Bill No./Ref. No."])
            pass
        return response.status_code

    def saveFailedFile(fileName, fileObj, clientUUID):
        api_URL = base_URL + 'api/uploadedDoc/uploadFailedFile'
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

    #Variable declaration
    base_URL = sys.argv[11]
    inputFilePath = sys.argv[7]
    clientUUID = sys.argv[6]
    isSuccess = False
    documents = json.loads(sys.argv[1])
    documentCategories = json.loads(sys.argv[2])

    documentAttachments = json.loads(sys.argv[4])

    partnerLocationFilePath = sys.argv[3]
    file = open(partnerLocationFilePath, 'r')
    partnerLocations = json.loads(file.read())
    file.close()

    billNoFilePath = sys.argv[10]
    
    file = open(billNoFilePath, 'r')
    content = file.read()
    billNos = content.split(',')
    file.close()
    
    requiredColumns = ["Posting Date", "Bill No./Ref. No.", "Customer", "Debit Amount", "Document Type"]
    outputFolderName = 'scripts'
    #Process start
    print(json.dumps('Process started...'))
    print(json.dumps('Reading files...'))
    inputFileName = os.path.basename(inputFilePath)
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')

    #Format checker
    print(json.dumps('Checking format...'))
    checkFormat(requiredColumns, df)
    print(json.dumps('Format OK'))
    print(json.dumps('Processing files...'))

    #Remove duplicates
    df.drop_duplicates(subset='Bill No./Ref. No.', inplace=True)

    #Change date format
    changeDateFormat("%Y-%m-%d", 'Posting Date', df)

    if 'Remark' not in df.columns:
        df.insert(len(df.columns), 'Remark', '')
    
    for index, row in df.iterrows():
        print(json.dumps("Processing invoice summary row no. " + str(index + 1) + " of " + str(len(df))))
        partnerLocationUUID = getPartnerLocationUUID()
        documentId = getDocumentId(row["Document Type"])
        documentCategoryId = getDocumentCategoryId()
        documentAttachmentId = getDocumentAttachmentId()
        
        if partnerLocationUUID == '':
            df.at[index, 'Remark'] = 'Partner location not found in database'
        elif row['Bill No./Ref. No.'] in billNos:
            df.at[index, 'Remark'] = 'Bill number already exists in database'
        elif documentId == -1:
            df.at[index, 'Remark'] = 'Document id not found in database'
        else:
            statusCode = saveClientUploadedSummaryDocs(partnerLocationUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, row)
            if statusCode == 200:
                isSuccess = True

    failedDF = df[df['Remark'] != '']
    print(json.dumps("From " + str(len(df)) + " invoice summary " + str(len(failedDF)) + " rows rejected"))
    
    if len(failedDF) > 0:
        outputPath = os.path.join(outputFolderName, os.path.splitext(inputFileName)[0]+'.xlsx')
        failedDF.to_excel(outputPath, index=False)
        dfile = open(outputPath, "rb")
        saveFailedFile(inputFileName, dfile, clientUUID)
        dfile.close()
        deleteIfExists(outputPath)
        print(json.dumps('Output file generated with remark: ' + inputFileName))

    deleteIfExists(billNoFilePath)
    deleteIfExists(billNoFilePath)
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(failedDF) > 0, 'isSuccess' : isSuccess}))
        
except Exception as e:
    deleteIfExists(billNoFilePath)
    deleteIfExists(billNoFilePath)
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
