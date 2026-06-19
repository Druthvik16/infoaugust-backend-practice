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


def getPartnerCategoryId(category):
    categoryIds = [partnerCategory['id'] for partnerCategory in partnerCategories if partnerCategory['code'] == category]
    if len(categoryIds) > 0:
        return categoryIds[0]
    return None

def getStateId(stateName):
    stateIds = [state['id'] for state in states if state['name'].lower() == stateName.lower()]
    if len(stateIds) > 0:
        return stateIds[0]
    return -1

def savePartner(partnerName, emailId, mobileNo, categoryId, PAN, index, gstNumber, df_UniquePartners):
    api_URL = base_URL + 'api/partner/savePartnerSftp'
    
    payload = {"name": partnerName, "email": emailId, "mobile": mobileNo, "partnerCategory": {"id": categoryId}, "pan": PAN, "gstNumber": gstNumber}
    headers =  {"Content-Type":"application/json"}
    response = requests.post(api_URL, data=json.dumps(payload), headers=headers)
    print(json.dumps('Save partner response-------'))
    print(json.dumps(payload))
    print(json.dumps(response.text))
    responseJSON = json.loads(response.text)
    if response.status_code == 200:
        return [responseJSON.get("data").get("uuid"), '', responseJSON.get("data").get("isNewlyAdded")]
    else:
        Remark = responseJSON.get("message")
        df_UniquePartners.at[index, 'Remark'] = Remark if df_UniquePartners.at[index, 'Remark'] == None else str(df_UniquePartners.at[index, 'Remark']) + ', ' + Remark
    return ['', Remark, False]

def savePartnerClientMapping(clientUUID, partnerUUID):
    api_URL = base_URL + 'api/partner/savePartnerClientMappingSftp'
    payload = {"partner": {"uuid": partnerUUID}, "client": {"uuid": clientUUID}}
    headers =  {"Content-Type":"application/json"}
    response = requests.post(api_URL, data=json.dumps(payload), headers=headers)
    print(json.dumps('Save partner client mapping response-------'))
    print(json.dumps(payload))
    print(json.dumps(response.text))
    if response.status_code == 200:
        return True
    return False

def savePartnerStatewiseGST(partnerUUID, stateId, gstNo):
    api_URL = base_URL + 'api/partner/savePartnerStatewiseGstSftp'
    payload = {"partner": {"uuid": partnerUUID}, "state": {"id": stateId}, "gstNumber": gstNo}
    headers =  {"Content-Type":"application/json"}
    response = requests.post(api_URL, data=json.dumps(payload), headers=headers)
    print(json.dumps('Save partner statewise GST response-------'))
    print(json.dumps(payload))
    print(json.dumps(response.text))
    responseJSON = json.loads(response.text)
    if response.status_code == 200:
        return responseJSON.get("data").get("id")
    return ''

def savePartnerLocation(partnerStatewiseGSTId, stateId, row, index, df_UniquePartnerLocations):
    api_URL = base_URL + 'api/partner/savePartnerLocationSftp'
    payload = {"code": str(row['Code']),
               "spsnCode": str(row['Sales Group']),
               "storeName": row['Store Name'],
               "storeLocation": row['Store Location'],
               "partnerStatewiseGstMaster": {"id": partnerStatewiseGSTId},
               "mobile": row['Primary Contact Number'],
               "email": row['Email ID'],
               "tan": row['TAN'],
               "addressLine1": row['Address Line 1'],
               "addressLine2": row['Address Line 2'],
               "addressLine3": row['Address Line 3'],
               "city": row['City'],
               "state": {"id": stateId},
               "pincode": row['Pincode'],
               "msmeNumber": row['MSME Number']}
    
    headers =  {"Content-Type":"application/json"}
    response = requests.post(api_URL, data=json.dumps(payload), headers=headers)
    print(json.dumps('Save partner location response-------'))
    print(json.dumps(payload))
    print(json.dumps(response.text))
    responseJSON = json.loads(response.text)
    if response.status_code == 200:
        Remark = responseJSON.get("data").get("remark")
    else:
        Remark = responseJSON.get("message")
    df_UniquePartnerLocations.at[index, 'Remark'] = Remark if df_UniquePartnerLocations.at[index, 'Remark'] == None else str(df_UniquePartnerLocations.at[index, 'Remark']) + ', ' + Remark
    return Remark

base_URL = sys.argv[11]
filePath = sys.argv[10]
excelFiles = glob.glob(filePath)
requiredColumns = ["Category", "Code", "Sales Group", "Partner Name", "Store Name", "Store Location", "Primary Contact Number", "Email ID", "PAN", "TAN", "GST Number", "MSME Number", "Address Line 1", "Address Line 2", "Address Line 3", "City", "State", "Pincode"]
try:
    for excelFile in excelFiles:
        df = pd.read_excel(filePath, dtype=str).fillna('')
        
        for columnName in requiredColumns:
            if columnName not in df.columns:
                print(json.dumps({"data":'File Formate Not Matched', "code": "FILEFORMATERROR"}))
                sys.exit()
        df.insert(len(df.columns), 'Remark', None)
        
    #df_UniquePartners = df.drop_duplicates(subset=['Primary Contact Number','Email ID'])
    df_UniquePartners = df.copy()

    states = json.loads(sys.argv[6])
    partnerCategories = json.loads(sys.argv[2])
    bearerToken = sys.argv[9]
    partnerLocations = []
    locationCodeList = [partnerLocation['code'] for partnerLocation in partnerLocations]
    partnerClientMapping = []
    partnerStatewiseMaster = []
    partners = []
    clientUUID = sys.argv[8]
    df_UniquePartnersList = []
    df_UniquePartnerLocationList = []

    for index, row in df_UniquePartners.iterrows():
        IsInvalid = False
        FailRemark = ''
        #Check missing values
        if row['GST Number'] == '':
            FailRemark = 'GST Number is missing'
            IsInvalid = True
        elif row['State'] == '':
            FailRemark = 'State is missing'
            IsInvalid = True
        elif row['Code'] == '':
            FailRemark = 'Location code is missing'
            IsInvalid = True
        elif row['Category'] == '':
            FailRemark = 'Category is missing'
            IsInvalid = True
        elif row['Email ID'] == '':
            FailRemark = 'Email ID is missing'
            IsInvalid = True
        elif row['Primary Contact Number'] == '':
            FailRemark = 'Primary Contact Number is missing'
            IsInvalid = True
        elif re.fullmatch('^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$', row['Email ID']) == None:
            FailRemark = 'Email ID is invalid'
            IsInvalid = True
        elif re.fullmatch('[0-9]{10}', row['Primary Contact Number']) == None:
            FailRemark = 'Primary Contact Number is invalid'
            IsInvalid = True

        df_UniquePartnerLocations = df[(df['Primary Contact Number'] == row['Primary Contact Number']) & (df['Email ID'] == row['Email ID'])]

        #Check if state exists in database
        stateId = getStateId(row['State'])
        if stateId == -1:
            FailRemark = 'State does not exist in database' if FailRemark == None else FailRemark + ', ' + 'State does not exist in database'
            IsInvalid = True

        if IsInvalid:
            row['Remark'] = FailRemark
            df_UniquePartnerLocationList.append(row.to_dict())
            df_UniquePartnersList.append(row.to_dict())
            continue

        partnerUUID = ['', '', '']
        #Get category id and save partner
        categoryId = getPartnerCategoryId(row['Category'])
        if categoryId != None:
            partnerUUID = savePartner(row['Partner Name'], row['Email ID'], row['Primary Contact Number'], categoryId, row['PAN'], index, row['GST Number'], df_UniquePartners)
        else:
            df_UniquePartners.at[index, 'Remark'] = 'Invalid partner category' if df_UniquePartners.at[index, 'Remark'] == None else str(df_UniquePartners.at[index, 'Remark']) + ', ' + 'Invalid partner category'

        if partnerUUID[0] != '':
            if partnerUUID[2] == True:
                row['Remark'] = 'Updated'
            else:
                row['Remark'] = 'Already exists'
            df_UniquePartnersList.append(row.to_dict())
            savePartnerClientMapping(clientUUID, partnerUUID[0])
            partnerStatewiseGSTId = savePartnerStatewiseGST(partnerUUID[0], stateId, row['GST Number'])

            if partnerStatewiseGSTId != '':
                row['Remark'] = savePartnerLocation(partnerStatewiseGSTId, stateId, row, index, df_UniquePartnerLocations)
        else:
            row['Remark'] = partnerUUID[1]

        df_UniquePartnerLocationList.append(row.to_dict())

    print(json.dumps("Output file with remark:"))
    if len(df_UniquePartnerLocationList) > 0:
        df_UniquePartnerLocationList = pd.DataFrame(df_UniquePartnerLocationList)
        
        with pd.ExcelWriter('Output.xlsx', engine='openpyxl') as writer:
            df_UniquePartnerLocationList.to_excel(writer, sheet_name='Locations', index=False)
            df_UniquePartnerLocationList.to_excel('Output.xlsx', sheet_name='Locations', index=False)
    if len(df_UniquePartnersList) > 0:
        df_UniquePartnersList = pd.DataFrame(df_UniquePartnersList)
        
        with pd.ExcelWriter('Output.xlsx', engine='openpyxl', mode='a') as writer:
            df_UniquePartnersList.to_excel(writer, sheet_name='Partners', index=False)
            df_UniquePartnersList.to_excel('Output.xlsx', sheet_name='Partners', index=False)
    f = open("Output.xlsx", "rb")
    f.seek(0)
    base64String = str(base64.b64encode(f.read()))
    f.close()
    # 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,'+
    print(json.dumps({"data":base64String[2:-1], "code": "CMPLT"}))
    if os.path.exists("Output.xlsx"):
        os.remove("Output.xlsx")
except Exception as e:
    print(json.dumps({"data":"Error occured: " + str(e), "code": "ERROR"}))
