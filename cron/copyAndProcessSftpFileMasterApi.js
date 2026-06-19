let db = require('./dbQueryCronTab')
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()
let apiUrl = require('../apiUrl')
let api = new apiUrl()
let axios = require('axios')
let cloudFolderList = ['PList', 'CreditNoteSummary','CreditNoteWorking','CreditNotePDF','LedgerSummary','InvoiceSummary','InvoicePDF', 'CTransaction']
// let cloudFolderList = ['CreditNoteSummary','LedgerSummary','InvoiceSummary', 'CTransaction']

let processFolderList = ['PList', 'CreditNoteSummary','CreditNoteWorking','CreditNotePDF','LedgerSummary','InvoiceSummary','InvoicePDF', 'CTransaction']

let fileStoreTo = process.env.fileStoreTo

const { getDiskSpaceStatus } = require('../diskSpaceChecker/diskSpaceChecker.js');

module.exports = require('express').Router().get('/',async(req,res) => 
{
    try
    {
        const disk = getDiskSpaceStatus();
        if(!disk.isAvailable)
        {
            return res.json({
                status_code: 500,
                message: "Insufficient disk space available for file processing",
                data: {
                    isDiskSpaceAvailable: disk.isAvailable,
                    availableGB: disk.availableGB
                },
                status_name: getCode.getStatus(500)
            });
        }

        console.log("Calling getApiToCallCopyFile", new Date())
        getApiToCallCopyFileLocal(cloudFolderList, 0, cloudFolderList?.length)
        
        res.end()
    }
    catch(e)
    {
        console.log(e)
        res.end()
    }
})

async function getApiToCallProcessFile(processFolderList, start, end)
{
    try
    {
        if(start < end)
        {
            let folderName = processFolderList[start]
            let url = ''
            if(folderName == 'PList')
            {
                console.log("Calling PList", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getPartnerFileFromInputFolder
            }
            else if(folderName == 'CreditNoteSummary')
            {
                console.log("Calling CreditNoteSummary", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getCreditNoteSummaryFileFromInputFolder
            }
            else  if(folderName == 'CreditNoteWorking')
            {
                console.log("Calling CreditNoteWorking", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getCreditNoteWorkingFileFromInputFolder
            }
            else  if(folderName == 'LedgerSummary')
            {
                console.log("Calling LedgerSummary", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getLedgerSummaryFileFromInputFolder
            }
            else  if(folderName == 'InvoiceSummary')
            {
                console.log("Calling InvoiceSummary", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getInvoiceSummaryFileFromInputFolder
            }
            else  if(folderName == 'CTransaction')
            {
                console.log("Calling CTransaction", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getMonthlyTransactionFileFromInputFolder
            }
             
            axios.get(url).
            then(async(response) => { 
                if(response?.data)
                {
                    start++
                    getApiToCallProcessFile(processFolderList, start, end)
                }
            })
            .catch(async(err) => {
                start++
                getApiToCallProcessFile(processFolderList, start, end)
            })
        }
        else
        {
            console.log("Processing of files completed successfully", new Date())
        }
    }
    catch(e)
    {
        start++
        getApiToCallProcessFile(processFolderList, start, end)
        console.log(e)
    }
}

async function getApiToCallCopyFileLocal(cloudFolderList, start, end)
{
    try
    {
        if(start < end)
        {
            let folderName = cloudFolderList[start]
            let url = ''
            if(folderName == 'PList')
            {
                console.log("Calling PList", new Date(), " Total copy apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.copyPartnerFileFromSftpToLocal
            }
            else if(folderName == 'CreditNoteSummary')
            {
                console.log("Calling CreditNoteSummary", new Date(), " Total copy apis:" + end + " calling api no:"+start, api.serviceApi + api.cron + api.copyCreditNoteSummaryFileFromSftpToLocal)
                url = api.serviceApi + api.cron + api.copyCreditNoteSummaryFileFromSftpToLocal
            }
            else  if(folderName == 'CreditNotePDF')
            {
                console.log("Calling CreditNotePDF", new Date(), " Total copy apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.copyCreditNotePdfFileFromSftpToLocal
            }
            else  if(folderName == 'CreditNoteWorking')
            {
                console.log("Calling CreditNoteWorking", new Date(), " Total copy apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.copyCreditNoteWorkingFileFromSftpToLocal
            }
            else  if(folderName == 'LedgerSummary')
            {
                console.log("Calling LedgerSummary", new Date(), " Total copy apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.copyLedgerSummaryFileFromSftpToLocal
            }
            else  if(folderName == 'InvoiceSummary')
            {
                console.log("Calling InvoiceSummary", new Date(), " Total copy apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.copyInvoiceSummaryFileFromSftpToLocal
            }
            else  if(folderName == 'InvoicePDF')
            {
                console.log("Calling InvoicePDF", new Date(), " Total copy apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.copyInvoicePdfFileFromSftpToLocal
            }
            else  if(folderName == 'CTransaction')
            {
                console.log("Calling CTransaction", new Date(), " Total copy apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.copyMonthlyTransactionFileFromSftpToLocal
            }
             
            axios.get(url).
            then(async(response) => {
                if(response?.data)
                {
                    start++
                    getApiToCallCopyFileLocal(cloudFolderList, start, end)
                }
            })
            .catch(async(err) => {
                start++
                getApiToCallCopyFileLocal(cloudFolderList, start, end)
            })
        }
        else
        {
            console.log("Coping Process Completed for All Files", new Date())
            getApiToCallProcessFileLocal(processFolderList, 0, processFolderList?.length)
        }
    }
    catch(e)
    {
        start++
        getApiToCallCopyFileLocal(cloudFolderList, start, end)
        console.log(e)
    }
}

async function getApiToCallProcessFileLocal(processFolderList, start, end)
{
    try
    {
        if(start < end)
        {
            let folderName = processFolderList[start]
            let url = ''
            if(folderName == 'PList')
            {
                console.log("Calling PList", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getPartnerFileFromInputFolderLocal
            }
            else if(folderName == 'CreditNoteSummary')
            {
                console.log("Calling CreditNoteSummary", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getCreditNoteSummaryFileFromInputFolderLocal
            }
            else  if(folderName == 'CreditNoteWorking')
            {
                console.log("Calling CreditNoteWorking", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getCreditNoteWorkingFileFromInputFolderLocal
            }
            else  if(folderName == 'LedgerSummary')
            {
                console.log("Calling LedgerSummary", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getLedgerSummaryFileFromInputFolderLocal
            }
            else  if(folderName == 'InvoiceSummary')
            {
                console.log("Calling InvoiceSummary", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getInvoiceSummaryFileFromInputFolderLocal
            }
            else  if(folderName == 'CTransaction')
            {
                console.log("Calling CTransaction", new Date(), " Total process apis:" + end + " calling api no:"+start)
                url = api.serviceApi + api.cron + api.getMonthlyTransactionFileFromInputFolderLocal
            }
             
            axios.get(url).
            then(async(response) => { 
                if(response?.data)
                {
                    start++
                    getApiToCallProcessFileLocal(processFolderList, start, end)
                }
            })
            .catch(async(err) => {
                start++
                getApiToCallProcessFileLocal(processFolderList, start, end)
            })
        }
        else
        {
            console.log("Processing of files completed successfully", new Date())
        }
    }
    catch(e)
    {
        start++
        getApiToCallProcessFileLocal(processFolderList, start, end)
        console.log(e)
    }
}