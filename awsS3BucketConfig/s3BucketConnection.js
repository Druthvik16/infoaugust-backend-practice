const AWS = require('aws-sdk');
let awsConfig = {
    region: process.env.Region,
    credentials: {
      accessKeyId: process.env.Access_Key,
      secretAccessKey: process.env.Secret_Access_Key,
    }
}
const s3 = new AWS.S3(awsConfig);

module.exports = s3