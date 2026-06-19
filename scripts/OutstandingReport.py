from datetime import date
import pandas as pd
import requests
import math
import glob
import json
import base64
import os
import io
import sys
import re
pd.options.mode.chained_assignment = None  # default='warn'

def deleteIfExists(outputPath):
    if mode != 'dev' and os.path.exists(outputPath):
        os.remove(outputPath)

def getDocumentAttachmentId():
    filterDocumentAttachments = [documentAttachment['id'] for documentAttachment in documentAttachments if "Summary" == documentAttachment['name']]
    if len(filterDocumentAttachments) > 0:
        documentAttachmentId = filterDocumentAttachments[0]
        return documentAttachmentId
    return -1

def getDocumentCategoryId():
    filterDocumentCategories = [documentCategory['id'] for documentCategory in documentCategories if "OS" == documentCategory["code"]]
    if len(filterDocumentCategories) > 0:
        documentCategoryId = filterDocumentCategories[0]
        return documentCategoryId
    return -1

def getDocumentId():
    filterDocuments = [document['id'] for document in documents if "OS" == document["code"]]
    if len(filterDocuments) > 0:
        return filterDocuments[0]
    return -1

def saveFailedFile(fileName, fileObj, df, clientUUID):
        api_URL = base_URL + 'api/spsn/uploadFailedFileOSAndCAReport'
        payload = {
   "client" : json.dumps({"uuid" : clientUUID}),
   "documentFailedFolderPath" : documentFailedFolderPath
}
        files=[
              ('uploadFile', (fileName, fileObj, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
            ]

        if mode == 'dev':
            print(json.dumps('Save failed file payload-------'))
            print(json.dumps(payload))
            return 200

        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save failed file payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save failed file response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)
        return response.status_code
    
def saveSuccessFile(fileName, fileObj, documentCategoryId, documentId, documentAttachmentId, financialYearId, uploadDate, clientUUID):

    api_URL = base_URL + 'api/spsn/saveSpsnOSandCAReport'
    payload = {
"documentCategory" : json.dumps({"id" : documentCategoryId}),
"document" : json.dumps({"id" : documentId}),
"client" : json.dumps({"uuid" : clientUUID}),
"documentAttachment" : json.dumps({ "id" : documentAttachmentId}),
"financialYear" : json.dumps({ "id" : financialYearId}),
"documentNewFolderPath" : documentNewFolderPath,
"uploadedOn" : uploadDate
}
    files=[
          ('uploadFile', (fileName, fileObj, 'application/json'))
        ]

    if mode == 'dev':
        print(json.dumps('Save spsn report payload-------'))
        print(json.dumps(payload))
        return 200

    response = requests.post(api_URL, data=payload, headers={}, files=files)
    print(json.dumps('Save spsn report payload-------'))
    print(json.dumps(payload))
    print(json.dumps('Save spsn report response-------'))
    print(json.dumps(response.text))
    responseJSON = json.loads(response.text)
    
    return response.status_code

def getSPSNUUID(SPSN):
    #Filter on basis of spsn
    filterSPSN = [spsn['uuid'] for spsn in spsnList if SPSN == spsn['code']]
    if len(filterSPSN) > 0:
        return filterSPSN[0]
    return ''

def validateAccountSPSN(Account, SPSN):

    #Filter on basis of account
    filterAccountSPSN = [accountSPSN for accountSPSN in accountSPSNList if Account == accountSPSN['code']]
    if len(filterAccountSPSN) == 0:
        return 'Partner location not found'

    #Filter the filtered list on basis of spsn
    filterAccountSPSNWithCode = [accountSPSN for accountSPSN in filterAccountSPSN if SPSN == accountSPSN['spsnCode']]
    if len(filterAccountSPSNWithCode) == 0:
        return 'SPSN not mapped with partner'
    return ''

mode = 'prod'

if mode == 'dev':
    base_URL = ''
    clientUUID = 'clientUUID'
    financialYearId = 1
    inputFilePath = r'C:\Divyansh\APProcess\Outstanding Report\InputFile_30-11-2024.xlsx'
    accountSPSNFilePath = r'C:\Divyansh\APProcess\Outstanding Report\partnerLocation.txt'
    spsnFilePath = r'C:\Divyansh\APProcess\Outstanding Report\spsn.txt'
    documents = [
  {
    "id": 1,
    "name": "Outstanding Report",
    "document_category_id": 1,
    "document_attachment_ids": 1,
    "is_active": 1,
    "created_on": "2024-11-26 12:33:29",
    "created_by_id": 1,
    "code": "OS"
  },
  {
    "id": 2,
    "name": "Adjustment Report",
    "document_category_id": 2,
    "document_attachment_ids": 1,
    "is_active": 1,
    "created_on": "2024-11-28 12:44:16",
    "created_by_id": 1,
    "code": "CA"
  }
]

    documentCategories = [
  {
    "id": 1,
    "code": "OS",
    "name": "Outstanding Report",
    "document_category_id": 1,
    "created_on": "2024-11-26 12:24:48",
    "created_by_id": 1
  },
  {
    "id": 2,
    "code": "CA",
    "name": "Adjustment Report",
    "document_category_id": 1,
    "created_on": "2024-11-26 12:24:48",
    "created_by_id": 1
  }
]

    documentAttachments = [
  {
    "id": 1,
    "name": "Summary",
    "document_category_ids": "2,3",
    "created_on": "2024-11-26 12:29:42",
    "created_by_id": 1
  }
]
    documentFailedFolderPath = ''
    documentNewFolderPath = ''
    financialYear = '2024-25'
else:
    #Variable initialization
    base_URL = sys.argv[11]
    clientUUID = sys.argv[6]
    financialYearId = sys.argv[12]
    inputFilePath = sys.argv[7]
    accountSPSNFilePath = sys.argv[10]
    spsnFilePath = sys.argv[3]
    documents = json.loads(sys.argv[1])
    documentCategories = json.loads(sys.argv[2])
    documentAttachments = json.loads(sys.argv[4])
    financialYear = sys.argv[13]
    documentFailedFolderPath = sys.argv[9]
    documentNewFolderPath = sys.argv[8]

file = open(accountSPSNFilePath, 'r')
accountSPSNList = json.loads(file.read())
file.close()

file = open(spsnFilePath, 'r')
spsnList = json.loads(file.read())
file.close()

inputFileName = os.path.basename(inputFilePath)

#Convert date dd-mm-YYYY to YYY-mm-dd
uploadDate = os.path.splitext(inputFileName)[0].split('_')[1]
uploadDate = uploadDate.split('-')
uploadDate.reverse()
uploadDate = '-'.join(uploadDate)
if pd.to_datetime(uploadDate) > pd.to_datetime(date.today()):
    print(json.dumps({"data":'Date exceeded', "code": "FILEERROR"}))
    sys.exit()

successCount = 0
isSuccess = False
list_FailedDF = []
list_SuccessDF = []
requiredColumns = ["Customer", "SPSN", "Document Date", "Posting Date"]
try:
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')
    print(json.dumps("Reading file: " + inputFileName))
    for columnName in requiredColumns:
        if columnName not in df.columns:
            print(json.dumps({"data":'File Formate Not Matched ' + columnName, "code": "FILEERROR"}))
            sys.exit()
    df.insert(len(df.columns), 'Process Remark', None)

    #Convert date format
    df['Document Date'] = pd.to_datetime(df['Document Date'])
    df['Document Date'] = df['Document Date'].dt.strftime("%Y-%m-%d")
    df['Posting Date'] = pd.to_datetime(df['Posting Date'])
    df['Posting Date'] = df['Posting Date'].dt.strftime("%Y-%m-%d")

    documentCategoryId = getDocumentCategoryId()
    documentId = getDocumentId()
    documentAttachmentId = getDocumentAttachmentId()
    
    gdf = df.groupby('SPSN')
    currentDateTime = date.today().strftime("%d-%m-%Y")
    
    for group in gdf.groups:
        df_OutstandingReport = gdf.get_group(group)
        spsnUUID = getSPSNUUID(group)

        for index, row in df_OutstandingReport.iterrows():
            Remark = validateAccountSPSN(row['Customer'], row['SPSN'])

            if spsnUUID == '':
                row['Process Remark'] = 'SPSN not found'
                list_FailedDF.append(row)
            elif Remark != '':
                #Write row to failed excel file
                row['Process Remark'] = Remark
                list_FailedDF.append(row)
            # elif pd.to_datetime(row['Posting Date']) > pd.to_datetime(date.today()):
            #     #Write row to failed excel file
            #     row['Process Remark'] = 'Date exceed'
            #     list_FailedDF.append(row)
            else:
                #If account match with spsn, write row to json file
                list_SuccessDF.append(row)
        
    if len(list_SuccessDF) > 0:
        successCount += len(list_SuccessDF)
        #Write all success rows to JSON file
        jsonFileName = 'OS_' + financialYear + '.json'
        outputPath = os.path.join('scripts', jsonFileName)
        successDF = pd.DataFrame(list_SuccessDF, columns=df_OutstandingReport.columns)
        successDF.to_json(outputPath, orient='records')
        
        outputFileName = os.path.basename(outputPath)
        
        #Call api to save success file
        dfile = open(outputPath, "rb")
        statusCode = saveSuccessFile(outputFileName, dfile, documentCategoryId, documentId, documentAttachmentId, financialYearId, uploadDate, clientUUID)
        dfile.close()

        if statusCode == 200:
            isSuccess = True

        # deleteIfExists(outputPath)
    
    print(json.dumps("From " + str(len(df)) + " outstanding report " + str(successCount) + " rows acceptd and "  + str(len(list_FailedDF)) + " rows rejected"))
    if len(list_FailedDF) > 0:
        #Write all failed rows to Excel file
        outputPath = os.path.join('scripts', 'OS_' + financialYear + '.xlsx')
        failedDF = pd.DataFrame(list_FailedDF)
        failedDF.to_excel(outputPath, index=False)
        #Call api to save failed file

        dfile = open(outputPath, "rb")
        statusCode = saveFailedFile(inputFileName, dfile, failedDF, clientUUID)
        dfile.close()

        deleteIfExists(outputPath)
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(list_FailedDF) > 0, 'isSuccess' : isSuccess}))

    deleteIfExists(accountSPSNFilePath)
    deleteIfExists(spsnFilePath)
except Exception as e:
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
    deleteIfExists(accountSPSNFilePath)
    deleteIfExists(spsnFilePath)
