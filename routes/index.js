var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const jwtsecret = "mysecretkey";
var fs = require("fs");
const db = require('../models');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/checktoken', function (req, res, next) {
  jwt.verify(req.body.token, jwtsecret, function (err, decoded) {
    if (err) {
      res.send({ msg: 'invalid token', error: true })
    }
    else {
      res.send({ msg: 'token valid', error: false })
    }
  })
});
router.get('/uploads/:recipeId/:imageId', function (req, res, next) {
  db.recipes.findOne({ where: { 'id': req.params.recipeId } }).then((recipe) => {
    if (recipe) {
      console.log('hi');
      try {
        var img = fs.readFileSync(`./uploads/${recipe.id}/${req.params.imageId}`);
        res.writeHead(200, { 'Content-Type': 'image/gif' });
        res.end(img, 'binary');
      }
      catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('image not found', 'text');
      }
    }
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('recipe not found', 'text');
    }
  })
});
module.exports = router;
