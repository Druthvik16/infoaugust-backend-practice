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
        filterDocumentCategories = [documentCategory['id'] for documentCategory in documentCategories if "PA" == documentCategory["code"] or "Payment Advice" == documentCategory["name"]]
        if len(filterDocumentCategories) > 0:
            documentCategoryId = filterDocumentCategories[0]
            return documentCategoryId

    def getDocumentId():
        documentId = -1
        filterDocuments = [document['id'] for document in documents if document["code"] == "PAM"]
        if len(filterDocuments) > 0:
            documentId = filterDocuments[0]
        return documentId

    def getDocumentAttachmentId():
        filterDocumentAttachments = [documentAttachment['id'] for documentAttachment in documentAttachments if "Summary" == documentAttachment['name']]
        if len(filterDocumentAttachments) > 0:
            documentAttachmentId = filterDocumentAttachments[0]
            return documentAttachmentId

    def savePaymentAdviceMaster(vendorUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, row):

        api_URL = base_URL + 'api/vendorUploadedDoc/savePaymentAdviceMaster'
        payload = {
   "documentCategory" : {"id" : documentCategoryId},
   "document" : {"id" : documentId},
   "vendor" : {"uuid" : vendorUUID},
   "client" : {"uuid" : clientUUID},
   "narration" : row["Narration"],
   "paidDate" : row["Paid Date"],
   "totalAmount" : row["TotalPaid Amount"],
   "billNoOrRefNo" : row["Payment document reference Number"],
   "documentAttachment" : {"id" : documentAttachmentId}
}
        print(json.dumps('Save payment advice master payload-------'))
        print(json.dumps(payload))
        response = requests.post(api_URL, data=json.dumps(payload), headers={"Content-Type":"application/json"})
        print(json.dumps('Save payment advice master payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save payment advice master response-------'))
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
        print(json.dumps('Save failed file payload-------'))
        print(json.dumps(payload))
        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save failed file payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save failed file response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)

    requiredColumns = ["Vendor Code", "Paid Date", "Payment document reference Number", "Narration", "TotalPaid Amount"]
    inputFileName = os.path.basename(inputFilePath)
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')
    
    for columnName in requiredColumns:
        if columnName not in df.columns:
            print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
            sys.exit()

    df['Paid Date'] = pd.to_datetime(df['Paid Date'])
    df['Paid Date'] = df['Paid Date'].dt.strftime("%Y-%m-%d")
    
    if 'Remark' not in df.columns:
        df.insert(len(df.columns), 'Remark', '')
    for index, row in df.iterrows():
        print(json.dumps("Processing payment advice master row no. " + str(index + 1) + " of " + str(len(df))))
        vendorUUIDs = [vendor['uuid'] for vendor in vendors if vendor['code'] == row['Vendor Code']]
        documentId = getDocumentId()
        documentCategoryId = getDocumentCategoryId()
        documentAttachmentId = getDocumentAttachmentId()
        
        if len(vendorUUIDs) == 0:
            df.at[index, 'Remark'] = 'Vendor not found in database'
        elif row['Payment document reference Number'] in documentNos:
            df.at[index, 'Remark'] = 'Document number already exists in database'
        elif documentId == -1:
            df.at[index, 'Remark'] = 'Document id not found in database'
        else:
            statusCode = savePaymentAdviceMaster(vendorUUIDs[0], clientUUID, documentId, documentCategoryId, documentAttachmentId, row)
            if statusCode == 200:
                documentNos.append(row['Payment document reference Number'])
                isSuccess = True

    successDF = df[df['Remark'] == '']
    failedDF = df[df['Remark'] != '']
    print(json.dumps("From " + str(len(df)) + " payment advice master " + str(len(successDF)) + " rows acceptd and "  + str(len(failedDF)) + " rows rejected"))
    
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
