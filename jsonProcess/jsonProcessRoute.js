const express = require('express');
const jsonProcessRoute = express.Router();

jsonProcessRoute.use('/getJsonData', require('./getJsonData.js'));
jsonProcessRoute.use('/createRawData', require('./createRawData.js'));
jsonProcessRoute.use('/getJsonData/ca', require('./getJsonDataCA.js'));
jsonProcessRoute.use('/createRawData/ca', require('./createRawDataCA.js'));
jsonProcessRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "error"     : "Wrong method or api"
    })
})
module.exports = jsonProcessRoute;

