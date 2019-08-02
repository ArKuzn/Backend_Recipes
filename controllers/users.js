const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtsecret = "mysecretkey";
const hash = require('object-hash');
/* GET users listing. */
const db = require('../models');
const userDir = "uploads/users/";
const multer = require("multer")
const rimraf = require("rimraf")
const fs = require("fs");
var hashAvatar;
const rn = require('random-number');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    hashAvatar = hash(rn());
    let rec = userDir + `${hashAvatar}`;
    if (!fs.existsSync(rec)) {
      fs.mkdirSync(rec);
    }
    cb(null, userDir + `${hashAvatar}`)
  },
  filename: function (req, file, cb) {
    cb(null, `avatar` + '.jpg')
  }
})

const userRegister = function (req, res, next) {//register
  try {
    bcrypt.genSalt(12, function (err, salt) {
      bcrypt.hash(req.body.password, salt, function (err, hash) {
        console.log(`this is true hash ${hash}`);
        let avatar;
        if (req.file) {
          avatar = userDir + `${hashAvatar}/avatar.jpg`;
        } else {
          avatar = userDir + "default/avatar.jpg"
        }
        db.users.findOrCreate({
          where: { login: req.body.login }, defaults: {
            password: hash,
            avatar: avatar,
            favorites: req.body.Favorites || []
          }
        })
          .then(([user, created]) => {
            if (!created) {
              // throw { status: 400, message: 'login already taken' };
              return res.status(400).json({ msg: 'login already taken', error: true });
            }
            let token = jwt.sign({ id: user.id, login: user.login, role: user.role }, jwtsecret, { expiresIn: 86400 });
            return res.status(200).json({ msg: 'Success! you have been registered', error: false, user, token: token });

          }).catch((error) => {
            return res.status(500).json({ msg: error.message, error: true })
          })
      });
    });
  } catch (err) {
    if (err.status == 400) {
      return res.status(400).json({ msg: err.message, error: true });
    }
    return res.status(500).json({ msg: err.message, error: true })
  }
}

const userSubscribe = function (req, res) {
  db.users.findOne({
    where: { id: req.body.tokenId },
    include: [{
      model: db.users,
      through: {
        attributes: []
      },
      as: "subscribs",
    },]
  })
    .then(async (user) => {
      console.log(user);
      const subscribe = await user.hasSubscribs(+req.params.id);
      if (subscribe) {
        await user.removeSubscribs(req.params.id);
        return res.status(200).json({ msg: 'unsubscribe', subscribs: await user.getSubscribs(), error: false })
      }
      // const subscribs = await user.getSubscribs();
      await user.addSubscribs(req.params.id);
      return res.status(200).json({ msg: 'subscribed', subscribs: await user.getSubscribs(), error: false })
    }).catch((err) => {
      return res.status(404).json({ msg: 'user not found', error: true })

    })

}

const userLogin = function (req, res, next) {//login
  db.users.findOne({
    where: { login: req.body.login },
    include: [{
      model: db.users,
      through: {
        attributes: []
      },
      as: "subscribs",
    }, {
      model: db.recipes,
      through: {
        attributes: []
      },
      as: "favoritesTable",
    }, {
      model: db.users,
      through: {
        attributes: []
      },
      as: "followers",
    },]
  })
    .then((user) => {
      if (user) {
        bcrypt.compare(req.body.password, user.password, function (err, hash) {
          if (hash) {
            let token = jwt.sign({ id: user.id, login: user.login, role: user.role }, jwtsecret, { expiresIn: 86400 });
            let userObj = { ...user.dataValues };
            delete userObj.password;
            userObj.favorites = userObj.favoritesTable;
            return res.status(200).json({ msg: 'success', error: false, token: token, user: userObj });
          }

          return res.status(401).json({ msg: 'wrong password', error: true, field: 'password' });

        });
      }
      else {
        return res.status(401).json({ msg: 'wrong login', error: true, field: 'login' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ msg: err.message, error: true });
    })
}
const userDel = function (req, res, next) {//delete
  let folder;
  if (req.body.tokenId != req.params.id) {
    return res.status(403).json({ msg: "access error", error: false })
  }
  db.users.findOne({ where: { "id": req.params.id } }).then((user) => {
    console.log(user.avatar.split('/')[2]);
    folder = user.avatar.split('/')[2];
    if (folder == 'default') {
      folder = null;
    }
    db.users.destroy({ where: { "id": req.params.id } }).then((user) => {
      if (user) {
        console.log(`this folder will be deleted ${folder}`);
        rimraf.sync(`./uploads/users/${folder}`)
        return res.status(200).json({ msg: 'User deleted', error: false });
      }
      else {
        return res.status(404).json({ msg: 'User not found', error: true });
      }
    })
  }).catch((error) => {
    console.log(error);
    return res.status(500).json({ msg: error.message, error: true })
  })
}
const userUpdate = function (req, res, next) {//update           //upload.single('avatar')
  db.users.findOne({ where: { id: req.params.id } }).then((user) => {
    var upt = {};
    let err_field = [];
    upt.name = req.body.name;
    upt.about = req.body.about;
    if (req.body.favorites) {
      upt.favorites = req.body.favorites.split('|');
    }
    if (req.file) {
      upt.avatar = userDir + `${hashAvatar}/avatar.jpg`;
    }
    if (req.body.oldpassword && req.body.newpassword)
      if ((bcrypt.compareSync(req.body.oldpassword, user.password))) {
        let salt = bcrypt.genSaltSync(12)
        let hash = bcrypt.hashSync(req.body.newpassword, salt)
        upt['password'] = hash;
      }
      else {
        err_field.push("password");
        console.log('wrong old password');
      }
    user.update(
      { ...upt },
    ).then((user) => {
      if (user) {
        return res.status(200).json({
          msg: 'User updated',
          user,
          avatarpath: upt.avatar || 'avatar not updated',
          error: false,
          err_field
        });
      }
      return res.status(404).json({ msg: 'Users not found', error: true });

    })
  }).catch((error) => {
    return res.status(500).json({ msg: error.message, error: true })
  });
}
const userShow = function (req, res, next) {//show user   //Auth
  db.users.findOne({
    where: { id: req.params.id },
    include: [{
      model: db.users,
      through: {
        attributes: []
      },
      as: "subscribs",
    },
    {
      model: db.recipes,
      through: {
        attributes: []
      },
      as: "favoritesTable",
    },
    {
      model: db.users,
      through: {
        attributes: []
      },
      as: "followers",
    },
    ]
  })
    .then((user) => {
      if (user) {
        // res.send(user);
        return res.status(200).json({ user: user, msg: "User detected", error: false })
      } else {
        return res.status(200).json({ msg: "User deleted or not created", error: true })
      }
    }).catch((error) => {
      console.log(error);
      return res.status(500).json({ msg: error.message, error: true })
    })
};
const userProfile = function (req, res, next) {//show user   //Auth
  db.users.findOne({
    where: { id: req.body.tokenId },
    include: [{
      model: db.users,
      through: {
        attributes: []
      },
      as: "subscribs",
    },
    {
      model: db.recipes,
      through: {
        attributes: []
      },
      as: "favoritesTable",
    },
    {
      model: db.users,
      through: {
        attributes: []
      },
      as: "followers",
    },]
  })
    .then((user) => {
      user.favorites = user.favoritesTable;
      return res.status(200).json({ msg: user, error: false });
    }).catch((error) => {
      console.log(error);
      return res.status(500).json({ msg: error.message, error: true });
    })
};
const usersShowAll = function (req, res, next) {//show all //Auth
  db.users.findAll({}).then((users) => {
    res.send(users);
  }).catch(err => res.status(500).json({ message: err.message }))
};


module.exports = {
  userProfile,
  userRegister,
  userLogin,
  userDel,
  userUpdate,
  userShow,
  usersShowAll,
  storage,
  userSubscribe
}