var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const jwtsecret = "mysecretkey";
var fs = require("fs");
const db = require('../models');
const Index = function (req, res, next) {
    res.render('index', { title: 'Express' });
};
const tokenCheck = function (req, res, next) {
    jwt.verify(req.body.token, jwtsecret, function (err, decoded) {
        if (err) {
            res.send({ msg: 'invalid token', error: true })
        }
        else {
            // res.send({ msg: 'token valid', error: false })
            next()
        }
    })
};
const imageGet = function (req, res, next) {

    try {
        var img = fs.readFileSync(`./uploads/${req.params.recipeId}/${req.params.imageId}`);

        res.writeHead(200, { 'Content-Type': 'image/gif' });
        return res.end(img, 'binary');
    }
    catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('image not found', 'text');
    }


};
const avatarGet = function (req, res, next) {

    try {
        var img = fs.readFileSync(`./uploads/users/${req.params.hash}/avatar.jpg`);
        res.writeHead(200, { 'Content-Type': 'image/gif' });
        res.end(img, 'binary');
    }
    catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('image not found', 'text');
    }
};
module.exports = {
    Index,
    tokenCheck,
    avatarGet,
    imageGet
}