const multer = require("multer")
const userCtrl = require('../controllers/users');
const AuthMiddl = require('../middlewares/Authentication');
const upload = multer({ storage: userCtrl.storage })
const passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// passport.use(new LocalStrategy(
//   function (username, password, done) {
//     debugger
//     db.users.findOne({ where: { login: username } })
//       .then((err, user) => {
//         if (err) throw err;
//         if (!user) {
//           return done(null, false, { message: 'Unknown User' });
//         }
//         debugger
//         if(user.password == password){
//             return done(null, user);
//           }else {
//             return done(null, false, { message: 'Invalid password' });
//           }
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


module.exports = router => {
  router.post('/registration', userCtrl.userRegister);
  router.get('/reset',  userCtrl.checkHash);
  router.post('/reset',userCtrl.resetPassword)
  router.post('/hash',  userCtrl.linkResetPassword);
  router.post('/subscribe/:id', AuthMiddl.AuthRecipe, userCtrl.userSubscribe);
  router.get('/profile', AuthMiddl.GetAuth, userCtrl.userProfile);
  router.post('/login', passport.authenticate('local'), userCtrl.userLogin);
  // router.delete('/:id', AuthMiddl.GetAuth, userCtrl.userDel);
  router.delete('/:id', userCtrl.userDel);
  router.put('/:id', upload.single('avatar'), userCtrl.userUpdate);
  router.get('/', AuthMiddl.Auth, userCtrl.usersShowAll);
  router.get('/:id', userCtrl.userShow);
  router.get('/auth/facebook', passport.authenticate('facebook', { session: false }));
  router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
    function (req, res) {
      // Successful authentication, redirect home.
      console.log(req.user)
      res.redirect('/');
    }
  );

}

