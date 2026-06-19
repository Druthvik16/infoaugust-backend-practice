const express = require('express');
const path = require('path');
const db = require('./dbQueryProcessController');
const errorCode = require('../common/error/errorCode');
const getCode = new errorCode();
const baseFolder = process.env.baseFolder;
const {
  getFileListFromSftp,
  retrySftpConnection,
  sftpDirectories,
  sftpConfig,
  Client,
} = require('./commonSftpFunctions');

module.exports = express.Router().get('/', async (req, res) => {
  const sftp = new Client();
  try {
    await sftp.connect(sftpConfig);
    if (!sftp?.sftp) await retrySftpConnection(sftp);
    const rows = await db.getDataFromProcessSequenceMaster('FileSync', 0);
    sftp.client.setMaxListeners(30);
    const unreadedCount = await Promise.all(rows.map(async ({ processName, processType }) => {
      const directories = sftpDirectories[processName] || [];
      // Fetch file lists from all directories in parallel
      const allFiles = (await Promise.all(
        directories.map(dir => getFileListFromSftp(sftp, baseFolder + dir))
      )).flat();

      console.log(allFiles, processName)

      // Count files that are not directories and don't end with '_read'
      const count = allFiles.reduce((acc, file) => {
        if (file.type === 'd') return acc;
        const nameWithoutExt = path.basename(file.name, path.extname(file.name));
        return nameWithoutExt.endsWith('_read') ? acc : acc + 1;
      }, 0);

      return { processName, processType, count };
    }));

    console.log(unreadedCount)

    const filteredCount = unreadedCount.filter(count => count.count > 0);
    res.status(200).json({
      status_code: 200,
      message: 'success',
      data: { fileCounts: filteredCount },
      status_name: getCode.getStatus(200),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal error');
  } finally {
    await sftp?.end();
  }
});
