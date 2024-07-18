const express = require('express');
const router = express.Router();
const usermodel = require('../model/user')
const ordermodel = require('../model/order')
const isAdmin = require('../middlewares/isAdmin')
let isloggedin = require('../middlewares/isLoggedIn');
var path = require('path');
var app = express();
const productModel = require('../model/productModel');






/* GET admin page. */
router.get('/createproduct', function(req, res, next) {
    res.render('admin/createproducts' , {isAdmin: req.isAuthenticated()});
  });
router.get('/admin',async function(req, res, next) {
  let products = await productModel.find();
    res.render('admin/admin' , {isAdmin: req.isAuthenticated(), products});
  });
router.get('/cart', function(req, res, next) {
    res.render('admin/cart' , {isAdmin: req.isAuthenticated()});
  });

  // show all users
  router.get('/users', async function(req, res, next) {
    const allusers = await usermodel.find();
    res.render('admin/users' , {isAdmin: req.isAuthenticated(), allusers});
  });
 

router.post('/delete/:id',isloggedin, async function(req, res, next) {
 try{
  let User = await usermodel.findByIdAndDelete({_id: req.params.id});
  res.redirect('/owners/users')
 }catch(err){
 console.log(err)
 }
});

// show all Orders
router.get('/orders', async function(req, res, next) {
  const allorders = await ordermodel.find();
  res.render('admin/orders' , {isAdmin: req.isAuthenticated(), allorders});
});

router.post('/order/delete/:id',isloggedin, async function(req, res, next) {
  try{
   let order = await ordermodel.findByIdAndDelete({_id: req.params.id});
   res.redirect('/owners/orders')
  }catch(err){
  console.log(err)
  }
 });


module.exports = router;