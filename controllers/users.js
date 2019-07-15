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
// const upload = multer({ storage: storage })




const userRegister = function (req, res, next) {//register
    let pass;
    bcrypt.genSalt(12, function (err, salt) {
        bcrypt.hash(req.body.password, salt, function (err, hash) {
            // Store hash in your password DB.
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
                    console.log(user.toJSON())
                    if (!created) {
                        res.send({ msg: 'login already taken', error: true });
                    }
                    else {
                        let token = jwt.sign({ id: user.id, login: user.login, role: user.role }, jwtsecret, { expiresIn: 86400 });
                        res.send({ msg: 'Success! you have been registered', error: false, token: token });
                    }
                    console.log(created)
                }).catch((error) => {
                    console.log(error);
                    return res.status(500).json({ msg: error.message, error: true })
                })
        });
    })
}
const userLogin = function (req, res, next) {//login
    db.users.findOne({ where: { login: req.body.login } }).then((user) => {
        if (user) {
            bcrypt.compare(req.body.password, user.password, function (err, hash) {
                if (hash) {
                    let token = jwt.sign({ id: user.id, login: user.login, role: user.role }, jwtsecret, { expiresIn: 86400 });
                    return res.status(200).json({ msg: 'success', error: false, token: token });
                }

                return res.status(401).json({ msg: 'wrong password', error: true, field: 'password' });

            });
        }
        else {
            res.status(401).json({ msg: 'wrong login', error: true, field: 'login' });
        }
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
                // DelRecipe.destroy({});
                res.status(200).json({ msg: 'User deleted', error: false });
            }
            else {
                res.status(404).json({ msg: 'User not found', error: true });
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
        // upt.password = "req.body.about";
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
                // res.send({ msg: 'wrong old password', error: true });
                err_field.push("password");
                console.log('wrong old password');
            }
        db.users.update(
            { ...upt },
            { where: { id: req.params.id } }
        ).then((user) => {
            console.log(user);
            if (user > 0) {
                return res.status(200).json({ msg: 'User updated', avatarpath: upt.avatar || 'avatar not updated', error: false, err_field: err_field });
            }
            res.send('Users not found');

        })
    }).catch((error) => {
        console.log(error);
        return res.status(500).json({ msg: error.message, error: true })
    });
}
const userShow = function (req, res, next) {//show user   //Auth
    db.users.findByPk(req.params.id).then((user) => {
        if (user) {
            res.send(user);
        } else {
            return res.status(200).json({ msg: "User deleted or not created", error: true })
        }
    }).catch((error) => {
        console.log(error);
        return res.status(500).json({ msg: error.message, error: true })
    })
};
const userProfile = function (req, res, next) {//show user   //Auth
    db.users.findByPk(req.body.tokenId).then((user) => {

        res.send(user);
    }).catch((error) => {
        console.log(error);
        return res.status(500).json({ msg: error.message, error: true })
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
    storage
}