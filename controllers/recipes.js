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
    ingredientsSearchObj.title = ingredients.split('-');
  }
  else {
    if (ingredients.length > 0) {
      ingredientsSearchObj.title = ingredients;
    }
  }
  try {
    const recipes = await db.recipes.findAll({
      where: {
        duration: {
          [Op.between]: [duration[0], duration[1]]
        }
      },
      include: [{
        model: db.ingredients, as: 'ingredientsTable',
        // through: {
        //   attributes: [],
        //   where: {
        //     title: ingredientsSearchObj
        //     // recipe_id: {
        //     //   // where: {
        //     //   //   title
        //     //   // }
        //     // }
        //   }
        // }
        where: ingredientsSearchObj
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
      as: 'stepItem',
      // order: [['index', 'ASC']]
    },
    {
      model: db.ingredients,
      as: 'ingredientsTable'
    }],
  }).then((recipe) => {
    if (recipe) {
      return res.json(recipe);
    }
    return res.status(404).json({ message: 'recipe not found', error: true });

  })
}
const recipeDel = (req, res, next) => {//delete
  let folder;
  db.recipes.findOne({ where: { "id": req.params.id } }).then((recipe) => {
    folder = recipe.images[0].split('/')[1];
    recipe.destroy({}).then((recipes) => {
      if (recipes) {
        console.log(`this is folder will be deleted ${folder}`);
        rimraf.sync(`./uploads/${folder}`)
        // DelRecipe.destroy({});
        res.send('recipe deleted')
      }
      else {
        res.send('Recipe not found');
      }
    }).catch(error => {
      console.log(error)
    })
  })
}
const recipeIngredients = function (req, res, next) {//get ingredients
  db.ingredients.findAll({}).then((recipes) => {
    return res.status(200).json({ recipes })
  })

}
// const testing = async function (recipe) {
//   await recipe.setIngredientsTable([])
//   console.log(recipe)
// }
const recipeUpdate = async function (req, res, next) {//update recipe

  let idRecipe = req.params.id;
  const recipe = await db.recipes.findOne({
    where: {
      id: req.params.id
    },
    include: [{
      model: db.steps,
      as: 'stepItem',
      where: {
        // "recipe_id": req.params.id
      },
      // order: [['index', 'DESC']]
    }, {
      model: db.ingredients,
      as: 'ingredientsTable',
    }

    ]
  })
  console.log(recipe);
  console.log(req);

  //update ingredients
  let ingredients = req.body.ingredients.split('|').map(ingredient => {
    return db.ingredients.findOrCreate({
      where: {
        title: ingredient
      }
    }).then((DBingredient) => {
      return DBingredient[0].id;
    })
  })
  const ingredientListIds = await Promise.all(ingredients);
  recipe.setIngredientsTable(ingredientListIds);
  //update steps
  let steps = req.body.steps.split('|').map((step, id) => {
    return db.steps.findOrCreate({
      where: {
        [Op.and]: [{ text: step }, { index: id }]
      },
      defaults: {
        text: step,
        index: id
      },
    }).then((DBstep) => {
      return DBstep[0].id;
    })
  })
  const stepListIds = await Promise.all(steps);
  recipe.setStepItem(stepListIds);
  //update other fields
  let updateObj = {};
  updateObj.title = req.body.title;
  updateObj.calories = req.body.calories;
  updateObj.difficult = req.body.difficult > 5 || req.body.difficult < 0 ? 5 : req.body.difficult;
  updateObj.duration = req.body.duration;
  db.recipes.update(
    updateObj,
    { where: { id: req.params.id } }
  ).then((recipe) => {
    console.log(recipe);
    if (recipe > 0) {
      return res.status(200).json({ msg: 'Recipe updated', error: false });
    }
    return res.status(404).json({ msg: 'Recipe not found', error: true });

  }).catch((error) => {
    return res.status(404).json({ msg: error, error: true });
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