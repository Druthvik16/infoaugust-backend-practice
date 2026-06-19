const verifyToken = require('./verifyToken');
const app = require('express').Router();

app.use('/*', async (req, res, next) => {
    console.log(`v${req.params[0].split('/').length}`);
    verifyToken(req, res, next);
});

app.get('/', async (req, res, next) => {
    console.log("v9");
    verifyToken(req, res, next);
});

app.post('/', async (req, res, next) => {
    console.log("v10");
    verifyToken(req, res, next);
});

module.exports = app;
