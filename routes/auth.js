const express = require('express');
const passport = require('passport');
const usermodel = require('../model/user');
const Admin = require('../model/adminModel');
const router = express.Router();
const { generateOTP, sendOTP, optCache } = require('../utils/otp');
require('dotenv').config()

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ["profile", "email"]
  },
  async (request, token, tokenSecret, profile, done) => {
    try {
      let user = await usermodel.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      } else {
        let email = profile.emails && profile.emails.value > 0 ? profile.emails[0].value : null;
        user = new usermodel({
          googleId: profile.id,
          fullname: profile.displayName,
          email: email
        });
        await user.save();
        return done(null, user);
        console.log(profile);
      }
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: 'http://localhost:3000/',
    failureRedirect: 'http://localhost:4000/auth/google'
  })
);

  

router.get('/login', (req, res) => {
    res.render('login', { message: 'User/Admin login' });
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/auth/login',
    failureFlash: true
}), (req, res) => {
    if (req.user instanceof usermodel) {
        res.redirect('/');
    } else if (req.user instanceof Admin) {
        res.redirect('/owners/admin');
    } else {
        res.redirect('/auth/login'); // Handle unexpected cases
    }
});



router.get('/register/user', (req, res) => {
    res.render('signup', { message: 'User register' });
});

router.post('/register/user', async (req, res) => {
    let { fullname, email, number, password } = req.body;
    const otp = generateOTP();
    sendOTP(email, otp);
    optCache[email] = otp;
    res.cookie('otpCache', optCache, { maxAge: 30000, httpOnly: true });
    try {
        const newUser = new usermodel({ 
            fullname,
            email, 
            password,
            number,
            otp: otp	
         });
        await newUser.save();
        res.redirect('/requestOTP');
    } catch (err) {
        res.redirect('/auth/register/user');
    }
});

router.get('/register/admin', (req, res) => {
    res.render('admin/signup', { message: 'Admin register' });
});

router.post('/register/admin', async (req, res) => {
    let { fullname, email, number, password } = req.body;

    try {
        const newAdmin = new Admin({ email, password });
        await newAdmin.save();
        res.redirect('/auth/login');
    } catch (err) {
        res.redirect('/auth/register/admin');
    }
});

// POST route to verify the user
router.post('/verify', async function (req, res, next) {
    const { email, otp } = req.body;

    try {
        // Find the user by email
        const user = await usermodel.findOne({ _id: req.session.passport.user });

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


router.get('/requestOTp', (req, res) => {
    res.render('requestOTP', { message: 'Admin register' });
});


module.exports = router;
