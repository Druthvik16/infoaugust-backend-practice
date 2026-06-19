import pandas as pd
import requests
import json
import sys
import os
import re
from datetime import date
pd.options.mode.chained_assignment = None  # default='warn'

try:
    def deleteIfExists(path):
        if os.path.exists(path):
            os.remove(path)

    def billNoExists(billNo):
        return billNo in billNos

    def getPartnerLocationUUID(partnerCode):
        partnerUUIDs = [partnerLocation['uuid'] for partnerLocation in partnerLocations if partnerLocation['code'] == partnerCode]
        if len(partnerUUIDs) > 0:
            return partnerUUIDs[0]
        return ''

    def getDocumentCategoryId():
        filterDocumentCategories = [documentCategory['id'] for documentCategory in documentCategories if "INV" == documentCategory["code"] or "Invoice" == documentCategory["name"]]
        if len(filterDocumentCategories) > 0:
            return filterDocumentCategories[0]
        return -1

    def getDocumentId():
        filterDocuments = [document['id'] for document in documents if "PT" == document["code"]]
        if len(filterDocuments) > 0:
            return filterDocuments[0]
        return -1

    def getDocumentAttachmentId():
        filterDocumentAttachments = [documentAttachment['id'] for documentAttachment in documentAttachments if "PT File" == documentAttachment['name']]
        if len(filterDocumentAttachments) > 0:
            return filterDocumentAttachments[0]
        return -1

    def saveInvoicePTDocs(fileName, fileObj, partnerLocationUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, invoiceNo):
        api_URL = base_URL + 'api/uploadedDoc/saveInvoicePTDocs'
        payload = {
           "documentCategory" : json.dumps({"id" : documentCategoryId}),
           "document" : json.dumps({"id" : documentId}),
           "partnerLocationDetail" : json.dumps({"uuid" : partnerLocationUUID}),
           "client" : json.dumps({"uuid" : clientUUID}),
           "documentAttachment" : json.dumps({ "id" : documentAttachmentId}),
           "documentNewFolderPath" : "Uploaded_Invoice_Pt_File_Raw_Sap_dump",
           "invoiceNumber" : invoiceNo,
        }

        files=[
              ('uploadFile', (fileName, fileObj, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
            ]

        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save invoice pt docs payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save invoice pt docs response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)
        if response.status_code == 200:
            return response.status_code
        else:
            return responseJSON.get("message")

    def saveFailedFile(fileName, fileObj, df, clientUUID):
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
        if response.status_code == 200:
            pass
        
    #variable declaration
    base_URL = sys.argv[11]
    inputFilePath = sys.argv[7]
    clientUUID = sys.argv[6]

    documents = json.loads(sys.argv[1])
    documentCategories = json.loads(sys.argv[2])
    documentAttachments = json.loads(sys.argv[4])

    billNoFilePath = sys.argv[10]
    partnerLocationsFilePath = sys.argv[3]

    file = open(billNoFilePath, 'r')
    content = file.read()
    billNos = content.split(',')
    file.close()

    file = open(partnerLocationsFilePath, 'r')
    content = file.read()
    partnerLocations = json.loads(content)
    file.close()
    
    inputFileName = os.path.basename(inputFilePath)
    
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')
    requiredColumns = ["Invoice Number", "Bill To Party"]
    
    print(json.dumps('Checking format...'))
    for columnName in requiredColumns:
        if columnName not in df.columns:
            print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
            sys.exit()            
    print(json.dumps('Format OK'))
    print(json.dumps(billNos))
    print(json.dumps('Processing files...'))

    list_FailedDF = []
    gdf = df.groupby('Invoice Number')
    print(json.dumps("PT File total rows are "+str(len(gdf))))
    currentDateTime = date.today().strftime("%d-%m-%Y")
    isSuccess = False
    
    for index, group in enumerate(gdf.groups, 1):
        print(json.dumps("Processing pt file row no. " + str(index) + " of " + str(len(gdf.groups))))
        outputDF = gdf.get_group(group)
        gdf1 = outputDF.groupby('Bill To Party')
        
        documentId = getDocumentId()
        documentCategoryId = getDocumentCategoryId()
        documentAttachmentId = getDocumentAttachmentId()
        if not billNoExists(group):
            outputDF["Remark"] = "Bill no not found in database"
            list_FailedDF.append(outputDF)
            continue
        for group1 in gdf1.groups:
            outputDF = gdf1.get_group(group1).reset_index()
            outputDF = outputDF.drop(['index'], axis=1)
            partnerLocationUUID = getPartnerLocationUUID(group1)
            if partnerLocationUUID == '':
                outputDF["Remark"] = "Partner code not found in database"
                list_FailedDF.append(outputDF)
                continue
            outputFileName = group + "_" + group1 + "_" + currentDateTime + '.xlsx'
            outputPath = os.path.join('scripts', outputFileName)
            outputDF.to_excel(outputPath, index=False)
            dfile = open(outputPath, "rb")
            #Save to api
            statusCode = saveInvoicePTDocs(outputFileName, dfile, partnerLocationUUID, clientUUID, documentId, documentCategoryId, documentAttachmentId, group)
            if statusCode == 200:
                isSuccess = True
            else:
                outputDF["Remark"] = statusCode
                list_FailedDF.append(outputDF)
            dfile.close()
            deleteIfExists(outputPath)
    
    print(json.dumps("From " + str(len(gdf)) + " pt file " + str(len(list_FailedDF)) + " rows rejected"))
    if len(list_FailedDF) > 0:
        failed_df = pd.concat(list_FailedDF, axis=0, ignore_index=True)
        outputPath = os.path.join('scripts', os.path.splitext(inputFileName)[0]+'.xlsx')
        failed_df.to_excel(outputPath, index=False)
        #Save to api
        dfile = open(outputPath, "rb")
        saveFailedFile(inputFileName, dfile, failed_df, clientUUID)
        dfile.close()
        deleteIfExists(outputPath)
        print(json.dumps('Output file generated with failed remark: ' + inputFileName))
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(list_FailedDF) > 0, 'isSuccess' : isSuccess}))
except Exception as e:
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
