const LocalStrategy = require('passport-local').Strategy;
const User = require('../model/user');
const Admin = require('../model/adminModel');

module.exports = function(passport) {
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            let user = await User.findOne({ email });
            if (user) {
                const isMatch = await user.comparePassword(password);
                if (isMatch) {
                    return done(null, user);
                }
            }
            let admin = await Admin.findOne({ email });
            if (admin) {
                const isMatch = await admin.comparePassword(password);
                if (isMatch) {
                    return done(null, admin);
                }
            }
            return done(null, false, { message: 'Incorrect email or password' });
        } catch (err) {
            return done(err);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id); // Store only the user ID in session
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            if (user) {
                return done(null, user);
            } else {
                const admin = await Admin.findById(id);
                return done(null, admin);
            }
        } catch (err) {
            done(err);
        }
    });
};
