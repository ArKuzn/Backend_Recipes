const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtsecret = "mysecretkey";
const hash = require('object-hash');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
/* GET users listing. */
const db = require('../models');
const userDir = "uploads/users/";
const multer = require("multer")
const rimraf = require("rimraf")
const testAccount = require('../config').email;
const nodemailer = require("nodemailer");
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





const emalNotification = async (author, title, idRecipe) => {
  try {
    const user = await db.users.findOne({
      where: { id: author },
      include: [{
        model: db.users,
        through: {
          attributes: []
        },
        as: "followers",
      }]
    }).catch((err) => {
      console.log(err)
    });
    let followers = await user.getFollowers();
    let loginFollowers = [];
    loginFollowers = followers.map(el => el.login)
    let transporter = nodemailer.createTransport({
      host: "smtp.yandex.ru",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass // generated ethereal password
      }
    });
    let sendemails = loginFollowers.map((email) => {
      transporter.sendMail({
        from: '<axkuz97@yandex.ru>', // sender address
        to: `${email}@yandex.ru`, // list of receivers
        subject: `New recipe from ${user.login}`, // Subject line
        text: "Hello world?", // plain text body
        html: `<a href="http://localhost:3001/recipes/${idRecipe}">${title}</a>` // html body
      });
    })
    await Promise.all(sendemails.map(function (email) {
      return email
        .catch(function (err) {
          console.log(err.message); // some coding error in handling happened
          return err
        });
    }))
  } catch (err) {
    console.log(err);
    return false
  }
}




passport.use(new FacebookStrategy({
  clientID: "305205550040723",
  clientSecret: "d3812117eb072fd9ce385c60b5ed1b5e",
  callbackURL: "http://localhost:3000/api/users/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'link', 'email']
},
  function (accessToken, refreshToken, profile, done) {
    console.log(profile)
    debugger
    db.users.findOne({ where: { 'login': profile.emails[0].value } })
      .then(( user, err) => {
        debugger
        if (err) return done(err);
        if (user) return done(null, user);
        else {
          db.users.create({
            login: profile.emails[0].value,
            favorites: []
          })
          // if there is no user found with that facebook id, create them
          // var newUser = new User();

          // // set all of the facebook information in our user model
          // newUser.facebook.id = profile.id;
          // newUser.facebook.token = accessToken;
          // newUser.facebook.name = profile.displayName;
          // if (typeof profile.emails != 'undefined' && profile.emails.length > 0)
          //   newUser.facebook.email = profile.emails[0].value;

          // save our user to the database
          // newUser.save(function (err) {
          //   if (err) throw err;
          //   return done(null, newUser);
          // });
        }
      })
      .catch((err) => {
        debugger
        return res.status(500).json({ msg: err.message })
      })
  }
));

const linkResetPassword = function (req,res) {
  debugger
  db.users.findOne({
    where: { login: req.body.login }
  })
  .then((user,error)=>{
    debugger
    const test = hash(rn());
    bcrypt.genSalt(12, function(err, salt) {
      bcrypt.hash(user.login, salt, function(err, hash) {
        debugger
          user.update({
            avatar: test
          }).then((result)=>{
            debugger
            return res.status(200).json({ msg: "link sent", error: false })
          })
      });
  });
  })
  .catch((err)=>{
    return res.status(500).json({ msg: err.message, error: true })
  })
}

const resetPassword = function (req,res) {
  
  return res.status(200).json({ msg: 'Your password reset', error: false, user, token: token });
}

const checkHash =  function (req,res) {
  // req.params.id
  debugger
  db.users.findOne({
    where: { avatar: req.query.hash }
  })
  .then((user,error)=>{
    debugger
    res.status(200).json({ msg: 'Hash valid', error: false });
  })
  .catch((err)=>{
    return res.status(500).json({ msg: err.message, error: true })
  })
}
const userRegister = function (req, res, next) {//register
  debugger
  try {
    // bcrypt.genSalt(12, function (err, salt) {
    //   bcrypt.hash(req.body.password, salt, function (err, hash) {
    //     console.log(`this is true hash ${hash}`);
    //     let avatar;
    //     if (req.file) {
    //       avatar = userDir + `${hashAvatar}/avatar.jpg`;
    //     } else {
    //       avatar = userDir + "default/avatar.jpg"
    //     }
    db.users.findOrCreate({
      where: { login: req.body.login }, defaults: {
        password: req.body.password,
        // password: hash,
        // avatar: avatar,
        favorites: req.body.Favorites || []
      }
    })
      .then(([user, created]) => {
        debugger
        if (!created) {
          // throw { status: 400, message: 'login already taken' };
          return res.status(400).json({ msg: 'login already taken', error: true });
        }
        let token = jwt.sign({ id: user.id, login: user.login, role: user.role }, jwtsecret, { expiresIn: 86400 });
        return res.status(200).json({ msg: 'Success! you have been registered', error: false, user, token: token });

      }).catch((error) => {
        return res.status(500).json({ msg: error.message, error: true })
      })
    //   });
    // });
  } catch (err) {
    if (err.status == 400) {
      return res.status(400).json({ msg: err.message, error: true });
    }
    return res.status(500).json({ msg: err.message, error: true })
  }
}

passport.use(new LocalStrategy(
  function (username, password, done) {
    debugger
    db.users.findOne({ where: { login: username } })
      .then((user, err) => {
        debugger
        if (err) throw err;
        if (!user) {
          return done(null, false, { message: 'Unknown User' });
        }
        debugger
        if (user.password == password) {
          return done(null, user);
        }
        return done(null, false, { message: 'Invalid password' });

      })
      .catch((err) => {
        return res.status(500).json({ msg: err.message })
      })
  }
));


passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  debugger
  db.users.findOne({ where: { id: id } })
    .then((err, user) => {
      done(err, user);
    });
});


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
  debugger
  res.send(req.user);
  // db.users.findOne({
  //   where: { login: req.body.login },
  //   include: [{
  //     model: db.users,
  //     through: {
  //       attributes: []
  //     },
  //     as: "subscribs",
  //   }, {
  //     model: db.recipes,
  //     through: {
  //       attributes: []
  //     },
  //     as: "favoritesTable",
  //   }, {
  //     model: db.users,
  //     through: {
  //       attributes: []
  //     },
  //     as: "followers",
  //   },]
  // })
  //   .then((user) => {
  //     if (user) {
  //       bcrypt.compare(req.body.password, user.password, function (err, hash) {
  //         if (hash) {
  //           let token = jwt.sign({ id: user.id, login: user.login, role: user.role }, jwtsecret, { expiresIn: 86400 });
  //           let userObj = { ...user.dataValues };
  //           delete userObj.password;
  //           userObj.favorites = userObj.favoritesTable;
  //           return res.status(200).json({ msg: 'success', error: false, token: token, user: userObj });
  //         }

  //         return res.status(401).json({ msg: 'wrong password', error: true, field: 'password' });

  //       });
  //     }
  //     else {
  //       return res.status(401).json({ msg: 'wrong login', error: true, field: 'login' });
  //     }
  //   })
  //   .catch((err) => {
  //     return res.status(500).json({ msg: err.message, error: true });
  //   })
}
const userDel = function (req, res, next) {//delete
  let folder;
  // if (req.body.tokenId != req.params.id) {
  //   return res.status(403).json({ msg: "access error", error: false })
  // }
  db.users.findOne({ where: { "id": req.params.id } }).then((user) => {
    // console.log(user.avatar.split('/')[2]);
    // folder = user.avatar.split('/')[2];
    // if (folder == 'default') {
    //   folder = null;
    // }
    db.users.destroy({ where: { "id": req.params.id } }).then((user) => {
      if (user) {
        // console.log(`this folder will be deleted ${folder}`);
        // rimraf.sync(`./uploads/users/${folder}`)
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
  userSubscribe,
  checkHash,
  linkResetPassword,
  resetPassword
}