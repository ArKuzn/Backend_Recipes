const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtsecret = "mysecretkey";
const hash = require("object-hash");
/* GET users listing. */

const GetAuth = function (req, res, next) {
  try {
    jwt.verify(req.query.token || req.headers.token, jwtsecret, function (err, decoded) {
      if (err) {
        return res.status(401).json({ msg: "invalid token", error: true });
      }
      req.body.tokenId = decoded.id;
      next();
    });
  } catch (err) {
    return res.status(500).json({ msg: err, error: true });
  }
};
const Auth = function (req, res, next) {
  jwt.verify(req.body.token, jwtsecret, function (err, decoded) {
    if (err) {
      return res.status(401).json({ msg: "invalid token", error: true });
    }
    req.body.tokenId = decoded.id;
    next();
  });
};
const AuthRecipe = function (req, res, next) {
  try {
    jwt.verify(req.body.token, jwtsecret, function (err, decoded) {
      req.body.tokenId = decoded.id;
      console.log(req.body.tokenId);
      if (err) {
        return res.status(401).json({ msg: "invalid token", error: true });
      } else {
        return next();
      }
    })
  }
  catch (err) {
    return res.status(500).json({ msg: err, error: true });
  }
};


const AuthAuthor = function (req, res, next) {
  try {
    if (!req.body.token) {
      return res.status(400).json({ msg: "token is missing", error: true });
    }
    jwt.verify(req.body.token, jwtsecret, function (err, decoded) {
      if (err) {
        res.status(401).json({ msg: "invalid token", error: true });
      } else {
        req.body.author = decoded.id;
        next();
      }
    });
  }
  catch (err) {
    return res.status(500).json({ msg: err, error: true });
  }
};
module.exports = {
  Auth,
  AuthRecipe,
  GetAuth,
  AuthAuthor
};
