const jwt = require('jsonwebtoken');
const usermodel = require('../model/user');


module.exports =  async function (req,res,next ){
    try{
        if(req.isAuthenticated()) return next();
      req.flash('error', "your Login ");
      res.redirect("/login");
      } catch (err){
        req.flash('error', "Something want Wrong");
      res.render("login");
      }
}