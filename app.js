var createError = require('http-errors');
var express = require('express');
const session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
require('./config/passport')(passport);
const authRoutes = require('./routes/auth');
const  flash = require('connect-flash');
const  cookieSession = require('cookie-session');
const db = require('./config/mongooseConnection')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRoutes = require('./routes/adminRouter');
var productRoute = require('./routes/productRoute');
const { urlencoded } = require('body-parser');
const methodOverride = require('method-override');
// require('./config/passport-setup');
require('dotenv').config(); 


var app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Session and Passport initialization
app.use(session({
  secret: 'heyhowareyou',
  resave: false,
  saveUninitialized: true,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// flash use
app.use(flash());

// Routes

// Example middleware to simulate user authentication
app.use((req, res, next) => {
  // Simulate authentication state
  res.locals.isLoggedIn = true; // Set to true/false based on actual authentication state
  res.locals.isAdmin = true; // Set to true/false based on user role (admin or regular user)
  next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('views', path.join(__dirname, 'views/admin'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRoutes);
app.use('/owners', adminRoutes);
app.use('/products', productRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
