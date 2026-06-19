import pandas as pd
import requests
import json
import sys
import os

pd.options.mode.chained_assignment = None

try:
    def outputSuccessFile(outputFolderName, outputFileName, outputSheetName, df, checkColumn, checkValue):
        df_Success = df[df[checkColumn] == checkValue]
        with pd.ExcelWriter(os.path.join(outputFolderName, outputFileName), engine='openpyxl', mode='a') as writer:
            df_Success.to_excel(writer, sheet_name=outputSheetName, index=False)

    def outputFailedFile(outputFolderName, outputFileName, outputSheetName, df, checkColumn, checkList):
        df_Failed = df[df[checkColumn].isin(checkList)]
        with pd.ExcelWriter(os.path.join(outputFolderName, outputFileName), engine='openpyxl', mode='a') as writer:
            df_Failed.to_excel(writer, sheet_name=outputSheetName, index=False)

    def checkFormat(columnName, dfList):
        for df in dfList:
            if columnName not in df.columns:
                print(json.dumps({"data" :"Format error: File is missing column ["+columnName+"]",  "code": "FILEERROR"}))
                sys.exit()

    def getClientDocMasterId(cnNo):
        filterCreditNoteNumbers = [creditNoteNumber['id'] for creditNoteNumber in creditNoteNumbers if creditNoteNumber['creditNoteNumber'] == cnNo]
        return filterCreditNoteNumbers[0]

    def uploadWorkingFile(fileName, file, creditNoteNumber, clientUUID):
        api_URL = base_URL + 'api/uploadedDoc/uploadWorkingFile'
        payload = {
           "client" : json.dumps({"uuid" : clientUUID}),
           "documentNewFolderPath" : sys.argv[5],
           "creditNoteNumber" : creditNoteNumber,
           "documentAttachment" : json.dumps({"id" : getDocumentAttachmentId()}),
           "clientDocMasterId" : json.dumps({"id" : getClientDocMasterId(creditNoteNumber)})
        }
        
        files=[
              ('uploadFile', (fileName, file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
        ]

        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save working file payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save working file response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)
        return response.status_code

    def uploadFailedFile(fileName, file, clientUUID):
        api_URL = base_URL + 'api/uploadedDoc/uploadFailedFile'
        payload = {
           "client" : json.dumps({"uuid" : clientUUID}),
           "documentFailedFolderPath" : sys.argv[6]
        }
        
        files=[
              ('uploadFile', (fileName, file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
        ]

        response = requests.post(api_URL, data=payload, headers={}, files=files)
        print(json.dumps('Save failed file payload-------'))
        print(json.dumps(payload))
        print(json.dumps('Save failed file response-------'))
        print(json.dumps(response.text))
        responseJSON = json.loads(response.text)
        return response.status_code

    def deleteIfExists(filePath):
        if mode == 'dev':
            return
        if os.path.exists(filePath):
            os.remove(filePath)

    def getDocumentAttachmentId():
        documentAttachmentIds = [documentAttachment['id'] for documentAttachment in documentAttachments if documentAttachment['name'] == 'Working File']
        return documentAttachmentIds[0]

    def changeDateFormat(dateFormat, columnName, dfList):
        for df in dfList:
            df[columnName] = pd.to_datetime(df[columnName])
            df[columnName] = df[columnName].dt.strftime(dateFormat)
    
    #Variable declaration
    mode = 'prod'
    if mode == 'dev':
        base_URL = ''
        inputFilePath = r'C:\Divyansh\APProcess\CreditNoteWorkingFile\ICNW_20-02-24_1.xlsx'
        creditNoteNumberFilePath = r'C:\Divyansh\APProcess\CreditNoteWorkingFile\billNo.txt'
        partnerLocationsFilePath = r'C:\Divyansh\APProcess\CreditNoteWorkingFile\partnerLocations.txt'
        documentAttachments = []
        clientUUID = ''
    else:
        base_URL = sys.argv[8]
        inputFilePath = sys.argv[4]
        creditNoteNumberFilePath = sys.argv[7]
        partnerLocationsFilePath = sys.argv[9]
        documentAttachments = json.loads(sys.argv[1])
        clientUUID = sys.argv[3]

    outputFolderName = 'scripts'
    
    file = open(creditNoteNumberFilePath, 'r')
    creditNoteNumbers = json.loads(file.read())
    file.close()
    
    file = open(partnerLocationsFilePath, 'r')
    partnerLocations = json.loads(file.read())
    file.close()    
    
    isSuccess = False

    #Process start
    print(json.dumps('Process started...'))
    print(json.dumps('Reading files...'))
    inputFileName = os.path.basename(inputFilePath)
    df_Working = pd.read_excel(inputFilePath, sheet_name='Working', dtype=str)
    df_SaleReport = pd.read_excel(inputFilePath, sheet_name='Sale Report', dtype=str)
    df_Target = pd.read_excel(inputFilePath, sheet_name='Target', dtype=str)

    #Convert to list
    creditNoteNumbersList = [creditNoteNumber['creditNoteNumber'] for creditNoteNumber in creditNoteNumbers]
    partnerCodeList = [partnerLocation['code'] for partnerLocation in partnerLocations]
    df_Working_Failed_List = []

    #Format checker
    print(json.dumps('Checking format...'))
    checkFormat("Credit Note No", [df_Working])
    checkFormat("Bill TO", [df_Working])
    checkFormat("Credit Note Date", [df_Working])
    checkFormat("AlternateStoreCode", [df_Working, df_SaleReport])
    checkFormat("STORE CODE", [df_Target])
    print(json.dumps('Format OK'))
    print(json.dumps('Processing files...'))

    #Changing date format
    changeDateFormat("%d-%m-%Y", "BillDate", [df_SaleReport])
    changeDateFormat("%d-%m-%Y", "Credit Note Date", [df_Working])
    
    for index, row in df_Working.iterrows():
        print(json.dumps("Processing credit note working row no. " + str(index + 1) + " of " + str(len(df_Working))))
        if row["Bill TO"] not in partnerCodeList:
            row["Remark"] = "Partner location not found in database"
            df_Working_Failed_List.append(row.to_dict())
        elif row["Credit Note No"] not in creditNoteNumbersList:
            row["Remark"] = "Credit note number not found in database"
            df_Working_Failed_List.append(row.to_dict())
        else:
            df_Working_Success = df_Working[df_Working["Credit Note No"] == row["Credit Note No"]]
            outputFileName = row["Credit Note No"] + '.xlsx'

            df_Working_Success.to_excel(os.path.join(outputFolderName, outputFileName), sheet_name='Working', index=False)
            print(json.dumps("Output file generated: " + outputFileName))
            
            outputSuccessFile(outputFolderName, outputFileName, "Sale Report", df_SaleReport, "AlternateStoreCode", row["Bill TO"])
            outputSuccessFile(outputFolderName, outputFileName, "Target", df_Target, "STORE CODE", row["Bill TO"])

            file = open(os.path.join(outputFolderName, outputFileName), "rb")
            if mode != 'dev':
                statusCode = uploadWorkingFile(outputFileName, file, row["Credit Note No"], clientUUID)
                if statusCode == 200:
                    isSuccess = True
            file.close()
            deleteIfExists(os.path.join(outputFolderName, outputFileName))

    print(json.dumps("From " + str(len(df_Working)) + " credit note working "  + str(len(df_Working_Failed_List)) + " rows rejected and rest all accepted"))
    if len(df_Working_Failed_List) > 0:
        outputFileName = os.path.splitext(inputFileName)[0]+'.xlsx'
        df_Working_Failed = pd.DataFrame(df_Working_Failed_List)

        if 'Remark' not in df_Working_Failed.columns:
            df_Working_Failed.insert(len(df_Working_Failed.columns), 'Remark', '')
        df_Working_Failed.to_excel(os.path.join(outputFolderName, outputFileName), sheet_name='Working', index=False)
        print(json.dumps("Output file generated with remark: " + outputFileName))

        outputFailedFile(outputFolderName, outputFileName, "Sale Report", df_SaleReport, "AlternateStoreCode", df_Working["Bill TO"])
        outputFailedFile(outputFolderName, outputFileName, "Target", df_Target, "STORE CODE", df_Working["Bill TO"])
        file = open(os.path.join(outputFolderName, outputFileName), "rb")
        if mode != 'dev':
            uploadFailedFile(inputFileName, file, clientUUID)
        file.close()
        deleteIfExists(os.path.join(outputFolderName, outputFileName))

    deleteIfExists(creditNoteNumberFilePath)
    deleteIfExists(partnerLocationsFilePath)
    print(json.dumps({"data":'Process complete', "code": "CMPLT", "isFailed" : len(df_Working_Failed) > 0, 'isSuccess' : isSuccess}))
except Exception as e:
    deleteIfExists(creditNoteNumberFilePath)
    deleteIfExists(partnerLocationsFilePath)
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
