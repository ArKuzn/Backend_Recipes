var rimraf = require("rimraf")
var multer = require("multer")
var fs = require("fs");
const db = require('../models');
const jwt = require('jsonwebtoken');
const jwtsecret = "mysecretkey";
const hash = require('object-hash');
const rn = require('random-number');
const recipeCtrl = require('../controllers/recipes');
const AuthMiddl = require('../middlewares/Authentication');
var dir;
let currentId = 0;
let fileid = 0;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var hashFolder = hash(rn());
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let rec = `uploads/${hashFolder}`;
    if (!fs.existsSync(rec)) {
      fs.mkdirSync(rec);
    }
    cb(null, `uploads/${hashFolder}`)
  },
  filename: function (req, file, cb) {
    cb(null, `${fileid += 1}` + '.jpg')
  }
})

const recipeAddFavorites = function (req, res, next) {//add to favorite recipe AuthRecipe
  console.log(`token id is ${req.body.tokenId}`);
  db.users.findByPk(req.body.tokenId).then((user) => {
    console.log(`this is user ${user}`);

    if (!user) {
      return res.status(404).json({ msg: 'user not found', error: true });
    }
    let { favorites } = user;
    console.log(`favorites before ${favorites}`);
    for (let recipeId in favorites) {
      if (favorites[recipeId] == req.params.id) {
        favorites.splice(recipeId, 1);
        return updateFavorites(favorites, req, res);

      }
      // if (recipeId == favorites.length - 1)
      //   favorites.push(req.params.id);
    }
    favorites.push(req.params.id);
    return updateFavorites(favorites, req, res);
  })
}

// async (req, res) => {
//   try {
//     if (!someData) {
//       throw new Error({code: 400, message: 'invalid somedata'})
//     }
//   } catch (err) {
//     const code = err.code || 500
//     const { message } = err
//     return res.status(code).json({message})
//   }
// }


const updateFavorites = function (favorites, req, res) {
  db.users.update(
    { favorites: favorites },
    { where: { id: req.body.tokenId } }
  ).then((user) => {
    console.log(user);
    if (user > 0) {
      return res.status(200).json({ msg: 'Recipe added to your favorites recipes', error: false });
    }
    return res.status(400).json({ msg: 'Update error', error: true });

  })
}



const recipeCreate = async function (req, res, next) {//create 
  fileid = 0;
  let ingredients = req.body.ingredients.split('|');
  let steps = [];
  steps = req.body.steps.split('|');
  let imgs = [];
  for (let i = 0; i < req.files.images.length; i++) {
    imgs.push(`uploads/${hashFolder}/${i + 1}.jpg`)
  }

  let ImagesforSteps = [];
  for (let stepImageIndex in req.files.stepsimages) {
    ImagesforSteps.push(`uploads/${hashFolder}/${+stepImageIndex + +req.files.images.length + 1}.jpg`)
  }
  // for (ingredient of ingredients) {
  //   await db.ingredients.findOrCreate({ where: { title: ingredient } }).then((ingredient) => {
  //     console.log(ingredient);
  //     DBingredientsId.push(ingredient[0].id);
  //   })
  // }


  let DBingredientsIds = [];

  const getIingredientsListIds = ingredients.map((item) => {
    return db.ingredients.findOrCreate({ where: { title: item } }).then((ingredient) => {
      return ingredient[0].id
    })
  })
  // console.log(ingredient);
  const ingredientsListIds = await Promise.all(getIingredientsListIds)
  ingredientsListIds.forEach(id => {
    DBingredientsIds.push(id);
  });

  let recipeId;
  await db.recipes.create({
    title: req.body.title,
    ingredients: ingredients,
    steps: steps,
    images: imgs,
    calories: req.body.calories,
    difficult: req.body.difficult,
    time: req.body.time,
    duration: req.body.duration,
    author: req.body.author
  }).then((rec) => {
    recipeId = rec.id;
  });

  steps.map((step, index) => {
    db.steps.create({
      recipe_id: recipeId,
      index: index,
      text: step,
      image: ImagesforSteps[index]
    })
  })

  for (ingredientId of DBingredientsIds) {
    db.ingredientsrecipes.create({ recipe_id: recipeId, ingredient_id: ingredientId }).catch(err => console.log('create error', err));
  }
  hashFolder = hash(rn());
  res.send('recipe created')
}


const filter = async function (req, res) {
  let duration = req.query.duration || '1-999';
  duration = duration.split('-');
  let ingredients = req.query.ingredients || '';
  let direction = req.query.direction || 'ASC';
  let order_field = req.query.order_field || 'title';
  ingredientsSearchObj = {}
  if (ingredients.split('-').length > 1) {
    // ingredientsSearchObj.where = {
    //   title: ingredients.split('-')
    // }
    ingredientsSearchObj = ingredients.split('-');
  }
  else {
    if (ingredients.length > 0) {
      ingredientsSearchObj = ingredients;
    }
  }
  // else {
  //   ingredientsSearchObj.where = {
  //     title: {
  //       $in: []
  //     }
  //   }
  // }
  try {
    const recipes = await db.recipes.findAll({
      where: {
        duration: {
          [Op.between]: [duration[0], duration[1]]
        }
      },
      include: [{
        model: db.ingredients, as: 'ingredientsTable',
        through: {
          attributes: [],
          where: {
            title: { [Op.and]: ingredientsSearchObj }
          }
        },
        // where: {
        // ingredientsSearchObj
        // title: ingredients.split('-')
        // title: { [Op.and]: ['cucumber', 'carrot'] }
        // }
      }],
      order: [[order_field, direction]]
    })
    return recipes;
    // let queryingresult = [];//filter ingredients

    // if (!req.query.ingredients) {
    //   return recipes;
    // }

    // await recipe1.setIngredients([]) // update

    // let ingredients = req.query.ingredients.split('-');
    // for (recipe of recipes) {
    //   let j = 0;
    //   for (ingredient of ingredients) {
    //     for (let i = 0; i < recipe.ingredientsTable.length; i++) {
    //       if (recipe.ingredientsTable[i].title == ingredient) {
    //         j++;
    //       }
    //       if (j == ingredients.length) {
    //         queryingresult.push(recipe);
    //         j = 0;
    //         break;
    //       }
    //     }
    //   }
    // }
    // return queryingresult;

  } catch (error) {
    console.log(error);
  }
}



const getSteps = function (req, res, next) {
  db.steps.findAll({
    where: {
      "recipe_id": req.params.id
    },
    order: [['index', 'ASC']]
  }).then((steps) => {
    return res.status(200).json({ steps: steps, error: false });
  }).catch(err => res.status(500).json({ message: err.message }))
}


const recipeFilter = async function (req, res, next) {//show all filtred recipes
  let result = await filter(req, res);
  return res.send(result);
}

const recipeShow = function (req, res, next) {//show recipe
  db.recipes.findOne({
    where: { "id": req.params.id },
    include: [{
      model: db.steps,
      where: {
        "recipe_id": req.params.id
      }
    }]
  }).then((recipe) => {
    if (recipe) {
      return res.json(recipe);
    }
    return res.status(404).json({ message: 'recipe not found', error: true });

  })
}
const recipeDel = function (req, res, next) {//delete
  let folder;
  db.recipes.findOne({ where: { "id": req.params.id } }).then((recipe) => {
    folder = recipe.images[0].split('/')[1];
    db.recipes.destroy({ where: { "id": req.params.id } }).then((recipes) => {
      if (recipes) {
        console.log(`this is folder will be deleted ${folder}`);
        rimraf.sync(`./uploads/${folder}`)
        // DelRecipe.destroy({});
        res.send('recipe deleted')
      }
      else {
        res.send('Recipe not found');
      }
    })
  })
}
const recipeIngredients = function (req, res, next) {//get ingredients
  db.ingredients.findAll({}).then((recipes) => {
    return res.status(200).json({ recipes })
  })

}
const recipeUpdate = function (req, res, next) {//update recipe
  let updateObj = {};
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





  fileid = 0;
  let ingredients = [];
  ingredients = req.body.ingredients.split('|');
  let steps = [];
  steps = req.body.steps.split('|');
  let imgs = [];
  for (let i = 0; i < req.files.images.length; i++) {
    imgs.push(`uploads/${hashFolder}/${i + 1}.jpg`)
  }

  let ImagesforSteps = [];
  for (let stepImageIndex in req.files.stepsimages) {
    ImagesforSteps.push(`uploads/${hashFolder}/${+stepImageIndex + +req.files.images.length + 1}.jpg`)
  }






  let DBingredientsId = [];

  ingredientsList = ingredients.map((item) => {
    return db.ingredients.findOrCreate({ where: { title: item } }).then((ingredient) => {
      return ingredient[0].id
    })
  })
  // console.log(ingredient);
  // ingredientsList = await Promise.all(ingredientsList)
  // ingredientsList.forEach(element => {
  //   DBingredientsId.push(element);
  // });




  steps.map((step, index) => {
    db.steps.create({
      recipe_id: recipeId,
      index: index,
      text: step,
      image: ImagesforSteps[index]
    })
  })

  for (ingredientId of DBingredientsId) {
    db.ingredientsrecipes.create({ recipe_id: recipeId, ingredient_id: ingredientId }).catch(err => console.log('create error', err));
  }
  hashFolder = hash(rn());


  ///////////////////////////////////////////////////////////////////////////////
  updateObj.title = req.body.title;
  if (req.body.ingredients instanceof String) {
    updateObj.ingredients = req.body.ingredients.split('|');
  }
  if (req.body.steps instanceof String) {
    updateObj.steps = req.body.steps.split('|');
  }
  updateObj.calories = req.body.calories;
  updateObj.difficult = req.body.difficult;
  updateObj.duration = req.body.duration;
  console.log(updateObj);
  db.recipes.update(
    updateObj,
    { where: { id: req.params.id } }
  ).then((recipe) => {
    console.log(recipe);
    if (recipe > 0) {
      res.send('Recipe updated');
    } else {
      res.send('Recipe not found');
    }
  })
}
module.exports = {
  recipeAddFavorites,
  recipeShow,
  recipeDel,
  recipeUpdate,
  recipeCreate,
  storage,
  recipeFilter,
  getSteps,
  recipeIngredients
}