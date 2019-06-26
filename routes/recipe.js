var express = require('express');
var router = express.Router();
//files
var rimraf = require("rimraf")
var multer = require("multer")
var fs = require("fs");
const db = require('../models');
var dir;
let currentId = 0;
let fileid = 0;
db.recipes.findAll({}).then((rec) => {
    currentId = rec[rec.length - 1].id;
    // console.log(currentId);
});
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let rec = `uploads/${currentId + 1}`;
        if (!fs.existsSync(rec)) {
            fs.mkdirSync(rec);
        }
        cb(null, `uploads/${currentId + 1}`)
    },
    filename: function (req, file, cb) {
        cb(null, `${fileid += 1}` + '.jpg')
    }
})
var upload = multer({ storage: storage })
//models
// var Recipes = require("../models/Recipes");
console.log(db.recipes);
router.post('/', upload.array('images', 12), function (req, res, next) {//create
    currentId += 1;
    fileid = 0;
    let ingredients = [];
    ingredients = req.body.ingredients.split('|');
    let steps = [];
    steps = req.body.steps.split('|');
    let imgs = [];
    for (let i = 0; i < req.files.length; i++) {
        imgs.push(`uploads/${currentId}/${i + 1}.jpg`)
    }
    db.recipes.create({ title: req.body.title, ingredients: ingredients, steps: steps, images: imgs, calories: req.body.calories, difficult: req.body.difficult, time: req.body.time, duration: req.body.duration, author: req.body.author }).then((rec) => {
        console.log(rec.id);
        currentId = rec.id;
    });

    res.send('recipe created')
})
router.get('/', function (req, res, next) {//show(all)

    db.recipes.findAll({}).then((recipes) => {
        // res.send(recipes);
        if (recipes) {
            if (recipes.length == 0) {
                res.end('Recipes not found')
            }
            else {
                res.send(recipes);
            }
        }
    }
    )
    // res.send('recipe created')
})
router.get('/:id', function (req, res, next) {
    db.recipes.findOne({ where: { "id": req.params.id } }).then((recipe) => {
        if (recipe) {

            res.send(recipe);
        }
        else {
            res.send({ msg: 'recipe not found', error: true });
        }
    })
})
router.delete('/:id', function (req, res, next) {//delete
    let folder;
    db.recipes.findOne({ where: { "id": req.params.id } }).then((recipe) => {
        folder = recipe.images[0].split('/')[1];
    })
    db.recipes.destroy({ where: { "id": req.params.id } }).then((recipes) => {
        if (recipes) {
            rimraf.sync(`./uploads/${folder}`)
            // DelRecipe.destroy({});
            res.send('recipe deleted')
        }
        else {
            res.send('Recipe not found');
        }
    })

})
router.put('/:id', upload.array('images', 12), function (req, res, next) {
    let upt = {};
    // let ingredients = [];
    // let steps = [];
    // if (req.body.ingredients) {
    //     ingredients = req.body.ingredients.split('|');
    // }
    // if (req.body.steps) {

    //     steps = req.body.steps.split('|');
    // }
    // let imgs = [];
    // for (let i = 0; i < req.files.length; i++) {
    //     imgs.push(`uploads/${currentId}/${i + 1}.jpg`)
    // }
    upt.title = req.body.title;
    try {
        upt.ingredients = req.body.ingredients.split('|');
        upt.steps = req.body.steps.split('|');
    }
    catch{ }
    upt.calories = req.body.calories;
    upt.difficult = req.body.difficult;
    upt.duration = req.body.duration;
    console.log(upt);
    db.recipes.update(
        { ...upt },
        { where: { id: req.params.id } }
    ).then((recipe) => {
        console.log(recipe);
        if (recipe > 0) {
            res.send('Recipe updated');
        } else {
            res.send('Recipe not found');
        }
    })
})
module.exports = router;