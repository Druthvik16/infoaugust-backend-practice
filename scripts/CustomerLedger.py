import pandas as pd
import requests
import json
import sys
import os
import re
from datetime import date, datetime
pd.options.mode.chained_assignment = None  # default='warn'

try:
    base_URL = sys.argv[11]
    
    documents = json.loads(sys.argv[1])

    documentCategories = json.loads(sys.argv[2])

    documentAttachments = json.loads(sys.argv[4])

    partnerLocationsFilePath = sys.argv[3]
    file = open(partnerLocationsFilePath, 'r')
    partnerLocations = json.loads(file.read())
    file.close()

    partnerPostingDatesFilePath = sys.argv[10]
    file = open(partnerPostingDatesFilePath, 'r')
    partnerPostingDates = json.loads(file.read())
    file.close()

    def getDocumentAttachmentId():
        filterDocumentAttachments = [documentAttachment['id'] for documentAttachment in documentAttachments if "Summary" == documentAttachment['name']]
        if len(filterDocumentAttachments) > 0:
            documentAttachmentId = filterDocumentAttachments[0]
            return documentAttachmentId

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
    
    def saveClientUploadedSummaryDocs(fileName, outputFileName, fileObj, df, postingDate, partnerLocationCode, partnerLocationUUID, clientUUID):

        documentCategoryId = getDocumentCategoryId()
        documentId = getDocumentId()
        documentAttachmentId = getDocumentAttachmentId()
        openingBalance = df['Openning Balance'][0]
        closingBalance = df['Credit Amount'].sum() + df['Debit Amount'].sum()
        
        api_URL = base_URL + 'api/uploadedDoc/saveClientUploadedSummaryDocs'
        payload = {
            "fileName" : fileName,
            "documentDate" : "",
            "documentNumber" : "",
            "documentCategory" : json.dumps({"id" : documentCategoryId}),
            "document" : json.dumps({"id" : documentId}),
            "partnerLocationDetail" : json.dumps({"uuid" : partnerLocationUUID}),
            "client" : json.dumps({"uuid" : clientUUID}),
            "narration" : "",
            "monthPeriod" : 1,
            "postingDate" : postingDate,
            "debitAmount" : "",
            "creditAmount" : "",
            "billNoOrRefNo" : "",
            "documentAttachment" : json.dumps({ "id" : documentAttachmentId}),
            "documentNewFolderPath" : sys.argv[8],
            "openingBalance" : openingBalance,
            "closingBalance" : closingBalance
        }
        files=[
            ('uploadFile', (outputFileName, fileObj, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
        ]

        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save client uploaded summary payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save client uploaded summary response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)
        if response.status_code == 200:
            partnerPostingDates.append({'postingDate': postingDate, 'partnerLocationCode': partnerLocationCode})
            return response.status_code
        else:
            return responseJSON.get("message")

    def getDocumentCategoryId():
        filterDocumentCategories = [documentCategory['id'] for documentCategory in documentCategories if "LGR" == documentCategory["code"]]
        if len(filterDocumentCategories) > 0:
            documentCategoryId = filterDocumentCategories[0]
            return documentCategoryId

    def getDocumentId():
        filterDocuments = [document['id'] for document in documents if "LGR" == document["code"]]
        if len(filterDocuments) > 0:
            documentId = filterDocuments[0]
            return documentId

        ##########################################################################################################################################
        documentId = -1
        if(Text.strip() != ''):
            Text = re.sub('[-]+', " ", Text)
            Text = re.sub('[_]+', " ", Text)
            TextSplit = re.split("[\s]+", Text)

            for TextSplit in TextSplit:
                if len(TextSplit) > 1:
                    filterDocuments = [document['id'] for document in documents if TextSplit in document["name"] or TextSplit == document["code"]]
                    if len(filterDocuments) > 0:
                        documentId = filterDocuments[0]

            if documentId > -1:
                print(json.dumps(Text, ' -> ', documentId))
                print(json.dumps('---------------------------'))

    clientUUID = sys.argv[6]
    inputFilePath = sys.argv[7]
    inputFileName = os.path.basename(inputFilePath)
    
    df = pd.read_excel(inputFilePath, dtype=str).fillna('')
    requiredColumns = ["Posting Date", "Text", "Balance", "Openning Balance", "Bill No./Ref. No.", "Customer", "Doc. No.", "Debit Amount", "Credit Amount"]
    for columnName in requiredColumns:
        if columnName not in df.columns:
            print(json.dumps("Format error: File is missing column ["+columnName+"]"))
            print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
            sys.exit()
    df = df[df['Customer'].str.isnumeric()]

    df['Posting Date'] = pd.to_datetime(df['Posting Date'])

    df['monthYear'] = df['Posting Date'].dt.strftime("%m-%Y")
    df['Posting Date'] = df['Posting Date'].dt.strftime("%Y-%m-%d")

    df['Credit Amount'] = pd.to_numeric(df['Credit Amount'])
    df['Debit Amount'] = pd.to_numeric(df['Debit Amount'])

    list_FailedDF = []
    gdf = df.groupby('Customer')
    print(json.dumps("Ledger total rows are "+ str(len(gdf))))
    currentDateTime = date.today().strftime("%d-%m-%Y")
    currentMonthYear = datetime.now().strftime("%m-%Y")
    isSuccess = False

    for index, group in enumerate(gdf.groups, 1):
        print(json.dumps("Processing ledger row no. " + str(index) + " of " + str(len(gdf.groups))))
        outputDF = gdf.get_group(group)
        outputDF.insert(len(outputDF.columns), 'Remark', '')
        outputDF.loc[(outputDF["Posting Date"].isnull()) | (outputDF["monthYear"] == currentMonthYear), 'Remark'] = 'Invalid posting date'
        outputDF.loc[(outputDF["Balance"] == '') | (outputDF["Openning Balance"] == ''), 'Remark'] = 'Invalid balance amount'
        remarkAdded = outputDF['Remark'] != ''
        partnerLocationUUIDs = [partnerLocation['uuid'] for partnerLocation in partnerLocations if partnerLocation['code'] == group]

        if len(partnerLocationUUIDs) == 0:
            outputDF['Remark'] = 'Partner location not found in database'
            outputDF = outputDF.drop(['monthYear'], axis=1)
            list_FailedDF.append(outputDF)
        elif remarkAdded.any():
            outputDF = outputDF.drop(['monthYear'], axis=1)
            list_FailedDF.append(outputDF)
        else:
            gdf1 = outputDF.groupby('monthYear')
            for group1 in gdf1.groups:
                outputDF = gdf1.get_group(group1).reset_index()
                outputDF = outputDF.drop(['monthYear', 'Remark', 'index'], axis=1)

                postingDate = outputDF['Posting Date'][0]
                filterPostingDates = [partnerPostingDate for partnerPostingDate in partnerPostingDates if partnerPostingDate['postingDate'].split('T')[0] == postingDate and partnerPostingDate['partnerLocationCode'] == group]
                if len(filterPostingDates) > 0:
                    outputDF.insert(len(outputDF.columns), 'Remark', 'Posting date already exists for partner')
                    list_FailedDF.append(outputDF)
                    continue
                
                outputPath = os.path.join('scripts', group + "_" + group1 + "_" + currentDateTime + '.xlsx')
                outputFileName = os.path.basename(outputPath)
                outputDF.to_excel(outputPath, index=False)
                
                dfile = open(outputPath, "rb")
                statusCode = saveClientUploadedSummaryDocs(inputFileName, outputFileName, dfile, outputDF, postingDate, group, partnerLocationUUIDs[0], clientUUID)
                if statusCode == 200:
                    isSuccess = True
                else:
                    outputDF['Remark'] = statusCode
                    list_FailedDF.append(outputDF)
                dfile.close()
                os.remove(outputPath)
                print(json.dumps('Output file generated: ' + group + "_" + group1 + "_" + currentDateTime + '.xlsx'))

    print(json.dumps("From " + str(len(gdf)) + " ledger " + str(len(list_FailedDF)) + " rows rejected"))

    if len(list_FailedDF) > 0:
        failed_df = pd.concat(list_FailedDF, axis=0, ignore_index=True)
        outputPath = os.path.join('scripts', os.path.splitext(inputFileName)[0]+'.xlsx')
        failed_df.to_excel(outputPath, index=False)

        dfile = open(outputPath, "rb")
        saveFailedFile(inputFileName, dfile, failed_df, clientUUID)
        dfile.close()
        if os.path.exists(outputPath):
            os.remove(outputPath)
        print(json.dumps('Output file generated with failed remark: ' + inputFileName))

    if os.path.exists(partnerLocationsFilePath):
        os.remove(partnerLocationsFilePath)
    if os.path.exists(partnerPostingDatesFilePath):
        os.remove(partnerPostingDatesFilePath)
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(list_FailedDF) > 0, 'isSuccess' : isSuccess}))
except Exception as e:
    if os.path.exists(partnerLocationsFilePath):
        os.remove(partnerLocationsFilePath)
    if os.path.exists(partnerPostingDatesFilePath):
        os.remove(partnerPostingDatesFilePath)
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
