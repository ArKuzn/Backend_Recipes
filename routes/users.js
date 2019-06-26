var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtsecret = "mysecretkey";
/* GET users listing. */
const db = require('../models');



router.get('/', function (req, res, next) {
});

router.post('/', async function (req, res, next) {//register
  let pass;
  bcrypt.genSalt(12, function (err, salt) {
    bcrypt.hash(req.body.password, salt, function (err, hash) {
      // Store hash in your password DB.
      console.log(`this is true hash ${hash}`);
      db.users.findOrCreate({
        where: { login: req.body.login }, defaults: {
          password: hash,
          avatar: req.body.Avatar,
          favorites: req.body.Favorites
        }
      })
        .then(([user, created]) => {
          console.log(user.get({
            plain: true
          }))
          if (created == false) {
            res.send({ msg: 'login already taken', error: true });
          }
          else {
            let token = jwt.sign({ id: user.id, login: user.login, role: user.role }, jwtsecret, { expiresIn: 86400 });
            res.send({ msg: 'Success! you have been registered', error: false, token: token });
          }
          console.log(created)
        });
    });
  })
});


router.post('/login', function (req, res, next) {//login
  db.users.findOne({ where: { login: req.body.login } }).then((user) => {
    if (user) {
      bcrypt.compare(req.body.password, user.password, function (err, hash) {
        if (hash) {
          let token = jwt.sign({ id: user.id, login: user.login, role: user.role }, jwtsecret, { expiresIn: 86400 });
          res.send({ msg: 'success', error: false, token: token });
        }
        else {
          res.send({ msg: 'wrong password', error: true });
        }
      });
    }
    else {
      res.send({ msg: 'wrong login', error: true });
    }
  })
});


module.exports = router;