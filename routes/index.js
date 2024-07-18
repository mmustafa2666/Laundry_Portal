var express = require('express');
var router = express.Router();
var nodeMailer = require('nodemailer');
var randomString = require('randomstring');
var usermodel = require('../model/user');
var ordermodel = require('../model/order');
var productModel = require('../model/productModel');
var Admin = require('../model/adminModel');
const mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
const flash = require('connect-flash');
const pino = require('pino');
const cookieSession = require('cookie-session');
const passport = require('passport');
const { generateOTP, sendOTP, optCache } = require('../utils/otp');
const isloggedin = require('../middlewares/isLoggedIn');
const isAdmin = require('../middlewares/isAdmin');
const upload = require('../config/multerConfig');
const { render } = require('ejs');
const isLoggedIn = require('../middlewares/isLoggedIn');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);






passport.serializeUser((user, done) => {
  done(null, { id: user.id, role: user.role });
});

passport.deserializeUser(async (data, done) => {
  try {
      if (data.role === 'user') {
          const user = await usermodel.findById(data.id);
          done(null, user);
      } else {
          const admin = await Admin.findById(data.id);
          done(null, admin);
      }
  } catch (err) {
      done(err);
  }
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { isLoggedin: req.isAuthenticated()});
});


/* GET about page. */
router.get('/about', isloggedin, function(req, res, next) {
  res.render('about', { isloggedin: req.isAuthenticated() });
});

/* GET profile page. */
router.get('/profile',isloggedin, async function(req, res, next) {
  const user = await usermodel.findOne({
    email: req.session.passport.user,
  })
  .populate("posts")
  res.render('profile', {User:req.user,isLoggedIn: req.isAuthenticated()});
});


/* GET profile page. */
router.get('/profileedit/:id',isloggedin, async function(req, res, next) {
  let User = await usermodel.findOne({_id: req.params.id});
  res.render('profileedit',{User})
});

router.post('/updateprofile/:id',upload.single('image'),isloggedin, async function(req, res, next) {
 try{
  let User = await usermodel.findByIdAndUpdate({_id: req.params.id},{
    image:req.file.buffer,
    fullname: req.body.fullname,
    number:req.body.number,
  });
  res.redirect('/profile')
 }catch(err){
 console.log(err)
 }
});





/* GET services page. */
router.get('/services',async function(req, res, next) {
  
  res.render('services',{User:req.user,isLoggedIn: req.isAuthenticated()});
});



/* GET contact page. */
router.get('/contact',isloggedin, async function(req, res, next) {
  const user = await usermodel.findOne({
    email: req.session.passport.user,
  })
  .populate("posts")
  res.render('contact', {User:req.user,isLoggedIn: req.isAuthenticated()});
});


/* GET singup page. */
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Express' });
});





/* GET requestOTP page. */
router.get('/requestOTP', function(req, res, next) {
  // req.flash('success_msg', 'This is a flash message for requestOTP page.');
  res.render('requestOTP', { title: 'Express' });
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Express' });
});

/* GET order page. */
router.get('/order',isloggedin, function(req, res, next) {
  res.render('order', { isLoggedIn: req.isAuthenticated() });
});

// show all products
router.get('/products',async function(req, res, next) {
  let products = await productModel.find();
  res.render('products', { isLoggedIn: req.isAuthenticated(),products });
});

// show all products
router.get('/discountproducts',async function(req, res, next) {
  let products = await productModel.find();
  res.render('discountproduct', { isLoggedIn: req.isAuthenticated(),products });
});

router.post('/signup', async function(req, res, next) {
  let { fullname, email, number, password } = req.body;
  const otp = generateOTP();
  sendOTP(email, otp);
  optCache[email] = otp;
  res.cookie('otpCache', optCache, { maxAge: 30000, httpOnly: true });

  try {
    // const salt = await bcrypt.genSalt(10);
    // const hash = await bcrypt.hash(password, salt);
    const createUser = await usermodel.create({
      fullname,
      email,
      number,
      password,
      otp: otp,
    });
    req.login(createUser, function(err) {
      if (err) { return next(err); }
      return res.redirect('/requestOTP');
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/order',
  failureRedirect: '/login',
  failureFlash: true
}));

router.post('/verify', async function (req, res, next) {
  const { email, otp } = req.body;

  try {
    // Extract the user ID from the session
    let userId;
    if (req.session.passport && req.session.passport.user && req.session.passport.user.id) {
      userId = req.session.passport.user.id;
    } else {
      return res.redirect('/login'); // Handle the case where the user ID is not available
    }

    // Convert the userId to an ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);

    // Find the user by _id
    const user = await usermodel.findOne({ _id: objectId });

    if (!user) {
      return res.redirect('/signup');
    }

    // Check if the provided OTP matches the one in the user model
    if (user.otp === otp) {
      // OTP matches, mark user as verified and remove OTP
      user.otp = undefined; // or you can set it to null
      user.isVerified = true; // add an isVerified field to your schema if you don't have one
      await user.save();

      // Respond with a success message
      return res.redirect('/');
    } else {
      // OTP does not match
      return res.status(400).render('requestOTP');
    }
  } catch (err) {
    next(err);
  }
});


router.post('/order', isloggedin, async (req, res) => {
  try {
    // Find the user based on authenticated email
    let user = await usermodel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Destructure necessary fields from request body
    const { fullname, contact, email, address } = req.body;
    const { item, quantity, price, totalprice, grandTotal } = req.body;

    // Ensure `item`, `quantity`, `price`, and `totalprice` are arrays
    const items = Array.isArray(item) ? item.map((_, index) => ({
      item: item[index],
      quantity: quantity[index],
      price: price[index],
      totalprice: totalprice[index],
    })) : [{ item, quantity, price, totalprice }];

    // Create a new order using OrderModel
    let order = await ordermodel.create({
      fullname,
      contact,
      email,
      address,
      items,
      grandTotal  // Add grandTotal to the order document
    });

    // Update user's orders array with the new order id
    user.orders.push(order._id); // Assuming orders array in user model is `orders` and stores ObjectId
    await user.save();

    // Redirect to a page showing all orders (adjust as needed)
    res.redirect('/showallorders');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




// GET Orders page
router.get('/showallorders', isloggedin, async (req, res, next) => {
  let user = await usermodel.findOne({email: req.user.email}).populate("orders");
  res.render('showallorder', { user });
});


// Show Orders
router.get('/show/:id', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await ordermodel.findById(orderId);
    
   

    res.render('show', { order });
  } catch (error) {
    next(error); // Pass errors to the error handler middleware
  }
});

// delete order
router.post('/delete/order/:id', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await ordermodel.findByIdAndDelete(orderId);

    // Assuming you want to send some response back
    res.status(200).redirect('/showallorders');
  
  } catch (error) {
    next(error); // Pass errors to the error handler middleware
  }
});

// Edit  Route
router.get('/order/:id/edit', async function(req, res, next) {
  try {
    let orderId = req.params.id;
    // Assuming 'ordermodel' is the model for orders
    const order = await ordermodel.findById(orderId).populate('user'); 
    if (!order) {
      return res.status(404).send('Order not found');
    }
    res.render('orders/edit', { order });
  } catch (error) {
    next(error); // Pass errors to the error handler middleware
  }
  
});


// Route to update an order
router.put('/users/:userId/orders/:orderId', async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    const updatedOrderData = req.body.orderData; // assuming the order update data comes from req.body

    // Find the order by ID and update it
    const updatedOrder = await ordermodel.findByIdAndUpdate(orderId, updatedOrderData, { new: true });

    if (!updatedOrder) {
      return res.status(404).send('Order not found');
    }

    res.redirect('../../../auth/order');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Edit  Route
router.get('/order/:id/delete', async function(req, res, next) {
  try {
    let orderId = req.params.id;
    // Assuming 'ordermodel' is the model for orders
    const order = await ordermodel.findById(orderId).populate('user'); 
    if (!order) {
      return res.status(404).send('Order not found');
    }
    res.render('orders/delete', { order });
  } catch (error) {
    next(error); // Pass errors to the error handler middleware
  }
  
});

// Route to delete an order
router.delete('/users/:userId/orders/:orderId', async (req, res) => {
  try {
    const { userId, orderId } = req.params;

    // Find the user by ID
    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Remove the order from the user's orders array
    user.orders.pull(orderId);
    await user.save();

    // Optionally, delete the order document from the Order collection
    await ordermodel.findByIdAndDelete(orderId);

    res.redirect('orders');
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// payment CARD
router.post('/checkout/order/:id', async (req, res) => {
  try {
      const orderId = req.params.id; // Retrieve orderId from URL params

      // Fetch the order details from MongoDB based on orderId and populate the user
      const order = await ordermodel.findById(orderId).populate('user');

      if (!order) {
          return res.status(404).redirect('/showallorders');
      }

      // Create a Stripe Checkout session with the fetched grandTotal
      const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
              {
                  price_data: {
                      currency: 'usd',
                      product_data: {
                          name: 'Your Product Name' // Update with actual product name logic if necessary
                      },
                      unit_amount: order.grandTotal * 100 // Convert grandTotal to cents
                  },
                  quantity: 1
              }
          ],
          mode: 'payment',
          success_url: `${process.env.BASE_URL}/complete`,
          cancel_url: `${process.env.BASE_URL}/cancel`
      });

      // Redirect to the Stripe Checkout session URL
      res.redirect(303, session.url);
  } catch (error) {
      console.error('Error creating Stripe Checkout session:', error);
      res.status(500).send('An error occurred while creating the checkout session.');
  }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/auth/login'); // Redirect to login page if not authenticated
};


router.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('error', "your Logout ");
    res.redirect('/');
  });
});


module.exports = router;
