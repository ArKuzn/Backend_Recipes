const multer = require("multer")
const userCtrl = require('../controllers/users');
const AuthMiddl = require('../middlewares/Authentication');
const upload = multer({ storage: userCtrl.storage })


module.exports = router => {
  router.post('/registration', upload.single('avatar'), userCtrl.userRegister);
  router.post('/subscribe/:id', AuthMiddl.AuthRecipe, userCtrl.userSubscribe);
  router.get('/profile', AuthMiddl.GetAuth, userCtrl.userProfile);
  router.post('/login', userCtrl.userLogin);
  router.delete('/:id', AuthMiddl.GetAuth, userCtrl.userDel);
  router.put('/:id', upload.single('avatar'), userCtrl.userUpdate);
  router.get('/', AuthMiddl.Auth, userCtrl.usersShowAll);
  router.get('/:id', userCtrl.userShow);
}
