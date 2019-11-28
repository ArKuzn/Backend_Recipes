var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var routersList = require('./routes/index');
const passport = require('passport');

var LocalStrategy = require('passport-local').Strategy;
const cors = require('cors')
var app = express();

app.use(passport.initialize());
app.use(passport.session());

// passport.use(new LocalStrategy(
//   function (username, password, done) {
//     debugger
//     db.users.findOne({ where: { username } })
//       .then((err, user) => {
//         if (err) throw err;
//         if (!user) {
//           return done(null, false, { message: 'Unknown User' });
//         }
//         debugger
//         user.password == password ? function (err, isMatch) {
//           if (err) throw err;
//           if (isMatch) {
//             return done(null, user);
//           } else {
//             return done(null, false, { message: 'Invalid password' });
//           }
//         } : null;
//       });
//   }
// ));


// passport.serializeUser(function (user, done) {
//   done(null, user.id);
// });

// passport.deserializeUser(function (id, done) {
//   debugger
//   db.users.findOne({ where: { id: id } })
//     .then((err, user) => {
//       done(err, user);
//     });
// });



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())
routersList(app)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
