const express = require('express');
const routes = require('require-dir')();
const indexCtrl = require('../controllers/index');
const changeCase = require('change-case');
/* GET home page. */
// router.get('/uploads/:recipeId/:imageId', indexCtrl.imageGet)
// router.get('/uploads/users/:hash/avatar.jpg', indexCtrl.avatarGet)
module.exports = (app) => {
    Object.keys(routes).forEach((routeName) => {
        const router = express.Router();

        require(`./${routeName}`)(router);

        app.use(`/api/${changeCase.paramCase(routeName)}`, router);
    });
    const router = express.Router();
    router.get('/', indexCtrl.Index)
};