const jwt = require('jsonwebtoken') ;
const Admin = require('../model/adminModel')
module.exports = function(req, res, next) {

    if (req.isAuthenticated() ) {
        return next();
    } else {
        res.status(403).send('Forbidden');
    }
};