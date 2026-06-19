const fs = require('fs');
class docPath{
    constructor()
    {
        try 
        {
            let vendorLog = "logs/vendor,logs/vendor/sftpProcessLogs,logs/vendor/s3BucketProcessLogs,logs/vendor/sftpProcessLogs/creditNote,logs/vendor/sftpProcessLogs/invoice,logs/vendor/sftpProcessLogs/ledger,logs/vendor/sftpProcessLogs/partner,logs/vendor/sftpProcessLogs/monthlyTransaction,logs/vendor/sftpProcessLogs/creditNote/summary,logs/vendor/sftpProcessLogs/creditNote/pdf,logs/vendor/sftpProcessLogs/creditNote/working,logs/vendor/sftpProcessLogs/invoice/summary,logs/vendor/sftpProcessLogs/invoice/pdf,logs/vendor/sftpProcessLogs/invoice/pt,logs/vendor/sftpProcessLogs/form16,logs/vendor/sftpProcessLogs/form16/pdf,logs/vendor/sftpProcessLogs/form16/summary,logs/vendor/sftpProcessLogs/paymentAdviceMaster,logs/vendor/sftpProcessLogs/paymentAdviceDetail,logs/vendor/s3BucketProcessLogs/creditNote,logs/vendor/s3BucketProcessLogs/creditNote/summary,logs/vendor/s3BucketProcessLogs/creditNote/pdf,logs/vendor/s3BucketProcessLogs/creditNote/working,logs/vendor/s3BucketProcessLogs/invoice,logs/vendor/s3BucketProcessLogs/invoice/summary,logs/vendor/s3BucketProcessLogs/invoice/pdf,logs/vendor/s3BucketProcessLogs/invoice/pt,logs/vendor/s3BucketProcessLogs/ledger,logs/vendor/s3BucketProcessLogs/partner,logs/vendor/s3BucketProcessLogs/monthlyTransaction,logs/vendor/s3BucketProcessLogs/form16,logs/vendor/s3BucketProcessLogs/form16/pdf,logs/vendor/s3BucketProcessLogs/form16/summary,logs/vendor/s3BucketProcessLogs/paymentAdviceMaster,logs/vendor/s3BucketProcessLogs/paymentAdviceDetail,logs/vendor/pythonScriptsLog,logs/vendor/pythonScriptsLog/creditNote,logs/vendor/pythonScriptsLog/invoice,logs/vendor/pythonScriptsLog/ledger,logs/vendor/pythonScriptsLog/partner,logs/vendor/pythonScriptsLog/monthlyTransaction,logs/vendor/pythonScriptsLog/creditNote/summary,logs/vendor/pythonScriptsLog/creditNote/pdf,logs/vendor/pythonScriptsLog/creditNote/working,logs/vendor/pythonScriptsLog/invoice/summary,logs/vendor/pythonScriptsLog/invoice/pdf,logs/vendor/pythonScriptsLog/invoice/pt,logs/vendor/pythonScriptsLog/form16,logs/vendor/pythonScriptsLog/form16/pdf,logs/vendor/pythonScriptsLog/form16/summary,logs/vendor/pythonScriptsLog/paymentAdviceMaster,logs/vendor/pythonScriptsLog/paymentAdviceDetail"

            let spsnLog = "logs/spsn,logs/spsn/sftpProcessLogs,logs/spsn/s3BucketProcessLogs,logs/spsn/sftpProcessLogs/outstandingReport,logs/spsn/sftpProcessLogs/adjustmentReport,logs/spsn/sftpProcessLogs/outstandingReport/summary,logs/spsn/sftpProcessLogs/adjustmentReport/summary,logs/spsn/s3BucketProcessLogs/outstandingReport,logs/spsn/s3BucketProcessLogs/outstandingReport/summary,logs/spsn/s3BucketProcessLogs/adjustmentReport,logs/spsn/s3BucketProcessLogs/adjustmentReport/summary,logs/spsn/pythonScriptsLog,logs/spsn/pythonScriptsLog/outstandingReport,logs/spsn/pythonScriptsLog/adjustmentReport,logs/spsn/pythonScriptsLog/outstandingReport/summary,logs/spsn/pythonScriptsLog/adjustmentReport/summary"

           let folderNames = ["tempFiles","documentFolders","uploads","uploads/client","uploads/vendor","logs", "logs/sftpProcessLogs", "logs/s3BucketProcessLogs", "logs/sftpProcessLogs/creditNote","logs/sftpProcessLogs/invoice","logs/sftpProcessLogs/ledger","logs/sftpProcessLogs/partner","logs/sftpProcessLogs/monthlyTransaction","logs/sftpProcessLogs/creditNote/summary","logs/sftpProcessLogs/creditNote/pdf","logs/sftpProcessLogs/creditNote/working","logs/sftpProcessLogs/invoice/summary","logs/sftpProcessLogs/invoice/pdf","logs/sftpProcessLogs/invoice/pt", "logs/s3BucketProcessLogs/creditNote","logs/s3BucketProcessLogs/creditNote/summary","logs/s3BucketProcessLogs/creditNote/pdf","logs/s3BucketProcessLogs/creditNote/working","logs/s3BucketProcessLogs/invoice","logs/s3BucketProcessLogs/invoice/summary","logs/s3BucketProcessLogs/invoice/pdf","logs/s3BucketProcessLogs/invoice/pt","logs/s3BucketProcessLogs/ledger","logs/s3BucketProcessLogs/partner","logs/s3BucketProcessLogs/monthlyTransaction", "logs/pythonScriptsLog",
            "logs/pythonScriptsLog/creditNote","logs/pythonScriptsLog/invoice","logs/pythonScriptsLog/ledger",
            "logs/pythonScriptsLog/partner","logs/pythonScriptsLog/monthlyTransaction",
            "logs/pythonScriptsLog/creditNote/summary",
            "logs/pythonScriptsLog/creditNote/pdf","logs/pythonScriptsLog/creditNote/working",
            "logs/pythonScriptsLog/invoice/summary","logs/pythonScriptsLog/invoice/pdf","logs/pythonScriptsLog/invoice/pt" ]

            folderNames = folderNames.concat(vendorLog.split(','))
            folderNames = folderNames.concat(spsnLog.split(','))

            for(let i = 0; i < folderNames.length; i++)
            {
                if (!fs.existsSync(folderNames[i])) 
                {
                    fs.mkdirSync(folderNames[i]);
                }
            }

            
                // let folderToCreateInLocalVendorModule = ['documentFolders/vendorModule', 'documentFolders/vendorModule/client', 'documentFolders/vendorModule/client/e4d0dcc0-613c-11ef-81c4-2b91c6324805' ,'documentFolders/vendorModule/client/e4d0dcc0-613c-11ef-81c4-2b91c6324805/Input_Summary_Raw_Sap_dump', 'documentFolders/vendorModule/client/e4d0dcc0-613c-11ef-81c4-2b91c6324805/Input_Pdfs', 'documentFolders/vendorModule/client/e4d0dcc0-613c-11ef-81c4-2b91c6324805/Input_Ledger_Raw_Sap_dump', 'documentFolders/vendorModule/client/e4d0dcc0-613c-11ef-81c4-2b91c6324805/Input_form16_Summary_Raw_Sap_dump', 'documentFolders/vendorModule/client/e4d0dcc0-613c-11ef-81c4-2b91c6324805/Input_form16_Pdfs_Raw_Sap_dump']
                // for(let i = 0; i < folderToCreateInLocalVendorModule.length; i++)
                //     {
                //         if (!fs.existsSync(folderToCreateInLocalVendorModule[i])) 
                //         {
                //             fs.mkdirSync(folderToCreateInLocalVendorModule[i]);
                //         }
                //     }
        } 
        catch (err) 
        {
            console.error(err);
        } 
    }

    getName(code){
    if (code) 
	{
		switch (code) 
		{ 
			case 'root': return 'uploads'; 
            case 'client': return 'uploads/client'; 
            case 'client/documents': return 'documents'; 
            case 'vendor': return 'uploads/vendor'; 
            case 'vendor/uploadDocuments': return 'uploadDocuments'; 
            case 'vendor/documentTimeline': return 'documentTimeline'; 
            case 'vendor/po/pdf': return 'po/pdf'; 
            case 'vendor/invoice/pdf': return 'invoice/pdf'; 
            case 'template': return 'templates'; 
            case 'script': return 'scripts'; 
            case 'log': return 'logs'; 
            case 'sftpProcessLogs': return 'logs/sftpProcessLogs'; 
            case 's3BucketProcessLogs': return 'logs/s3BucketProcessLogs'; 
            case 'sftp/creditNote': return 'logs/sftpProcessLogs/creditNote'; 
            case 'sftp/creditNote/summary': return 'logs/sftpProcessLogs/creditNote/summary'; 
            case 'sftp/creditNote/pdf': return 'logs/sftpProcessLogs/creditNote/pdf'; 
            case 'sftp/creditNote/working': return 'logs/sftpProcessLogs/creditNote/working'; 
            case 'sftp/invoice': return 'logs/sftpProcessLogs/invoice'; 
            case 'sftp/invoice/summary': return 'logs/sftpProcessLogs/invoice/summary'; 
            case 'sftp/invoice/pdf': return 'logs/sftpProcessLogs/invoice/pdf'; 
            case 'sftp/invoice/pt': return 'logs/sftpProcessLogs/invoice/pt'; 
            case 'sftp/ledger': return 'logs/sftpProcessLogs/ledger'; 
            case 'sftp/partner': return 'logs/sftpProcessLogs/partner'; 
            case 'sftp/monthlyTransaction': return 'logs/sftpProcessLogs/monthlyTransaction'; 
            case 's3/creditNote': return 'logs/s3BucketProcessLogs/creditNote'; 
            case 's3/creditNote/summary': return 'logs/s3BucketProcessLogs/creditNote/summary'; 
            case 's3/creditNote/pdf': return 'logs/s3BucketProcessLogs/creditNote/pdf'; 
            case 's3/creditNote/working': return 'logs/s3BucketProcessLogs/creditNote/working'; 
            case 's3/invoice': return 'logs/s3BucketProcessLogs/invoice'; 
            case 's3/invoice/summary': return 'logs/s3BucketProcessLogs/invoice/summary'; 
            case 's3/invoice/pdf': return 'logs/s3BucketProcessLogs/invoice/pdf'; 
            case 's3/invoice/pt': return 'logs/s3BucketProcessLogs/invoice/pt'; 
            case 's3/ledger': return 'logs/s3BucketProcessLogs/ledger'; 
            case 's3/partner': return 'logs/s3BucketProcessLogs/partner'; 
            case 's3/monthlyTransaction': return 'logs/s3BucketProcessLogs/monthlyTransaction';
            case 'script/creditNote': return 'logs/pythonScriptsLog/creditNote'; 
            case 'script/creditNote/summary': return 'logs/pythonScriptsLog/creditNote/summary'; 
            case 'script/creditNote/pdf': return 'logs/pythonScriptsLog/creditNote/pdf'; 
            case 'script/creditNote/working': return 'logs/pythonScriptsLog/creditNote/working'; 
            case 'script/invoice': return 'logs/pythonScriptsLog/invoice'; 
            case 'script/invoice/summary': return 'logs/pythonScriptsLog/invoice/summary'; 
            case 'script/invoice/pdf': return 'logs/pythonScriptsLog/invoice/pdf'; 
            case 'script/invoice/pt': return 'logs/pythonScriptsLog/invoice/pt';
            case 'script/ledger': return 'logs/pythonScriptsLog/ledger'; 
            case 'script/partner': return 'logs/pythonScriptsLog/partner'; 
            case 'script/monthlyTransaction': return 'logs/pythonScriptsLog/monthlyTransaction';  
            case 'documentFolders': return 'documentFolders';
//////// For vendor html logs
            case 'log/vendor': return 'vendor'; 
            case 'vendor/sftpProcessLogs': return 'logs/vendor/sftpProcessLogs'; 
            case 'vendor/s3BucketProcessLogs': return 'logs/vendor/s3BucketProcessLogs'; 
            case 'vendor/sftp/creditNote': return 'logs/vendor/sftpProcessLogs/creditNote'; 
            case 'vendor/sftp/creditNote/summary': return 'logs/vendor/sftpProcessLogs/creditNote/summary'; 
            case 'vendor/sftp/creditNote/pdf': return 'logs/vendor/sftpProcessLogs/creditNote/pdf'; 
            case 'vendor/sftp/creditNote/working': return 'logs/vendor/sftpProcessLogs/creditNote/working'; 
            case 'vendor/sftp/invoice': return 'logs/vendor/sftpProcessLogs/invoice'; 
            case 'vendor/sftp/invoice/summary': return 'logs/vendor/sftpProcessLogs/invoice/summary'; 
            case 'vendor/sftp/invoice/pdf': return 'logs/vendor/sftpProcessLogs/invoice/pdf'; 
            case 'vendor/sftp/invoice/pt': return 'logs/vendor/sftpProcessLogs/invoice/pt'; 
            case 'vendor/sftp/form16': return 'logs/vendor/sftpProcessLogs/form16'; 
            case 'vendor/sftp/form16/summary': return 'logs/vendor/sftpProcessLogs/form16/summary'; 
            case 'vendor/sftp/form16/pdf': return 'logs/vendor/sftpProcessLogs/form16/pdf'; 
            case 'vendor/sftp/ledger': return 'logs/vendor/sftpProcessLogs/ledger'; 
            case 'vendor/sftp/partner': return 'logs/vendor/sftpProcessLogs/partner'; 
            case 'vendor/sftp/monthlyTransaction': return 'logs/vendor/sftpProcessLogs/monthlyTransaction'; 
            case 'vendor/sftp/paymentAdviceMaster': return 'logs/vendor/sftpProcessLogs/paymentAdviceMaster'; 
            case 'vendor/sftp/paymentAdviceDetail': return 'logs/vendor/sftpProcessLogs/paymentAdviceDetail'; 
            case 'vendor/s3/creditNote': return 'logs/vendor/s3BucketProcessLogs/creditNote'; 
            case 'vendor/s3/creditNote/summary': return 'logs/vendor/s3BucketProcessLogs/creditNote/summary'; 
            case 'vendor/s3/creditNote/pdf': return 'logs/vendor/s3BucketProcessLogs/creditNote/pdf'; 
            case 'vendor/s3/creditNote/working': return 'logs/vendor/s3BucketProcessLogs/creditNote/working'; 
            case 'vendor/s3/invoice': return 'logs/vendor/s3BucketProcessLogs/invoice'; 
            case 'vendor/s3/invoice/summary': return 'logs/vendor/s3BucketProcessLogs/invoice/summary'; 
            case 'vendor/s3/invoice/pdf': return 'logs/vendor/s3BucketProcessLogs/invoice/pdf'; 
            case 'vendor/s3/invoice/pt': return 'logs/vendor/s3BucketProcessLogs/invoice/pt'; 
            case 'vendor/s3/form16': return 'logs/vendor/s3BucketProcessLogs/form16'; 
            case 'vendor/s3/form16/summary': return 'logs/vendor/s3BucketProcessLogs/form16/summary'; 
            case 'vendor/s3/form16/pdf': return 'logs/vendor/s3BucketProcessLogs/form16/pdf'; 
            case 'vendor/s3/ledger': return 'logs/vendor/s3BucketProcessLogs/ledger'; 
            case 'vendor/s3/partner': return 'logs/vendor/s3BucketProcessLogs/partner'; 
            case 'vendor/s3/monthlyTransaction': return 'logs/vendor/s3BucketProcessLogs/monthlyTransaction';
            case 'vendor/s3/paymentAdviceMaster': return 'logs/vendor/s3BucketProcessLogs/paymentAdviceMaster';
            case 'vendor/s3/paymentAdviceDetail': return 'logs/vendor/s3BucketProcessLogs/paymentAdviceDetail';
            case 'vendor/script/creditNote': return 'logs/vendor/pythonScriptsLog/creditNote'; 
            case 'vendor/script/creditNote/summary': return 'logs/vendor/pythonScriptsLog/creditNote/summary'; 
            case 'vendor/script/creditNote/pdf': return 'logs/vendor/pythonScriptsLog/creditNote/pdf'; 
            case 'vendor/script/creditNote/working': return 'logs/vendor/pythonScriptsLog/creditNote/working'; 
            case 'vendor/script/invoice': return 'logs/vendor/pythonScriptsLog/invoice'; 
            case 'vendor/script/invoice/summary': return 'logs/vendor/pythonScriptsLog/invoice/summary'; 
            case 'vendor/script/invoice/pdf': return 'logs/vendor/pythonScriptsLog/invoice/pdf'; 
            case 'vendor/script/form16': return 'logs/vendor/pythonScriptsLog/form16'; 
            case 'vendor/script/form16/summary': return 'logs/vendor/pythonScriptsLog/form16/summary'; 
            case 'vendor/script/form16/pdf': return 'logs/vendor/pythonScriptsLog/form16/pdf';
            case 'vendor/script/invoice/pt': return 'logs/vendor/pythonScriptsLog/invoice/pt';
            case 'vendor/script/ledger': return 'logs/vendor/pythonScriptsLog/ledger'; 
            case 'vendor/script/partner': return 'logs/vendor/pythonScriptsLog/partner'; 
            case 'vendor/script/monthlyTransaction': return 'logs/vendor/pythonScriptsLog/monthlyTransaction'; 
            case 'vendor/script/paymentAdviceMaster': return 'logs/vendor/pythonScriptsLog/paymentAdviceMaster'; 
            case 'vendor/script/paymentAdviceDetail': return 'logs/vendor/pythonScriptsLog/paymentAdviceDetail'; 
        ///////////////////////////////////spsn log////////////////////////////////////////////////////////////////
            case 'log/spsn': return 'spsn'; 
            case 'spsn/sftpProcessLogs': return 'logs/spsn/sftpProcessLogs'; 
            case 'spsn/s3BucketProcessLogs': return 'logs/spsn/s3BucketProcessLogs'; 
            case 'spsn/sftp/outstandingReport': return 'logs/spsn/sftpProcessLogs/outstandingReport'; 
            case 'spsn/sftp/outstandingReport/summary': return 'logs/spsn/sftpProcessLogs/outstandingReport/summary'; 
            case 'spsn/sftp/adjustmentReport': return 'logs/spsn/sftpProcessLogs/adjustmentReport'; 
            case 'spsn/sftp/adjustmentReport/summary': return 'logs/spsn/sftpProcessLogs/adjustmentReport/summary'; 
            case 'spsn/s3/outstandingReport': return 'logs/spsn/s3BucketProcessLogs/outstandingReport'; 
            case 'spsn/s3/outstandingReport/summary': return 'logs/spsn/s3BucketProcessLogs/outstandingReport/summary'; 
            case 'spsn/s3/outstandingReport/pdf': return 'logs/spsn/s3BucketProcessLogs/outstandingReport/pdf'; 
            case 'spsn/s3/outstandingReport/working': return 'logs/spsn/s3BucketProcessLogs/outstandingReport/working'; 
            case 'spsn/s3/adjustmentReport': return 'logs/spsn/s3BucketProcessLogs/adjustmentReport'; 
            case 'spsn/s3/adjustmentReport/summary': return 'logs/spsn/s3BucketProcessLogs/adjustmentReport/summary'; 
            case 'spsn/s3/adjustmentReport/pdf': return 'logs/spsn/s3BucketProcessLogs/adjustmentReport/pdf'; 
            case 'spsn/s3/adjustmentReport/pt': return 'logs/spsn/s3BucketProcessLogs/adjustmentReport/pt'; 
            case 'spsn/script/outstandingReport': return 'logs/spsn/pythonScriptsLog/outstandingReport'; 
            case 'spsn/script/outstandingReport/summary': return 'logs/spsn/pythonScriptsLog/outstandingReport/summary'; 
            case 'spsn/script/outstandingReport/pdf': return 'logs/spsn/pythonScriptsLog/outstandingReport/pdf'; 
            case 'spsn/script/outstandingReport/working': return 'logs/spsn/pythonScriptsLog/outstandingReport/working'; 
            case 'spsn/script/adjustmentReport': return 'logs/spsn/pythonScriptsLog/adjustmentReport'; 
            case 'spsn/script/adjustmentReport/summary': return 'logs/spsn/pythonScriptsLog/adjustmentReport/summary'; 
            case 'spsn/script/adjustmentReport/pdf': return 'logs/spsn/pythonScriptsLog/adjustmentReport/pdf'; 
			default:
				return "unknown folder"
		}
}
    }

    createFolder(companyName)
    {
        let folderNames = []
        for(let i = 0; i < folderNames.length; i++)
        {
            if (!fs.existsSync(folderNames[i])) 
            {
                fs.mkdirSync(folderNames[i]);
            }
        }
        return true
    }
}

module.exports = docPath