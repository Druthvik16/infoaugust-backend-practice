from datetime import date
import pandas as pd
import requests
import json
import sys
import os
import re
pd.options.mode.chained_assignment = None

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

    billNumberAmountFilePath = sys.argv[10]
    file = open(billNumberAmountFilePath, 'r')
    billNumberAmounts = json.loads(file.read())
    file.close()
    
    outputFolderName = 'scripts'
    isSuccess = False
    successCount = 0
    def getDocumentCategoryId():
        filterDocumentCategories = [documentCategory['id'] for documentCategory in documentCategories if "PA" == documentCategory["code"] or "Payment Advice" == documentCategory["name"]]
        if len(filterDocumentCategories) > 0:
            documentCategoryId = filterDocumentCategories[0]
            return documentCategoryId

    def getDocumentId():
        documentId = -1
        filterDocuments = [document['id'] for document in documents if document["code"] == "PAD"]
        if len(filterDocuments) > 0:
            documentId = filterDocuments[0]
        return documentId

    def getDocumentAttachmentId():
        filterDocumentAttachments = [documentAttachment['id'] for documentAttachment in documentAttachments if "Payment Advice Detail" == documentAttachment['name']]
        if len(filterDocumentAttachments) > 0:
            documentAttachmentId = filterDocumentAttachments[0]
            return documentAttachmentId

    def savePaymentAdviceDetail(fileName, fileObj, vendorUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, billNumberAmountId):

        api_URL = base_URL + 'api/vendorUploadedDoc/savePaymentAdviceDetail'
        payload = {
   "documentCategory" : json.dumps({"id" : documentCategoryId}),
   "document" : json.dumps({"id" : documentId}),
   "vendor" : json.dumps({"uuid" : vendorUUID}),
   "client" : json.dumps({"uuid" : clientUUID}),
   "documentAttachment" : json.dumps({"id" : documentAttachmentId}),
   "clientUploadedDocsMaster" : json.dumps({"id" : billNumberAmountId}),
   "documentNewFolderPath" : ""
}
        files=[
              ('uploadFile', (fileName, fileObj, 'application/json'))
            ]
        
        print(json.dumps('Save payment advice detail payload-------'))
        print(json.dumps(payload))
        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save payment advice detail payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save payment advice detail response-------'))
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
    
    requiredColumns = ["Vendor Code", "Invoice Date", "Payment Date", "Payment Reference Number", "Net Amount Paid"]
    inputFileName = os.path.basename(inputFilePath)
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')

    #format checking
    for columnName in requiredColumns:
        if columnName not in df.columns:
            print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
            sys.exit()

    #convert date format and number format
    df['Invoice Date'] = pd.to_datetime(df['Invoice Date'])
    df['Invoice Date'] = df['Invoice Date'].dt.strftime("%Y-%m-%d")
    df['Payment Date'] = pd.to_datetime(df['Payment Date'])
    df['Payment Date'] = df['Payment Date'].dt.strftime("%Y-%m-%d")
    df['Net Amount Paid'] = pd.to_numeric(df['Net Amount Paid'])

    documentId = getDocumentId()
    documentCategoryId = getDocumentCategoryId()
    documentAttachmentId = getDocumentAttachmentId()
    
    if 'Remark' not in df.columns:
        df.insert(len(df.columns), 'Remark', '')
    for billNumberAmount in billNumberAmounts:
        df_FilterAmount = df[df["Payment Reference Number"] == billNumberAmount["billNumber"]]

        if len(df_FilterAmount) > 0:
            if str(billNumberAmount["totalAmount"]) == str(df_FilterAmount["Net Amount Paid"].sum(numeric_only=True)):
                vendorCode = df_FilterAmount.iloc[0]["Vendor Code"]
                vendorUUIDs = [vendor['uuid'] for vendor in vendors if vendor['code'] == vendorCode]

                if len(vendorUUIDs) == 0:
                    df.loc[df['Payment Reference Number'] == billNumberAmount["billNumber"], 'Remark'] = 'Vendor not found in database'
                elif documentId == -1:
                    df.loc[df['Payment Reference Number'] == billNumberAmount["billNumber"], 'Remark'] = 'Document id not found in database'
                else:
                    jsonFileName = billNumberAmount["billNumber"] + '_' + str(date.today()) + '.json'
                    jsonFileOutputPath = os.path.join(outputFolderName, jsonFileName)
                    df_FilterAmount.to_json(jsonFileOutputPath, orient='records')
                    dfile = open(jsonFileOutputPath, "rb")
                    statusCode = savePaymentAdviceDetail(jsonFileName, dfile, vendorUUIDs[0], clientUUID, documentId, documentCategoryId, documentAttachmentId, billNumberAmount["id"])
                    dfile.close()
                    if statusCode == 200:
                        isSuccess = True
                        successCount += len(df_FilterAmount)
                    os.remove(jsonFileOutputPath)
            else:
                df.loc[df['Payment Reference Number'] == billNumberAmount["billNumber"], 'Remark'] = 'Amount does not match'

    failedDF = df[df['Remark'] != '']
    print(json.dumps("From " + str(len(df)) + " payment advice detail " + str(successCount) + " rows acceptd and "  + str(len(failedDF)) + " rows rejected"))
    
    if len(failedDF) > 0:
        outputPath = os.path.join(outputFolderName, os.path.splitext(inputFileName)[0] + '.xlsx')
        failedDF.to_excel(outputPath, index=False)
        dfile = open(outputPath, "rb")
        saveFailedFile(inputFileName, dfile, clientUUID)
        dfile.close()
        if os.path.exists(outputPath):
            os.remove(outputPath)
        print(json.dumps('Output file generated with remark: ' + inputFileName))

    if os.path.exists(vendorsFilePath):
        os.remove(vendorsFilePath)
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(failedDF) > 0, 'isSuccess' : isSuccess}))
        
except Exception as e:
    if os.path.exists(vendorsFilePath):
        os.remove(vendorsFilePath)
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
