require('dotenv').config(); // Ensure this is at the top

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('../model/user');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback'
},
async (request, token, tokenSecret, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      return done(null, user);
    } else {
      user = new User({ googleId: profile.id,
         username: profile.displayName,
         email: profile.emails[0].value
         });
      await user.save();
      return done(null, user);
    }
  } catch (err) {
    return done(err);
  }
}
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
