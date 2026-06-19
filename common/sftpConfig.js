const fs = require('fs');

function getSftpConfig() {
    const baseConfig = {
        host: process.env.sftpHost,
        port: process.env.sftpPort,
        username: process.env.sftpUserName || 'ubuntu',
    };

    // 🔹 If private key is provided → use key-based auth
    if (process.env.sftpPrivateKeyPath) {
        return {
            ...baseConfig,
            privateKey: fs.readFileSync(process.env.sftpPrivateKeyPath),
        };
    }

    // 🔹 Else fallback to password-based auth
    return {
        ...baseConfig,
        password: process.env.sftpPassword,
        algorithms: process.env.sftpAlgorithms
            ? JSON.parse(process.env.sftpAlgorithms)
            : undefined,
    };
}

module.exports = getSftpConfig

// const config = getSftpConfig();