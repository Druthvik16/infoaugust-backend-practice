const Client = require('ssh2-sftp-client');
const sftpConfig = {
    host: process.env.sftpHost,
    port: process.env.sftpPort,
    username: process.env.sftpUserName,
    password: process.env.sftpPassword,
    algorithms: JSON.parse(process.env.sftpAlgorithms)
};
/////// for qa and dev
// const sftpConfig = {
//     host: process.env.sftpHost,
//     port: process.env.sftpPort,
//     username: 'ubuntu',
//    privateKey: fs.readFileSync('./infomap-tgbl-new-qa.pem')
// };


const sftpDirectories = {
    Partner: ['Cust_Master'],
    CreditNoteSummary: ['CreditNoteSummary'],
    InvoiceSummary: ['InvoiceSummary'],
    LedgerSummary: ['LedgerSummary'],
    MonthlyTransactionSummary: ['CTransaction'],
    CreditNoteWorking: ['CreditNoteWorking/Promo', 'CreditNoteWorking/CashDiscount', 'CreditNoteWorking/GiftVoucher', 'CreditNoteWorking/Incentive'],
    CreditNotePdf: ['CreditNotePDF'],
    InvoicePdf: ['InvoicePDF'],
    InvoicePt: ['PTFile']
};

async function getFileListFromSftp(sftpClient, directory) {
    try {
        if (!sftpClient?.sftp) await retrySftpConnection(sftpClient);
        const isDirectory = await sftpClient.exists(directory);
        return isDirectory ? await sftpClient.list(directory) : [];
    } catch (err) {
        console.error(`Failed to list ${directory}:`, err);
        return [];
    }
}

async function retrySftpConnection(sftpClient) {
    let retries = 10;
    while (retries-- > 0) {
        try {
            console.log(`Reconnecting… (${retries} left)`);
            await sftpClient.connect(sftpConfig);
            return true;
        } catch (err) {
            if (retries === 0) throw err;
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return false;
}

module.exports = {
    getFileListFromSftp,
    retrySftpConnection,
    Client,
    sftpDirectories,
    sftpConfig
};