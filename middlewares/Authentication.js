const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtsecret = "mysecretkey";
const hash = require("object-hash");
/* GET users listing. */
const db = require("../models");
const userDir = "uploads/users/";
const multer = require("multer");
const rimraf = require("rimraf");
const fs = require("fs");
var hashAvatar;
const rn = require("random-number");

const GetAuth = function (req, res, next) {
    try {
        jwt.verify(req.query.token, jwtsecret, function (err, decoded) {
            if (err) {
                return res.status(401).json({ msg: "invalid token", error: true });
            }
            req.body.tokenId = decoded.id;
            // if (req.params.id) {
            //     if (req.params.id != decoded.id) {
            //         return res.status(403).json({ msg: 'access error', error: true })
            //     }
            // }
            next();
        });
    } catch (err) {
        return res.status(401).json({ msg: "invalid token", error: true });
    }
};
const Auth = function (req, res, next) {
    jwt.verify(req.body.token, jwtsecret, function (err, decoded) {
        if (err) {
            return res.status(401).json({ msg: "invalid token", error: true });
        }
        req.body.tokenId = decoded.id;
        // if (req.params.id) {
        //     if (req.params.id != decoded.id) {
        //         return res.status(403).json({ msg: 'access error', error: true })
        //     }
        // }
        next();
    });
};
const AuthRecipe = function (req, res, next) {
    jwt.verify(req.body.token, jwtsecret, function (err, decoded) {
        req.body.tokenId = decoded.id;
        console.log(req.body.tokenId);
        if (err) {
            res.status(401).json({ msg: "invalid token", error: true });
        } else {
            next();
        }
    });
};


const AuthAuthor = function (req, res, next) {
    if (!req.body.token) {
        return res.status(400).json({ msg: "token is missing", error: true });
    }
    jwt.verify(req.body.token, jwtsecret, function (err, decoded) {
        if (err) {
            res.status(401).json({ msg: "invalid token", error: true });
        } else {
            req.body.author = decoded.id;
            //req.user = decoded;
            next();
        }
    });
};
module.exports = {
    Auth,
    AuthRecipe,
    GetAuth,
    AuthAuthor
};
